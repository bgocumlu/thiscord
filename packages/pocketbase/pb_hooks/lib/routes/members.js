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

  const membershipFilter = h.filterAny("membership", items.map((item) => item.id), "membership");
  const memberRoles = h.findAllRecordsByFilter(
    e.app,
    "member_roles",
    membershipFilter.filter,
    "",
    membershipFilter.params,
  );
  const presenceFilter = h.filterAny(
    "user",
    items.map((item) => item.getString("user")),
    "user",
  );
  const presence = h.findAllRecordsByFilter(
    e.app,
    "presence",
    presenceFilter.filter,
    "",
    presenceFilter.params,
  );

  return e.json(200, {
    page,
    perPage,
    hasMore,
    items,
    memberRoles,
    presence,
  });
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/thiscord/users/by-handle", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const handle = h.requiredText(
    e.request.url.query().get("handle"),
    "handle",
    h.POLICY_LIMITS.profile.handleMax,
  ).toLowerCase();
  const user = e.app.findFirstRecordByData("users", "handle", handle);
  return e.json(200, user);
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
  const presenceService = require(`${__hooks}/lib/presence.js`);
  const body = e.requestInfo().body;
  const leaseId = h.requiredText(body.leaseId, "presence lease", 120);
  const allowed = ["online", "idle", "dnd", "offline"];
  const status = String(body.status || "");
  if (!allowed.includes(status)) throw new BadRequestError("Invalid presence status.");
  const sequence = Number(body.sequence);
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new BadRequestError("Invalid presence sequence.");
  }
  let result = { accepted: false, sequence, status: "offline" };
  const update = () => e.app.runInTransaction((txApp) => {
    const now = new Date().toISOString();
    let lease;
    let leaseFound = true;
    try {
      lease = txApp.findFirstRecordByFilter(
        "presence_leases",
        "user = {:user} && leaseId = {:lease}",
        { user: e.auth.id, lease: leaseId },
      );
    } catch {
      leaseFound = false;
      lease = new Record(txApp.findCollectionByNameOrId("presence_leases"));
      lease.set("user", e.auth.id);
      lease.set("leaseId", leaseId);
    }
    if (
      leaseFound
      && (sequence <= lease.getInt("sequence") || Boolean(lease.getString("closedAt")))
    ) {
      result = {
        accepted: false,
        sequence: lease.getInt("sequence"),
        status: presenceService.syncUserPresence(txApp, e.auth.id, now),
      };
      return;
    }
    lease.set("sequence", sequence);
    lease.set("status", status);
    if (status === "offline") {
      lease.set("closedAt", now);
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.presenceLeaseTombstoneMs).toISOString(),
      );
    } else {
      lease.set("closedAt", "");
      lease.set(
        "expiresAt",
        new Date(Date.now() + h.TRANSIENT_TIMINGS.presenceExpiryMs).toISOString(),
      );
    }
    txApp.save(lease);
    result = {
      accepted: true,
      sequence,
      status: presenceService.syncUserPresence(txApp, e.auth.id, now),
    };
  });
  try {
    update();
  } catch (error) {
    if (!/unique|constraint|locked/i.test(String(error?.message || error))) throw error;
    update();
  }
  return e.json(200, result);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerMembers,
  registerPresence,
};
