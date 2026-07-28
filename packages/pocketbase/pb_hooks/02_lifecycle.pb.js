/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const handle = String(e.record.get("handle") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  if (
    handle.length < h.POLICY_LIMITS.profile.handleMin
    || handle.length > h.POLICY_LIMITS.profile.handleMax
  ) throw new BadRequestError("Invalid handle.");
  e.record.set("handle", handle);
  e.record.set(
    "displayName",
    h.normalizeName(e.record.get("displayName") || handle, h.POLICY_LIMITS.profile.displayNameMax),
  );
  e.record.set("status", "online");
  e.record.set("lastSeenAt", new Date().toISOString());
  e.record.set("preferences", {
    theme: "dark",
    compactMode: false,
    reduceMotion: false,
    notificationSound: true,
    presenceStatus: "online",
  });
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  if (e.record.get("handle")) {
    const handle = String(e.record.get("handle")).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (
      handle.length < h.POLICY_LIMITS.profile.handleMin
      || handle.length > h.POLICY_LIMITS.profile.handleMax
    ) throw new BadRequestError("Invalid handle.");
    e.record.set("handle", handle);
  }
  if (e.record.get("displayName")) {
    e.record.set(
      "displayName",
      h.normalizeName(e.record.get("displayName"), h.POLICY_LIMITS.profile.displayNameMax),
    );
  }
  e.next();
}, "users");

onRecordAfterCreateSuccess((e) => {
  e.next();
  const h = require(`${__hooks}/lib/permissions.js`);
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
      const preferences = h.recordPreferences(user);
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

  const pattern = /(^|[^a-z0-9._-])@([a-z0-9._-]{2,32})(?![a-z0-9._-])/gi;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    try {
      const user = e.app.findFirstRecordByData("users", "handle", match[2].toLowerCase());
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

  if (/(^|[^a-z0-9._-])@everyone\b/i.test(content)) {
    const author = h.channelContext(e.app, channel.id, authorId, "mention_everyone");
    if (author) {
      const members = h.findAllRecordsByFilter(
        e.app,
        "memberships",
        "community = {:community} && state = 'active' && user != {:author}",
        "",
        { community: communityId, author: authorId },
      );
      for (const member of members) notify(member.getString("user"), "mention_everyone");
    }
  }

  const mentionableRoles = h.findAllRecordsByFilter(
    e.app,
    "roles",
    "community = {:community} && mentionable = true",
    "",
    { community: communityId },
  );
  const normalizedContent = content.toLowerCase();
  for (const role of mentionableRoles) {
    const normalizedRole = role.getString("name")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!normalizedRole) continue;
    const tokenPattern = new RegExp(`(^|[^a-z0-9-])@${normalizedRole}(?![a-z0-9-])`, "i");
    if (!tokenPattern.test(normalizedContent)) continue;
    const assignments = h.findAllRecordsByFilter(
      e.app,
      "member_roles",
      "role = {:role}",
      "",
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
  const h = require(`${__hooks}/lib/permissions.js`);
  const members = h.findAllRecordsByFilter(
    e.app,
    "conversation_members",
    "conversation = {:conversation} && user != {:author}",
    "",
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

cronAdd(
  "thiscord-transient-cleanup",
  require(`${__hooks}/lib/policies.generated.js`).TRANSIENT_TIMINGS.transientCleanupCron,
  () => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const now = new Date().toISOString();
  const queryNow = h.databaseDate(now);
  const expiredPresenceLeases = h.findAllRecordsByFilter(
    $app,
    "presence_leases",
    "expiresAt != '' && expiresAt <= {:now}",
    "",
    { now: queryNow },
  );
  const affectedPresenceUsers = new Set(
    expiredPresenceLeases.map((lease) => lease.getString("user")),
  );
  for (const lease of expiredPresenceLeases) {
    if (!lease.getString("closedAt")) {
      lease.set("closedAt", now);
      lease.set("status", "offline");
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.presenceLeaseTombstoneMs).toISOString(),
      );
      $app.save(lease);
    } else {
      $app.delete(lease);
    }
  }
  const presenceService = require(`${__hooks}/lib/presence.js`);
  for (const userId of affectedPresenceUsers) {
    presenceService.syncUserPresence($app, userId, now);
  }

  for (const collection of ["typing", "direct_typing", "call_token_versions"]) {
    h.deleteRecordsByFilter(
      $app,
      collection,
      "expiresAt != '' && expiresAt <= {:now}",
      { now: queryNow },
    );
  }

  require(`${__hooks}/lib/callAccess.js`).retryPendingEjections($app, now);

  const expiredCallLeases = h.findAllRecordsByFilter(
    $app,
    "call_presence_leases",
    "expiresAt != '' && expiresAt <= {:now}",
    "",
    { now: queryNow },
  );
  for (const lease of expiredCallLeases) {
    if (!lease.getString("closedAt")) {
      lease.set("closedAt", now);
      lease.set("closedReason", "expired");
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.callLeaseTombstoneMs).toISOString(),
      );
      $app.save(lease);
    } else {
      $app.delete(lease);
    }
  }

  const staleParticipants = h.findAllRecordsByFilter(
    $app,
    "call_participants",
    "leftAt = '' && expiresAt != '' && expiresAt <= {:now}",
    "",
    { now: queryNow },
  );
  for (const participant of staleParticipants) {
    require(`${__hooks}/lib/callAccess.js`).endParticipant($app, participant, now, "expired");
  }

  const activeCalls = h.findAllRecordsByFilter($app, "call_sessions", "endedAt = ''");
  for (const call of activeCalls) {
    const participants = $app.findRecordsByFilter(
      "call_participants",
      "call = {:call} && leftAt = '' && expiresAt > {:now}",
      "",
      1,
      0,
      { call: call.id, now: queryNow },
    );
    if (!participants.length) {
      call.set("endedAt", now);
      $app.save(call);
    }
  }
  },
);
