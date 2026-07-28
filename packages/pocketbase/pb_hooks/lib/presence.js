const permissions = require(`${__hooks}/lib/permissions.js`);

const STATUS_PRIORITY = ["dnd", "online", "idle"];

function activeLeases(app, userId, now = new Date().toISOString()) {
  return permissions.findAllRecordsByFilter(
    app,
    "presence_leases",
    "user = {:user} && closedAt = '' && status != 'offline' && expiresAt > {:now}",
    "",
    { user: userId, now: permissions.databaseDate(now) },
  );
}

function aggregateStatus(leases) {
  for (const status of STATUS_PRIORITY) {
    if (leases.some((lease) => lease.getString("status") === status)) return status;
  }
  return "offline";
}

function findAggregate(app, userId) {
  try {
    return app.findFirstRecordByFilter("presence", "user = {:user}", { user: userId });
  } catch {
    return null;
  }
}

function syncCommunityPresence(app, userId, status) {
  const memberships = permissions.findAllRecordsByFilter(
    app,
    "memberships",
    "user = {:user} && state = 'active'",
    "",
    { user: userId },
  );
  const desired = new Set(memberships.map((membership) => membership.getString("community")));
  const existing = permissions.findAllRecordsByFilter(
    app,
    "community_presence",
    "user = {:user}",
    "",
    { user: userId },
  );
  const existingByCommunity = new Map(
    existing.map((record) => [record.getString("community"), record]),
  );
  for (const record of existing) {
    if (status === "offline" || !desired.has(record.getString("community"))) {
      app.delete(record);
    }
  }
  if (status === "offline") return;
  for (const communityId of desired) {
    const current = existingByCommunity.get(communityId);
    if (current) {
      if (current.getString("status") !== status) {
        current.set("status", status);
        app.save(current);
      }
      continue;
    }
    const created = new Record(app.findCollectionByNameOrId("community_presence"));
    created.set("community", communityId);
    created.set("user", userId);
    created.set("status", status);
    app.save(created);
  }
}

function syncUserPresence(app, userId, now = new Date().toISOString()) {
  const status = aggregateStatus(activeLeases(app, userId, now));
  const aggregate = findAggregate(app, userId);
  if (status !== "offline") {
    if (!aggregate) {
      const created = new Record(app.findCollectionByNameOrId("presence"));
      created.set("user", userId);
      created.set("status", status);
      app.save(created);
    } else if (aggregate.getString("status") !== status) {
      aggregate.set("status", status);
      app.save(aggregate);
    }
    syncCommunityPresence(app, userId, status);
    return status;
  }
  syncCommunityPresence(app, userId, status);
  if (aggregate) {
    app.delete(aggregate);
    const user = app.findRecordById("users", userId);
    user.set("lastSeenAt", now);
    app.save(user);
  }
  return status;
}

module.exports = {
  activeLeases,
  aggregateStatus,
  syncCommunityPresence,
  syncUserPresence,
};
