function registerMessages() {
routerAdd("GET", "/api/thiscord/channels/{id}/messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "read_history");
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const beforeCreated = String(e.request.url.query().get("beforeCreated") || "");
  const beforeId = String(e.request.url.query().get("beforeId") || "");
  if (Boolean(beforeCreated) !== Boolean(beforeId)) {
    throw new BadRequestError("A complete message cursor is required.");
  }
  const conditions = ["channel = {:channel}"];
  const params = { channel: channelId };
  if (beforeCreated) {
    conditions.push("(created < {:beforeCreated} || (created = {:beforeCreated} && id < {:beforeId}))");
    params.beforeCreated = beforeCreated;
    params.beforeId = beforeId;
  }
  const records = e.app.findRecordsByFilter(
    "messages",
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

routerAdd("GET", "/api/thiscord/messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("messages", e.request.pathValue("id"));
  h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(200, message);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const channelId = h.requiredText(body.channel, "channel", 32);
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
    const context = h.channelContext(tx, channelId, e.auth.id, "send_messages");
    const channelCapabilities = h.CHANNEL_CAPABILITIES[context.channel.getString("kind")];
    if (!channelCapabilities.messages) {
      throw new BadRequestError("Messages cannot be sent to this channel.");
    }
    for (const permission of channelCapabilities.postingPermissions) {
      if (
        !context.auth.permissions.includes(permission)
        && !context.auth.permissions.includes("administrator")
      ) {
        throw new ForbiddenError("Only members who can manage messages may post announcements.");
      }
    }
    if (context.auth.membership.getString("timeoutUntil")) {
      const timeout = new Date(context.auth.membership.getString("timeoutUntil")).getTime();
      if (timeout > Date.now()) throw new ForbiddenError("You are currently timed out.");
    }
    if (
      files.length > 0
      && !context.auth.permissions.includes("attach_files")
      && !context.auth.permissions.includes("administrator")
    ) {
      throw new ForbiddenError("You cannot attach files in this channel.");
    }
    if (
      /(^|[^a-z0-9._-])@everyone\b/i.test(content)
      && !context.auth.permissions.includes("mention_everyone")
      && !context.auth.permissions.includes("administrator")
    ) {
      throw new ForbiddenError("You cannot mention everyone in this channel.");
    }

    const slowmode = context.channel.getInt("slowmodeSeconds");
    if (
      slowmode > 0
      && !context.auth.permissions.includes("manage_messages")
      && !context.auth.permissions.includes("administrator")
    ) {
      const previous = tx.findRecordsByFilter(
        "messages",
        "channel = {:channel} && author = {:author} && deletedAt = ''",
        "-created,-id",
        1,
        0,
        { channel: channelId, author: e.auth.id },
      )[0];
      if (
        previous
        && Date.now() - new Date(previous.getString("created")).getTime() < slowmode * 1000
      ) {
        throw new TooManyRequestsError(`This channel has a ${slowmode} second slow mode.`);
      }
    }

    if (replyToId) {
      if (
        !context.auth.permissions.includes("read_history")
        && !context.auth.permissions.includes("administrator")
      ) {
        throw new ForbiddenError("You cannot reply without message history access.");
      }
      const reply = tx.findRecordById("messages", replyToId);
      if (reply.getString("channel") !== channelId) throw new BadRequestError("Invalid reply target.");
    }

    message = new Record(tx.findCollectionByNameOrId("messages"));
    message.set("channel", channelId);
    message.set("author", e.auth.id);
    message.set("content", content);
    message.set("replyTo", replyToId);
    message.set(
      "embedsEnabled",
      context.auth.permissions.includes("embed_links")
        || context.auth.permissions.includes("administrator"),
    );
    if (files.length) message.set("attachments", files);
    tx.save(message);
  });
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(201, message);
}, $apis.requireAuth("users"), $apis.bodyLimit(260 * 1024 * 1024));

routerAdd("PATCH", "/api/thiscord/messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const messageId = e.request.pathValue("id");
  let message;
  e.app.runInTransaction((tx) => {
    message = tx.findRecordById("messages", messageId);
    const context = h.channelContext(
      tx,
      message.getString("channel"),
      e.auth.id,
      "read_history",
    );
    const ownsMessage = message.getString("author") === e.auth.id;
    if (message.getString("deletedAt")) {
      throw new BadRequestError("Deleted messages cannot be edited.");
    }

    if (body.content !== undefined) {
      if (!ownsMessage && !context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
        throw new ForbiddenError("You cannot edit this message.");
      }
      const content = h.optionalText(body.content, h.POLICY_LIMITS.message.contentMax);
      if (!content && message.getStringSlice("attachments").length === 0) {
        throw new BadRequestError("A message needs text or an attachment.");
      }
      message.set("content", content);
      message.set("editedAt", new Date().toISOString());
    }

    if (body.pinned !== undefined) {
      if (!context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
        throw new ForbiddenError("You cannot pin messages.");
      }
      message.set("pinned", Boolean(body.pinned));
      h.audit(tx, context.communityId, e.auth.id, body.pinned ? "message.pin" : "message.unpin", "message", message.id, "", {});
    }

    tx.save(message);
  });
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(200, message);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const messageId = e.request.pathValue("id");
  e.app.runInTransaction((tx) => {
    const message = tx.findRecordById("messages", messageId);
    const context = h.channelContext(
      tx,
      message.getString("channel"),
      e.auth.id,
      "read_history",
    );
    const ownsMessage = message.getString("author") === e.auth.id;
    if (!ownsMessage && !context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
      throw new ForbiddenError("You cannot delete this message.");
    }
    message.set("content", "");
    message.set("attachments", []);
    message.set("deletedAt", new Date().toISOString());
    tx.save(message);
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/messages/{id}/reactions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const emoji = h.requiredText(e.requestInfo().body.emoji, "emoji", h.POLICY_LIMITS.message.emojiMax);
  let active;
  let reaction;
  e.app.runInTransaction((tx) => {
    const message = tx.findRecordById("messages", e.request.pathValue("id"));
    const context = h.channelContext(tx, message.getString("channel"), e.auth.id, "read_history");
    if (
      !context.auth.permissions.includes("add_reactions")
      && !context.auth.permissions.includes("administrator")
    ) {
      throw new ForbiddenError("Missing permission: add_reactions.");
    }
    let existing = null;
    try {
      existing = tx.findFirstRecordByFilter(
        "reactions",
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
    reaction = new Record(tx.findCollectionByNameOrId("reactions"));
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

routerAdd("POST", "/api/thiscord/channels/{id}/reactions/query", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "read_history");
  const requested = Array.isArray(e.requestInfo().body.messageIds)
    ? e.requestInfo().body.messageIds.map(String)
    : [];
  const messageIds = Array.from(new Set(requested)).filter(Boolean);
  if (messageIds.length > 100) throw new BadRequestError("Too many message targets.");
  const reactions = [];
  for (const messageId of messageIds) {
    const message = e.app.findRecordById("messages", messageId);
    if (message.getString("channel") !== channelId) throw new BadRequestError("Invalid message.");
    reactions.push(...h.findAllRecordsByFilter(
      e.app,
      "reactions",
      "message = {:message}",
      "+created",
      { message: messageId },
    ));
  }
  return e.json(200, { reactions });
}, $apis.requireAuth("users"), $apis.bodyLimit(128 * 1024));

routerAdd("POST", "/api/thiscord/channels/{id}/read", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "read_history");
  const lastMessage = h.requiredText(e.requestInfo().body.lastMessage, "lastMessage", 32);
  const message = e.app.findRecordById("messages", lastMessage);
  if (message.getString("channel") !== channelId) throw new BadRequestError("Invalid message.");

  let state;
  e.app.runInTransaction((tx) => {
    h.channelContext(tx, channelId, e.auth.id, "read_history");
    const requested = tx.findRecordById("messages", lastMessage);
    if (requested.getString("channel") !== channelId) {
      throw new BadRequestError("Invalid message.");
    }
    try {
      state = tx.findFirstRecordByFilter(
        "read_states",
        "user = {:user} && channel = {:channel}",
        { user: e.auth.id, channel: channelId },
      );
    } catch {
      state = new Record(tx.findCollectionByNameOrId("read_states"));
      state.set("user", e.auth.id);
      state.set("channel", channelId);
    }
    const currentId = state.getString("lastMessage");
    const current = currentId ? tx.findRecordById("messages", currentId) : null;
    if (h.recordComesAfter(requested, current)) {
      state.set("lastMessage", requested.id);
      state.set("lastReadAt", new Date().toISOString());
      tx.save(state);
    }
  });
  return e.json(200, state);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerMessages,
};
