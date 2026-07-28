function registerCalls() {
routerAdd("POST", "/api/thiscord/calls/occupancy", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const calls = require(`${__hooks}/lib/callAccess.js`);
  const requested = Array.isArray(e.requestInfo().body.targets)
    ? e.requestInfo().body.targets
    : [];
  const targets = [];
  const seen = new Set();
  for (const candidate of requested) {
    const target = calls.callTarget(String(candidate.kind || ""), String(candidate.id || ""));
    const key = `${target.kind}:${target.id}`;
    if (!target.id || seen.has(key)) continue;
    seen.add(key);
    targets.push(target);
  }
  if (targets.length > 200) throw new BadRequestError("Too many call targets.");

  const authorizedTargets = [];
  const now = Date.now();
  for (const target of targets) {
    calls.authorizeTarget(e.app, target, e.auth.id, "view");
    authorizedTargets.push(target);
  }
  const roomQueries = [
    ["channel", authorizedTargets.filter((target) => target.kind === "channel").map((target) => target.id)],
    ["conversation", authorizedTargets.filter((target) => target.kind === "conversation").map((target) => target.id)],
  ];
  const rooms = [];
  for (const [field, ids] of roomQueries) {
    if (!ids.length) continue;
    const targetFilter = h.filterAny(field, ids, field);
    rooms.push(...h.findAllRecordsByFilter(
      e.app,
      "call_rooms",
      targetFilter.filter,
      "",
      targetFilter.params,
    ));
  }
  const roomFilter = h.filterAny("room", rooms.map((room) => room.id), "room");
  const activeCalls = h.findAllRecordsByFilter(
    e.app,
    "call_sessions",
    `${roomFilter.filter} && endedAt = ''`,
    "",
    roomFilter.params,
  );
  const activeCallIds = activeCalls.map((call) => call.id);
  const callFilter = h.filterAny("call", activeCallIds, "call");
  const participants = h.findAllRecordsByFilter(
    e.app,
    "call_participants",
    `${callFilter.filter} && leftAt = ''`,
    "+joinedAt",
    callFilter.params,
  ).filter((participant) => new Date(participant.getString("expiresAt")).getTime() > now);
  $apis.enrichRecords(e, participants, "user", "call", "call.room");
  return e.json(200, { participants });
}, $apis.requireAuth("users"), $apis.bodyLimit(128 * 1024));

routerAdd("GET", "/api/thiscord/calls/{kind}/{id}/join", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const calls = require(`${__hooks}/lib/callAccess.js`);
  const target = calls.callTarget(e.request.pathValue("kind"), e.request.pathValue("id"));

  const domain = String($os.getenv("JITSI_DOMAIN") || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const jitsiUrl = String($os.getenv("JITSI_URL") || `https://${domain}`).replace(/\/+$/, "");
  const appId = String($os.getenv("JITSI_APP_ID") || "");
  const secret = String($os.getenv("JITSI_APP_SECRET") || "");
  if (!domain || !jitsiUrl || !appId || !secret) throw new InternalServerError("Jitsi is not configured.");

  const issuedAt = Date.now();
  const expiresAt = new Date(issuedAt + h.TRANSIENT_TIMINGS.callTokenLifetimeMs);
  let context;
  let callPermissions;
  let tokenVersion;
  const prepareToken = () => e.app.runInTransaction((tx) => {
    context = calls.targetContext(
      tx,
      target.kind,
      target.id,
      e.auth.id,
      "join",
      target.kind === "conversation",
    );
    let participant = null;
    try {
      const activeCall = tx.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: context.room.id },
      );
      participant = tx.findFirstRecordByFilter(
        "call_participants",
        "call = {:call} && user = {:user} && leftAt = '' && expiresAt > {:now}",
        {
          call: activeCall.id,
          user: e.auth.id,
          now: h.databaseDate(),
        },
      );
    } catch {
      // A token may be issued before product presence is created.
    }
    callPermissions = calls.callCapabilities(target.kind, context, participant);
    tokenVersion = calls.issueCallTokenVersion(
      tx,
      context.room,
      e.auth.id,
      expiresAt.toISOString(),
    );
  });
  try {
    prepareToken();
  } catch (error) {
    if (!/unique|constraint|locked/i.test(String(error?.message || error))) throw error;
    prepareToken();
  }
  const canMuteMembers = callPermissions.canMuteMembers;
  const canRemoveMembers = callPermissions.canRemoveMembers;
  // Jitsi's moderator role is deliberately never delegated to browsers: it
  // combines mute, kick, and owner-grant powers that Thiscord authorizes
  // independently. Participant moderation is routed through PocketBase below.
  const moderator = false;
  const canSpeak = callPermissions.canSpeak;
  const canStreamVideo = callPermissions.canStreamVideo;
  const roomName = context.room.getString("roomName");
  const pocketBasePublicUrl = String($os.getenv("POCKETBASE_PUBLIC_URL") || "");
  const avatar = e.auth.getString("avatar");
  const avatarUrl = h.publicFileUrl(pocketBasePublicUrl, e.auth, avatar, "128x128");
  const displayName = e.auth.getString("displayName") || e.auth.getString("handle");
  const token = $security.createJWT({
    aud: appId,
    iss: appId,
    sub: domain,
    room: roomName,
    moderator,
    context: {
      user: {
        id: e.auth.id,
        name: displayName,
        avatar: avatarUrl,
        moderator,
        thiscordTokenVersion: tokenVersion,
        thiscordCanSpeak: canSpeak,
        thiscordCanStreamVideo: canStreamVideo,
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "file-upload": false,
      },
    },
  }, secret, h.TRANSIENT_TIMINGS.callTokenLifetimeMs / 1000);

  return e.json(200, {
    domain,
    url: jitsiUrl,
    roomName,
    jwt: token,
    displayName,
    avatarUrl,
    canSpeak,
    canStreamVideo,
    canMuteMembers,
    canRemoveMembers,
    expiresAt: expiresAt.toISOString(),
  });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/calls/{kind}/{id}/moderate", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const calls = require(`${__hooks}/lib/callAccess.js`);
  const target = calls.callTarget(e.request.pathValue("kind"), e.request.pathValue("id"));
  const body = e.requestInfo().body;
  const action = String(body.action || "");
  if (!["mute", "server_mute", "server_unmute", "kick"].includes(action)) {
    throw new BadRequestError("Invalid call moderation action.");
  }
  const userId = h.requiredText(body.userId, "userId", 30);
  calls.moderateParticipant(e.app, target, e.auth.id, userId, action);
  return e.json(200, { success: true });
}, $apis.requireAuth("users"), $apis.bodyLimit(16 * 1024));

routerAdd("POST", "/api/thiscord/calls/{kind}/{id}/presence", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const calls = require(`${__hooks}/lib/callAccess.js`);
  const target = calls.callTarget(e.request.pathValue("kind"), e.request.pathValue("id"));
  const body = e.requestInfo().body;
  const state = String(body.state || "");
  if (!["joined", "update", "left"].includes(state)) {
    throw new BadRequestError("Invalid call presence state.");
  }
  const leaseId = h.requiredText(body.leaseId, "call presence lease", 120);
  const sequence = Number(body.sequence);
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new BadRequestError("Invalid call presence sequence.");
  }
  let result = null;
  let refreshedPermissions = null;
  const updatePresence = () => e.app.runInTransaction((tx) => {
    const context = calls.targetContext(
      tx,
      target.kind,
      target.id,
      e.auth.id,
      state === "left" ? "view" : "join",
      target.kind === "conversation" && state !== "left",
    );
    refreshedPermissions = calls.callCapabilities(target.kind, context);
    const now = new Date().toISOString();
    let lease;
    let leaseFound = true;
    try {
      lease = tx.findFirstRecordByFilter(
        "call_presence_leases",
        "room = {:room} && user = {:user} && leaseId = {:lease}",
        { room: context.room.id, user: e.auth.id, lease: leaseId },
      );
    } catch {
      leaseFound = false;
      lease = new Record(tx.findCollectionByNameOrId("call_presence_leases"));
      lease.set("room", context.room.id);
      lease.set("user", e.auth.id);
      lease.set("leaseId", leaseId);
    }

    const currentResult = () => {
      try {
        const currentCall = tx.findFirstRecordByFilter(
          "call_sessions",
          "room = {:room} && endedAt = ''",
          { room: context.room.id },
        );
        const currentParticipant = tx.findFirstRecordByFilter(
          "call_participants",
          "call = {:call} && user = {:user} && leftAt = ''",
          { call: currentCall.id, user: e.auth.id },
        );
        return { active: true, call: currentCall, participant: currentParticipant };
      } catch {
        return { active: false };
      }
    };

    const existingResult = currentResult();
    if (existingResult.active) {
      refreshedPermissions = calls.callCapabilities(
        target.kind,
        context,
        existingResult.participant,
      );
    }
    const canRepairInterruptedJoin = leaseFound
      && state === "joined"
      && sequence === lease.getInt("sequence")
      && !lease.getString("closedAt")
      && (
        !existingResult.active
        || !calls.deviceStates(existingResult.participant)[leaseId]
      );
    const canReopenExpired = leaseFound
      && state === "joined"
      && lease.getString("closedReason") === "expired"
      && sequence > lease.getInt("sequence");
    if (
      leaseFound
      && !canRepairInterruptedJoin
      && !canReopenExpired
      && (sequence <= lease.getInt("sequence") || Boolean(lease.getString("closedAt")))
    ) {
      result = {
        ...existingResult,
        accepted: false,
        sequence: lease.getInt("sequence"),
      };
      return;
    }

    lease.set("sequence", sequence);
    if (state === "left") {
      lease.set("closedAt", now);
      lease.set("closedReason", "left");
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.callLeaseTombstoneMs).toISOString(),
      );
    } else {
      lease.set("closedAt", "");
      lease.set("closedReason", "");
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.callParticipantExpiryMs).toISOString(),
      );
    }
    tx.save(lease);

    let call;
    try {
      call = tx.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: context.room.id },
      );
    } catch {
      if (state === "left") {
        result = { active: false, accepted: true, sequence };
        return;
      }
      call = new Record(tx.findCollectionByNameOrId("call_sessions"));
      call.set("room", context.room.id);
      call.set("startedBy", e.auth.id);
      tx.save(call);
      if (target.kind === "conversation") {
        const members = h.findAllRecordsByFilter(
          tx,
          "conversation_members",
          "conversation = {:conversation} && user != {:actor}",
          "",
          { conversation: target.id, actor: e.auth.id },
        );
        for (const member of members) {
          const userId = member.getString("user");
          try {
            const user = tx.findRecordById("users", userId);
            const preferences = h.recordPreferences(user);
            if (String(preferences.presenceStatus || "online") === "dnd") continue;
            const muted = Array.isArray(preferences.mutedConversations)
              ? preferences.mutedConversations.map(String)
              : [];
            if (muted.includes(target.id)) continue;
            const notification = new Record(tx.findCollectionByNameOrId("notifications"));
            notification.set("user", userId);
            notification.set("actor", e.auth.id);
            notification.set("type", "conversation_call");
            notification.set("data", { conversation: target.id, call: call.id });
            tx.save(notification);
          } catch {
            // Deleted users and memberships never block call initiation.
          }
        }
      }
    }

    let participant;
    let participantCreated = false;
    try {
      participant = tx.findFirstRecordByFilter(
        "call_participants",
        "call = {:call} && user = {:user} && leftAt = ''",
        { call: call.id, user: e.auth.id },
      );
    } catch {
      if (state === "left") {
        result = { active: false, accepted: true, sequence };
        return;
      }
      participant = new Record(tx.findCollectionByNameOrId("call_participants"));
      participantCreated = true;
      participant.set("call", call.id);
      participant.set("user", e.auth.id);
      participant.set("joinedAt", new Date().toISOString());
      const previous = tx.findRecordsByFilter(
        "call_participants",
        "call = {:call} && user = {:user}",
        "-created",
        1,
        0,
        { call: call.id, user: e.auth.id },
      )[0];
      participant.set("serverMuted", previous ? previous.getBool("serverMuted") : false);
    }
    refreshedPermissions = calls.callCapabilities(target.kind, context, participant);

    let devices = participantCreated ? {} : calls.deviceStates(participant);
    devices = calls.applyDeviceStates(participant, devices, now);
    if (state === "left") {
      delete devices[leaseId];
      devices = calls.applyDeviceStates(participant, devices, now);
      if (Object.keys(devices).length) {
        tx.save(participant);
        result = { active: true, call, participant, accepted: true, sequence };
        return;
      }
      calls.endParticipant(tx, participant, now, "left");
      result = { active: false, accepted: true, sequence };
      return;
    }

    participant.set("leftAt", "");
    const expiresAt = new Date(Date.now() + h.TRANSIENT_TIMINGS.callParticipantExpiryMs).toISOString();
    const previous = devices[leaseId] || {
      muted: true,
      deafened: false,
      camera: false,
      sharing: false,
    };
    devices[leaseId] = {
      expiresAt,
      muted: body.muted === undefined ? previous.muted : Boolean(body.muted),
      deafened: body.deafened === undefined ? previous.deafened : Boolean(body.deafened),
      camera: body.camera === undefined ? previous.camera : Boolean(body.camera),
      sharing: body.sharing === undefined ? previous.sharing : Boolean(body.sharing),
    };
    calls.applyDeviceStates(participant, devices, now);
    tx.save(participant);
    result = { active: true, call, participant, accepted: true, sequence };
  });
  try {
    updatePresence();
  } catch (error) {
    if (state === "left") throw error;
    const context = calls.targetContext(
      e.app,
      target.kind,
      target.id,
      e.auth.id,
      "join",
      target.kind === "conversation",
    );
    try {
      e.app.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: context.room.id },
      );
    } catch {
      throw error;
    }
    // A concurrent first join can win either the active-call or active-user
    // unique index. Reload the winner and merge this device in a fresh
    // transaction instead of surfacing a uniqueness error.
    result = null;
    updatePresence();
  }

  return e.json(200, {
    ...(result || { active: false, accepted: false, sequence }),
    ...(refreshedPermissions || {}),
  });
}, $apis.requireAuth("users"));
}

module.exports = {
  registerCalls,
};
