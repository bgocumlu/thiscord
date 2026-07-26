/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/thiscord/communities", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const name = h.normalizeName(body.name, 100);
  const slug = h.normalizeSlug(body.slug || name);
  const description = h.optionalText(body.description, 1000);
  const userId = e.auth.id;

  try {
    e.app.findFirstRecordByData("communities", "slug", slug);
    throw new BadRequestError("That community address is already in use.");
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
  }

  let createdCommunity;
  e.app.runInTransaction((tx) => {
    const community = new Record(tx.findCollectionByNameOrId("communities"));
    community.set("name", name);
    community.set("slug", slug);
    community.set("description", description);
    community.set("owner", userId);
    community.set("settings", {
      defaultNotifications: "mentions",
      verificationLevel: "none",
      explicitContentFilter: "members_without_roles",
    });
    tx.save(community);

    const membership = new Record(tx.findCollectionByNameOrId("memberships"));
    membership.set("community", community.id);
    membership.set("user", userId);
    membership.set("state", "active");
    membership.set("joinedAt", new Date().toISOString());
    tx.save(membership);

    const everyone = new Record(tx.findCollectionByNameOrId("roles"));
    everyone.set("community", community.id);
    everyone.set("name", "@everyone");
    everyone.set("color", "#aeb4c0");
    everyone.set("position", 0);
    everyone.set("permissions", h.DEFAULT_MEMBER_PERMISSIONS);
    everyone.set("managed", true);
    tx.save(everyone);

    const administrator = new Record(tx.findCollectionByNameOrId("roles"));
    administrator.set("community", community.id);
    administrator.set("name", "Administrator");
    administrator.set("color", "#8b7cff");
    administrator.set("position", 100);
    administrator.set("permissions", h.ALL_PERMISSIONS);
    administrator.set("hoist", true);
    tx.save(administrator);

    const assignment = new Record(tx.findCollectionByNameOrId("member_roles"));
    assignment.set("membership", membership.id);
    assignment.set("role", administrator.id);
    tx.save(assignment);

    const information = createChannel(tx, community.id, "", "Information", "", "category", 0);
    createChannel(tx, community.id, information.id, "welcome", "Start here.", "text", 1);
    createChannel(tx, community.id, information.id, "announcements", "Updates and announcements.", "announcement", 2);
    const textChannels = createChannel(tx, community.id, "", "Text channels", "", "category", 100);
    createChannel(tx, community.id, textChannels.id, "general", "", "text", 101);
    const voiceChannels = createChannel(tx, community.id, "", "Voice channels", "", "category", 200);
    createChannel(tx, community.id, voiceChannels.id, "lounge", "", "voice", 201);

    h.audit(tx, community.id, userId, "community.create", "community", community.id, "", {});
    createdCommunity = community;
  });

  return e.json(201, createdCommunity);

  function createChannel(app, communityId, parentId, channelName, topic, kind, position) {
    const channel = new Record(app.findCollectionByNameOrId("channels"));
    channel.set("community", communityId);
    channel.set("parent", parentId);
    channel.set("name", channelName);
    channel.set("topic", topic);
    channel.set("kind", kind);
    channel.set("position", position);
    if (kind === "voice") channel.set("jitsiRoom", $security.randomString(32).toLowerCase());
    app.save(channel);
    return channel;
  }
}, $apis.requireAuth("users"), $apis.bodyLimit(2 * 1024 * 1024));

routerAdd("PATCH", "/api/thiscord/communities/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const context = h.requirePermission(e.app, communityId, e.auth.id, "manage_community");
  const body = e.requestInfo().body;

  if (body.name !== undefined) context.community.set("name", h.normalizeName(body.name, 100));
  if (body.description !== undefined) context.community.set("description", h.optionalText(body.description, 1000));
  for (const field of ["icon", "banner"]) {
    if (body[field] === null) {
      context.community.set(field, null);
      continue;
    }
    try {
      const files = e.findUploadedFiles(field);
      if (files.length) context.community.set(field, files[0]);
    } catch {
      // JSON-only updates do not include files.
    }
  }
  e.app.save(context.community);
  h.audit(e.app, communityId, e.auth.id, "community.update", "community", communityId, "", {});
  return e.json(200, context.community);
}, $apis.requireAuth("users"), $apis.bodyLimit(12 * 1024 * 1024));

routerAdd("GET", "/api/thiscord/communities/{id}/permissions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const channelId = String(e.request.url.query().get("channel") || "");
  if (channelId) {
    const channel = e.app.findRecordById("channels", channelId);
    if (channel.getString("community") !== communityId) throw new BadRequestError("Invalid channel.");
  }
  const context = h.communityPermissions(e.app, communityId, e.auth.id, channelId);
  return e.json(200, {
    membershipId: context.membership.id,
    roleIds: context.roleIds,
    permissions: context.permissions,
    highestRolePosition: context.highestRolePosition,
    owner: context.community.getString("owner") === e.auth.id,
  });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/channels", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "manage_channels");
  const body = e.requestInfo().body;
  const allowedKinds = ["category", "text", "announcement", "voice"];
  const kind = String(body.kind || "text");
  if (!allowedKinds.includes(kind)) throw new BadRequestError("Invalid channel type.");

  const parentId = String(body.parent || "");
  if (parentId) {
    const parent = e.app.findRecordById("channels", parentId);
    if (parent.getString("community") !== communityId || parent.getString("kind") !== "category") {
      throw new BadRequestError("Invalid channel category.");
    }
  }

  const channel = new Record(e.app.findCollectionByNameOrId("channels"));
  channel.set("community", communityId);
  channel.set("parent", parentId);
  channel.set("name", kind === "category" ? h.normalizeName(body.name, 100) : h.normalizeChannelName(body.name));
  channel.set("topic", h.optionalText(body.topic, 1024));
  channel.set("kind", kind);
  channel.set("position", Math.max(0, Number(body.position || 0)));
  channel.set("nsfw", Boolean(body.nsfw));
  channel.set("slowmodeSeconds", Math.max(0, Math.min(21600, Number(body.slowmodeSeconds || 0))));
  if (kind === "voice") channel.set("jitsiRoom", $security.randomString(32).toLowerCase());
  e.app.save(channel);
  h.audit(e.app, communityId, e.auth.id, "channel.create", "channel", channel.id, "", { kind });
  return e.json(201, channel);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/channels/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const context = h.channelContext(e.app, channelId, e.auth.id, "manage_channels");
  const body = e.requestInfo().body;

  if (body.name !== undefined) {
    const kind = context.channel.getString("kind");
    context.channel.set("name", kind === "category" ? h.normalizeName(body.name, 100) : h.normalizeChannelName(body.name));
  }
  if (body.topic !== undefined) context.channel.set("topic", h.optionalText(body.topic, 1024));
  if (body.position !== undefined) context.channel.set("position", Math.max(0, Number(body.position)));
  if (body.nsfw !== undefined) context.channel.set("nsfw", Boolean(body.nsfw));
  if (body.slowmodeSeconds !== undefined) {
    context.channel.set("slowmodeSeconds", Math.max(0, Math.min(21600, Number(body.slowmodeSeconds))));
  }
  if (body.parent !== undefined) {
    const parentId = String(body.parent || "");
    if (parentId) {
      const parent = e.app.findRecordById("channels", parentId);
      if (parent.getString("community") !== context.communityId || parent.getString("kind") !== "category") {
        throw new BadRequestError("Invalid channel category.");
      }
    }
    context.channel.set("parent", parentId);
  }
  e.app.save(context.channel);
  h.audit(e.app, context.communityId, e.auth.id, "channel.update", "channel", channelId, "", {});
  return e.json(200, context.channel);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/channels/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const context = h.channelContext(e.app, channelId, e.auth.id, "manage_channels");
  const name = context.channel.getString("name");
  const kind = context.channel.getString("kind");
  e.app.runInTransaction((tx) => {
    if (kind === "category") {
      const children = tx.findRecordsByFilter(
        "channels",
        "parent = {:parent}",
        "",
        10000,
        0,
        { parent: channelId },
      );
      for (const child of children) {
        child.set("parent", "");
        tx.save(child);
      }
    }
    h.audit(tx, context.communityId, e.auth.id, "channel.delete", "channel", channelId, "", {
      name,
      kind,
    });
    tx.delete(tx.findRecordById("channels", channelId));
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/communities/{id}/channels/order", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "manage_channels");
  const ids = Array.isArray(e.requestInfo().body.ids)
    ? Array.from(new Set(e.requestInfo().body.ids.map(String)))
    : [];
  const records = ids.map((id) => e.app.findRecordById("channels", id));
  if (records.some((record) => record.getString("community") !== communityId)) {
    throw new BadRequestError("Invalid channel order.");
  }
  e.app.runInTransaction((tx) => {
    records.forEach((record, position) => {
      record.set("position", position);
      tx.save(record);
    });
    h.audit(tx, communityId, e.auth.id, "channel.reorder", "community", communityId, "", { ids });
  });
  return e.json(200, { ids });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/roles", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_roles");
  const body = e.requestInfo().body;
  const requested = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
  const granted = h.validateGrantedPermissions(auth, requested, { allowAdministrator: true });
  const maxPosition = auth.community.getString("owner") === e.auth.id
    ? 10_000
    : Math.max(1, auth.highestRolePosition);
  const role = new Record(e.app.findCollectionByNameOrId("roles"));
  role.set("community", communityId);
  role.set("name", h.normalizeName(body.name, 80));
  role.set("color", h.optionalText(body.color || "#aeb4c0", 20));
  role.set("position", Math.max(1, Math.min(maxPosition - 1, Number(body.position || 1))));
  role.set("permissions", granted);
  role.set("hoist", Boolean(body.hoist));
  role.set("mentionable", Boolean(body.mentionable));
  role.set("managed", false);
  e.app.save(role);
  h.audit(e.app, communityId, e.auth.id, "role.create", "role", role.id, "", { permissions: granted });
  return e.json(201, role);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/roles/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const role = e.app.findRecordById("roles", e.request.pathValue("id"));
  const communityId = role.getString("community");
  const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_roles");
  if (role.getBool("managed")) throw new BadRequestError("Managed roles cannot be edited.");
  if (auth.community.getString("owner") !== e.auth.id && role.getInt("position") >= auth.highestRolePosition) {
    throw new ForbiddenError("You cannot edit this role.");
  }
  const body = e.requestInfo().body;
  if (body.name !== undefined) role.set("name", h.normalizeName(body.name, 80));
  if (body.color !== undefined) role.set("color", h.optionalText(body.color, 20));
  if (body.hoist !== undefined) role.set("hoist", Boolean(body.hoist));
  if (body.mentionable !== undefined) role.set("mentionable", Boolean(body.mentionable));
  if (body.permissions !== undefined) {
    const requested = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
    const granted = h.validateGrantedPermissions(auth, requested, { allowAdministrator: true });
    role.set("permissions", granted);
  }
  if (body.position !== undefined) {
    const maxPosition = auth.community.getString("owner") === e.auth.id ? 10_000 : auth.highestRolePosition - 1;
    role.set("position", Math.max(1, Math.min(maxPosition, Number(body.position))));
  }
  e.app.save(role);
  h.audit(e.app, communityId, e.auth.id, "role.update", "role", role.id, "", {});
  return e.json(200, role);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/roles/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const role = e.app.findRecordById("roles", e.request.pathValue("id"));
  const communityId = role.getString("community");
  const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_roles");
  if (role.getBool("managed")) throw new BadRequestError("Managed roles cannot be deleted.");
  if (auth.community.getString("owner") !== e.auth.id && role.getInt("position") >= auth.highestRolePosition) {
    throw new ForbiddenError("You cannot delete this role.");
  }
  h.audit(e.app, communityId, e.auth.id, "role.delete", "role", role.id, "", { name: role.getString("name") });
  e.app.delete(role);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/communities/{id}/roles/order", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_roles");
  const ids = Array.isArray(e.requestInfo().body.ids)
    ? Array.from(new Set(e.requestInfo().body.ids.map(String)))
    : [];
  const records = ids.map((id) => e.app.findRecordById("roles", id));
  if (records.some((record) => record.getString("community") !== communityId || record.getBool("managed"))) {
    throw new BadRequestError("Invalid role order.");
  }
  const maximum = auth.community.getString("owner") === e.auth.id ? 10000 : auth.highestRolePosition - 1;
  e.app.runInTransaction((tx) => {
    records.forEach((record, index) => {
      record.set("position", Math.max(1, Math.min(maximum, records.length - index)));
      tx.save(record);
    });
    h.audit(tx, communityId, e.auth.id, "role.reorder", "community", communityId, "", { ids });
  });
  return e.json(200, { ids });
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/memberships/{id}/roles", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const membership = e.app.findRecordById("memberships", e.request.pathValue("id"));
  const communityId = membership.getString("community");
  const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_roles");
  h.assertCanManageMembership(e.app, auth, membership, "change roles for");
  const requested = Array.isArray(e.requestInfo().body.roleIds)
    ? Array.from(new Set(e.requestInfo().body.roleIds.map(String)))
    : [];
  const roles = requested.map((roleId) => e.app.findRecordById("roles", roleId));
  for (const role of roles) {
    if (role.getString("community") !== communityId || role.getBool("managed")) {
      throw new BadRequestError("Invalid assignable role.");
    }
    if (auth.community.getString("owner") !== e.auth.id && role.getInt("position") >= auth.highestRolePosition) {
      throw new ForbiddenError("You cannot assign this role.");
    }
  }
  e.app.runInTransaction((tx) => {
    const existing = tx.findRecordsByFilter("member_roles", "membership = {:membership}", "", 500, 0, {
      membership: membership.id,
    });
    for (const assignment of existing) tx.delete(assignment);
    for (const role of roles) {
      const assignment = new Record(tx.findCollectionByNameOrId("member_roles"));
      assignment.set("membership", membership.id);
      assignment.set("role", role.id);
      tx.save(assignment);
    }
    h.audit(tx, communityId, e.auth.id, "member.roles.update", "membership", membership.id, "", {
      roleIds: roles.map((role) => role.id),
    });
  });
  return e.json(200, { roleIds: roles.map((role) => role.id) });
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/memberships/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const membership = e.app.findRecordById("memberships", e.request.pathValue("id"));
  const communityId = membership.getString("community");
  const editingSelf = membership.getString("user") === e.auth.id;
  if (editingSelf) h.activeMembership(e.app, communityId, e.auth.id);
  else {
    const auth = h.requirePermission(e.app, communityId, e.auth.id, "manage_members");
    h.assertCanManageMembership(e.app, auth, membership, "change the nickname for");
  }
  const nickname = h.optionalText(e.requestInfo().body.nickname, 80);
  membership.set("nickname", nickname);
  e.app.save(membership);
  h.audit(e.app, communityId, e.auth.id, "member.nickname.update", "membership", membership.id, "", {});
  return e.json(200, membership);
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/channels/{id}/permissions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const context = h.channelContext(e.app, channelId, e.auth.id, "manage_roles");
  const body = e.requestInfo().body;
  const targetType = String(body.targetType || "");
  const targetId = h.requiredText(body.targetId, "permission target", 32);
  if (!["role", "member"].includes(targetType)) throw new BadRequestError("Invalid permission target.");
  if (targetType === "role") {
    const role = e.app.findRecordById("roles", targetId);
    if (role.getString("community") !== context.communityId) throw new BadRequestError("Invalid role.");
    if (
      context.auth.community.getString("owner") !== e.auth.id
      && role.getInt("position") >= context.auth.highestRolePosition
    ) throw new ForbiddenError("You cannot edit overrides for this role.");
  } else {
    const membership = e.app.findRecordById("memberships", targetId);
    if (membership.getString("community") !== context.communityId) throw new BadRequestError("Invalid member.");
    if (membership.getString("user") !== e.auth.id) {
      h.assertCanManageMembership(e.app, context.auth, membership, "edit overrides for");
    }
  }
  const allow = h.validateGrantedPermissions(
    context.auth,
    Array.isArray(body.allow) ? body.allow.map(String) : [],
    { allowAdministrator: false },
  );
  const deny = (Array.isArray(body.deny) ? body.deny.map(String) : [])
    .filter((item) => h.ALL_PERMISSIONS.includes(item) && item !== "administrator");
  let overwrite;
  let overwriteExists = true;
  try {
    overwrite = e.app.findFirstRecordByFilter(
      "channel_permissions",
      "channel = {:channel} && targetType = {:targetType} && targetId = {:targetId}",
      { channel: channelId, targetType, targetId },
    );
  } catch {
    overwriteExists = false;
    overwrite = new Record(e.app.findCollectionByNameOrId("channel_permissions"));
    overwrite.set("channel", channelId);
    overwrite.set("targetType", targetType);
    overwrite.set("targetId", targetId);
  }
  if (!allow.length && !deny.length) {
    if (overwriteExists) e.app.delete(overwrite);
  } else {
    overwrite.set("allow", allow);
    overwrite.set("deny", deny);
    e.app.save(overwrite);
  }
  h.audit(e.app, context.communityId, e.auth.id, "channel.permissions.update", "channel", channelId, "", {
    targetType,
    targetId,
  });
  return e.json(200, overwrite);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const channelId = h.requiredText(body.channel, "channel", 32);
  const context = h.channelContext(e.app, channelId, e.auth.id, "send_messages");
  if (!["text", "announcement"].includes(context.channel.getString("kind"))) {
    throw new BadRequestError("Messages cannot be sent to this channel.");
  }
  if (
    context.channel.getString("kind") === "announcement"
    && !context.auth.permissions.includes("manage_messages")
    && !context.auth.permissions.includes("administrator")
  ) {
    throw new ForbiddenError("Only members who can manage messages may post announcements.");
  }
  if (context.auth.membership.getString("timeoutUntil")) {
    const timeout = new Date(context.auth.membership.getString("timeoutUntil")).getTime();
    if (timeout > Date.now()) throw new ForbiddenError("You are currently timed out.");
  }

  const content = h.optionalText(body.content, 4000);
  let files = [];
  try {
    files = e.findUploadedFiles("attachments");
  } catch {
    // JSON requests without attachments are valid.
  }
  if (!content && files.length === 0) throw new BadRequestError("A message needs text or an attachment.");
  if (files.length > 0 && !context.auth.permissions.includes("attach_files") && !context.auth.permissions.includes("administrator")) {
    throw new ForbiddenError("You cannot attach files in this channel.");
  }
  if (
    /(^|\s)@everyone\b/i.test(content)
    && !context.auth.permissions.includes("mention_everyone")
    && !context.auth.permissions.includes("administrator")
  ) {
    throw new ForbiddenError("You cannot mention everyone in this channel.");
  }

  const slowmode = context.channel.getInt("slowmodeSeconds");
  if (slowmode > 0 && !context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
    const previous = e.app.findRecordsByFilter(
        "messages",
        "channel = {:channel} && author = {:author} && deletedAt = ''",
        "-created",
        1,
        0,
        { channel: channelId, author: e.auth.id },
      )[0];
    if (previous) {
      if (Date.now() - new Date(previous.getString("created")).getTime() < slowmode * 1000) {
        throw new TooManyRequestsError(`This channel has a ${slowmode} second slow mode.`);
      }
    }
  }

  const replyToId = String(body.replyTo || "");
  if (replyToId) {
    if (!context.auth.permissions.includes("read_history") && !context.auth.permissions.includes("administrator")) {
      throw new ForbiddenError("You cannot reply without message history access.");
    }
    const reply = e.app.findRecordById("messages", replyToId);
    if (reply.getString("channel") !== channelId) throw new BadRequestError("Invalid reply target.");
  }

  const message = new Record(e.app.findCollectionByNameOrId("messages"));
  message.set("channel", channelId);
  message.set("author", e.auth.id);
  message.set("content", content);
  message.set("replyTo", replyToId);
  message.set(
    "embedsEnabled",
    context.auth.permissions.includes("embed_links") || context.auth.permissions.includes("administrator"),
  );
  if (files.length) message.set("attachments", files);
  e.app.save(message);
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(201, message);
}, $apis.requireAuth("users"), $apis.bodyLimit(260 * 1024 * 1024));

routerAdd("PATCH", "/api/thiscord/messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const message = e.app.findRecordById("messages", e.request.pathValue("id"));
  const context = h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
  const ownsMessage = message.getString("author") === e.auth.id;
  if (message.getString("deletedAt")) throw new BadRequestError("Deleted messages cannot be edited.");

  if (body.content !== undefined) {
    if (!ownsMessage && !context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
      throw new ForbiddenError("You cannot edit this message.");
    }
    const content = h.optionalText(body.content, 4000);
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
    h.audit(e.app, context.communityId, e.auth.id, body.pinned ? "message.pin" : "message.unpin", "message", message.id, "", {});
  }

  e.app.save(message);
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(200, message);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("messages", e.request.pathValue("id"));
  const context = h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
  const ownsMessage = message.getString("author") === e.auth.id;
  if (!ownsMessage && !context.auth.permissions.includes("manage_messages") && !context.auth.permissions.includes("administrator")) {
    throw new ForbiddenError("You cannot delete this message.");
  }
  message.set("content", "");
  message.set("attachments", []);
  message.set("deletedAt", new Date().toISOString());
  e.app.save(message);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/messages/{id}/reactions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("messages", e.request.pathValue("id"));
  const context = h.channelContext(e.app, message.getString("channel"), e.auth.id, "read_history");
  if (!context.auth.permissions.includes("add_reactions") && !context.auth.permissions.includes("administrator")) {
    throw new ForbiddenError("Missing permission: add_reactions.");
  }
  const emoji = h.requiredText(e.requestInfo().body.emoji, "emoji", 64);

  try {
    const existing = e.app.findFirstRecordByFilter(
      "reactions",
      "message = {:message} && user = {:user} && emoji = {:emoji}",
      { message: message.id, user: e.auth.id, emoji },
    );
    e.app.delete(existing);
    return e.json(200, { active: false });
  } catch {
    const reaction = new Record(e.app.findCollectionByNameOrId("reactions"));
    reaction.set("message", message.id);
    reaction.set("user", e.auth.id);
    reaction.set("emoji", emoji);
    e.app.save(reaction);
    return e.json(201, { active: true, reaction });
  }
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/channels/{id}/read", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "read_history");
  const lastMessage = String(e.requestInfo().body.lastMessage || "");
  if (lastMessage) {
    const message = e.app.findRecordById("messages", lastMessage);
    if (message.getString("channel") !== channelId) throw new BadRequestError("Invalid message.");
  }

  let state;
  try {
    state = e.app.findFirstRecordByFilter(
      "read_states",
      "user = {:user} && channel = {:channel}",
      { user: e.auth.id, channel: channelId },
    );
  } catch {
    state = new Record(e.app.findCollectionByNameOrId("read_states"));
    state.set("user", e.auth.id);
    state.set("channel", channelId);
  }
  state.set("lastMessage", lastMessage);
  state.set("lastReadAt", new Date().toISOString());
  e.app.save(state);
  return e.json(200, state);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/channels/{id}/typing", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "send_messages");
  let typing;
  try {
    typing = e.app.findFirstRecordByFilter(
      "typing",
      "channel = {:channel} && user = {:user}",
      { channel: channelId, user: e.auth.id },
    );
  } catch {
    typing = new Record(e.app.findCollectionByNameOrId("typing"));
    typing.set("channel", channelId);
    typing.set("user", e.auth.id);
  }
  typing.set("expiresAt", new Date(Date.now() + 10_000).toISOString());
  e.app.save(typing);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/presence", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const deviceId = h.requiredText(body.deviceId, "device identifier", 120);
  const allowed = ["online", "idle", "dnd", "offline"];
  const status = allowed.includes(body.status) ? body.status : "online";
  e.app.runInTransaction((txApp) => {
    let presence;
    try {
      presence = txApp.findFirstRecordByFilter(
        "presence",
        "user = {:user} && deviceId = {:device}",
        { user: e.auth.id, device: deviceId },
      );
    } catch {
      presence = new Record(txApp.findCollectionByNameOrId("presence"));
      presence.set("user", e.auth.id);
      presence.set("deviceId", deviceId);
    }
    if (status === "offline") {
      if (presence.id) txApp.delete(presence);
      const user = txApp.findRecordById("users", e.auth.id);
      user.set("lastSeenAt", new Date().toISOString());
      txApp.save(user);
      return;
    }
    presence.set("status", status);
    presence.set("expiresAt", new Date(Date.now() + 120_000).toISOString());
    txApp.save(presence);
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/invites", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "create_invites");
  const body = e.requestInfo().body;
  const maxUses = Math.max(0, Math.min(100000, Number(body.maxUses || 0)));
  const expiresInHours = Math.max(0, Math.min(24 * 365, Number(body.expiresInHours || 24 * 7)));

  const invite = new Record(e.app.findCollectionByNameOrId("invites"));
  invite.set("community", communityId);
  invite.set("creator", e.auth.id);
  invite.set("code", $security.randomString(12));
  invite.set("maxUses", maxUses);
  invite.set("uses", 0);
  if (expiresInHours > 0) invite.set("expiresAt", new Date(Date.now() + expiresInHours * 3_600_000).toISOString());
  e.app.save(invite);
  return e.json(201, invite);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/invites/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const invite = e.app.findRecordById("invites", e.request.pathValue("id"));
  const communityId = invite.getString("community");
  const auth = h.communityPermissions(e.app, communityId, e.auth.id);
  const ownsInvite = invite.getString("creator") === e.auth.id;
  if (!ownsInvite && !auth.permissions.includes("manage_community") && !auth.permissions.includes("administrator")) {
    throw new ForbiddenError("You cannot revoke this invite.");
  }
  invite.set("revoked", true);
  e.app.save(invite);
  h.audit(e.app, communityId, e.auth.id, "invite.revoke", "invite", invite.id, "", {});
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/invites/{code}/preview", (e) => {
  const code = e.request.pathValue("code");
  const invite = e.app.findFirstRecordByData("invites", "code", code);
  if (invite.getBool("revoked")) throw new BadRequestError("This invite is no longer valid.");
  if (invite.getString("expiresAt") && new Date(invite.getString("expiresAt")).getTime() <= Date.now()) {
    throw new BadRequestError("This invite has expired.");
  }
  if (invite.getInt("maxUses") > 0 && invite.getInt("uses") >= invite.getInt("maxUses")) {
    throw new BadRequestError("This invite has reached its use limit.");
  }
  const community = e.app.findRecordById("communities", invite.getString("community"));
  const members = e.app.findRecordsByFilter(
    "memberships",
    "community = {:community} && state = 'active'",
    "",
    10000,
    0,
    { community: community.id },
  );
  return e.json(200, {
    code,
    community: {
      id: community.id,
      name: community.getString("name"),
      description: community.getString("description"),
    },
    memberCount: members.length,
    expiresAt: invite.getString("expiresAt"),
  });
});

routerAdd("POST", "/api/thiscord/invites/{code}/accept", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const code = e.request.pathValue("code");
  const invite = e.app.findFirstRecordByData("invites", "code", code);
  if (invite.getBool("revoked")) throw new BadRequestError("This invite is no longer valid.");
  if (invite.getString("expiresAt") && new Date(invite.getString("expiresAt")).getTime() <= Date.now()) {
    throw new BadRequestError("This invite has expired.");
  }
  const communityId = invite.getString("community");
  try {
    const ban = e.app.findFirstRecordByFilter(
      "bans",
      "community = {:community} && user = {:user}",
      { community: communityId, user: e.auth.id },
    );
    const expiresAt = ban.getString("expiresAt");
    if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
      throw new ForbiddenError("You are banned from this community.");
    }
    e.app.delete(ban);
  } catch (error) {
    if (error instanceof ForbiddenError) throw error;
  }

  let membership;
  let joined = false;
  e.app.runInTransaction((tx) => {
    const currentInvite = tx.findRecordById("invites", invite.id);
    if (currentInvite.getBool("revoked")) throw new BadRequestError("This invite is no longer valid.");
    if (
      currentInvite.getString("expiresAt")
      && new Date(currentInvite.getString("expiresAt")).getTime() <= Date.now()
    ) throw new BadRequestError("This invite has expired.");
    let wasActive = false;
    try {
      membership = tx.findFirstRecordByFilter(
        "memberships",
        "community = {:community} && user = {:user}",
        { community: communityId, user: e.auth.id },
      );
      wasActive = membership.getString("state") === "active";
    } catch {
      membership = new Record(tx.findCollectionByNameOrId("memberships"));
      membership.set("community", communityId);
      membership.set("user", e.auth.id);
      membership.set("joinedAt", new Date().toISOString());
    }
    if (wasActive) return;
    if (
      currentInvite.getInt("maxUses") > 0
      && currentInvite.getInt("uses") >= currentInvite.getInt("maxUses")
    ) throw new BadRequestError("This invite has reached its use limit.");

    membership.set("state", "active");
    membership.set("timeoutUntil", "");
    tx.save(membership);

    currentInvite.set("uses", currentInvite.getInt("uses") + 1);
    tx.save(currentInvite);
    h.audit(tx, communityId, e.auth.id, "member.join", "membership", membership.id, "", { invite: invite.id });
    joined = true;
  });
  return e.json(joined ? 201 : 200, membership);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/moderation", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const context = h.requirePermission(e.app, communityId, e.auth.id, "manage_members");
  const body = e.requestInfo().body;
  const action = String(body.action || "");
  const userId = h.requiredText(body.userId, "user", 32);
  const reason = h.optionalText(body.reason, 1000);
  if (userId === e.auth.id || userId === context.community.getString("owner")) {
    throw new BadRequestError("That member cannot be moderated.");
  }
  const membership = h.activeMembership(e.app, communityId, userId);
  h.assertCanManageMembership(e.app, context, membership, action);

  if (action === "kick") {
    membership.set("state", "left");
    e.app.save(membership);
    h.audit(e.app, communityId, e.auth.id, "member.kick", "user", userId, reason, {});
  } else if (action === "ban") {
    let ban;
    try {
      ban = e.app.findFirstRecordByFilter(
        "bans",
        "community = {:community} && user = {:user}",
        { community: communityId, user: userId },
      );
    } catch {
      ban = new Record(e.app.findCollectionByNameOrId("bans"));
      ban.set("community", communityId);
      ban.set("user", userId);
    }
    ban.set("moderator", e.auth.id);
    ban.set("reason", reason);
    if (Number(body.durationHours) > 0) {
      ban.set("expiresAt", new Date(Date.now() + Number(body.durationHours) * 3_600_000).toISOString());
    }
    e.app.save(ban);
    membership.set("state", "banned");
    e.app.save(membership);
    h.audit(e.app, communityId, e.auth.id, "member.ban", "user", userId, reason, {});
  } else if (action === "timeout") {
    const durationMinutes = Math.max(1, Math.min(60 * 24 * 28, Number(body.durationMinutes || 10)));
    membership.set("timeoutUntil", new Date(Date.now() + durationMinutes * 60_000).toISOString());
    e.app.save(membership);
    h.audit(e.app, communityId, e.auth.id, "member.timeout", "user", userId, reason, { durationMinutes });
  } else if (action === "untimeout") {
    membership.set("timeoutUntil", "");
    e.app.save(membership);
    h.audit(e.app, communityId, e.auth.id, "member.untimeout", "user", userId, reason, {});
  } else {
    throw new BadRequestError("Invalid moderation action.");
  }

  return e.json(200, membership);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/leave", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const membership = h.activeMembership(e.app, communityId, e.auth.id);
  const community = e.app.findRecordById("communities", communityId);
  if (community.getString("owner") === e.auth.id) {
    throw new BadRequestError("Transfer ownership or delete the community before leaving.");
  }
  membership.set("state", "left");
  e.app.save(membership);
  h.audit(e.app, communityId, e.auth.id, "member.leave", "membership", membership.id, "", {});
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/transfer", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const community = e.app.findRecordById("communities", e.request.pathValue("id"));
  if (community.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the owner can transfer ownership.");
  const targetUserId = h.requiredText(e.requestInfo().body.userId, "new owner", 32);
  if (targetUserId === e.auth.id) throw new BadRequestError("You already own this community.");
  h.activeMembership(e.app, community.id, targetUserId);
  const targetPermissions = h.communityPermissions(e.app, community.id, targetUserId);
  if (!targetPermissions.permissions.includes("administrator")) {
    throw new BadRequestError("Ownership can only be transferred to an administrator.");
  }
  e.app.runInTransaction((tx) => {
    community.set("owner", targetUserId);
    tx.save(community);
    h.audit(tx, community.id, e.auth.id, "community.transfer", "user", targetUserId, "", {});
  });
  return e.json(200, community);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/bans", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "manage_members");
  const records = e.app.findRecordsByFilter(
    "bans",
    "community = {:community}",
    "-created",
    500,
    0,
    { community: communityId },
  );
  $apis.enrichRecords(e, records, "user", "moderator");
  return e.json(200, { items: records });
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/bans/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const ban = e.app.findRecordById("bans", e.request.pathValue("id"));
  const communityId = ban.getString("community");
  h.requirePermission(e.app, communityId, e.auth.id, "manage_members");
  const userId = ban.getString("user");
  e.app.delete(ban);
  try {
    const membership = e.app.findFirstRecordByFilter(
      "memberships",
      "community = {:community} && user = {:user}",
      { community: communityId, user: userId },
    );
    if (membership.getString("state") === "banned") {
      membership.set("state", "left");
      e.app.save(membership);
    }
  } catch {
    // A deleted account may no longer have a membership.
  }
  h.audit(e.app, communityId, e.auth.id, "member.unban", "user", userId, "", {});
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/communities/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const community = e.app.findRecordById("communities", e.request.pathValue("id"));
  if (community.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the owner can delete this community.");
  e.app.delete(community);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/search", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "read_history");
  const query = String(e.request.url.query().get("q") || "").trim();
  const pinned = String(e.request.url.query().get("pinned") || "") === "1";
  if ((!pinned && query.length < 2) || query.length > 120) throw new BadRequestError("Search requires 2 to 120 characters.");
  const channelId = String(e.request.url.query().get("channel") || "");
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  if (channelId) h.channelContext(e.app, channelId, e.auth.id, "read_history");
  const conditions = [
    channelId ? "channel = {:channel}" : "channel.community = {:community}",
    "deletedAt = ''",
  ];
  if (query) conditions.push("content ~ {:query}");
  if (pinned) conditions.push("pinned = true");
  const params = channelId ? { channel: channelId, query } : { community: communityId, query };
  const records = e.app.findRecordsByFilter(
    "messages",
    conditions.join(" && "),
    "-created",
    perPage + 1,
    (page - 1) * perPage,
    params,
  )
    .filter((record) => {
      try {
        h.channelContext(e.app, record.getString("channel"), e.auth.id, "read_history");
        return true;
      } catch {
        return false;
      }
    });
  const hasMore = records.length > perPage;
  const items = records.slice(0, perPage);
  $apis.enrichRecords(e, items, "author", "channel");
  return e.json(200, { page, perPage, hasMore, items });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/unread-summary", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "view_channels");
  const channels = e.app.findRecordsByFilter(
    "channels",
    "community = {:community} && kind != 'category'",
    "+position",
    1000,
    0,
    { community: communityId },
  );
  const items = [];
  for (const channel of channels) {
    try {
      h.channelContext(e.app, channel.id, e.auth.id, "read_history");
      const message = e.app.findRecordsByFilter(
        "messages",
        "channel = {:channel} && deletedAt = ''",
        "-created",
        1,
        0,
        { channel: channel.id },
      )[0];
      if (message) {
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
  if (query.length < 2 || query.length > 120) throw new BadRequestError("Search requires 2 to 120 characters.");
  const memberships = e.app.findRecordsByFilter(
    "memberships",
    "user = {:user} && state = 'active'",
    "",
    500,
    0,
    { user: e.auth.id },
  );
  const communityIds = memberships.map((membership) => membership.getString("community"));
  const channels = [];
  const messages = [];
  const peopleById = new Map();

  for (const communityId of communityIds) {
    const communityChannels = e.app.findRecordsByFilter(
      "channels",
      "community = {:community} && kind != 'category' && name ~ {:query}",
      "+position",
      20,
      0,
      { community: communityId, query },
    );
    for (const channel of communityChannels) {
      try {
        h.channelContext(e.app, channel.id, e.auth.id, "view_channels");
        channels.push(channel);
      } catch {
        // Hidden channels are omitted.
      }
    }

    const communityMessages = e.app.findRecordsByFilter(
      "messages",
      "channel.community = {:community} && content ~ {:query} && deletedAt = ''",
      "-created",
      20,
      0,
      { community: communityId, query },
    );
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
      "community = {:community} && state = 'active'",
      "",
      10000,
      0,
      { community: communityId },
    );
    for (const membership of communityMembers) {
      const user = e.app.findRecordById("users", membership.getString("user"));
      const haystack = `${user.getString("displayName")} ${user.getString("handle")}`.toLowerCase();
      if (haystack.includes(query.toLowerCase())) peopleById.set(user.id, user);
    }
  }

  const conversationMemberships = e.app.findRecordsByFilter(
    "conversation_members",
    "user = {:user}",
    "",
    500,
    0,
    { user: e.auth.id },
  );
  const directMessages = [];
  for (const ownMembership of conversationMemberships) {
    const conversationId = ownMembership.getString("conversation");
    const matches = e.app.findRecordsByFilter(
      "direct_messages",
      "conversation = {:conversation} && content ~ {:query} && deletedAt = ''",
      "-created",
      10,
      0,
      { conversation: conversationId, query },
    );
    directMessages.push(...matches);
    const conversationMembers = e.app.findRecordsByFilter(
      "conversation_members",
      "conversation = {:conversation}",
      "",
      100,
      0,
      { conversation: conversationId },
    );
    for (const member of conversationMembers) {
      const user = e.app.findRecordById("users", member.getString("user"));
      const haystack = `${user.getString("displayName")} ${user.getString("handle")}`.toLowerCase();
      if (haystack.includes(query.toLowerCase())) peopleById.set(user.id, user);
    }
  }

  const channelItems = channels.slice(0, 20);
  const messageItems = messages.sort((left, right) => (
    new Date(right.getString("created")).getTime() - new Date(left.getString("created")).getTime()
  )).slice(0, 30);
  const directItems = directMessages.sort((left, right) => (
    new Date(right.getString("created")).getTime() - new Date(left.getString("created")).getTime()
  )).slice(0, 30);
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

routerAdd("POST", "/api/thiscord/conversations", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const requestedIds = Array.isArray(body.userIds) ? body.userIds.map(String) : [];
  const userIds = Array.from(new Set([e.auth.id, ...requestedIds])).filter(Boolean);
  if (userIds.length < 2 || userIds.length > 25) throw new BadRequestError("A conversation needs between 2 and 25 members.");
  for (const userId of userIds) e.app.findRecordById("users", userId);

  const kind = userIds.length === 2 ? "direct" : "group";
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
  e.app.runInTransaction((tx) => {
    conversation = new Record(tx.findCollectionByNameOrId("conversations"));
    conversation.set("kind", kind);
    conversation.set("name", kind === "group" ? h.normalizeName(body.name || "New group", 100) : "");
    conversation.set("directKey", directKey);
    conversation.set("owner", e.auth.id);
    tx.save(conversation);

    for (const userId of userIds) {
      const member = new Record(tx.findCollectionByNameOrId("conversation_members"));
      member.set("conversation", conversation.id);
      member.set("user", userId);
      member.set("joinedAt", new Date().toISOString());
      tx.save(member);
    }
  });
  return e.json(201, conversation);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/conversations/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversation = e.app.findRecordById("conversations", e.request.pathValue("id"));
  h.conversationMembership(e.app, conversation.id, e.auth.id);
  if (conversation.getString("kind") !== "group") throw new BadRequestError("Direct conversations cannot be renamed.");
  if (conversation.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the group owner can rename it.");
  conversation.set("name", h.normalizeName(e.requestInfo().body.name, 100));
  e.app.save(conversation);
  return e.json(200, conversation);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/members", (e) => {
  const conversation = e.app.findRecordById("conversations", e.request.pathValue("id"));
  if (conversation.getString("kind") !== "group") throw new BadRequestError("Members cannot be added to a direct conversation.");
  if (conversation.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the group owner can add members.");
  const userId = String(e.requestInfo().body.userId || "");
  e.app.findRecordById("users", userId);
  const members = e.app.findRecordsByFilter(
    "conversation_members",
    "conversation = {:conversation}",
    "",
    100,
    0,
    { conversation: conversation.id },
  );
  if (members.length >= 25) throw new BadRequestError("Groups can have at most 25 members.");
  if (members.some((member) => member.getString("user") === userId)) return e.json(200, conversation);
  const member = new Record(e.app.findCollectionByNameOrId("conversation_members"));
  member.set("conversation", conversation.id);
  member.set("user", userId);
  member.set("joinedAt", new Date().toISOString());
  e.app.save(member);
  return e.json(201, member);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/conversations/{id}/members/{userId}", (e) => {
  const conversation = e.app.findRecordById("conversations", e.request.pathValue("id"));
  if (conversation.getString("kind") !== "group") throw new BadRequestError("Direct conversations cannot be left.");
  const userId = e.request.pathValue("userId");
  if (userId !== e.auth.id && conversation.getString("owner") !== e.auth.id) {
    throw new ForbiddenError("Only the group owner can remove another member.");
  }
  const member = e.app.findFirstRecordByFilter(
    "conversation_members",
    "conversation = {:conversation} && user = {:user}",
    { conversation: conversation.id, user: userId },
  );
  const remaining = e.app.findRecordsByFilter(
    "conversation_members",
    "conversation = {:conversation} && user != {:user}",
    "+created",
    100,
    0,
    { conversation: conversation.id, user: userId },
  );
  if (!remaining.length) {
    e.app.delete(conversation);
    return e.noContent(204);
  }
  if (conversation.getString("owner") === userId) {
    conversation.set("owner", remaining[0].getString("user"));
    e.app.save(conversation);
  }
  e.app.delete(member);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/read", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  const member = h.conversationMembership(e.app, conversationId, e.auth.id);
  const lastMessage = String(e.requestInfo().body.lastMessage || "");
  if (lastMessage) {
    const message = e.app.findRecordById("direct_messages", lastMessage);
    if (message.getString("conversation") !== conversationId) throw new BadRequestError("Invalid message.");
  }
  member.set("lastMessage", lastMessage);
  member.set("lastReadAt", new Date().toISOString());
  e.app.save(member);
  return e.json(200, member);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/conversations/{id}/typing", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const conversationId = e.request.pathValue("id");
  h.conversationMembership(e.app, conversationId, e.auth.id);
  let typing;
  try {
    typing = e.app.findFirstRecordByFilter(
      "direct_typing",
      "conversation = {:conversation} && user = {:user}",
      { conversation: conversationId, user: e.auth.id },
    );
  } catch {
    typing = new Record(e.app.findCollectionByNameOrId("direct_typing"));
    typing.set("conversation", conversationId);
    typing.set("user", e.auth.id);
  }
  typing.set("expiresAt", new Date(Date.now() + 10_000).toISOString());
  e.app.save(typing);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/direct-messages", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const conversationId = h.requiredText(body.conversation, "conversation", 32);
  h.conversationMembership(e.app, conversationId, e.auth.id);
  const content = h.optionalText(body.content, 4000);
  let files = [];
  try {
    files = e.findUploadedFiles("attachments");
  } catch {
    // JSON requests without attachments are valid.
  }
  if (!content && files.length === 0) throw new BadRequestError("A message needs text or an attachment.");
  const replyToId = String(body.replyTo || "");
  if (replyToId) {
    const reply = e.app.findRecordById("direct_messages", replyToId);
    if (reply.getString("conversation") !== conversationId) throw new BadRequestError("Invalid reply target.");
  }
  const message = new Record(e.app.findCollectionByNameOrId("direct_messages"));
  message.set("conversation", conversationId);
  message.set("author", e.auth.id);
  message.set("content", content);
  message.set("replyTo", replyToId);
  message.set("embedsEnabled", true);
  if (files.length) message.set("attachments", files);
  e.app.save(message);
  const conversation = e.app.findRecordById("conversations", conversationId);
  e.app.save(conversation);
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(201, message);
}, $apis.requireAuth("users"), $apis.bodyLimit(260 * 1024 * 1024));

routerAdd("POST", "/api/thiscord/direct-messages/{id}/reactions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("direct_messages", e.request.pathValue("id"));
  h.conversationMembership(e.app, message.getString("conversation"), e.auth.id);
  const emoji = h.requiredText(e.requestInfo().body.emoji, "emoji", 64);
  try {
    const existing = e.app.findFirstRecordByFilter(
      "direct_reactions",
      "message = {:message} && user = {:user} && emoji = {:emoji}",
      { message: message.id, user: e.auth.id, emoji },
    );
    e.app.delete(existing);
    return e.json(200, { active: false });
  } catch {
    const reaction = new Record(e.app.findCollectionByNameOrId("direct_reactions"));
    reaction.set("message", message.id);
    reaction.set("user", e.auth.id);
    reaction.set("emoji", emoji);
    e.app.save(reaction);
    return e.json(201, { active: true, reaction });
  }
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/direct-messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("direct_messages", e.request.pathValue("id"));
  h.conversationMembership(e.app, message.getString("conversation"), e.auth.id);
  if (message.getString("deletedAt")) throw new BadRequestError("Deleted messages cannot be edited.");
  const body = e.requestInfo().body;
  if (body.content !== undefined) {
    if (message.getString("author") !== e.auth.id) throw new ForbiddenError("You cannot edit this message.");
    const content = h.optionalText(body.content, 4000);
    if (!content && message.getStringSlice("attachments").length === 0) {
      throw new BadRequestError("A message needs text or an attachment.");
    }
    message.set("content", content);
    message.set("editedAt", new Date().toISOString());
  }
  if (body.pinned !== undefined) message.set("pinned", Boolean(body.pinned));
  e.app.save(message);
  $apis.enrichRecord(e, message, "author", "replyTo", "replyTo.author");
  return e.json(200, message);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/direct-messages/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const message = e.app.findRecordById("direct_messages", e.request.pathValue("id"));
  h.conversationMembership(e.app, message.getString("conversation"), e.auth.id);
  if (message.getString("author") !== e.auth.id) throw new ForbiddenError("You cannot delete this message.");
  message.set("content", "");
  message.set("attachments", []);
  message.set("deletedAt", new Date().toISOString());
  e.app.save(message);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/notifications/{id}/read", (e) => {
  const notification = e.app.findRecordById("notifications", e.request.pathValue("id"));
  if (notification.getString("user") !== e.auth.id) throw new ForbiddenError("This notification does not belong to you.");
  notification.set("readAt", new Date().toISOString());
  e.app.save(notification);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/notifications/read-all", (e) => {
  const unread = e.app.findRecordsByFilter(
    "notifications",
    "user = {:user} && readAt = ''",
    "",
    10000,
    0,
    { user: e.auth.id },
  );
  const now = new Date().toISOString();
  e.app.runInTransaction((tx) => {
    for (const notification of unread) {
      notification.set("readAt", now);
      tx.save(notification);
    }
  });
  return e.json(200, { updated: unread.length });
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/account", (e) => {
  const userId = e.auth.id;
  e.app.runInTransaction((tx) => {
    const user = tx.findRecordById("users", userId);

    // Communities owned by the account are private data under that account's
    // control and are removed with their channels and related records.
    const ownedCommunities = tx.findRecordsByFilter(
      "communities",
      "owner = {:user}",
      "",
      10000,
      0,
      { user: userId },
    );
    for (const community of ownedCommunities) tx.delete(community);

    // A two-person direct conversation is no longer meaningful when either
    // participant leaves. Groups remain and transfer ownership if needed.
    const conversationMemberships = tx.findRecordsByFilter(
      "conversation_members",
      "user = {:user}",
      "",
      10000,
      0,
      { user: userId },
    );
    for (const membership of conversationMemberships) {
      let conversation;
      try {
        conversation = tx.findRecordById("conversations", membership.getString("conversation"));
      } catch {
        continue;
      }
      if (conversation.getString("kind") === "direct") {
        tx.delete(conversation);
        continue;
      }
      if (conversation.getString("owner") === userId) {
        const replacement = tx.findRecordsByFilter(
          "conversation_members",
          "conversation = {:conversation} && user != {:user}",
          "+created",
          1,
          0,
          { conversation: conversation.id, user: userId },
        )[0];
        if (!replacement) {
          tx.delete(conversation);
          continue;
        }
        conversation.set("owner", replacement.getString("user"));
        tx.save(conversation);
      }
    }

    for (const collection of ["messages", "direct_messages"]) {
      const authored = tx.findRecordsByFilter(
        collection,
        "author = {:user}",
        "",
        100000,
        0,
        { user: userId },
      );
      for (const record of authored) tx.delete(record);
    }

    const createdInvites = tx.findRecordsByFilter(
      "invites",
      "creator = {:user}",
      "",
      10000,
      0,
      { user: userId },
    );
    for (const invite of createdInvites) tx.delete(invite);

    const moderatedBans = tx.findRecordsByFilter(
      "bans",
      "moderator = {:user}",
      "",
      10000,
      0,
      { user: userId },
    );
    for (const ban of moderatedBans) {
      try {
        const community = tx.findRecordById("communities", ban.getString("community"));
        ban.set("moderator", community.getString("owner"));
        tx.save(ban);
      } catch {
        tx.delete(ban);
      }
    }

    const startedCalls = tx.findRecordsByFilter(
      "call_sessions",
      "startedBy = {:user}",
      "",
      10000,
      0,
      { user: userId },
    );
    for (const call of startedCalls) {
      try {
        const channel = tx.findRecordById("channels", call.getString("channel"));
        const community = tx.findRecordById("communities", channel.getString("community"));
        call.set("startedBy", community.getString("owner"));
        if (!call.getString("endedAt")) {
          const remainingParticipants = tx.findRecordsByFilter(
            "call_participants",
            "call = {:call} && user != {:user} && leftAt = '' && expiresAt > {:now}",
            "",
            1,
            0,
            { call: call.id, user: userId, now: new Date().toISOString() },
          );
          if (!remainingParticipants.length) call.set("endedAt", new Date().toISOString());
        }
        tx.save(call);
      } catch {
        tx.delete(call);
      }
    }

    for (const collection of ["audit_events", "notifications"]) {
      const records = tx.findRecordsByFilter(
        collection,
        "actor = {:user}",
        "",
        100000,
        0,
        { user: userId },
      );
      for (const record of records) {
        record.set("actor", "");
        tx.save(record);
      }
    }

    tx.delete(user);
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/channels/{id}/jitsi-token", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const context = h.channelContext(e.app, channelId, e.auth.id, "connect_voice");
  if (context.channel.getString("kind") !== "voice") throw new BadRequestError("This is not a voice channel.");

  const domain = String($os.getenv("JITSI_DOMAIN") || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const jitsiUrl = String($os.getenv("JITSI_URL") || `https://${domain}`).replace(/\/+$/, "");
  const appId = String($os.getenv("JITSI_APP_ID") || "");
  const secret = String($os.getenv("JITSI_APP_SECRET") || "");
  if (!domain || !jitsiUrl || !appId || !secret) throw new InternalServerError("Jitsi is not configured.");

  const canMuteMembers = context.auth.permissions.includes("mute_members") || context.auth.permissions.includes("administrator");
  const canRemoveMembers = context.auth.permissions.includes("manage_members") || context.auth.permissions.includes("administrator");
  const moderator = canMuteMembers || canRemoveMembers;
  const canSpeak = context.auth.permissions.includes("speak") || context.auth.permissions.includes("administrator");
  const canStreamVideo = context.auth.permissions.includes("stream_video") || context.auth.permissions.includes("administrator");
  const roomName = context.channel.getString("jitsiRoom");
  const publicUrl = String($os.getenv("THISCORD_PUBLIC_URL") || "");
  const avatar = e.auth.getString("avatar");
  const avatarUrl = h.publicFileUrl(publicUrl, e.auth, avatar, "128x128");
  const displayName = e.auth.getString("displayName") || e.auth.getString("handle");
  const expiresAt = new Date(Date.now() + 5 * 60_000);
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
        email: e.auth.email(),
        avatar: avatarUrl,
        moderator,
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "file-upload": false,
      },
    },
  }, secret, 5 * 60);

  return e.json(200, {
    domain,
    url: jitsiUrl,
    roomName,
    jwt: token,
    displayName,
    avatarUrl,
    moderator,
    canSpeak,
    canStreamVideo,
    canMuteMembers,
    canRemoveMembers,
    expiresAt: expiresAt.toISOString(),
  });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/channels/{id}/call-presence", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const state = ["joined", "update", "left"].includes(body.state) ? body.state : "update";
  const context = h.channelContext(
    e.app,
    channelId,
    e.auth.id,
    state === "left" ? "view_channels" : "connect_voice",
  );
  if (context.channel.getString("kind") !== "voice") throw new BadRequestError("This is not a voice channel.");

  let result = null;
  e.app.runInTransaction((tx) => {
    let call;
    try {
      call = tx.findFirstRecordByFilter(
        "call_sessions",
        "channel = {:channel} && endedAt = ''",
        { channel: channelId },
      );
    } catch {
      if (state === "left") return;
      call = new Record(tx.findCollectionByNameOrId("call_sessions"));
      call.set("channel", channelId);
      call.set("startedBy", e.auth.id);
      call.set("roomName", context.channel.getString("jitsiRoom"));
      tx.save(call);
    }

    let participant;
    try {
      participant = tx.findFirstRecordByFilter(
        "call_participants",
        "call = {:call} && user = {:user} && leftAt = ''",
        { call: call.id, user: e.auth.id },
      );
    } catch {
      if (state === "left") return;
      participant = new Record(tx.findCollectionByNameOrId("call_participants"));
      participant.set("call", call.id);
      participant.set("user", e.auth.id);
      participant.set("joinedAt", new Date().toISOString());
    }

    if (state === "left") {
      participant.set("leftAt", new Date().toISOString());
      participant.set("expiresAt", "");
      tx.save(participant);
      const remaining = tx.findRecordsByFilter(
        "call_participants",
        "call = {:call} && leftAt = '' && expiresAt > {:now}",
        "",
        1,
        0,
        { call: call.id, now: new Date().toISOString() },
      );
      if (!remaining.length) {
        call.set("endedAt", new Date().toISOString());
        tx.save(call);
      }
      result = { active: false };
      return;
    }

    participant.set("leftAt", "");
    participant.set("expiresAt", new Date(Date.now() + 120_000).toISOString());
    for (const field of ["muted", "deafened", "camera", "sharing"]) {
      if (body[field] !== undefined) participant.set(field, Boolean(body[field]));
    }
    tx.save(participant);
    result = { active: true, call, participant };
  });

  return e.json(200, result || { active: false });
}, $apis.requireAuth("users"));
