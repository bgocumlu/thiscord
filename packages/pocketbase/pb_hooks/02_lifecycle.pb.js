/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const handle = String(e.record.get("handle") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  if (handle.length < 2 || handle.length > 32) throw new BadRequestError("Invalid handle.");
  e.record.set("handle", handle);
  e.record.set("displayName", h.normalizeName(e.record.get("displayName") || handle, 80));
  e.record.set("status", "online");
  e.record.set("lastSeenAt", new Date().toISOString());
  e.record.set("preferences", {
    theme: "dark",
    compactMode: false,
    reduceMotion: false,
    notificationSound: true,
  });
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  if (e.record.get("handle")) {
    const handle = String(e.record.get("handle")).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (handle.length < 2 || handle.length > 32) throw new BadRequestError("Invalid handle.");
    e.record.set("handle", handle);
  }
  if (e.record.get("displayName")) {
    e.record.set("displayName", h.normalizeName(e.record.get("displayName"), 80));
  }
  e.next();
}, "users");

onRecordAfterCreateSuccess((e) => {
  e.next();
  const message = e.record;
  if (message.getString("deletedAt")) return;
  const content = message.getString("content");
  const channel = e.app.findRecordById("channels", message.getString("channel"));
  const communityId = channel.getString("community");
  const authorId = message.getString("author");
  const notified = new Set();

  const notify = (userId, type) => {
    if (!userId || userId === authorId || notified.has(userId)) return;
    try {
      h.channelContext(e.app, channel.id, userId, "read_history");
      const user = e.app.findRecordById("users", userId);
      let preferences = {};
      try {
        preferences = user.get("preferences") || {};
        if (typeof preferences === "string") preferences = JSON.parse(preferences);
      } catch {
        preferences = {};
      }
      const mutedChannels = Array.isArray(preferences.mutedChannels) ? preferences.mutedChannels.map(String) : [];
      if (mutedChannels.includes(channel.id)) return;
      createNotification(e.app, userId, authorId, communityId, channel.id, message.id, type);
      notified.add(userId);
    } catch {
      // Inaccessible channels and deleted users do not receive notifications.
    }
  };

  const replyId = message.getString("replyTo");
  if (replyId) {
    try {
      const reply = e.app.findRecordById("messages", replyId);
      const targetId = reply.getString("author");
      notify(targetId, "reply");
    } catch {
      // A missing reply does not block the persisted message.
    }
  }

  const pattern = /@([a-z0-9._-]{2,32})/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    try {
      const user = e.app.findFirstRecordByData("users", "handle", match[1].toLowerCase());
      e.app.findFirstRecordByFilter(
        "memberships",
        "community = {:community} && user = {:user} && state = 'active'",
        { community: communityId, user: user.id },
      );
      notify(user.id, "mention");
    } catch {
      // Unknown handles and non-members are ignored.
    }
  }

  if (/(^|\s)@everyone\b/i.test(content)) {
    const author = h.channelContext(e.app, channel.id, authorId, "mention_everyone");
    if (author) {
      const members = e.app.findRecordsByFilter(
        "memberships",
        "community = {:community} && state = 'active' && user != {:author}",
        "",
        10000,
        0,
        { community: communityId, author: authorId },
      );
      for (const member of members) notify(member.getString("user"), "mention_everyone");
    }
  }

  const mentionableRoles = e.app.findRecordsByFilter(
    "roles",
    "community = {:community} && mentionable = true",
    "",
    500,
    0,
    { community: communityId },
  );
  const normalizedContent = content.toLowerCase();
  for (const role of mentionableRoles) {
    const token = `@${role.getString("name").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    if (!token || !normalizedContent.includes(token)) continue;
    const assignments = e.app.findRecordsByFilter(
      "member_roles",
      "role = {:role}",
      "",
      10000,
      0,
      { role: role.id },
    );
    for (const assignment of assignments) {
      try {
        const membership = e.app.findRecordById("memberships", assignment.getString("membership"));
        if (membership.getString("state") === "active") notify(membership.getString("user"), "role_mention");
      } catch {
        // Stale assignments are ignored.
      }
    }
  }

  function createNotification(app, userId, actorId, community, channelId, messageId, type) {
    const notification = new Record(app.findCollectionByNameOrId("notifications"));
    notification.set("user", userId);
    notification.set("actor", actorId);
    notification.set("community", community);
    notification.set("channel", channelId);
    notification.set("message", messageId);
    notification.set("type", type);
    notification.set("data", {});
    app.save(notification);
  }
}, "messages");

onRecordAfterCreateSuccess((e) => {
  e.next();
  const message = e.record;
  const members = e.app.findRecordsByFilter(
    "conversation_members",
    "conversation = {:conversation} && user != {:author}",
    "",
    100,
    0,
    { conversation: message.getString("conversation"), author: message.getString("author") },
  );
  for (const member of members) {
    const notification = new Record(e.app.findCollectionByNameOrId("notifications"));
    notification.set("user", member.getString("user"));
    notification.set("actor", message.getString("author"));
    notification.set("type", "direct_message");
    notification.set("data", {
      conversation: message.getString("conversation"),
      directMessage: message.id,
    });
    e.app.save(notification);
  }
}, "direct_messages");

cronAdd("thiscord-transient-cleanup", "* * * * *", () => {
  const now = new Date().toISOString();
  for (const collection of ["presence", "typing", "direct_typing"]) {
    const records = $app.findRecordsByFilter(
      collection,
      "expiresAt != '' && expiresAt <= {:now}",
      "",
      1000,
      0,
      { now },
    );
    for (const record of records) $app.delete(record);
  }

  const staleParticipants = $app.findRecordsByFilter(
    "call_participants",
    "leftAt = '' && expiresAt != '' && expiresAt <= {:now}",
    "",
    1000,
    0,
    { now },
  );
  for (const participant of staleParticipants) {
    participant.set("leftAt", now);
    participant.set("expiresAt", "");
    $app.save(participant);
  }

  const activeCalls = $app.findRecordsByFilter("call_sessions", "endedAt = ''", "", 1000, 0);
  for (const call of activeCalls) {
    const participants = $app.findRecordsByFilter(
      "call_participants",
      "call = {:call} && leftAt = '' && expiresAt > {:now}",
      "",
      1,
      0,
      { call: call.id, now },
    );
    if (!participants.length) {
      call.set("endedAt", now);
      $app.save(call);
    }
  }
});
