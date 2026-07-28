function registerSearch() {
routerAdd("GET", "/api/thiscord/communities/{id}/search", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.activeMembership(e.app, communityId, e.auth.id);
  const query = String(e.request.url.query().get("q") || "").trim();
  const pinned = String(e.request.url.query().get("pinned") || "") === "1";
  if (
    (!pinned && query.length < h.POLICY_LIMITS.search.queryMin)
    || query.length > h.POLICY_LIMITS.search.queryMax
  ) throw new BadRequestError("Search requires 2 to 120 characters.");
  const channelId = String(e.request.url.query().get("channel") || "");
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  if (channelId) {
    const channelContext = h.channelContext(e.app, channelId, e.auth.id, "read_history");
    if (channelContext.channel.getString("community") !== communityId) {
      throw new BadRequestError("The channel does not belong to this community.");
    }
  }
  const conditions = [
    channelId ? "channel = {:channel}" : "channel.community = {:community}",
    "deletedAt = ''",
  ];
  if (query) conditions.push("content ~ {:query}");
  if (pinned) conditions.push("pinned = true");
  const params = channelId ? { channel: channelId, query } : { community: communityId, query };
  const authorizedPage = h.findAuthorizedPage(
    e.app,
    "messages",
    conditions.join(" && "),
    "-created,-id",
    params,
    page,
    perPage,
    (record) => {
      try {
        h.channelContext(e.app, record.getString("channel"), e.auth.id, "read_history");
        return true;
      } catch {
        return false;
      }
    },
  );
  const { hasMore, items } = authorizedPage;
  $apis.enrichRecords(e, items, "author", "channel");
  return e.json(200, { page, perPage, hasMore, items });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/unread-summary", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.activeMembership(e.app, communityId, e.auth.id);
  const channels = h.findAllRecordsByFilter(
    e.app,
    "channels",
    "community = {:community} && kind != 'category'",
    "+position",
    { community: communityId },
  );
  const items = [];
  for (const channel of channels) {
    try {
      h.channelContext(e.app, channel.id, e.auth.id, "read_history");
      const message = e.app.findRecordsByFilter(
        "messages",
        "channel = {:channel} && deletedAt = ''",
        "-created,-id",
        1,
        0,
        { channel: channel.id },
      )[0];
      if (message) {
        if (message.getString("author") === e.auth.id) continue;
        let lastMessage = "";
        try {
          lastMessage = e.app.findFirstRecordByFilter(
            "read_states",
            "user = {:user} && channel = {:channel}",
            { user: e.auth.id, channel: channel.id },
          ).getString("lastMessage");
        } catch {
          // A missing read state means the latest message is unread.
        }
        if (lastMessage) {
          try {
            const readMessage = e.app.findRecordById("messages", lastMessage);
            if (!h.recordComesAfter(message, readMessage)) continue;
          } catch {
            // A removed read pointer cannot prove that the latest message was read.
          }
        }
        items.push({
          channel: channel.id,
          message: message.id,
          author: message.getString("author"),
          created: message.getString("created"),
        });
      }
    } catch {
      // Hidden channels and channels without history access are omitted.
    }
  }
  return e.json(200, { items });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/search", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const query = String(e.request.url.query().get("q") || "").trim();
  if (
    query.length < h.POLICY_LIMITS.search.queryMin
    || query.length > h.POLICY_LIMITS.search.queryMax
  ) throw new BadRequestError("Search requires 2 to 120 characters.");
  const memberships = h.findAllRecordsByFilter(
    e.app,
    "memberships",
    "user = {:user} && state = 'active'",
    "",
    { user: e.auth.id },
  );
  const communityIds = memberships.map((membership) => membership.getString("community"));
  const channels = [];
  const messages = [];
  const peopleById = new Map();

  for (const communityId of communityIds) {
    const communityChannels = h.findAuthorizedPage(
      e.app,
      "channels",
      "community = {:community} && kind != 'category' && name ~ {:query}",
      "+position",
      { community: communityId, query },
      1,
      20,
      (channel) => {
        try {
          h.channelContext(e.app, channel.id, e.auth.id, "view_channels");
          return true;
        } catch {
          return false;
        }
      },
    ).items;
    for (const channel of communityChannels) {
      try {
        h.channelContext(e.app, channel.id, e.auth.id, "view_channels");
        channels.push(channel);
      } catch {
        // Hidden channels are omitted.
      }
    }

    const communityMessages = h.findAuthorizedPage(
      e.app,
      "messages",
      "channel.community = {:community} && content ~ {:query} && deletedAt = ''",
      "-created,-id",
      { community: communityId, query },
      1,
      30,
      (message) => {
        try {
          h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
          return true;
        } catch {
          return false;
        }
      },
    ).items;
    for (const message of communityMessages) {
      try {
        h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
        messages.push(message);
      } catch {
        // Hidden channel messages are omitted.
      }
    }

    const communityMembers = e.app.findRecordsByFilter(
      "memberships",
      "community = {:community} && state = 'active' && (nickname ~ {:query} || user.displayName ~ {:query} || user.handle ~ {:query})",
      "",
      20,
      0,
      { community: communityId, query },
    );
    for (const membership of communityMembers) {
      const user = e.app.findRecordById("users", membership.getString("user"));
      const haystack = `${membership.getString("nickname")} ${user.getString("displayName")} ${user.getString("handle")}`.toLowerCase();
      if (haystack.includes(query.toLowerCase())) peopleById.set(user.id, user);
    }
  }

  const conversationMemberships = h.findAllRecordsByFilter(
    e.app,
    "conversation_members",
    "user = {:user}",
    "",
    { user: e.auth.id },
  );
  const directMessages = e.app.findRecordsByFilter(
    "direct_messages",
    "conversation.conversation_members_via_conversation.user ?= {:user} && content ~ {:query} && deletedAt = ''",
    "-created,-id",
    30,
    0,
    { user: e.auth.id, query },
  );
  for (const ownMembership of conversationMemberships) {
    const conversationId = ownMembership.getString("conversation");
    const conversationMembers = h.findAllRecordsByFilter(
      e.app,
      "conversation_members",
      "conversation = {:conversation}",
      "",
      { conversation: conversationId },
    );
    for (const member of conversationMembers) {
      const user = e.app.findRecordById("users", member.getString("user"));
      const haystack = `${user.getString("displayName")} ${user.getString("handle")}`.toLowerCase();
      if (haystack.includes(query.toLowerCase())) peopleById.set(user.id, user);
    }
  }

  const channelItems = channels.slice(0, 20);
  const newestFirst = (left, right) => {
    const createdDifference = (
      new Date(right.getString("created")).getTime()
      - new Date(left.getString("created")).getTime()
    );
    if (createdDifference) return createdDifference;
    if (left.id === right.id) return 0;
    return left.id < right.id ? 1 : -1;
  };
  const messageItems = messages.sort(newestFirst).slice(0, 30);
  const directItems = directMessages.sort(newestFirst).slice(0, 30);
  $apis.enrichRecords(e, channelItems, "community");
  $apis.enrichRecords(e, messageItems, "author", "channel", "channel.community");
  $apis.enrichRecords(e, directItems, "author", "conversation");
  return e.json(200, {
    channels: channelItems,
    messages: messageItems,
    directMessages: directItems,
    people: Array.from(peopleById.values()).slice(0, 20),
  });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/audit", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "view_audit_log");
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const records = e.app.findRecordsByFilter(
    "audit_events",
    "community = {:community}",
    "-created",
    perPage,
    (page - 1) * perPage,
    { community: communityId },
  );
  $apis.enrichRecords(e, records, "actor");
  return e.json(200, {
    page,
    perPage,
    items: records,
  });
}, $apis.requireAuth("users"));

}

module.exports = {
  registerSearch,
};
