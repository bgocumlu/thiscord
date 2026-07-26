const permissions = require(`${__hooks}/lib/permissions.js`);

const CHANNEL_SCOPED_COLLECTIONS = [
  "channels",
  "channel_permissions",
  "messages",
  "reactions",
  "read_states",
  "typing",
  "call_sessions",
  "call_participants",
];

function channelIdForRecord(app, record) {
  switch (record.collection().name) {
    case "channels":
      return record.id;
    case "channel_permissions":
    case "messages":
    case "read_states":
    case "typing":
    case "call_sessions":
      return record.getString("channel");
    case "reactions": {
      const message = app.findRecordById("messages", record.getString("message"));
      return message.getString("channel");
    }
    case "call_participants": {
      const call = app.findRecordById("call_sessions", record.getString("call"));
      return call.getString("channel");
    }
    default:
      return "";
  }
}

function canViewRecord(app, record, userId) {
  if (!userId) return false;
  try {
    const channelId = channelIdForRecord(app, record);
    if (!channelId) return false;
    const collection = record.collection().name;
    const required = ["messages", "reactions", "read_states"].includes(collection)
      ? "read_history"
      : "view_channels";
    permissions.channelContext(app, channelId, userId, required);
    return true;
  } catch {
    return false;
  }
}

function channelIdForRealtimeRecord(app, collection, record) {
  switch (collection) {
    case "channels":
      return String(record.id || "");
    case "channel_permissions":
    case "messages":
    case "read_states":
    case "typing":
    case "call_sessions":
      return String(record.channel || "");
    case "reactions": {
      const message = app.findRecordById("messages", String(record.message || ""));
      return message.getString("channel");
    }
    case "call_participants": {
      const call = app.findRecordById("call_sessions", String(record.call || ""));
      return call.getString("channel");
    }
    default:
      return "";
  }
}

module.exports = {
  CHANNEL_SCOPED_COLLECTIONS,
  canViewRecord,
  channelIdForRealtimeRecord,
};
