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

  const participants = [];
  const now = Date.now();
  for (const target of targets) {
    calls.authorizeTarget(e.app, target, e.auth.id, "view");
    let room;
    let call;
    try {
      room = calls.findRoom(e.app, target);
      call = e.app.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: room.id },
      );
    } catch {
      continue;
    }
    const active = h.findAllRecordsByFilter(
      e.app,
      "call_participants",
      "call = {:call} && leftAt = ''",
      "+joinedAt",
      { call: call.id },
    ).filter((participant) => new Date(participant.getString("expiresAt")).getTime() > now);
    $apis.enrichRecords(e, active, "user", "call", "call.room");
    participants.push(...active);
  }
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
    callPermissions = calls.callCapabilities(target.kind, context);
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
  if (action !== "mute" && action !== "kick") {
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
  const deviceId = h.requiredText(body.deviceId, "deviceId", 120);
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
    let call;
    try {
      call = tx.findFirstRecordByFilter(
        "call_sessions",
        "room = {:room} && endedAt = ''",
        { room: context.room.id },
      );
    } catch {
      if (state === "left") return;
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
            if (user.getString("status") === "dnd") continue;
            const preferences = h.recordPreferences(user);
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
      if (state === "left") return;
      participant = new Record(tx.findCollectionByNameOrId("call_participants"));
      participantCreated = true;
      participant.set("call", call.id);
      participant.set("user", e.auth.id);
      participant.set("joinedAt", new Date().toISOString());
    }

    const now = new Date().toISOString();
    let devices = participantCreated ? {} : calls.deviceStates(participant);
    devices = calls.applyDeviceStates(participant, devices, now);
    if (state === "left") {
      delete devices[deviceId];
      devices = calls.applyDeviceStates(participant, devices, now);
      if (Object.keys(devices).length) {
        tx.save(participant);
        result = { active: true, call, participant };
        return;
      }
      calls.endParticipant(tx, participant, now);
      result = { active: false };
      return;
    }

    participant.set("leftAt", "");
    const expiresAt = new Date(Date.now() + h.TRANSIENT_TIMINGS.callParticipantExpiryMs).toISOString();
    const previous = devices[deviceId] || {
      muted: true,
      deafened: false,
      camera: false,
      sharing: false,
    };
    devices[deviceId] = {
      expiresAt,
      muted: body.muted === undefined ? previous.muted : Boolean(body.muted),
      deafened: body.deafened === undefined ? previous.deafened : Boolean(body.deafened),
      camera: body.camera === undefined ? previous.camera : Boolean(body.camera),
      sharing: body.sharing === undefined ? previous.sharing : Boolean(body.sharing),
    };
    calls.applyDeviceStates(participant, devices, now);
    tx.save(participant);
    result = { active: true, call, participant };
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
    ...(result || { active: false }),
    ...(refreshedPermissions || {}),
  });
}, $apis.requireAuth("users"));
}

module.exports = {
  registerCalls,
};
