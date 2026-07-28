const policies = require(`${__hooks}/lib/policies.generated.js`);
const {
  ALL_PERMISSIONS,
  CHANNEL_CAPABILITIES,
  CHANNEL_KINDS,
  DEFAULT_MEMBER_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  PERMISSION_GROUPS,
  PERMISSION_IMPLICATIONS,
  PERMISSION_RESTRICTIONS,
  POLICY_LIMITS,
  POLICY_MANIFEST,
  TRANSIENT_TIMINGS,
} = policies;

function findAllRecordsByFilter(app, collection, filter, sort = "", params = {}, batchSize = 200) {
  const records = [];
  let offset = 0;
  while (true) {
    const batch = app.findRecordsByFilter(
      collection,
      filter,
      sort,
      batchSize,
      offset,
      params,
    );
    records.push(...batch);
    if (batch.length < batchSize) return records;
    offset += batch.length;
  }
}

function databaseDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new BadRequestError("Invalid date.");
  return date.toISOString().replace("T", " ");
}

function recordPreferences(record) {
  let preferences = record?.get("preferences") || {};
  try {
    if (typeof preferences?.string === "function") {
      preferences = JSON.parse(preferences.string());
    } else if (typeof preferences === "string") {
      preferences = JSON.parse(preferences);
    }
  } catch {
    preferences = {};
  }
  return preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? preferences
    : {};
}

function findAuthorizedPage(
  app,
  collection,
  filter,
  sort,
  params,
  page,
  perPage,
  authorize,
  batchSize = 200,
) {
  const start = (page - 1) * perPage;
  const authorized = [];
  let authorizedSeen = 0;
  let offset = 0;
  let exhausted = false;
  while (!exhausted && authorized.length <= perPage) {
    const batch = app.findRecordsByFilter(
      collection,
      filter,
      sort,
      batchSize,
      offset,
      params,
    );
    exhausted = batch.length < batchSize;
    offset += batch.length;
    for (const record of batch) {
      if (!authorize(record)) continue;
      if (authorizedSeen >= start) authorized.push(record);
      authorizedSeen += 1;
      if (authorized.length > perPage) break;
    }
    if (!batch.length) break;
  }
  return {
    items: authorized.slice(0, perPage),
    hasMore: authorized.length > perPage,
  };
}

function countRecordsByFilter(app, collection, filter, params = {}, batchSize = 500) {
  let count = 0;
  let offset = 0;
  while (true) {
    const batch = app.findRecordsByFilter(
      collection,
      filter,
      "",
      batchSize,
      offset,
      params,
    );
    count += batch.length;
    if (batch.length < batchSize) return count;
    offset += batch.length;
  }
}

function deleteRecordsByFilter(app, collection, filter, params = {}, batchSize = 200) {
  let deleted = 0;
  while (true) {
    const batch = app.findRecordsByFilter(collection, filter, "", batchSize, 0, params);
    if (!batch.length) return deleted;
    for (const record of batch) app.delete(record);
    deleted += batch.length;
  }
}

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
  const assignments = findAllRecordsByFilter(
    app,
    "member_roles",
    "membership = {:membership}",
    "",
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
  const overwrites = findAllRecordsByFilter(
    app,
    "channel_permissions",
    "channel = {:channel}",
    "+created",
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

  const assigned = findAllRecordsByFilter(
    app,
    "member_roles",
    "membership = {:membership}",
    "",
    { membership: membership.id },
  );
  const assignedIds = assigned.map((item) => item.getString("role"));
  const roles = findAllRecordsByFilter(
    app,
    "roles",
    "community = {:community}",
    "+position",
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
      for (const permission of PERMISSION_RESTRICTIONS.hiddenChannelRemoves) granted.delete(permission);
    }
  }

  const timeoutUntil = membership.getString("timeoutUntil");
  if (timeoutUntil && new Date(timeoutUntil).getTime() > Date.now()) {
    for (const permission of PERMISSION_RESTRICTIONS.timeoutRemoves) granted.delete(permission);
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

function fileRequestAuth(e) {
  if (e.auth) return e.auth;
  try {
    const token = String(e.requestInfo().query.token || "");
    return token ? e.app.findAuthRecordByToken(token, "file") : null;
  } catch {
    return null;
  }
}

function isSuperuserRecord(record) {
  return Boolean(record && record.collection().name === "_superusers");
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
  if (!name || name.length > POLICY_LIMITS.channel.nameMax) throw new BadRequestError("Invalid channel name.");
  return name;
}

function assertChannelWriteFields(body, capabilities, creating) {
  const settings = capabilities.settingsFields || [];
  const supplied = (field) => Object.prototype.hasOwnProperty.call(body, field);
  for (const field of ["topic", "parent", "slowmodeSeconds", "nsfw"]) {
    if (supplied(field) && !settings.includes(field)) {
      throw new BadRequestError(`The ${field} field is not supported by this channel type.`);
    }
  }
  const immutable = creating ? ["community", "position"] : ["community", "kind", "position"];
  if (immutable.some(supplied)) {
    throw new BadRequestError("Channel identity and position use dedicated routes.");
  }
}

function normalizeSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (
    slug.length < POLICY_LIMITS.community.slugMin
    || slug.length > POLICY_LIMITS.community.slugMax
  ) throw new BadRequestError("Invalid community slug.");
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

function recordComesAfter(candidate, current) {
  if (!current) return true;
  const candidateCreated = candidate.getString("created");
  const currentCreated = current.getString("created");
  return candidateCreated > currentCreated
    || (candidateCreated === currentCreated && candidate.id > current.id);
}

function bumpCommunityAccessRevision(app, communityOrId) {
  const community = typeof communityOrId === "string"
    ? app.findRecordById("communities", communityOrId)
    : communityOrId;
  community.set("accessRevision", community.getInt("accessRevision") + 1);
  app.save(community);
  return community;
}

function publicFileUrl(baseUrl, record, filename, thumb) {
  if (!baseUrl || !filename) return "";
  let url = `${baseUrl.replace(/\/$/, "")}/api/files/${record.collection().id}/${record.id}/${filename}`;
  if (thumb) url += `?thumb=${encodeURIComponent(thumb)}`;
  return url;
}

module.exports = {
  ALL_PERMISSIONS,
  CHANNEL_CAPABILITIES,
  CHANNEL_KINDS,
  DEFAULT_MEMBER_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  PERMISSION_GROUPS,
  PERMISSION_IMPLICATIONS,
  PERMISSION_RESTRICTIONS,
  POLICY_LIMITS,
  POLICY_MANIFEST,
  TRANSIENT_TIMINGS,
  activeMembership,
  assertCanManageMembership,
  audit,
  bumpCommunityAccessRevision,
  channelContext,
  communityPermissions,
  countRecordsByFilter,
  conversationMembership,
  databaseDate,
  deleteRecordsByFilter,
  fileRequestAuth,
  findAllRecordsByFilter,
  findAuthorizedPage,
  isSuperuserRecord,
  jsonArray,
  normalizeChannelName,
  assertChannelWriteFields,
  normalizeName,
  normalizeSlug,
  optionalText,
  publicFileUrl,
  recordComesAfter,
  recordPreferences,
  requirePermission,
  requiredText,
  validateGrantedPermissions,
};
