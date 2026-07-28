function registerChannels() {
routerAdd("GET", "/api/thiscord/communities/{id}/channels", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.activeMembership(e.app, communityId, e.auth.id);
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const authorizedPage = h.findAuthorizedPage(
    e.app,
    "channels",
    "community = {:community}",
    "+position,+created",
    { community: communityId },
    page,
    perPage,
    (channel) => {
      try {
        h.channelContext(e.app, channel.id, e.auth.id, "view_channels");
        return true;
      } catch {
        return false;
      }
    },
  );
  const { hasMore, items } = authorizedPage;
  return e.json(200, { page, perPage, hasMore, items });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/channels/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const context = h.channelContext(
    e.app,
    e.request.pathValue("id"),
    e.auth.id,
    "view_channels",
  );
  return e.json(200, context.channel);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/channels", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const kind = String(body.kind || "text");
  if (!h.CHANNEL_KINDS.includes(kind)) throw new BadRequestError("Invalid channel type.");
  const capabilities = h.CHANNEL_CAPABILITIES[kind];
  h.assertChannelWriteFields(body, capabilities, true);
  const parentId = capabilities.settingsFields.includes("parent") ? String(body.parent || "") : "";

  let channel;
  e.app.runInTransaction((tx) => {
    h.requirePermission(tx, communityId, e.auth.id, "manage_channels");
    if (parentId) {
      const parent = tx.findRecordById("channels", parentId);
      if (
        parent.getString("community") !== communityId
        || parent.getString("kind") !== "category"
      ) {
        throw new BadRequestError("Invalid channel category.");
      }
    }
    channel = new Record(tx.findCollectionByNameOrId("channels"));
    channel.set("community", communityId);
    channel.set("parent", parentId);
    channel.set(
      "name",
      capabilities.container
        ? h.normalizeName(body.name, h.POLICY_LIMITS.channel.nameMax)
        : h.normalizeChannelName(body.name),
    );
    channel.set(
      "topic",
      capabilities.topics ? h.optionalText(body.topic, h.POLICY_LIMITS.channel.topicMax) : "",
    );
    channel.set("kind", kind);
    channel.set("position", 0);
    channel.set("nsfw", capabilities.ageRestriction ? Boolean(body.nsfw) : false);
    channel.set(
      "slowmodeSeconds",
      capabilities.slowmode
        ? Math.max(0, Math.min(h.POLICY_LIMITS.channel.slowmodeSecondsMax, Number(body.slowmodeSeconds || 0)))
        : 0,
    );
    tx.save(channel);
    if (capabilities.calls) {
      require(`${__hooks}/lib/callAccess.js`).createRoom(
        tx,
        { kind: "channel", id: channel.id },
      );
    }
    h.audit(tx, communityId, e.auth.id, "channel.create", "channel", channel.id, "", { kind });
  });
  return e.json(201, channel);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/channels/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  let context;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    context = h.channelContext(tx, channelId, e.auth.id, "manage_channels");
    const kind = context.channel.getString("kind");
    const capabilities = h.CHANNEL_CAPABILITIES[kind];
    h.assertChannelWriteFields(body, capabilities, false);
    let accessPolicyChanged = false;
    if (body.name !== undefined) {
      context.channel.set(
        "name",
        capabilities.container
          ? h.normalizeName(body.name, h.POLICY_LIMITS.channel.nameMax)
          : h.normalizeChannelName(body.name),
      );
    }
    if (body.topic !== undefined) {
      context.channel.set("topic", h.optionalText(body.topic, h.POLICY_LIMITS.channel.topicMax));
    }
    if (body.nsfw !== undefined) context.channel.set("nsfw", Boolean(body.nsfw));
    if (body.slowmodeSeconds !== undefined) {
      context.channel.set(
        "slowmodeSeconds",
        Math.max(0, Math.min(h.POLICY_LIMITS.channel.slowmodeSecondsMax, Number(body.slowmodeSeconds))),
      );
    }
    if (body.parent !== undefined) {
      const parentId = String(body.parent || "");
      if (parentId) {
        if (parentId === channelId) throw new BadRequestError("A channel cannot be its own category.");
        const parent = tx.findRecordById("channels", parentId);
        if (parent.getString("community") !== context.communityId || parent.getString("kind") !== "category") {
          throw new BadRequestError("Invalid channel category.");
        }
      }
      accessPolicyChanged = context.channel.getString("parent") !== parentId;
      context.channel.set("parent", parentId);
    }
    if (!capabilities.topics) context.channel.set("topic", "");
    if (!capabilities.ageRestriction) context.channel.set("nsfw", false);
    if (!capabilities.slowmode) context.channel.set("slowmodeSeconds", 0);
    if (capabilities.container && context.channel.getString("parent")) {
      context.channel.set("parent", "");
      accessPolicyChanged = true;
    }
    tx.save(context.channel);
    if (accessPolicyChanged) {
      h.bumpCommunityAccessRevision(tx, context.auth.community);
      require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedChannelParticipants(
        tx,
        channelId,
        "",
        true,
        pendingCallControls,
      );
    }
    h.audit(tx, context.communityId, e.auth.id, "channel.update", "channel", channelId, "", {});
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.json(200, context.channel);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/channels/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const context = h.channelContext(tx, channelId, e.auth.id, "manage_channels");
    const name = context.channel.getString("name");
    const kind = context.channel.getString("kind");
    if (h.CHANNEL_CAPABILITIES[kind].calls) {
      require(`${__hooks}/lib/callAccess.js`).revokeTargetParticipants(
        tx,
        { kind: "channel", id: channelId },
        true,
        pendingCallControls,
      );
    }
    if (kind === "category") {
      const children = h.findAllRecordsByFilter(
        tx,
        "channels",
        "parent = {:parent}",
        "",
        { parent: channelId },
      );
      for (const child of children) {
        child.set("parent", "");
        tx.save(child);
        require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedChannelParticipants(
          tx,
          child.id,
          "",
          true,
          pendingCallControls,
        );
      }
    }
    h.bumpCommunityAccessRevision(tx, context.auth.community);
    h.audit(tx, context.communityId, e.auth.id, "channel.delete", "channel", channelId, "", {
      name,
      kind,
    });
    tx.delete(tx.findRecordById("channels", channelId));
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/communities/{id}/channels/order", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const ids = Array.isArray(e.requestInfo().body.ids)
    ? Array.from(new Set(e.requestInfo().body.ids.map(String)))
    : [];
  e.app.runInTransaction((tx) => {
    h.requirePermission(tx, communityId, e.auth.id, "manage_channels");
    const allRecords = h.findAllRecordsByFilter(
      tx,
      "channels",
      "community = {:community}",
      "",
      { community: communityId },
    );
    if (
      ids.length !== allRecords.length
      || allRecords.some((record) => !ids.includes(record.id))
    ) {
      throw new BadRequestError("Channel order must include every community channel.");
    }
    const records = ids.map((id) => tx.findRecordById("channels", id));
    if (records.some((record) => record.getString("community") !== communityId)) {
      throw new BadRequestError("Invalid channel order.");
    }
    records.forEach((record, position) => {
      record.set("position", position);
      tx.save(record);
    });
    h.audit(tx, communityId, e.auth.id, "channel.reorder", "community", communityId, "", { ids });
  });
  return e.json(200, { ids });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/channels/{id}/move", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const direction = Number(e.requestInfo().body.direction);
  if (direction !== -1 && direction !== 1) {
    throw new BadRequestError("Invalid channel move direction.");
  }
  let ids = [];
  e.app.runInTransaction((tx) => {
    const channel = tx.findRecordById("channels", channelId);
    const communityId = channel.getString("community");
    h.requirePermission(tx, communityId, e.auth.id, "manage_channels");
    const records = h.findAllRecordsByFilter(
      tx,
      "channels",
      "community = {:community}",
      "+position,+created,+id",
      { community: communityId },
    );
    const index = records.findIndex((record) => record.id === channelId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= records.length) {
      ids = records.map((record) => record.id);
      return;
    }
    [records[index], records[target]] = [records[target], records[index]];
    records.forEach((record, position) => {
      record.set("position", position);
      tx.save(record);
    });
    ids = records.map((record) => record.id);
    h.audit(tx, communityId, e.auth.id, "channel.reorder", "community", communityId, "", {
      channel: channelId,
      direction,
    });
  });
  return e.json(200, { ids });
}, $apis.requireAuth("users"));

}

function registerChannelPermissions() {
routerAdd("GET", "/api/thiscord/channels/{id}/permissions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  h.channelContext(e.app, channelId, e.auth.id, "manage_roles");
  const items = h.findAllRecordsByFilter(
    e.app,
    "channel_permissions",
    "channel = {:channel}",
    "+created",
    { channel: channelId },
  );
  return e.json(200, { items });
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/channels/{id}/permissions", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const channelId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const targetType = String(body.targetType || "");
  const targetId = h.requiredText(body.targetId, "permission target", 32);
  if (!["role", "member"].includes(targetType)) throw new BadRequestError("Invalid permission target.");
  const deny = (Array.isArray(body.deny) ? body.deny.map(String) : [])
    .filter((item) => h.ALL_PERMISSIONS.includes(item) && item !== "administrator");
  const editedPermissions = Array.isArray(body.editedPermissions)
    ? Array.from(new Set(body.editedPermissions.map(String)))
    : null;
  let overwrite;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const context = h.channelContext(tx, channelId, e.auth.id, "manage_roles");
    if (targetType === "role") {
      const role = tx.findRecordById("roles", targetId);
      if (role.getString("community") !== context.communityId) {
        throw new BadRequestError("Invalid role.");
      }
      if (
        context.auth.community.getString("owner") !== e.auth.id
        && role.getInt("position") >= context.auth.highestRolePosition
      ) throw new ForbiddenError("You cannot edit overrides for this role.");
    } else {
      const membership = tx.findRecordById("memberships", targetId);
      if (membership.getString("community") !== context.communityId) {
        throw new BadRequestError("Invalid member.");
      }
      if (membership.getString("user") !== e.auth.id) {
        h.assertCanManageMembership(tx, context.auth, membership, "edit overrides for");
      }
    }
    const allow = h.validateGrantedPermissions(
      context.auth,
      Array.isArray(body.allow) ? body.allow.map(String) : [],
      { allowAdministrator: false },
    );
    let editable = null;
    if (editedPermissions) {
      editable = h.validateGrantedPermissions(
        context.auth,
        editedPermissions,
        { allowAdministrator: false },
      );
      if (
        allow.some((permission) => !editable.includes(permission))
        || deny.some((permission) => !editable.includes(permission))
        || allow.some((permission) => deny.includes(permission))
      ) {
        throw new BadRequestError("Invalid permission overwrite edit.");
      }
    }
    let overwriteExists = true;
    try {
      overwrite = tx.findFirstRecordByFilter(
        "channel_permissions",
        "channel = {:channel} && targetType = {:targetType} && targetId = {:targetId}",
        { channel: channelId, targetType, targetId },
      );
    } catch {
      overwriteExists = false;
      overwrite = new Record(tx.findCollectionByNameOrId("channel_permissions"));
      overwrite.set("channel", channelId);
      overwrite.set("targetType", targetType);
      overwrite.set("targetId", targetId);
    }
    const nextAllow = editable
      ? Array.from(new Set([
          ...h.jsonArray(overwrite, "allow").filter((permission) => !editable.includes(permission)),
          ...allow,
        ]))
      : allow;
    const nextDeny = editable
      ? Array.from(new Set([
          ...h.jsonArray(overwrite, "deny").filter((permission) => !editable.includes(permission)),
          ...deny,
        ]))
      : deny;
    if (!nextAllow.length && !nextDeny.length) {
      if (overwriteExists) tx.delete(overwrite);
    } else {
      overwrite.set("allow", nextAllow);
      overwrite.set("deny", nextDeny);
      tx.save(overwrite);
    }
    require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedChannelParticipants(
      tx,
      channelId,
      "",
      true,
      pendingCallControls,
    );
    h.bumpCommunityAccessRevision(tx, context.auth.community);
    h.audit(tx, context.communityId, e.auth.id, "channel.permissions.update", "channel", channelId, "", {
      targetType,
      targetId,
    });
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.json(200, overwrite);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerChannels,
  registerChannelPermissions,
};
