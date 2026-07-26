const ALL_PERMISSIONS = [
  "administrator",
  "manage_community",
  "manage_channels",
  "manage_roles",
  "manage_messages",
  "manage_members",
  "view_audit_log",
  "create_invites",
  "view_channels",
  "send_messages",
  "read_history",
  "add_reactions",
  "attach_files",
  "embed_links",
  "mention_everyone",
  "connect_voice",
  "speak",
  "stream_video",
  "mute_members",
];

const DEFAULT_MEMBER_PERMISSIONS = [
  "create_invites",
  "view_channels",
  "send_messages",
  "read_history",
  "add_reactions",
  "attach_files",
  "embed_links",
  "connect_voice",
  "speak",
  "stream_video",
];

function jsonArray(record, field) {
  const value = record.get(field);
  if (Array.isArray(value)) {
    if (value.length && value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
      try {
        const decoded = value.map((item) => String.fromCharCode(item)).join("");
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return [];
      }
    }
    return value.map(String);
  }
  if (value === null || value === undefined || value === "") return [];

  const candidates = [];
  if (typeof value === "string") candidates.push(value);
  try {
    candidates.push(String(value));
  } catch {
    // Go-backed dynamic values may reject JavaScript string coercion.
  }
  try {
    candidates.push(record.getString(field));
  } catch {
    // Some PocketBase field types don't support string coercion.
  }
  try {
    candidates.push(JSON.stringify(value));
  } catch {
    // Circular values cannot be serialized.
  }
  for (const candidate of candidates) {
    if (!candidate || candidate === "[object Object]") continue;
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        if (parsed.length && parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
          const decoded = parsed.map((item) => String.fromCharCode(item)).join("");
          const decodedArray = JSON.parse(decoded);
          if (Array.isArray(decodedArray)) return decodedArray.map(String);
        }
        return parsed.map(String);
      }
    } catch {
      // Try the next supported representation.
    }
  }
  return [];
}

function rolePosition(app, membershipId) {
  const assignments = app.findRecordsByFilter(
    "member_roles",
    "membership = {:membership}",
    "",
    200,
    0,
    { membership: membershipId },
  );
  if (!assignments.length) return 0;
  const roles = assignments.map((assignment) => app.findRecordById("roles", assignment.getString("role")));
  return Math.max(0, ...roles.map((role) => role.getInt("position")));
}

function assertCanManageMembership(app, auth, targetMembership, action) {
  const targetUserId = targetMembership.getString("user");
  if (targetUserId === auth.community.getString("owner")) {
    throw new ForbiddenError(`You cannot ${action} the community owner.`);
  }
  if (auth.community.getString("owner") === auth.membership.getString("user")) return;
  const targetPosition = rolePosition(app, targetMembership.id);
  if (targetPosition >= auth.highestRolePosition) {
    throw new ForbiddenError(`You cannot ${action} a member with an equal or higher role.`);
  }
}

function validateGrantedPermissions(auth, requested, options) {
  const allowAdministrator = Boolean(options && options.allowAdministrator);
  const normalized = Array.from(new Set(requested.map(String)))
    .filter((permission) => ALL_PERMISSIONS.includes(permission));
  const isOwner = auth.community.getString("owner") === auth.membership.getString("user");
  const isAdministrator = auth.permissions.includes("administrator");
  for (const permission of normalized) {
    if (permission === "administrator" && !allowAdministrator) {
      throw new ForbiddenError("Administrator cannot be granted through a channel override.");
    }
    if (!isOwner && !isAdministrator && !auth.permissions.includes(permission)) {
      throw new ForbiddenError(`You cannot grant a permission you do not have: ${permission}.`);
    }
  }
  return normalized;
}

function applyOverwrite(granted, overwrite) {
  for (const permission of jsonArray(overwrite, "deny")) granted.delete(permission);
  for (const permission of jsonArray(overwrite, "allow")) {
    if (ALL_PERMISSIONS.includes(permission) && permission !== "administrator") granted.add(permission);
  }
}

function applyChannelLayer(app, granted, channelId, roles, membership) {
  if (!channelId) return;
  const overwrites = app.findRecordsByFilter(
    "channel_permissions",
    "channel = {:channel}",
    "+created",
    500,
    0,
    { channel: channelId },
  );
  if (!overwrites.length) return;

  const roleIds = new Set(roles.map((role) => role.id));
  const everyone = roles.find((role) => role.getBool("managed") && role.getInt("position") === 0);
  if (everyone) {
    const everyoneOverwrite = overwrites.find((overwrite) => (
      overwrite.getString("targetType") === "role"
      && overwrite.getString("targetId") === everyone.id
    ));
    if (everyoneOverwrite) applyOverwrite(granted, everyoneOverwrite);
  }

  const roleOverwrites = overwrites.filter((overwrite) => (
    overwrite.getString("targetType") === "role"
    && overwrite.getString("targetId") !== (everyone ? everyone.id : "")
    && roleIds.has(overwrite.getString("targetId"))
  ));
  const roleDeny = new Set();
  const roleAllow = new Set();
  for (const overwrite of roleOverwrites) {
    for (const permission of jsonArray(overwrite, "deny")) roleDeny.add(permission);
    for (const permission of jsonArray(overwrite, "allow")) roleAllow.add(permission);
  }
  for (const permission of roleDeny) granted.delete(permission);
  for (const permission of roleAllow) {
    if (ALL_PERMISSIONS.includes(permission) && permission !== "administrator") granted.add(permission);
  }

  const memberOverwrite = overwrites.find((overwrite) => (
    overwrite.getString("targetType") === "member"
    && overwrite.getString("targetId") === membership.id
  ));
  if (memberOverwrite) applyOverwrite(granted, memberOverwrite);
}

function findMembership(app, communityId, userId) {
  return app.findFirstRecordByFilter(
    "memberships",
    "community = {:community} && user = {:user} && state = 'active'",
    { community: communityId, user: userId },
  );
}

function activeMembership(app, communityId, userId) {
  try {
    return findMembership(app, communityId, userId);
  } catch {
    throw new ForbiddenError("You are not an active member of this community.");
  }
}

function communityPermissions(app, communityId, userId, channelId) {
  const community = app.findRecordById("communities", communityId);
  const membership = activeMembership(app, communityId, userId);
  if (community.getString("owner") === userId) {
    return {
      community,
      membership,
      permissions: ALL_PERMISSIONS.slice(),
      roleIds: [],
      highestRolePosition: Number.MAX_SAFE_INTEGER,
    };
  }

  const assigned = app.findRecordsByFilter(
    "member_roles",
    "membership = {:membership}",
    "",
    200,
    0,
    { membership: membership.id },
  );
  const assignedIds = assigned.map((item) => item.getString("role"));
  const roles = app.findRecordsByFilter(
    "roles",
    "community = {:community}",
    "+position",
    200,
    0,
    { community: communityId },
  ).filter((role) => role.getBool("managed") || assignedIds.includes(role.id));

  const granted = new Set();
  for (const role of roles) {
    for (const permission of jsonArray(role, "permissions")) {
      if (ALL_PERMISSIONS.includes(permission)) granted.add(permission);
    }
  }

  if (granted.has("administrator")) {
    return {
      community,
      membership,
      permissions: ALL_PERMISSIONS.slice(),
      roleIds: roles.map((role) => role.id),
      highestRolePosition: Math.max(0, ...roles.map((role) => role.getInt("position"))),
    };
  }

  if (channelId) {
    const channel = app.findRecordById("channels", channelId);
    const parentId = channel.getString("parent");
    if (parentId) applyChannelLayer(app, granted, parentId, roles, membership);
    applyChannelLayer(app, granted, channelId, roles, membership);

    // A hidden channel cannot be used through a separately allowed action.
    if (!granted.has("view_channels")) {
      for (const permission of [
        "send_messages",
        "read_history",
        "add_reactions",
        "attach_files",
        "embed_links",
        "mention_everyone",
        "connect_voice",
        "speak",
        "stream_video",
      ]) granted.delete(permission);
    }
  }

  const timeoutUntil = membership.getString("timeoutUntil");
  if (timeoutUntil && new Date(timeoutUntil).getTime() > Date.now()) {
    for (const permission of [
      "send_messages",
      "add_reactions",
      "attach_files",
      "embed_links",
      "mention_everyone",
      "connect_voice",
      "speak",
      "stream_video",
    ]) granted.delete(permission);
  }

  return {
    community,
    membership,
    permissions: Array.from(granted),
    roleIds: roles.map((role) => role.id),
    highestRolePosition: Math.max(0, ...roles.map((role) => role.getInt("position"))),
  };
}

function requirePermission(app, communityId, userId, permission, channelId) {
  const context = communityPermissions(app, communityId, userId, channelId);
  if (!context.permissions.includes(permission) && !context.permissions.includes("administrator")) {
    throw new ForbiddenError(`Missing permission: ${permission}.`);
  }
  return context;
}

function channelContext(app, channelId, userId, permission) {
  const channel = app.findRecordById("channels", channelId);
  const communityId = channel.getString("community");
  const auth = permission
    ? requirePermission(app, communityId, userId, permission, channelId)
    : communityPermissions(app, communityId, userId, channelId);
  return { channel, communityId, auth };
}

function conversationMembership(app, conversationId, userId) {
  try {
    return app.findFirstRecordByFilter(
      "conversation_members",
      "conversation = {:conversation} && user = {:user}",
      { conversation: conversationId, user: userId },
    );
  } catch {
    throw new ForbiddenError("You are not a member of this conversation.");
  }
}

function audit(app, communityId, actorId, action, targetType, targetId, reason, metadata) {
  const record = new Record(app.findCollectionByNameOrId("audit_events"));
  record.set("community", communityId);
  record.set("actor", actorId || "");
  record.set("action", action);
  record.set("targetType", targetType || "");
  record.set("targetId", targetId || "");
  record.set("reason", reason || "");
  record.set("metadata", metadata || {});
  app.save(record);
  return record;
}

function normalizeName(value, max) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name || name.length > max) throw new BadRequestError("Invalid name.");
  return name;
}

function normalizeChannelName(value) {
  const name = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!name || name.length > 100) throw new BadRequestError("Invalid channel name.");
  return name;
}

function normalizeSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length < 2 || slug.length > 80) throw new BadRequestError("Invalid community slug.");
  return slug;
}

function requiredText(value, field, max) {
  const result = String(value || "").trim();
  if (!result || result.length > max) throw new BadRequestError(`Invalid ${field}.`);
  return result;
}

function optionalText(value, max) {
  const result = String(value || "").trim();
  if (result.length > max) throw new BadRequestError("Text is too long.");
  return result;
}

function publicFileUrl(baseUrl, record, filename, thumb) {
  if (!filename) return "";
  let url = `${baseUrl.replace(/\/$/, "")}/api/files/${record.collection().id}/${record.id}/${filename}`;
  if (thumb) url += `?thumb=${encodeURIComponent(thumb)}`;
  return url;
}

module.exports = {
  ALL_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
  activeMembership,
  assertCanManageMembership,
  audit,
  channelContext,
  communityPermissions,
  conversationMembership,
  jsonArray,
  normalizeChannelName,
  normalizeName,
  normalizeSlug,
  optionalText,
  publicFileUrl,
  requirePermission,
  requiredText,
  validateGrantedPermissions,
};
