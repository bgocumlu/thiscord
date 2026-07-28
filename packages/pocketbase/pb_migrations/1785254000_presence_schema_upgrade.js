/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const relatedCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;

  const clearRecords = (collection) => {
    while (true) {
      const records = app.findRecordsByFilter(collection, "", "", 200, 0);
      if (!records.length) return;
      for (const record of records) app.delete(record);
    }
  };

  const saveDefinition = (definition) => {
    const collection = new Collection(definition);
    collection.fields.add(new AutodateField({
      name: "created",
      onCreate: true,
      onUpdate: false,
    }));
    collection.fields.add(new AutodateField({
      name: "updated",
      onCreate: true,
      onUpdate: true,
    }));
    try {
      const existing = app.findCollectionByNameOrId(collection.name);
      const snapshot = JSON.parse(JSON.stringify(collection));
      snapshot.id = existing.id;
      app.importCollections([snapshot], false);
    } catch {
      app.save(collection);
    }
  };

  const users = app.findCollectionByNameOrId("users");
  users.listRule = "id = @request.auth.id";
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id && @request.body.preferences:isset = false && @request.body.status:isset = false";
  users.fields.add(new SelectField({
    name: "status",
    required: true,
    maxSelect: 1,
    values: ["online", "idle", "dnd", "offline"],
    hidden: true,
  }));
  users.fields.add(new JSONField({
    name: "preferences",
    maxSize: 32 * 1024,
    hidden: true,
  }));
  users.indexes = [
    ...users.indexes.filter((index) => !index.includes("idx_users_handle")),
    "CREATE UNIQUE INDEX idx_users_handle ON users (handle)",
  ];
  app.save(users);

  // Legacy presence rows are short-lived device leases. They cannot be
  // retained in the new one-row-per-account aggregate without guessing which
  // device won. Drop only this transient state; signed-in clients immediately
  // repopulate the aggregate through ordered leases.
  clearRecords("presence");
  const presence = app.findCollectionByNameOrId("presence");
  presence.listRule = "user = @request.auth.id";
  presence.viewRule = "user = @request.auth.id";
  presence.fields.removeByName("deviceId");
  presence.fields.removeByName("expiresAt");
  presence.fields.add(new SelectField({
    name: "status",
    required: true,
    maxSelect: 1,
    values: ["online", "idle", "dnd"],
  }));
  presence.indexes = [
    "CREATE UNIQUE INDEX idx_presence_user ON presence (user)",
  ];
  app.save(presence);

  const communities = app.findCollectionByNameOrId("communities");
  saveDefinition({
    type: "base",
    name: "community_presence",
    listRule: relatedCommunityMember,
    viewRule: relatedCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["online", "idle", "dnd"] },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_community_presence_pair ON community_presence (community, user)",
      "CREATE INDEX idx_community_presence_user ON community_presence (user)",
    ],
  });

  saveDefinition({
    type: "base",
    name: "presence_leases",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "leaseId", required: true, max: 120, hidden: true },
      { type: "number", name: "sequence", required: true, min: 1, onlyInt: true, hidden: true },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["online", "idle", "dnd", "offline"], hidden: true },
      { type: "date", name: "expiresAt", required: true, hidden: true },
      { type: "date", name: "closedAt", hidden: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_presence_leases_user_lease ON presence_leases (user, leaseId)",
      "CREATE INDEX idx_presence_leases_expires ON presence_leases (expiresAt)",
    ],
  });

  const callRooms = app.findCollectionByNameOrId("call_rooms");
  saveDefinition({
    type: "base",
    name: "call_presence_leases",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "room", required: true, maxSelect: 1, collectionId: callRooms.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "leaseId", required: true, max: 120, hidden: true },
      { type: "number", name: "sequence", required: true, min: 1, onlyInt: true, hidden: true },
      { type: "date", name: "expiresAt", required: true, hidden: true },
      { type: "date", name: "closedAt", hidden: true },
      { type: "select", name: "closedReason", maxSelect: 1, values: ["left", "expired", "revoked"], hidden: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_call_presence_leases_room_user_lease ON call_presence_leases (room, user, leaseId)",
      "CREATE INDEX idx_call_presence_leases_expires ON call_presence_leases (expiresAt)",
    ],
  });

  const callParticipants = app.findCollectionByNameOrId("call_participants");
  callParticipants.fields.add(new JSONField({
    name: "devices",
    maxSize: 16 * 1024,
    hidden: true,
  }));
  app.save(callParticipants);
}, (app) => {
  const authenticated = "@request.auth.id != ''";
  const clearRecords = (collection) => {
    while (true) {
      const records = app.findRecordsByFilter(collection, "", "", 200, 0);
      if (!records.length) return;
      for (const record of records) app.delete(record);
    }
  };

  for (const name of [
    "call_presence_leases",
    "presence_leases",
    "community_presence",
  ]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {
      // The interrupted migration did not create this collection.
    }
  }

  clearRecords("presence");
  const presence = app.findCollectionByNameOrId("presence");
  presence.listRule = authenticated;
  presence.viewRule = authenticated;
  presence.fields.add(new TextField({
    name: "deviceId",
    required: true,
    max: 120,
  }));
  presence.fields.add(new DateField({
    name: "expiresAt",
    required: true,
  }));
  presence.fields.add(new SelectField({
    name: "status",
    required: true,
    maxSelect: 1,
    values: ["online", "idle", "dnd", "offline"],
  }));
  presence.indexes = [
    "CREATE UNIQUE INDEX idx_presence_user_device ON presence (user, deviceId)",
    "CREATE INDEX idx_presence_expires ON presence (expiresAt)",
  ];
  app.save(presence);

  const users = app.findCollectionByNameOrId("users");
  users.listRule = authenticated;
  users.viewRule = authenticated;
  users.updateRule = "id = @request.auth.id && @request.body.preferences:isset = false";
  users.fields.add(new SelectField({
    name: "status",
    required: true,
    maxSelect: 1,
    values: ["online", "idle", "dnd", "offline"],
  }));
  app.save(users);

  const callParticipants = app.findCollectionByNameOrId("call_participants");
  callParticipants.fields.add(new JSONField({
    name: "devices",
    maxSize: 16 * 1024,
  }));
  app.save(callParticipants);
});
