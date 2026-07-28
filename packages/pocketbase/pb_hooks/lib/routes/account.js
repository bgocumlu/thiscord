function registerAccount() {
routerAdd("GET", "/api/thiscord/account/preferences", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const user = e.app.findRecordById("users", e.auth.id);
  return e.json(200, { preferences: h.recordPreferences(user) });
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/api/thiscord/account/preferences", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const patch = e.requestInfo().body.preferences;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new BadRequestError("Invalid preferences.");
  }
  const allowed = new Set([
    "theme",
    "compactMode",
    "reduceMotion",
    "notificationSound",
    "mutedChannels",
    "mutedConversations",
  ]);
  if (Object.keys(patch).some((key) => !allowed.has(key))) {
    throw new BadRequestError("Invalid preference field.");
  }
  if (patch.theme !== undefined && !["dark", "light", "system"].includes(String(patch.theme))) {
    throw new BadRequestError("Invalid theme preference.");
  }
  for (const key of ["compactMode", "reduceMotion", "notificationSound"]) {
    if (patch[key] !== undefined && typeof patch[key] !== "boolean") {
      throw new BadRequestError(`Invalid ${key} preference.`);
    }
  }
  for (const key of ["mutedChannels", "mutedConversations"]) {
    if (
      patch[key] !== undefined
      && (
        !Array.isArray(patch[key])
        || patch[key].length > 1_000
        || patch[key].some((id) => typeof id !== "string" || !id || id.length > 32)
      )
    ) throw new BadRequestError(`Invalid ${key} preference.`);
  }
  let user;
  let preferences;
  e.app.runInTransaction((tx) => {
    user = tx.findRecordById("users", e.auth.id);
    const current = h.recordPreferences(user);
    preferences = { ...current, ...patch };
    for (const key of ["mutedChannels", "mutedConversations"]) {
      if (Array.isArray(preferences[key])) {
        preferences[key] = Array.from(new Set(preferences[key].map(String)));
      }
    }
    user.set("preferences", preferences);
    tx.save(user);
  });
  return e.json(200, { preferences });
}, $apis.requireAuth("users"), $apis.bodyLimit(64 * 1024));

routerAdd("DELETE", "/api/thiscord/account", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const calls = require(`${__hooks}/lib/callAccess.js`);
  const userId = e.auth.id;
  const pendingCallControls = [];
  e.app.runInTransaction((tx) => {
    const user = tx.findRecordById("users", userId);

    // Communities owned by the account are private data under that account's
    // control and are removed with their channels and related records.
    const ownedCommunities = h.findAllRecordsByFilter(
      tx,
      "communities",
      "owner = {:user}",
      "",
      { user: userId },
    );
    for (const community of ownedCommunities) {
      calls.revokeCommunityParticipants(tx, community.id, true, pendingCallControls);
    }

    // A two-person direct conversation is no longer meaningful when either
    // participant leaves. Groups remain and transfer ownership if needed.
    const conversationMemberships = h.findAllRecordsByFilter(
      tx,
      "conversation_members",
      "user = {:user}",
      "",
      { user: userId },
    );
    for (const membership of conversationMemberships) {
      const conversation = tx.findRecordById(
        "conversations",
        membership.getString("conversation"),
      );
      if (conversation.getString("kind") === "direct") {
        calls.revokeTargetParticipants(
          tx,
          { kind: "conversation", id: conversation.id },
          true,
          pendingCallControls,
        );
      }
    }
    calls.revokeUserParticipants(tx, userId, true, pendingCallControls);
    for (const community of ownedCommunities) tx.delete(community);

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
          "+created,+id",
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
      h.deleteRecordsByFilter(tx, collection, "author = {:user}", { user: userId });
    }

    h.deleteRecordsByFilter(tx, "invites", "creator = {:user}", { user: userId });

    const moderatedBans = h.findAllRecordsByFilter(
      tx,
      "bans",
      "moderator = {:user}",
      "",
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

    const startedCalls = h.findAllRecordsByFilter(
      tx,
      "call_sessions",
      "startedBy = {:user}",
      "",
      { user: userId },
    );
    for (const call of startedCalls) {
      try {
        const target = require(`${__hooks}/lib/callAccess.js`).targetForRecord(tx, call).target;
        const nextOwner = target.kind === "channel"
          ? tx.findRecordById(
            "communities",
            tx.findRecordById("channels", target.id).getString("community"),
          ).getString("owner")
          : tx.findRecordById("conversations", target.id).getString("owner");
        call.set("startedBy", nextOwner);
        if (!call.getString("endedAt")) {
          const remainingParticipants = tx.findRecordsByFilter(
            "call_participants",
            "call = {:call} && user != {:user} && leftAt = '' && expiresAt > {:now}",
            "",
            1,
            0,
            {
              call: call.id,
              user: userId,
              now: h.databaseDate(),
            },
          );
          if (!remainingParticipants.length) call.set("endedAt", new Date().toISOString());
        }
        tx.save(call);
      } catch {
        tx.delete(call);
      }
    }

    for (const collection of ["audit_events", "notifications"]) {
      const records = h.findAllRecordsByFilter(
        tx,
        collection,
        "actor = {:user}",
        "",
        { user: userId },
      );
      for (const record of records) {
        record.set("actor", "");
        tx.save(record);
      }
    }

    tx.delete(user);
  });
  calls.dispatchPendingCallControls(e.app, pendingCallControls);
  return e.noContent(204);
}, $apis.requireAuth("users"));

}

module.exports = {
  registerAccount,
};
