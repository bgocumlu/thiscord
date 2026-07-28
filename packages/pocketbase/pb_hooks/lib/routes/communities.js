function registerCommunities() {
routerAdd("POST", "/api/thiscord/communities", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const body = e.requestInfo().body;
  const name = h.normalizeName(body.name, h.POLICY_LIMITS.community.nameMax);
  const slug = h.normalizeSlug(body.slug || name);
  const description = h.optionalText(body.description, h.POLICY_LIMITS.community.descriptionMax);
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
    const calls = require(`${__hooks}/lib/callAccess.js`);
    const channel = new Record(app.findCollectionByNameOrId("channels"));
    channel.set("community", communityId);
    channel.set("parent", parentId);
    channel.set("name", channelName);
    channel.set("topic", topic);
    channel.set("kind", kind);
    channel.set("position", position);
    app.save(channel);
    if (h.CHANNEL_CAPABILITIES[kind].calls) {
      calls.createRoom(app, { kind: "channel", id: channel.id });
    }
    return channel;
  }
}, $apis.requireAuth("users"), $apis.bodyLimit(2 * 1024 * 1024));

routerAdd("PATCH", "/api/thiscord/communities/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const uploads = {};
  for (const field of ["icon", "banner"]) {
    try {
      const files = e.findUploadedFiles(field);
      if (files.length) uploads[field] = files[0];
    } catch {
      // JSON-only updates do not include files.
    }
  }
  let community;
  e.app.runInTransaction((tx) => {
    const context = h.requirePermission(tx, communityId, e.auth.id, "manage_community");
    community = context.community;
    if (body.name !== undefined) {
      community.set("name", h.normalizeName(body.name, h.POLICY_LIMITS.community.nameMax));
    }
    if (body.description !== undefined) {
      community.set(
        "description",
        h.optionalText(body.description, h.POLICY_LIMITS.community.descriptionMax),
      );
    }
    for (const field of ["icon", "banner"]) {
      if (body[field] === null) community.set(field, null);
      else if (uploads[field]) community.set(field, uploads[field]);
    }
    tx.save(community);
    h.audit(tx, communityId, e.auth.id, "community.update", "community", communityId, "", {});
  });
  return e.json(200, community);
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

}

function registerInvites() {
routerAdd("GET", "/api/thiscord/communities/{id}/invites", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const auth = h.communityPermissions(e.app, communityId, e.auth.id);
  if (
    !auth.permissions.includes("create_invites")
    && !auth.permissions.includes("manage_community")
    && !auth.permissions.includes("administrator")
  ) {
    throw new ForbiddenError("You cannot view this community's invites.");
  }
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 30)));
  const records = e.app.findRecordsByFilter(
    "invites",
    "community = {:community}",
    "-created",
    perPage + 1,
    (page - 1) * perPage,
    { community: communityId },
  );
  const hasMore = records.length > perPage;
  const items = records.slice(0, perPage);
  $apis.enrichRecords(e, items, "creator");
  return e.json(200, { page, perPage, hasMore, items });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/invites", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const maxUses = Math.max(0, Math.min(100000, Number(body.maxUses || 0)));
  const expiresInHours = Math.max(0, Math.min(24 * 365, Number(body.expiresInHours || 24 * 7)));
  let invite;
  e.app.runInTransaction((tx) => {
    h.requirePermission(tx, communityId, e.auth.id, "create_invites");
    invite = new Record(tx.findCollectionByNameOrId("invites"));
    invite.set("community", communityId);
    invite.set("creator", e.auth.id);
    invite.set("code", $security.randomString(12));
    invite.set("maxUses", maxUses);
    invite.set("uses", 0);
    if (expiresInHours > 0) {
      invite.set("expiresAt", new Date(Date.now() + expiresInHours * 3_600_000).toISOString());
    }
    tx.save(invite);
  });
  return e.json(201, invite);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/invites/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const inviteId = e.request.pathValue("id");
  e.app.runInTransaction((tx) => {
    const invite = tx.findRecordById("invites", inviteId);
    const communityId = invite.getString("community");
    const auth = h.communityPermissions(tx, communityId, e.auth.id);
    const ownsInvite = invite.getString("creator") === e.auth.id;
    if (
      !ownsInvite
      && !auth.permissions.includes("manage_community")
      && !auth.permissions.includes("administrator")
    ) {
      throw new ForbiddenError("You cannot revoke this invite.");
    }
    invite.set("revoked", true);
    tx.save(invite);
    h.audit(tx, communityId, e.auth.id, "invite.revoke", "invite", invite.id, "", {});
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/invites/{code}/preview", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
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
  const memberCount = h.countRecordsByFilter(
    e.app,
    "memberships",
    "community = {:community} && state = 'active'",
    { community: community.id },
  );
  return e.json(200, {
    code,
    community: {
      id: community.id,
      name: community.getString("name"),
      description: community.getString("description"),
    },
    memberCount,
    expiresAt: invite.getString("expiresAt"),
  });
});

routerAdd("POST", "/api/thiscord/invites/{code}/accept", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const code = e.request.pathValue("code");
  let membership;
  let joined = false;
  e.app.runInTransaction((tx) => {
    const currentInvite = tx.findFirstRecordByData("invites", "code", code);
    if (currentInvite.getBool("revoked")) throw new BadRequestError("This invite is no longer valid.");
    if (
      currentInvite.getString("expiresAt")
      && new Date(currentInvite.getString("expiresAt")).getTime() <= Date.now()
    ) throw new BadRequestError("This invite has expired.");
    const communityId = currentInvite.getString("community");
    try {
      const ban = tx.findFirstRecordByFilter(
        "bans",
        "community = {:community} && user = {:user}",
        { community: communityId, user: e.auth.id },
      );
      const expiresAt = ban.getString("expiresAt");
      if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
        throw new ForbiddenError("You are banned from this community.");
      }
      tx.delete(ban);
    } catch (error) {
      if (error instanceof ForbiddenError) throw error;
    }
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
    h.audit(tx, communityId, e.auth.id, "member.join", "membership", membership.id, "", {
      invite: currentInvite.id,
    });
    joined = true;
  });
  return e.json(joined ? 201 : 200, membership);
}, $apis.requireAuth("users"));

}

function registerCommunityAdministration() {
routerAdd("POST", "/api/thiscord/communities/{id}/moderation", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const action = String(body.action || "");
  const userId = h.requiredText(body.userId, "user", 32);
  const reason = h.optionalText(body.reason, 1000);
  let membership;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const context = h.requirePermission(tx, communityId, e.auth.id, "manage_members");
    if (userId === e.auth.id || userId === context.community.getString("owner")) {
      throw new BadRequestError("That member cannot be moderated.");
    }
    membership = h.activeMembership(tx, communityId, userId);
    h.assertCanManageMembership(tx, context, membership, action);
    const calls = require(`${__hooks}/lib/callAccess.js`);

    if (action === "kick") {
      membership.set("state", "left");
      tx.save(membership);
      calls.revokeCommunityParticipant(tx, communityId, userId, true, pendingCallControls);
      h.audit(tx, communityId, e.auth.id, "member.kick", "user", userId, reason, {});
    } else if (action === "ban") {
      let ban;
      try {
        ban = tx.findFirstRecordByFilter(
          "bans",
          "community = {:community} && user = {:user}",
          { community: communityId, user: userId },
        );
      } catch {
        ban = new Record(tx.findCollectionByNameOrId("bans"));
        ban.set("community", communityId);
        ban.set("user", userId);
      }
      ban.set("moderator", e.auth.id);
      ban.set("reason", reason);
      if (Number(body.durationHours) > 0) {
        ban.set("expiresAt", new Date(Date.now() + Number(body.durationHours) * 3_600_000).toISOString());
      }
      tx.save(ban);
      membership.set("state", "banned");
      tx.save(membership);
      calls.revokeCommunityParticipant(tx, communityId, userId, true, pendingCallControls);
      h.audit(tx, communityId, e.auth.id, "member.ban", "user", userId, reason, {});
    } else if (action === "timeout") {
      const durationMinutes = Math.max(
        1,
        Math.min(h.POLICY_LIMITS.membership.timeoutMinutesMax, Number(body.durationMinutes || 10)),
      );
      membership.set("timeoutUntil", new Date(Date.now() + durationMinutes * 60_000).toISOString());
      tx.save(membership);
      calls.revokeCommunityParticipant(tx, communityId, userId, true, pendingCallControls);
      h.audit(tx, communityId, e.auth.id, "member.timeout", "user", userId, reason, { durationMinutes });
    } else if (action === "untimeout") {
      membership.set("timeoutUntil", "");
      tx.save(membership);
      h.audit(tx, communityId, e.auth.id, "member.untimeout", "user", userId, reason, {});
    } else {
      throw new BadRequestError("Invalid moderation action.");
    }
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );

  return e.json(200, membership);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/leave", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const membership = h.activeMembership(tx, communityId, e.auth.id);
    const community = tx.findRecordById("communities", communityId);
    if (community.getString("owner") === e.auth.id) {
      throw new BadRequestError("Transfer ownership or delete the community before leaving.");
    }
    membership.set("state", "left");
    tx.save(membership);
    require(`${__hooks}/lib/callAccess.js`).revokeCommunityParticipant(
      tx,
      communityId,
      e.auth.id,
      true,
      pendingCallControls,
    );
    h.audit(tx, communityId, e.auth.id, "member.leave", "membership", membership.id, "", {});
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/communities/{id}/transfer", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const targetUserId = h.requiredText(e.requestInfo().body.userId, "new owner", 32);
  if (targetUserId === e.auth.id) throw new BadRequestError("You already own this community.");
  let community;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    community = tx.findRecordById("communities", communityId);
    if (community.getString("owner") !== e.auth.id) {
      throw new ForbiddenError("Only the owner can transfer ownership.");
    }
    h.activeMembership(tx, community.id, targetUserId);
    const targetPermissions = h.communityPermissions(tx, community.id, targetUserId);
    if (!targetPermissions.permissions.includes("administrator")) {
      throw new BadRequestError("Ownership can only be transferred to an administrator.");
    }
    community.set("owner", targetUserId);
    tx.save(community);
    require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedCommunityParticipants(
      tx,
      community.id,
      e.auth.id,
      true,
      pendingCallControls,
    );
    h.audit(tx, community.id, e.auth.id, "community.transfer", "user", targetUserId, "", {});
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.json(200, community);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/communities/{id}/bans", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.requirePermission(e.app, communityId, e.auth.id, "manage_members");
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const records = e.app.findRecordsByFilter(
    "bans",
    "community = {:community}",
    "-created",
    perPage + 1,
    (page - 1) * perPage,
    { community: communityId },
  );
  const hasMore = records.length > perPage;
  const items = records.slice(0, perPage);
  $apis.enrichRecords(e, items, "user", "moderator");
  return e.json(200, { page, perPage, hasMore, items });
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/bans/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const banId = e.request.pathValue("id");
  e.app.runInTransaction((tx) => {
    const ban = tx.findRecordById("bans", banId);
    const communityId = ban.getString("community");
    h.requirePermission(tx, communityId, e.auth.id, "manage_members");
    const userId = ban.getString("user");
    tx.delete(ban);
    try {
      const membership = tx.findFirstRecordByFilter(
        "memberships",
        "community = {:community} && user = {:user}",
        { community: communityId, user: userId },
      );
      if (membership.getString("state") === "banned") {
        membership.set("state", "left");
        tx.save(membership);
      }
    } catch {
      // A deleted account may no longer have a membership.
    }
    h.audit(tx, communityId, e.auth.id, "member.unban", "user", userId, "", {});
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/communities/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const community = tx.findRecordById("communities", communityId);
    if (community.getString("owner") !== e.auth.id) throw new ForbiddenError("Only the owner can delete this community.");
    require(`${__hooks}/lib/callAccess.js`).revokeCommunityParticipants(
      tx,
      community.id,
      true,
      pendingCallControls,
    );
    tx.delete(community);
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.noContent(204);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerCommunities,
  registerInvites,
  registerCommunityAdministration,
};
