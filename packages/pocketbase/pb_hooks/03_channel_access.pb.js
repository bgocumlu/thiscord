/// <reference path="../pb_data/types.d.ts" />

const channelScopedCollections = [
  "channels",
  "channel_permissions",
  "messages",
  "reactions",
  "read_states",
  "typing",
  "call_sessions",
  "call_participants",
];

// PocketBase collection rules establish community membership. These hooks add
// the channel-specific role/member overwrite check that collection rules cannot
// safely express, including direct record views and expanded list responses.
onRecordsListRequest((e) => {
  const guard = require(`${__hooks}/lib/channelAccess.js`);
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }

  const userId = e.auth ? e.auth.id : "";
  const visible = e.records.filter((record) => guard.canViewRecord(e.app, record, userId));
  e.records = visible;
  if (e.result) {
    e.result.items = visible;
    // Do not disclose how many records exist in channels the caller cannot see.
    e.result.totalItems = visible.length;
    e.result.totalPages = visible.length ? 1 : 0;
  }
  e.next();
}, ...channelScopedCollections);

onRecordViewRequest((e) => {
  const guard = require(`${__hooks}/lib/channelAccess.js`);
  if (!e.hasSuperuserAuth() && !guard.canViewRecord(e.app, e.record, e.auth ? e.auth.id : "")) {
    throw new ForbiddenError("You cannot view this channel.");
  }
  e.next();
}, ...channelScopedCollections);

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
  if (e.hasSuperuserAuth() || !e.message) {
    e.next();
    return;
  }

  const collection = String(e.message.name || "").split("/")[0];
  if (!guard.CHANNEL_SCOPED_COLLECTIONS.includes(collection)) {
    e.next();
    return;
  }

  try {
    const raw = typeof e.message.data === "string"
      ? e.message.data
      : String.fromCharCode(...e.message.data);
    const payload = JSON.parse(raw);
    const channelId = guard.channelIdForRealtimeRecord(e.app, collection, payload.record || {});
    if (!channelId || !e.auth) return;
    const required = ["messages", "reactions", "read_states"].includes(collection)
      ? "read_history"
      : "view_channels";
    access.channelContext(e.app, channelId, e.auth.id, required);
    e.next();
  } catch {
    // A missing relation or a denied permission intentionally drops the event.
  }
});
