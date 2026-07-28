function registerMembers() {
routerAdd("GET", "/api/thiscord/communities/{id}/members", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  h.activeMembership(e.app, communityId, e.auth.id);
  const page = Math.max(1, Number(e.request.url.query().get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(e.request.url.query().get("perPage") || 50)));
  const query = String(e.request.url.query().get("query") || "").trim();
  const params = { community: communityId, query };
  const conditions = ["community = {:community}", "state = 'active'"];
  if (query) {
    conditions.push(
      "(nickname ~ {:query} || user.displayName ~ {:query} || user.handle ~ {:query})",
    );
  }
  const records = e.app.findRecordsByFilter(
    "memberships",
    conditions.join(" && "),
    "+joinedAt",
    perPage + 1,
    (page - 1) * perPage,
    params,
  );
  const hasMore = records.length > perPage;
  const items = records.slice(0, perPage);
  $apis.enrichRecords(e, items, "user");

  const memberRoles = [];
  const presence = [];
  const now = new Date().toISOString();
  for (const membership of items) {
    memberRoles.push(...h.findAllRecordsByFilter(
      e.app,
      "member_roles",
      "membership = {:membership}",
      "",
      { membership: membership.id },
    ));
    presence.push(...h.findAllRecordsByFilter(
      e.app,
      "presence",
      "user = {:user}",
      "",
      { user: membership.getString("user") },
    ).filter((item) => new Date(item.getString("expiresAt")).getTime() > new Date(now).getTime()));
  }

  return e.json(200, {
    page,
    perPage,
    hasMore,
    items,
    memberRoles,
    presence,
  });
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/memberships/{id}/roles", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const membershipId = e.request.pathValue("id");
  const requested = Array.isArray(e.requestInfo().body.roleIds)
    ? Array.from(new Set(e.requestInfo().body.roleIds.map(String)))
    : [];
  let roleIds = [];
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const requestedMembership = tx.findRecordById("memberships", membershipId);
    const communityId = requestedMembership.getString("community");
    const membership = h.activeMembership(
      tx,
      communityId,
      requestedMembership.getString("user"),
    );
    const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_roles");
    h.assertCanManageMembership(tx, auth, membership, "change roles for");
    const roles = requested.map((roleId) => tx.findRecordById("roles", roleId));
    for (const role of roles) {
      if (role.getString("community") !== communityId || role.getBool("managed")) {
        throw new BadRequestError("Invalid assignable role.");
      }
      if (
        auth.community.getString("owner") !== e.auth.id
        && role.getInt("position") >= auth.highestRolePosition
      ) {
        throw new ForbiddenError("You cannot assign this role.");
      }
    }
    const existing = h.findAllRecordsByFilter(
      tx,
      "member_roles",
      "membership = {:membership}",
      "",
      { membership: membershipId },
    );
    for (const assignment of existing) tx.delete(assignment);
    for (const role of roles) {
      const assignment = new Record(tx.findCollectionByNameOrId("member_roles"));
      assignment.set("membership", membershipId);
      assignment.set("role", role.id);
      tx.save(assignment);
    }
    require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedCommunityParticipants(
      tx,
      communityId,
      membership.getString("user"),
      true,
      pendingCallControls,
    );
    roleIds = roles.map((role) => role.id);
    h.audit(tx, communityId, e.auth.id, "member.roles.update", "membership", membershipId, "", {
      roleIds,
    });
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.json(200, { roleIds });
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/memberships/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const membershipId = e.request.pathValue("id");
  const nickname = h.optionalText(e.requestInfo().body.nickname, h.POLICY_LIMITS.membership.nicknameMax);
  let membership;
  e.app.runInTransaction((tx) => {
    membership = tx.findRecordById("memberships", membershipId);
    const communityId = membership.getString("community");
    const editingSelf = membership.getString("user") === e.auth.id;
    membership = h.activeMembership(tx, communityId, membership.getString("user"));
    if (editingSelf) h.activeMembership(tx, communityId, e.auth.id);
    else {
      const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_members");
      h.assertCanManageMembership(tx, auth, membership, "change the nickname for");
    }
    membership.set("nickname", nickname);
    tx.save(membership);
    h.audit(tx, communityId, e.auth.id, "member.nickname.update", "membership", membership.id, "", {});
  });
  return e.json(200, membership);
}, $apis.requireAuth("users"));

}

function registerPresence() {
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
    presence.set("expiresAt", new Date(Date.now() + h.TRANSIENT_TIMINGS.presenceExpiryMs).toISOString());
    txApp.save(presence);
  });
  return e.noContent(204);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerMembers,
  registerPresence,
};
