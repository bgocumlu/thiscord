function registerConversations() {
routerAdd("GET", "/api/thiscord/conversations", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const beforeActivity = String(e.request.url.query().get("beforeActivity") || "");
  const beforeId = String(e.request.url.query().get("beforeId") || "");
  if (Boolean(beforeActivity) !== Boolean(beforeId)) {
    throw new BadRequestError("A complete conversation cursor is required.");
  }
  const conditions = ["user = {:user}"];
  const params = { user: e.auth.id };
  if (beforeActivity) {
    conditions.push(
      "(conversation.lastMessageAt < {:beforeActivity} || (conversation.lastMessageAt = {:beforeActivity} && conversation < {:beforeId}))",
    );
    params.beforeActivity = beforeActivity;
    params.beforeId = beforeId;
  }
  const ownMemberships = e.app.findRecordsByFilter(
    "conversation_members",
    conditions.join(" && "),
    "-conversation.lastMessageAt,-conversation",
    perPage + 1,
    0,
    params,
  );
  const hasMore = ownMemberships.length > perPage;
  const pageMemberships = ownMemberships.slice(0, perPage);
  const conversations = [];
  const members = [];
  const unreadConversationIds = [];
  for (const ownMembership of pageMemberships) {
    const conversation = e.app.findRecordById(
      "conversations",
      ownMembership.getString("conversation"),
    );
    conversations.push(conversation);
    const latestMessage = e.app.findRecordsByFilter(
      "direct_messages",
      "conversation = {:conversation} && deletedAt = ''",
      "-created,-id",
      1,
      0,
      { conversation: conversation.id },
    )[0];
    if (latestMessage && latestMessage.getString("author") !== e.auth.id) {
      const lastMessageId = ownMembership.getString("lastMessage");
      let lastMessage = null;
      if (lastMessageId) {
        try {
          lastMessage = e.app.findRecordById("direct_messages", lastMessageId);
        } catch {
          // A removed pointer cannot prove that the newest message was read.
        }
      }
      if (h.recordComesAfter(latestMessage, lastMessage)) {
        unreadConversationIds.push(conversation.id);
      }
    }
    const conversationMembers = h.findAllRecordsByFilter(
      e.app,
      "conversation_members",
      "conversation = {:conversation}",
      "+joinedAt",
      { conversation: conversation.id },
    );
    $apis.enrichRecords(e, conversationMembers, "user");
    members.push(...conversationMembers);
  }
  const oldestConversation = conversations[conversations.length - 1];
  return e.json(200, {
    perPage,
    hasMore,
    nextCursor: hasMore && oldestConversation
      ? {
        activity: oldestConversation.getString("lastMessageAt"),
        id: oldestConversation.id,
      }
      : null,
    conversations,
    members,
    unreadConversationIds,
  });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/conversations/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  h.conversationMembership(e.app, conversationId, e.auth.id);
  const conversation = e.app.findRecordById("conversations", conversationId);
  const members = h.findAllRecordsByFilter(
    e.app,
    "conversation_members",
    "conversation = {:conversation}",
    "+joinedAt",
    { conversation: conversationId },
  );
  $apis.enrichRecords(e, members, "user");
  return e.json(200, { conversation, members });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const kind = String(body.kind || "");
  if (!["direct", "group"].includes(kind)) throw new BadRequestError("Invalid conversation type.");
  const requestedIds = Array.isArray(body.userIds) ? body.userIds.map(String) : [];
  const userIds = Array.from(new Set([e.auth.id, ...requestedIds])).filter(Boolean);
  if (
    userIds.length < h.POLICY_LIMITS.conversation.membersMin
    || userIds.length > h.POLICY_LIMITS.conversation.membersMax
  ) {
    throw new BadRequestError("A conversation needs between 2 and 25 members.");
  }
  if (kind === "direct" && userIds.length !== h.POLICY_LIMITS.conversation.membersMin) {
    throw new BadRequestError("A direct conversation requires exactly two members.");
  }
  if (kind === "group" && userIds.length <= h.POLICY_LIMITS.conversation.membersMin) {
    throw new BadRequestError("A group conversation requires at least three members.");
  }
  for (const userId of userIds) e.app.findRecordById("users", userId);

  const directKey = kind === "direct" ? userIds.slice().sort().join(":") : "";
  if (directKey) {
    try {
      const existing = e.app.findFirstRecordByData("conversations", "directKey", directKey);
      return e.json(200, existing);
    } catch {
      // A new direct conversation is created below.
    }
  }

  let conversation;
  try {
    e.app.runInTransaction((tx) => {
      conversation = new Record(tx.findCollectionByNameOrId("conversations"));
      conversation.set("kind", kind);
      conversation.set(
        "name",
        kind === "group"
          ? h.normalizeName(body.name || "New group", h.POLICY_LIMITS.conversation.nameMax)
          : "",
      );
      conversation.set("directKey", directKey);
      conversation.set("owner", e.auth.id);
      conversation.set("lastMessageAt", new Date().toISOString());
      tx.save(conversation);

      for (const userId of userIds) {
        const member = new Record(tx.findCollectionByNameOrId("conversation_members"));
        member.set("conversation", conversation.id);
        member.set("user", userId);
        member.set("joinedAt", new Date().toISOString());
        tx.save(member);
      }
    });
  } catch (error) {
    if (directKey) {
      try {
        const existing = e.app.findFirstRecordByData("conversations", "directKey", directKey);
        return e.json(200, existing);
      } catch {
        // The transaction failed for a reason other than the direct-key race.
      }
    }
    throw error;
  }
  return e.json(201, conversation);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/conversations/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  const name = h.normalizeName(e.requestInfo().body.name, h.POLICY_LIMITS.conversation.nameMax);
  let conversation;
  e.app.runInTransaction((tx) => {
    conversation = tx.findRecordById("conversations", conversationId);
    h.conversationMembership(tx, conversation.id, e.auth.id);
    if (conversation.getString("kind") !== "group") throw new BadRequestError("Direct conversations cannot be renamed.");
    if (conversation.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the group owner can rename it.");
    conversation.set("name", name);
    tx.save(conversation);
  });
  return e.json(200, conversation);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/members", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  const userId = String(e.requestInfo().body.userId || "");
  e.app.findRecordById("users", userId);
  let conversation;
  let member;
  let existing = false;
  try {
    e.app.runInTransaction((tx) => {
      conversation = tx.findRecordById("conversations", conversationId);
      h.conversationMembership(tx, conversation.id, e.auth.id);
      if (conversation.getString("kind") !== "group") throw new BadRequestError("Members cannot be added to a direct conversation.");
      if (conversation.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the group owner can add members.");
      const members = tx.findRecordsByFilter(
        "conversation_members",
        "conversation = {:conversation}",
        "",
        h.POLICY_LIMITS.conversation.membersMax + 1,
        0,
        { conversation: conversation.id },
      );
      if (members.some((candidate) => candidate.getString("user") === userId)) {
        existing = true;
        return;
      }
      if (members.length >= h.POLICY_LIMITS.conversation.membersMax) {
        throw new BadRequestError("Groups can have at most 25 members.");
      }
      member = new Record(tx.findCollectionByNameOrId("conversation_members"));
      member.set("conversation", conversation.id);
      member.set("user", userId);
      member.set("joinedAt", new Date().toISOString());
      tx.save(member);
    });
  } catch (error) {
    if (!conversation) throw error;
    const currentCount = e.app.findRecordsByFilter(
      "conversation_members",
      "conversation = {:conversation}",
      "",
      h.POLICY_LIMITS.conversation.membersMax + 1,
      0,
      { conversation: conversation.id },
    ).length;
    if (currentCount >= h.POLICY_LIMITS.conversation.membersMax) {
      throw new BadRequestError("Groups can have at most 25 members.");
    }
    throw error;
  }
  if (existing) return e.json(200, conversation);
  return e.json(201, member);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/conversations/{id}/members/{userId}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  const userId = e.request.pathValue("userId");
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const conversation = tx.findRecordById("conversations", conversationId);
    h.conversationMembership(tx, conversation.id, e.auth.id);
    if (conversation.getString("kind") !== "group") throw new BadRequestError("Direct conversations cannot be left.");
    if (userId !== e.auth.id && conversation.getString("owner") !== e.auth.id) {
      throw new ForbiddenError("Only the group owner can remove another member.");
    }
    const member = tx.findFirstRecordByFilter(
      "conversation_members",
      "conversation = {:conversation} && user = {:user}",
      { conversation: conversation.id, user: userId },
    );
    const remaining = h.findAllRecordsByFilter(
      tx,
      "conversation_members",
      "conversation = {:conversation} && user != {:user}",
      "+created,+id",
      { conversation: conversation.id, user: userId },
    );
    require(`${__hooks}/lib/callAccess.js`).revokeTargetParticipant(
      tx,
      { kind: "conversation", id: conversation.id },
      userId,
      true,
      pendingCallControls,
    );
    if (!remaining.length) {
      tx.delete(conversation);
      return;
    }
    if (conversation.getString("owner") === userId) {
      conversation.set("owner", remaining[0].getString("user"));
      tx.save(conversation);
    }
    tx.delete(member);
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/read", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  h.conversationMembership(e.app, conversationId, e.auth.id);
  const lastMessage = h.requiredText(e.requestInfo().body.lastMessage, "lastMessage", 32);
  const message = e.app.findRecordById("direct_messages", lastMessage);
  if (message.getString("conversation") !== conversationId) throw new BadRequestError("Invalid message.");
  let updatedMember;
  e.app.runInTransaction((tx) => {
    updatedMember = h.conversationMembership(tx, conversationId, e.auth.id);
    const requested = tx.findRecordById("direct_messages", lastMessage);
    if (requested.getString("conversation") !== conversationId) {
      throw new BadRequestError("Invalid message.");
    }
    const currentId = updatedMember.getString("lastMessage");
    const current = currentId ? tx.findRecordById("direct_messages", currentId) : null;
    if (h.recordComesAfter(requested, current)) {
      updatedMember.set("lastMessage", requested.id);
      updatedMember.set("lastReadAt", new Date().toISOString());
      tx.save(updatedMember);
    }
  });
  return e.json(200, updatedMember);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/conversations/{id}/messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  h.conversationMembership(e.app, conversationId, e.auth.id);
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const beforeCreated = String(e.request.url.query().get("beforeCreated") || "");
  const beforeId = String(e.request.url.query().get("beforeId") || "");
  if (Boolean(beforeCreated) !== Boolean(beforeId)) {
    throw new BadRequestError("A complete message cursor is required.");
  }
  const conditions = ["conversation = {:conversation}"];
  const params = { conversation: conversationId };
  if (beforeCreated) {
    conditions.push("(created < {:beforeCreated} || (created = {:beforeCreated} && id < {:beforeId}))");
    params.beforeCreated = beforeCreated;
    params.beforeId = beforeId;
  }
  const records = e.app.findRecordsByFilter(
    "direct_messages",
    conditions.join(" && "),
    "-created,-id",
    perPage + 1,
    0,
    params,
  );
  const hasMore = records.length > perPage;
  const items = records.slice(0, perPage);
  const oldest = items[items.length - 1];
  $apis.enrichRecords(e, items, "author", "replyTo", "replyTo.author");
  return e.json(200, {
    perPage,
    hasMore,
    nextCursor: hasMore && oldest
      ? { created: oldest.getString("created"), id: oldest.id }
      : null,
    items,
  });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/typing", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  const updateTyping = () => {
    e.app.runInTransaction((tx) => {
      h.conversationMembership(tx, conversationId, e.auth.id);
      let typing;
      try {
        typing = tx.findFirstRecordByFilter(
          "direct_typing",
          "conversation = {:conversation} && user = {:user}",
          { conversation: conversationId, user: e.auth.id },
        );
      } catch {
        typing = new Record(tx.findCollectionByNameOrId("direct_typing"));
        typing.set("conversation", conversationId);
        typing.set("user", e.auth.id);
      }
      typing.set("expiresAt", new Date(Date.now() + h.TRANSIENT_TIMINGS.typingExpiryMs).toISOString());
      tx.save(typing);
    });
  };
  try {
    updateTyping();
  } catch (error) {
    try {
      // A concurrent first update may have won the unique conversation/user key.
      updateTyping();
    } catch {
      throw error;
    }
  }
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/direct-messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const conversationId = h.requiredText(body.conversation, "conversation", 32);
  const content = h.optionalText(body.content, h.POLICY_LIMITS.message.contentMax);
  let files = [];
  try {
    files = e.findUploadedFiles("attachments");
  } catch {
    // JSON requests without attachments are valid.
  }
  if (!content && files.length === 0) throw new BadRequestError("A message needs text or an attachment.");
  const replyToId = String(body.replyTo || "");
  let message;
  e.app.runInTransaction((tx) => {
    h.conversationMembership(tx, conversationId, e.auth.id);
    if (replyToId) {
      const reply = tx.findRecordById("direct_messages", replyToId);
      if (reply.getString("conversation") !== conversationId) {
        throw new BadRequestError("Invalid reply target.");
      }
    }
    message = new Record(tx.findCollectionByNameOrId("direct_messages"));
    message.set("conversation", conversationId);
    message.set("author", e.auth.id);
    message.set("content", content);
    message.set("replyTo", replyToId);
    message.set("embedsEnabled", true);
    if (files.length) message.set("attachments", files);
    tx.save(message);
    const conversation = tx.findRecordById("conversations", conversationId);
    conversation.set("lastMessageAt", new Date().toISOString());
    tx.save(conversation);
  });
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(201, message);
}, $apis.requireAuth("users"), $apis.bodyLimit(260 * 1024 * 1024));

routerAdd("POST", "/api/thiscord/direct-messages/{id}/reactions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const emoji = h.requiredText(e.requestInfo().body.emoji, "emoji", h.POLICY_LIMITS.message.emojiMax);
  let active;
  let reaction;
  e.app.runInTransaction((tx) => {
    const message = tx.findRecordById("direct_messages", e.request.pathValue("id"));
    h.conversationMembership(tx, message.getString("conversation"), e.auth.id);
    let existing = null;
    try {
      existing = tx.findFirstRecordByFilter(
        "direct_reactions",
        "message = {:message} && user = {:user} && emoji = {:emoji}",
        { message: message.id, user: e.auth.id, emoji },
      );
    } catch {
      // The absent reaction is created below.
    }
    if (existing) {
      tx.delete(existing);
      active = false;
      return;
    }
    reaction = new Record(tx.findCollectionByNameOrId("direct_reactions"));
    reaction.set("message", message.id);
    reaction.set("user", e.auth.id);
    reaction.set("emoji", emoji);
    tx.save(reaction);
    active = true;
  });
  return active
    ? e.json(201, { active: true, reaction })
    : e.json(200, { active: false });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/reactions/query", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  h.conversationMembership(e.app, conversationId, e.auth.id);
  const requested = Array.isArray(e.requestInfo().body.messageIds)
    ? e.requestInfo().body.messageIds.map(String)
    : [];
  const messageIds = Array.from(new Set(requested)).filter(Boolean);
  if (messageIds.length > 100) throw new BadRequestError("Too many message targets.");
  const reactions = [];
  for (const messageId of messageIds) {
    const message = e.app.findRecordById("direct_messages", messageId);
    if (message.getString("conversation") !== conversationId) {
      throw new BadRequestError("Invalid message.");
    }
    reactions.push(...h.findAllRecordsByFilter(
      e.app,
      "direct_reactions",
      "message = {:message}",
      "+created",
      { message: messageId },
    ));
  }
  return e.json(200, { reactions });
}, $apis.requireAuth("users"), $apis.bodyLimit(128 * 1024));

routerAdd("PATCH", "/api/thiscord/direct-messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const messageId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  let message;
  e.app.runInTransaction((tx) => {
    message = tx.findRecordById("direct_messages", messageId);
    h.conversationMembership(tx, message.getString("conversation"), e.auth.id);
    if (message.getString("deletedAt")) {
      throw new BadRequestError("Deleted messages cannot be edited.");
    }
    if (body.content !== undefined) {
      if (message.getString("author") !== e.auth.id) {
        throw new ForbiddenError("You cannot edit this message.");
      }
      const content = h.optionalText(body.content, h.POLICY_LIMITS.message.contentMax);
      if (!content && message.getStringSlice("attachments").length === 0) {
        throw new BadRequestError("A message needs text or an attachment.");
      }
      message.set("content", content);
      message.set("editedAt", new Date().toISOString());
    }
    if (body.pinned !== undefined) message.set("pinned", Boolean(body.pinned));
    tx.save(message);
  });
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(200, message);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/direct-messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const messageId = e.request.pathValue("id");
  e.app.runInTransaction((tx) => {
    const message = tx.findRecordById("direct_messages", messageId);
    h.conversationMembership(tx, message.getString("conversation"), e.auth.id);
    if (message.getString("author") !== e.auth.id) {
      throw new ForbiddenError("You cannot delete this message.");
    }
    message.set("content", "");
    message.set("attachments", []);
    message.set("deletedAt", new Date().toISOString());
    tx.save(message);
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerConversations,
};
