/// <reference path="../pb_data/types.d.ts" />

const channelScopedCollections = [
  "channels",
  "channel_permissions",
  "messages",
  "reactions",
  "read_states",
];
const callScopedCollections = ["call_rooms", "call_sessions", "call_participants"];

// PocketBase collection rules establish community membership. Exact record
// views add the channel-specific overwrite check that collection rules cannot
// safely express. Raw list endpoints are disabled because request hooks run
// after PocketBase pagination; every supported list uses a custom route that
// authorizes before filling its page.
onRecordsListRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }
  throw new ForbiddenError("Use the authorized Thiscord collection route.");
}, ...channelScopedCollections);

onRecordViewRequest((e) => {
  const guard = require(`${__hooks}/lib/channelAccess.js`);
  if (!e.hasSuperuserAuth() && !guard.canViewRecord(e.app, e.record, e.auth ? e.auth.id : "")) {
    throw new ForbiddenError("You cannot view this channel.");
  }
  e.next();
}, ...channelScopedCollections);

onRecordsListRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }
  throw new ForbiddenError("Use the authorized Thiscord call route.");
}, ...callScopedCollections);

onRecordViewRequest((e) => {
  const guard = require(`${__hooks}/lib/callAccess.js`);
  if (!e.hasSuperuserAuth() && !guard.canViewRecord(e.app, e.record, e.auth ? e.auth.id : "")) {
    throw new ForbiddenError("You cannot view this call.");
  }
  e.next();
}, ...callScopedCollections);

onFileDownloadRequest((e) => {
  const access = require(`${__hooks}/lib/permissions.js`);
  const auth = access.fileRequestAuth(e);
  const superuser = e.hasSuperuserAuth() || access.isSuperuserRecord(auth);
  if (!superuser) {
    try {
      access.channelContext(e.app, e.record.getString("channel"), auth ? auth.id : "", "read_history");
    } catch {
      throw new ForbiddenError("You cannot download files from this channel.");
    }
  }
  e.next();
}, "messages");

onFileDownloadRequest((e) => {
  const access = require(`${__hooks}/lib/permissions.js`);
  const auth = access.fileRequestAuth(e);
  const superuser = e.hasSuperuserAuth() || access.isSuperuserRecord(auth);
  if (!superuser) {
    try {
      access.conversationMembership(
        e.app,
        e.record.getString("conversation"),
        auth ? auth.id : "",
      );
    } catch {
      throw new ForbiddenError("You cannot download files from this conversation.");
    }
  }
  e.next();
}, "direct_messages");

// Built-in realtime list rules verify community membership. Apply the same
// channel overwrite decision before the serialized event reaches each client.
onRealtimeMessageSend((e) => {
  const guard = require(`${__hooks}/lib/channelAccess.js`);
  const access = require(`${__hooks}/lib/permissions.js`);
  const auth = e.auth || e.client.get("auth");
  if (e.hasSuperuserAuth() || access.isSuperuserRecord(auth) || !e.message) {
    e.next();
    return;
  }

  const collection = String(e.message.name || "").split("/")[0];
  const calls = require(`${__hooks}/lib/callAccess.js`);
  if (
    !guard.CHANNEL_SCOPED_COLLECTIONS.includes(collection)
    && !calls.CALL_SCOPED_COLLECTIONS.includes(collection)
  ) {
    e.next();
    return;
  }

  try {
    const raw = typeof e.message.data === "string"
      ? e.message.data
      : String.fromCharCode(...e.message.data);
    const payload = JSON.parse(raw);
    if (!auth) return;
    if (calls.CALL_SCOPED_COLLECTIONS.includes(collection)) {
      const target = calls.targetForRealtimeRecord(e.app, collection, payload.record || {});
      if (!target) return;
      calls.authorizeTarget(e.app, target, auth.id, "view");
    } else {
      const channelId = guard.channelIdForRealtimeRecord(e.app, collection, payload.record || {});
      if (!channelId) return;
      const required = ["messages", "reactions", "read_states"].includes(collection)
        ? "read_history"
        : "view_channels";
      access.channelContext(e.app, channelId, auth.id, required);
    }
    e.next();
  } catch {
    // A missing relation or a denied permission intentionally drops the event.
  }
});
