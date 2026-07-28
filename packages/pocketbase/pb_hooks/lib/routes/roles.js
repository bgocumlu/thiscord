function registerRoles() {
routerAdd("POST", "/api/thiscord/communities/{id}/roles", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  const requested = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
  let role;
  e.app.runInTransaction((tx) => {
    const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_roles");
    if (
      auth.community.getString("owner") !== e.auth.id
      && auth.highestRolePosition <= 1
    ) {
      throw new ForbiddenError("You need a role above position 1 to create a lower role.");
    }
    const granted = h.validateGrantedPermissions(auth, requested, { allowAdministrator: true });
    const maxPosition = auth.community.getString("owner") === e.auth.id
      ? 10_000
      : Math.max(1, auth.highestRolePosition);
    role = new Record(tx.findCollectionByNameOrId("roles"));
    role.set("community", communityId);
    role.set("name", h.normalizeName(body.name, h.POLICY_LIMITS.role.nameMax));
    role.set("color", h.optionalText(body.color || "#aeb4c0", h.POLICY_LIMITS.role.colorMax));
    role.set("position", Math.max(1, Math.min(maxPosition - 1, Number(body.position || 1))));
    role.set("permissions", granted);
    role.set("hoist", Boolean(body.hoist));
    role.set("mentionable", Boolean(body.mentionable));
    role.set("managed", false);
    tx.save(role);
    h.audit(tx, communityId, e.auth.id, "role.create", "role", role.id, "", { permissions: granted });
  });
  return e.json(201, role);
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/roles/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const roleId = e.request.pathValue("id");
  const body = e.requestInfo().body;
  let role;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    role = tx.findRecordById("roles", roleId);
    const communityId = role.getString("community");
    const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_roles");
    if (role.getBool("managed")) throw new BadRequestError("Managed roles cannot be edited.");
    if (auth.community.getString("owner") !== e.auth.id && role.getInt("position") >= auth.highestRolePosition) {
      throw new ForbiddenError("You cannot edit this role.");
    }
    if (body.name !== undefined) role.set("name", h.normalizeName(body.name, h.POLICY_LIMITS.role.nameMax));
    if (body.color !== undefined) role.set("color", h.optionalText(body.color, h.POLICY_LIMITS.role.colorMax));
    if (body.hoist !== undefined) role.set("hoist", Boolean(body.hoist));
    if (body.mentionable !== undefined) role.set("mentionable", Boolean(body.mentionable));
    if (body.permissions !== undefined) {
      const requested = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
      let nextPermissions = h.validateGrantedPermissions(
        auth,
        requested,
        { allowAdministrator: true },
      );
      if (Array.isArray(body.editedPermissions)) {
        const editedPermissions = h.validateGrantedPermissions(
          auth,
          Array.from(new Set(body.editedPermissions.map(String))),
          { allowAdministrator: true },
        );
        if (nextPermissions.some((permission) => !editedPermissions.includes(permission))) {
          throw new BadRequestError("Invalid role permission edit.");
        }
        nextPermissions = Array.from(new Set([
          ...h.jsonArray(role, "permissions").filter(
            (permission) => !editedPermissions.includes(permission),
          ),
          ...nextPermissions,
        ]));
      }
      role.set(
        "permissions",
        nextPermissions,
      );
    }
    if (body.position !== undefined) {
      const maxPosition = auth.community.getString("owner") === e.auth.id
        ? 10_000
        : auth.highestRolePosition - 1;
      role.set("position", Math.max(1, Math.min(maxPosition, Number(body.position))));
    }
    tx.save(role);
    if (body.permissions !== undefined) {
      require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedCommunityParticipants(
        tx,
        communityId,
        "",
        true,
        pendingCallControls,
      );
    }
    h.audit(tx, communityId, e.auth.id, "role.update", "role", role.id, "", {});
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.json(200, role);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/api/thiscord/roles/{id}", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const roleId = e.request.pathValue("id");
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const role = tx.findRecordById("roles", roleId);
    const communityId = role.getString("community");
    const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_roles");
    if (role.getBool("managed")) throw new BadRequestError("Managed roles cannot be deleted.");
    if (auth.community.getString("owner") !== e.auth.id && role.getInt("position") >= auth.highestRolePosition) {
      throw new ForbiddenError("You cannot delete this role.");
    }
    h.audit(tx, communityId, e.auth.id, "role.delete", "role", role.id, "", { name: role.getString("name") });
    tx.delete(role);
    require(`${__hooks}/lib/callAccess.js`).revokeUnauthorizedCommunityParticipants(
      tx,
      communityId,
      "",
      true,
      pendingCallControls,
    );
  });
  require(`${__hooks}/lib/callAccess.js`).dispatchPendingCallControls(
    e.app,
    pendingCallControls,
  );
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/thiscord/communities/{id}/roles/order", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const communityId = e.request.pathValue("id");
  const ids = Array.isArray(e.requestInfo().body.ids)
    ? Array.from(new Set(e.requestInfo().body.ids.map(String)))
    : [];
  e.app.runInTransaction((tx) => {
    const auth = h.requirePermission(tx, communityId, e.auth.id, "manage_roles");
    const records = ids.map((id) => tx.findRecordById("roles", id));
    if (records.some((record) => (
      record.getString("community") !== communityId
      || record.getBool("managed")
    ))) {
      throw new BadRequestError("Invalid role order.");
    }
    if (
      auth.community.getString("owner") !== e.auth.id
      && records.some((record) => record.getInt("position") >= auth.highestRolePosition)
    ) {
      throw new ForbiddenError("You cannot reorder this role.");
    }
    const maximum = auth.community.getString("owner") === e.auth.id
      ? 10_000
      : auth.highestRolePosition - 1;
    records.forEach((record, index) => {
      record.set("position", Math.max(1, Math.min(maximum, records.length - index)));
      tx.save(record);
    });
    h.audit(tx, communityId, e.auth.id, "role.reorder", "community", communityId, "", { ids });
  });
  return e.json(200, { ids });
}, $apis.requireAuth("users"));

}

module.exports = {
  registerRoles,
};
