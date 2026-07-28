const permissions = require(`${__hooks}/lib/permissions.js`);

const CALL_SCOPED_COLLECTIONS = [
  "call_rooms",
  "call_sessions",
  "call_participants",
];

function callTarget(kind, id) {
  if (kind === "channel" || kind === "conversation") return { kind, id: String(id || "") };
  throw new BadRequestError("Unsupported call target.");
}

function validateRoomTarget(record) {
  const channelId = record.getString("channel");
  const conversationId = record.getString("conversation");
  if (Boolean(channelId) === Boolean(conversationId)) {
    throw new BadRequestError("A call room must have exactly one target.");
  }
  return channelId
    ? { kind: "channel", id: channelId }
    : { kind: "conversation", id: conversationId };
}

function jsonObject(record, field) {
  let value = record.get(field) || {};
  try {
    if (typeof value?.string === "function") value = JSON.parse(value.string());
    else if (typeof value === "string") value = JSON.parse(value);
  } catch {
    return {};
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function deviceStates(participant) {
  const raw = jsonObject(participant, "devices");
  const fallback = {
    muted: participant.getBool("muted"),
    deafened: participant.getBool("deafened"),
    camera: participant.getBool("camera"),
    sharing: participant.getBool("sharing"),
  };
  const states = {};
  for (const [deviceId, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      states[String(deviceId)] = { ...fallback, expiresAt: value };
      continue;
    }
    if (!value || typeof value !== "object") continue;
    states[String(deviceId)] = {
      expiresAt: String(value.expiresAt || ""),
      muted: Boolean(value.muted),
      deafened: Boolean(value.deafened),
      camera: Boolean(value.camera),
      sharing: Boolean(value.sharing),
    };
  }
  return states;
}

function applyDeviceStates(participant, states, now = new Date().toISOString()) {
  const active = {};
  for (const [deviceId, state] of Object.entries(states)) {
    if (state.expiresAt > now) active[deviceId] = state;
  }
  const values = Object.values(active);
  const expiries = values.map((state) => state.expiresAt).sort();
  participant.set("devices", active);
  participant.set("expiresAt", expiries.length ? expiries[expiries.length - 1] : "");
  participant.set("muted", values.length ? values.every((state) => state.muted) : true);
  participant.set("deafened", values.length ? values.every((state) => state.deafened) : false);
  participant.set("camera", values.some((state) => state.camera));
  participant.set("sharing", values.some((state) => state.sharing));
  return active;
}

function callControlRequest(
  roomName,
  requestedUserIds,
  action = "kick",
  attributes = {},
  timeoutSeconds = 5,
) {
  const userIds = Array.from(new Set(
    (Array.isArray(requestedUserIds) ? requestedUserIds : [requestedUserIds])
      .map(String)
      .filter(Boolean),
  ));
  if (!roomName || !userIds.length) return 0;
  if (!["kick", "mute", "policy", "revoke"].includes(action)) {
    throw new BadRequestError("Unsupported call-control action.");
  }
  const controlUrl = String($os.getenv("JITSI_CONTROL_URL") || "");
  const controlSecret = String($os.getenv("JITSI_APP_SECRET") || "");
  if (!controlUrl || !controlSecret || typeof $http === "undefined") {
    throw new InternalServerError("Jitsi call control is not configured.");
  }
  let response;
  try {
    response = $http.send({
      url: controlUrl,
      method: "PUT",
      headers: {
        authorization: `Bearer ${controlSecret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        roomName,
        userIds,
        action,
        ...attributes,
      }),
      timeout: Math.max(1, Math.min(5, Number(timeoutSeconds) || 1)),
    });
  } catch {
    throw new InternalServerError("The media server could not apply call control.");
  }
  if (response.statusCode !== 200) {
    throw new InternalServerError("The media server rejected call control.");
  }
  return 1;
}

function issueCallTokenVersion(app, room, userId, expiresAt) {
  let state;
  try {
    state = app.findFirstRecordByFilter(
      "call_token_versions",
      "room = {:room} && user = {:user}",
      { room: room.id, user: userId },
    );
  } catch {
    state = new Record(app.findCollectionByNameOrId("call_token_versions"));
    state.set("room", room.id);
    state.set("user", userId);
  }
  const version = state.getInt("version") + 1;
  state.set("version", version);
  state.set("expiresAt", expiresAt);
  app.save(state);
  return version;
}

function revokeCallTokenVersion(app, room, userId, now = new Date().toISOString()) {
  let state;
  try {
    state = app.findFirstRecordByFilter(
      "call_token_versions",
      "room = {:room} && user = {:user}",
      { room: room.id, user: userId },
    );
  } catch {
    return null;
  }
  if (new Date(state.getString("expiresAt")).getTime() <= new Date(now).getTime()) return null;
  const version = state.getInt("version");
  const expiresAt = state.getString("expiresAt");
  state.set("revokedThrough", Math.max(state.getInt("revokedThrough"), version));
  if (
    new Date(expiresAt).getTime()
    > new Date(state.getString("revokedExpiresAt") || 0).getTime()
  ) {
    state.set("revokedExpiresAt", expiresAt);
  }
  app.save(state);
  return { version, expiresAt };
}

function syncTokenRevocation(roomName, userId, revocation) {
  if (!revocation) return 0;
  return callControlRequest(roomName, userId, "revoke", {
    tokenVersion: revocation.version,
    expiresAt: new Date(revocation.expiresAt).getTime(),
  });
}

function channelMediaPolicy(context) {
  const granted = context.auth.permissions;
  return {
    canSpeak: granted.includes("speak") || granted.includes("administrator"),
    canStreamVideo: granted.includes("stream_video") || granted.includes("administrator"),
  };
}

function callCapabilities(targetKind, context) {
  if (targetKind === "conversation") {
    return {
      canSpeak: true,
      canStreamVideo: true,
      canMuteMembers: false,
      canRemoveMembers: false,
    };
  }
  const policy = channelMediaPolicy(context);
  const granted = context.auth.permissions;
  const administrator = granted.includes("administrator");
  return {
    ...policy,
    canMuteMembers: granted.includes("mute_members") || administrator,
    canRemoveMembers: granted.includes("manage_members") || administrator,
  };
}

function syncParticipantMediaPolicy(target, room, participant, context) {
  if (target.kind !== "channel") return 0;
  const policy = channelMediaPolicy(context);
  return callControlRequest(
    room.getString("roomName"),
    participant.getString("user"),
    "policy",
    policy,
  );
}

function moderateParticipant(app, target, actorId, userId, action) {
  if (target.kind !== "channel") {
    throw new BadRequestError("Conversation calls do not support moderation.");
  }
  if (actorId === userId) throw new BadRequestError("You cannot moderate yourself.");
  const required = action === "mute" ? "mute_members" : "manage_members";
  let roomName = "";
  let participantId = "";
  app.runInTransaction((tx) => {
    const context = permissions.channelContext(tx, target.id, actorId, required);
    const { room } = targetContext(tx, target.kind, target.id, actorId, "join");
    try {
      const call = tx.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: room.id },
      );
      const participant = tx.findFirstRecordByFilter(
        "call_participants",
        "call = {:call} && user = {:user} && leftAt = '' && expiresAt > {:now}",
        {
          call: call.id,
          user: userId,
          now: permissions.databaseDate(),
        },
      );
      participantId = participant.id;
    } catch {
      throw new NotFoundError("The participant is no longer in this call.");
    }
    roomName = room.getString("roomName");
    permissions.audit(
      tx,
      context.communityId,
      actorId,
      "call.moderation.request",
      "user",
      userId,
      "",
      { action, channel: target.id },
    );
  });
  const result = callControlRequest(roomName, userId, action);
  if (action === "kick" && participantId) {
    app.runInTransaction((tx) => {
      let participant;
      try {
        participant = tx.findRecordById("call_participants", participantId);
      } catch {
        return;
      }
      if (!participant.getString("leftAt")) endParticipant(tx, participant);
    });
  }
  return result;
}

function ejectParticipant(app, participant, intents = null) {
  const userId = participant.getString("user");
  if (!userId) return 0;
  const { room } = targetForRecord(app, participant);
  const revocation = revokeCallTokenVersion(app, room, userId);
  queueCallControl(app, room, userId, "kick", null, revocation, intents);
  return 1;
}

function ejectionRetryAt(attempts, now = Date.now()) {
  const delay = Math.min(15 * 60_000, 60_000 * (2 ** Math.min(Math.max(attempts - 1, 0), 4)));
  return new Date(now + delay).toISOString();
}

function queueCallControl(app, room, userId, action, policy, revocation, intents = null) {
  const roomName = room.getString("roomName");
  if (!roomName) throw new InternalServerError("Call control could not be queued.");
  let pending;
  let existing = true;
  try {
    pending = app.findFirstRecordByFilter(
      "call_ejections",
      "roomName = {:roomName} && userId = {:userId}",
      { roomName, userId },
    );
  } catch {
    existing = false;
    pending = new Record(app.findCollectionByNameOrId("call_ejections"));
    pending.set("roomName", roomName);
    pending.set("userId", userId);
  }
  const updatePending = (record) => {
    if (record.getString("action") !== "kick" || action === "kick") {
      record.set("action", action);
    }
    if (policy) {
      record.set("canSpeak", policy.canSpeak);
      record.set("canStreamVideo", policy.canStreamVideo);
    }
    if (revocation && revocation.version >= record.getInt("tokenVersion")) {
      record.set("tokenVersion", revocation.version);
      record.set("tokenExpiresAt", revocation.expiresAt);
    }
    const revision = record.getInt("revision") + 1;
    record.set("revision", revision);
    record.set("attempts", 0);
    record.set("lastError", "");
    record.set("nextAttemptAt", new Date().toISOString());
    app.save(record);
    if (Array.isArray(intents)) intents.push({ id: record.id, revision });
    return record;
  };
  try {
    return updatePending(pending);
  } catch (error) {
    if (existing) throw error;
    // Concurrent revocations may race the unique room/user index. Merge into
    // the winning durable intent while keeping the authorization write atomic.
    try {
      return updatePending(app.findFirstRecordByFilter(
        "call_ejections",
        "roomName = {:roomName} && userId = {:userId}",
        { roomName, userId },
      ));
    } catch {
      throw error;
    }
  }
}

function queueParticipantEjection(
  app,
  participant,
  action = "kick",
  policy = null,
  revocation = null,
  intents = null,
) {
  const userId = participant.getString("user");
  if (!userId) return null;
  const { room } = targetForRecord(app, participant);
  return queueCallControl(app, room, userId, action, policy, revocation, intents);
}

function finalizeCallControlRevision(app, state, error = null) {
  const params = {
    id: state.id,
    revision: state.revision,
  };
  if (typeof app.db === "function") {
    if (!error) {
      return app.db()
        .newQuery(
          "DELETE FROM call_ejections WHERE id = {:id} AND revision = {:revision}",
        )
        .bind(params)
        .execute()
        .rowsAffected() > 0;
    }
    const attempts = state.item.getInt("attempts") + 1;
    return app.db()
      .newQuery(`
        UPDATE call_ejections
        SET revision = revision + 1,
            attempts = attempts + 1,
            lastError = {:lastError},
            nextAttemptAt = {:nextAttemptAt}
        WHERE id = {:id} AND revision = {:revision}
      `)
      .bind({
        ...params,
        lastError: String(error?.message || error || "Call ejection failed.").slice(0, 1000),
        nextAttemptAt: permissions.databaseDate(ejectionRetryAt(attempts)),
      })
      .execute()
      .rowsAffected() > 0;
  }

  // Test adapters without a SQL builder still exercise the same compare and
  // mutation under their transaction boundary.
  let affected = false;
  app.runInTransaction((tx) => {
    let current;
    try {
      current = tx.findRecordById("call_ejections", state.id);
    } catch {
      return;
    }
    if (current.getInt("revision") !== state.revision) return;
    if (!error) {
      tx.delete(current);
      affected = true;
      return;
    }
    const attempts = current.getInt("attempts") + 1;
    current.set("revision", state.revision + 1);
    current.set("attempts", attempts);
    current.set(
      "lastError",
      String(error?.message || error || "Call ejection failed.").slice(0, 1000),
    );
    current.set("nextAttemptAt", ejectionRetryAt(attempts));
    tx.save(current);
    affected = true;
  });
  return affected;
}

function retryPendingEjections(
  app,
  now = new Date().toISOString(),
  {
    limit = 100,
    maxDurationMs = 20_000,
    intents = null,
    clock = Date.now,
  } = {},
) {
  const batchLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const durationMs = Math.max(1_000, Math.min(60_000, Number(maxDurationMs) || 20_000));
  const startedAt = clock();
  const deadline = startedAt + durationMs;
  let pending;
  if (Array.isArray(intents)) {
    const latest = new Map();
    for (const intent of intents) {
      if (!intent?.id || !Number.isFinite(Number(intent.revision))) continue;
      const revision = Number(intent.revision);
      if (revision >= (latest.get(String(intent.id)) ?? -1)) {
        latest.set(String(intent.id), revision);
      }
    }
    pending = [];
    for (const [id, revision] of latest) {
      try {
        const item = app.findRecordById("call_ejections", id);
        if (
          item.getInt("revision") === revision
          && new Date(item.getString("nextAttemptAt")).getTime() <= new Date(now).getTime()
        ) pending.push(item);
      } catch {
        // A newer worker may already have completed this exact intent.
      }
    }
  } else {
    pending = [];
    let offset = 0;
    const fetchDeadline = Math.min(
      deadline,
      startedAt + Math.max(250, Math.min(2_000, Math.floor(durationMs / 4))),
    );
    while (clock() < fetchDeadline) {
      const page = app.findRecordsByFilter(
        "call_ejections",
        "nextAttemptAt <= {:now}",
        "nextAttemptAt,id",
        batchLimit,
        offset,
        { now: permissions.databaseDate(now) },
      );
      pending.push(...page);
      if (page.length < batchLimit) break;
      offset += page.length;
    }
  }
  const requestWithinBudget = (roomName, userId, action, attributes = {}) => {
    const remainingMs = deadline - clock();
    if (remainingMs <= 0) throw new Error("Call-control dispatch budget exhausted.");
    return callControlRequest(
      roomName,
      userId,
      action,
      attributes,
      Math.ceil(remainingMs / 1000),
    );
  };
  const states = new Map();
  for (const item of pending) {
    const revision = item.getInt("revision");
    const key = `${item.id}:${revision}`;
    const state = {
      id: item.id,
      item,
      key,
      revision,
      prepared: false,
      required: new Set(),
      attempted: new Set(),
      failed: new Map(),
    };
    states.set(key, state);
  }
  const operations = new Map();
  const addOperation = (state, roomName, userId, action, attributes = {}) => {
    const groupingAttributes = action === "revoke"
      ? { tokenVersion: attributes.tokenVersion }
      : attributes;
    const operationKey = JSON.stringify([roomName, action, groupingAttributes]);
    let operation = operations.get(operationKey);
    if (!operation) {
      operation = {
        roomName,
        action,
        attributes: { ...attributes },
        userIds: new Set(),
        states: new Set(),
      };
      operations.set(operationKey, operation);
    } else if (action === "revoke") {
      operation.attributes.expiresAt = Math.max(
        Number(operation.attributes.expiresAt) || 0,
        Number(attributes.expiresAt) || 0,
      );
    }
    operation.userIds.add(userId);
    operation.states.add(state.key);
    state.required.add(operationKey);
  };
  for (const state of states.values()) {
    if (clock() >= deadline) break;
    const item = state.item;
    try {
      const tokenVersion = item.getInt("tokenVersion");
      const tokenExpiresAt = item.getString("tokenExpiresAt");
      if (
        tokenVersion
        && new Date(tokenExpiresAt).getTime() > new Date(now).getTime()
      ) {
        addOperation(state, item.getString("roomName"), item.getString("userId"), "revoke", {
          tokenVersion,
          expiresAt: new Date(tokenExpiresAt).getTime(),
        });
      }
      let restoredTarget = null;
      let restoredContext = null;
      try {
        const room = app.findFirstRecordByData("call_rooms", "roomName", item.getString("roomName"));
        restoredTarget = validateRoomTarget(room);
        restoredContext = authorizeTarget(
          app,
          restoredTarget,
          item.getString("userId"),
          "join",
        );
      } catch {
        // Missing rooms and still-revoked targets both require an ejection.
      }
      const restoredPolicy = restoredTarget?.kind === "channel" && restoredContext
        ? channelMediaPolicy(restoredContext)
        : null;
      if (!restoredContext) {
        addOperation(state, item.getString("roomName"), item.getString("userId"), "kick");
      } else if (
        restoredPolicy
        && item.getString("action") === "kick"
        && (!restoredPolicy.canSpeak || !restoredPolicy.canStreamVideo)
      ) {
        addOperation(state, item.getString("roomName"), item.getString("userId"), "kick");
      } else if (restoredPolicy) {
        addOperation(
          state,
          item.getString("roomName"),
          item.getString("userId"),
          "policy",
          restoredPolicy,
        );
      }
      state.prepared = true;
    } catch (error) {
      state.failed.set("prepare", error);
      state.prepared = true;
    }
  }
  const orderedOperations = [...operations].sort((left, right) => {
    const priority = (operation) => operation.action === "revoke" ? 0 : 1;
    return priority(left[1]) - priority(right[1]);
  });
  for (const [operationKey, operation] of orderedOperations) {
    if (clock() >= deadline) break;
    const eligibleStates = [...operation.states].filter((stateKey) => {
      if (operation.action === "revoke") return true;
      const state = states.get(stateKey);
      if (!state) return false;
      const requiredRevokes = [...state.required].filter(
        (key) => operations.get(key)?.action === "revoke",
      );
      return requiredRevokes.every(
        (key) => state.attempted.has(key) && !state.failed.has(key),
      );
    });
    if (!eligibleStates.length) continue;
    const eligibleUserIds = new Set(
      eligibleStates.map((stateKey) => states.get(stateKey)?.item.getString("userId"))
        .filter(Boolean),
    );
    for (const stateKey of eligibleStates) states.get(stateKey)?.attempted.add(operationKey);
    try {
      requestWithinBudget(
        operation.roomName,
        [...eligibleUserIds],
        operation.action,
        operation.attributes,
      );
    } catch (error) {
      for (const stateKey of eligibleStates) states.get(stateKey)?.failed.set(operationKey, error);
    }
  }
  let completed = 0;
  for (const state of states.values()) {
    if (!state.prepared) continue;
    const allAttempted = [...state.required].every((key) => state.attempted.has(key));
    if (!allAttempted && !state.failed.size) continue;
    if (!state.failed.size && allAttempted) {
      if (finalizeCallControlRevision(app, state)) completed += 1;
      continue;
    }
    const error = state.failed.values().next().value;
    finalizeCallControlRevision(app, state, error);
  }
  return completed;
}

function dispatchPendingCallControls(app, intents) {
  if (!Array.isArray(intents) || !intents.length) return 0;
  try {
    return retryPendingEjections(app, new Date().toISOString(), {
      maxDurationMs: 5_000,
      intents,
    });
  } catch {
    // The durable intent remains queued and the bounded lifecycle worker will
    // pick it up even if inline dispatch fails after the route commits.
    return 0;
  }
}

function authorizeTarget(app, target, userId, permission = "view") {
  if (!userId) throw new ForbiddenError("Authentication is required.");
  if (target.kind === "channel") {
    const required = permission === "join" ? "connect_voice" : "view_channels";
    const context = permissions.channelContext(app, target.id, userId, required);
    if (!permissions.CHANNEL_CAPABILITIES[context.channel.getString("kind")].calls) {
      throw new BadRequestError("This channel does not support calls.");
    }
    return { ...context, target };
  }

  const membership = permissions.conversationMembership(app, target.id, userId);
  const conversation = app.findRecordById("conversations", target.id);
  return { conversation, membership, target };
}

function findRoom(app, target) {
  return app.findFirstRecordByFilter(
    "call_rooms",
    `${target.kind} = {:target}`,
    { target: target.id },
  );
}

function createRoom(app, target) {
  if (target.kind === "channel") {
    const channel = app.findRecordById("channels", target.id);
    if (!permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].calls) {
      throw new BadRequestError("This channel does not support calls.");
    }
  } else {
    app.findRecordById("conversations", target.id);
  }
  const room = new Record(app.findCollectionByNameOrId("call_rooms"));
  room.set("channel", target.kind === "channel" ? target.id : "");
  room.set("conversation", target.kind === "conversation" ? target.id : "");
  room.set("roomName", $security.randomString(32).toLowerCase());
  validateRoomTarget(room);
  app.save(room);
  return room;
}

function ensureRoom(app, target) {
  try {
    return findRoom(app, target);
  } catch {
    try {
      return createRoom(app, target);
    } catch (error) {
      // Concurrent first joins may race the unique target index. The winning
      // durable room is authoritative for both devices.
      try {
        return findRoom(app, target);
      } catch {
        throw error;
      }
    }
  }
}

function endParticipant(
  app,
  participant,
  now = new Date().toISOString(),
  closedReason = "revoked",
) {
  participant.set("leftAt", now);
  participant.set("expiresAt", "");
  participant.set("devices", {});
  app.save(participant);
  const call = app.findRecordById("call_sessions", participant.getString("call"));
  const leases = permissions.findAllRecordsByFilter(
    app,
    "call_presence_leases",
    "room = {:room} && user = {:user} && closedAt = ''",
    "",
    {
      room: call.getString("room"),
      user: participant.getString("user"),
    },
  );
  for (const lease of leases) {
    lease.set("closedAt", now);
    lease.set("closedReason", closedReason);
    lease.set(
      "expiresAt",
      new Date(Date.now() + permissions.TRANSIENT_TIMINGS.callLeaseTombstoneMs).toISOString(),
    );
    app.save(lease);
  }
  const remaining = app.findRecordsByFilter(
    "call_participants",
    "call = {:call} && leftAt = '' && expiresAt > {:now}",
    "",
    1,
    0,
    { call: call.id, now: permissions.databaseDate(now) },
  );
  if (!remaining.length && !call.getString("endedAt")) {
    call.set("endedAt", now);
    app.save(call);
  }
}

function participantRoom(app, participant) {
  return targetForRecord(app, participant).room;
}

function controlRevokedUser(
  app,
  room,
  userId,
  action,
  policy = null,
  eject = true,
  intents = null,
) {
  const revocation = revokeCallTokenVersion(app, room, userId);
  if (eject) queueCallControl(app, room, userId, action, policy, revocation, intents);
  return revocation;
}

function endRevokedParticipants(app, participants, eject = true, intents = null) {
  for (const participant of participants) {
    controlRevokedUser(
      app,
      participantRoom(app, participant),
      participant.getString("user"),
      "kick",
      null,
      eject,
      intents,
    );
    endParticipant(app, participant);
  }
  return participants.length;
}

function revokeTargetParticipant(app, target, userId, eject = true, intents = null) {
  let room;
  try {
    room = findRoom(app, target);
  } catch {
    return false;
  }
  let participant = null;
  try {
    const call = app.findFirstRecordByFilter(
      "call_sessions",
      "room = {:room} && endedAt = ''",
      { room: room.id },
    );
    participant = app.findFirstRecordByFilter(
      "call_participants",
      "call = {:call} && user = {:user} && leftAt = ''",
      { call: call.id, user: userId },
    );
  } catch {
    // A token can exist before the user reports product presence.
  }
  const revocation = revokeCallTokenVersion(app, room, userId);
  if (eject && (participant || revocation)) {
    queueCallControl(app, room, userId, "kick", null, revocation, intents);
  }
  if (participant) endParticipant(app, participant);
  return Boolean(participant || revocation);
}

function revokeTargetParticipants(app, target, eject = true, intents = null) {
  let room;
  try {
    room = findRoom(app, target);
  } catch {
    return 0;
  }
  let participants = [];
  try {
    const call = app.findFirstRecordByFilter(
      "call_sessions",
      "room = {:room} && endedAt = ''",
      { room: room.id },
    );
    participants = permissions.findAllRecordsByFilter(
      app,
      "call_participants",
      "call = {:call} && leftAt = ''",
      "",
      { call: call.id },
    );
  } catch {
    // Token revisions also exist before the first presence heartbeat.
  }
  const tokenStates = permissions.findAllRecordsByFilter(
    app,
    "call_token_versions",
    "room = {:room} && expiresAt > {:now}",
    "",
    { room: room.id, now: permissions.databaseDate() },
  );
  const users = new Set([
    ...participants.map((participant) => participant.getString("user")),
    ...tokenStates.map((state) => state.getString("user")),
  ]);
  for (const currentUserId of users) {
    controlRevokedUser(app, room, currentUserId, "kick", null, eject, intents);
  }
  for (const participant of participants) endParticipant(app, participant);
  return participants.length;
}

function revokeUserParticipants(app, userId, eject = true, intents = null) {
  const participants = permissions.findAllRecordsByFilter(
    app,
    "call_participants",
    "user = {:user} && leftAt = ''",
    "",
    { user: userId },
  );
  const rooms = new Map();
  for (const participant of participants) {
    const room = participantRoom(app, participant);
    rooms.set(room.id, room);
  }
  const tokenStates = permissions.findAllRecordsByFilter(
    app,
    "call_token_versions",
    "user = {:user} && expiresAt > {:now}",
    "",
    { user: userId, now: permissions.databaseDate() },
  );
  for (const state of tokenStates) {
    const room = app.findRecordById("call_rooms", state.getString("room"));
    rooms.set(room.id, room);
  }
  for (const room of rooms.values()) {
    controlRevokedUser(app, room, userId, "kick", null, eject, intents);
  }
  for (const participant of participants) endParticipant(app, participant);
  return participants.length;
}

function ejectUserParticipants(app, userId, intents = null) {
  const participants = permissions.findAllRecordsByFilter(
    app,
    "call_participants",
    "user = {:user} && leftAt = ''",
    "",
    { user: userId },
  );
  const rooms = new Map();
  for (const participant of participants) {
    const room = participantRoom(app, participant);
    rooms.set(room.id, room);
  }
  const tokenStates = permissions.findAllRecordsByFilter(
    app,
    "call_token_versions",
    "user = {:user} && expiresAt > {:now}",
    "",
    { user: userId, now: permissions.databaseDate() },
  );
  for (const state of tokenStates) {
    const room = app.findRecordById("call_rooms", state.getString("room"));
    rooms.set(room.id, room);
  }
  for (const room of rooms.values()) {
    controlRevokedUser(app, room, userId, "kick", null, true, intents);
  }
  return participants.length;
}

function revokeCommunityParticipant(
  app,
  communityId,
  userId,
  eject = true,
  intents = null,
) {
  const channels = permissions.findAllRecordsByFilter(
    app,
    "channels",
    "community = {:community}",
    "",
    { community: communityId },
  );
  let revoked = 0;
  for (const channel of channels) {
    if (!permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].calls) continue;
    if (revokeTargetParticipant(
      app,
      { kind: "channel", id: channel.id },
      userId,
      eject,
      intents,
    )) {
      revoked += 1;
    }
  }
  return revoked;
}

function revokeCommunityParticipants(app, communityId, eject = true, intents = null) {
  const channels = permissions.findAllRecordsByFilter(
    app,
    "channels",
    "community = {:community}",
    "",
    { community: communityId },
  );
  let revoked = 0;
  for (const channel of channels) {
    if (!permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].calls) continue;
    revoked += revokeTargetParticipants(
      app,
      { kind: "channel", id: channel.id },
      eject,
      intents,
    );
  }
  return revoked;
}

function revokeUnauthorizedTargetParticipants(
  app,
  target,
  userId = "",
  eject = true,
  intents = null,
) {
  let room;
  try {
    room = findRoom(app, target);
  } catch {
    return 0;
  }
  let participants = [];
  try {
    const call = app.findFirstRecordByFilter(
      "call_sessions",
      "room = {:room} && endedAt = ''",
      { room: room.id },
    );
    const params = { call: call.id };
    let filter = "call = {:call} && leftAt = ''";
    if (userId) {
      filter += " && user = {:user}";
      params.user = userId;
    }
    participants = permissions.findAllRecordsByFilter(
      app,
      "call_participants",
      filter,
      "",
      params,
    );
  } catch {
    // Token revisions are authoritative even before presence exists.
  }
  const tokenParams = { room: room.id, now: permissions.databaseDate() };
  let tokenFilter = "room = {:room} && expiresAt > {:now}";
  if (userId) {
    tokenFilter += " && user = {:user}";
    tokenParams.user = userId;
  }
  const tokenStates = permissions.findAllRecordsByFilter(
    app,
    "call_token_versions",
    tokenFilter,
    "",
    tokenParams,
  );
  const participantByUser = new Map(participants.map((participant) => (
    [participant.getString("user"), participant]
  )));
  const users = new Set([
    ...participantByUser.keys(),
    ...tokenStates.map((state) => state.getString("user")),
  ]);
  const revoked = [];
  for (const currentUserId of users) {
    const participant = participantByUser.get(currentUserId);
    const revocation = revokeCallTokenVersion(app, room, currentUserId);
    try {
      const context = authorizeTarget(app, target, currentUserId, "join");
      const policy = target.kind === "channel" ? channelMediaPolicy(context) : null;
      queueCallControl(app, room, currentUserId, "policy", policy, revocation, intents);
    } catch {
      if (eject) {
        queueCallControl(app, room, currentUserId, "kick", null, revocation, intents);
      }
      if (participant) revoked.push(participant);
    }
  }
  for (const participant of revoked) endParticipant(app, participant);
  return revoked.length;
}

function revokeUnauthorizedChannelParticipants(
  app,
  channelId,
  userId = "",
  eject = true,
  intents = null,
) {
  const channel = app.findRecordById("channels", channelId);
  if (permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].calls) {
    return revokeUnauthorizedTargetParticipants(
      app,
      { kind: "channel", id: channel.id },
      userId,
      eject,
      intents,
    );
  }
  if (!permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].container) return 0;
  const children = permissions.findAllRecordsByFilter(
    app,
    "channels",
    "parent = {:parent}",
    "",
    { parent: channel.id },
  );
  let revoked = 0;
  for (const child of children) {
    if (!permissions.CHANNEL_CAPABILITIES[child.getString("kind")].calls) continue;
    revoked += revokeUnauthorizedTargetParticipants(
      app,
      { kind: "channel", id: child.id },
      userId,
      eject,
      intents,
    );
  }
  return revoked;
}

function revokeUnauthorizedCommunityParticipants(
  app,
  communityId,
  userId = "",
  eject = true,
  intents = null,
) {
  const channels = permissions.findAllRecordsByFilter(
    app,
    "channels",
    "community = {:community}",
    "",
    { community: communityId },
  );
  let revoked = 0;
  let firstError = null;
  for (const channel of channels) {
    if (!permissions.CHANNEL_CAPABILITIES[channel.getString("kind")].calls) continue;
    try {
      revoked += revokeUnauthorizedTargetParticipants(
        app,
        { kind: "channel", id: channel.id },
        userId,
        eject,
        intents,
      );
    } catch (error) {
      if (!firstError) firstError = error;
    }
  }
  if (firstError) throw firstError;
  return revoked;
}

function targetForRecord(app, record) {
  let room = record;
  switch (record.collection().name) {
    case "call_rooms":
      break;
    case "call_sessions":
      room = app.findRecordById("call_rooms", record.getString("room"));
      break;
    case "call_participants": {
      const call = app.findRecordById("call_sessions", record.getString("call"));
      room = app.findRecordById("call_rooms", call.getString("room"));
      break;
    }
    default:
      throw new BadRequestError("This is not a call record.");
  }
  return { room, target: validateRoomTarget(room) };
}

function targetForRealtimeRecord(app, collection, record) {
  if (collection === "call_rooms") {
    const channelId = String(record.channel || "");
    const conversationId = String(record.conversation || "");
    if (Boolean(channelId) === Boolean(conversationId)) return null;
    return channelId
      ? { kind: "channel", id: channelId }
      : { kind: "conversation", id: conversationId };
  }
  if (collection === "call_sessions") {
    const room = app.findRecordById("call_rooms", String(record.room || ""));
    return validateRoomTarget(room);
  }
  if (collection === "call_participants") {
    const call = app.findRecordById("call_sessions", String(record.call || ""));
    const room = app.findRecordById("call_rooms", call.getString("room"));
    return validateRoomTarget(room);
  }
  return null;
}

function canViewRecord(app, record, userId) {
  try {
    authorizeTarget(app, targetForRecord(app, record).target, userId, "view");
    return true;
  } catch {
    return false;
  }
}

function targetContext(app, kind, id, userId, permission = "view", createIfMissing = false) {
  const target = callTarget(kind, id);
  const authorization = authorizeTarget(app, target, userId, permission);
  return {
    ...authorization,
    room: createIfMissing ? ensureRoom(app, target) : findRoom(app, target),
  };
}

module.exports = {
  CALL_SCOPED_COLLECTIONS,
  applyDeviceStates,
  authorizeTarget,
  callCapabilities,
  callTarget,
  canViewRecord,
  createRoom,
  deviceStates,
  dispatchPendingCallControls,
  ejectParticipant,
  ejectUserParticipants,
  endParticipant,
  ensureRoom,
  findRoom,
  issueCallTokenVersion,
  moderateParticipant,
  queueCallControl,
  retryPendingEjections,
  revokeCommunityParticipant,
  revokeCommunityParticipants,
  revokeUnauthorizedChannelParticipants,
  revokeUnauthorizedCommunityParticipants,
  revokeUnauthorizedTargetParticipants,
  revokeTargetParticipant,
  revokeTargetParticipants,
  revokeUserParticipants,
  targetContext,
  targetForRealtimeRecord,
  targetForRecord,
  validateRoomTarget,
};
