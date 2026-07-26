/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const conversationMember = `${authenticated} && @collection.conversation_members:auth.conversation ?= message.conversation && @collection.conversation_members:auth.user ?= @request.auth.id`;

  const directMessages = app.findCollectionByNameOrId("direct_messages");
  const conversationMembers = app.findCollectionByNameOrId("conversation_members");
  conversationMembers.fields.add(new DateField({ name: "lastReadAt" }));
  conversationMembers.fields.add(new RelationField({
    name: "lastMessage",
    maxSelect: 1,
    collectionId: directMessages.id,
    cascadeDelete: false,
  }));
  app.save(conversationMembers);

  const callParticipants = app.findCollectionByNameOrId("call_participants");
  callParticipants.fields.add(new DateField({ name: "expiresAt" }));
  callParticipants.indexes = [
    ...callParticipants.indexes,
    "CREATE INDEX idx_call_participants_expires ON call_participants (expiresAt)",
  ];
  app.save(callParticipants);

  const directReactions = new Collection({
    type: "base",
    name: "direct_reactions",
    listRule: conversationMember,
    viewRule: conversationMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "message", required: true, maxSelect: 1, collectionId: directMessages.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: app.findCollectionByNameOrId("users").id, cascadeDelete: true },
      { type: "text", name: "emoji", required: true, max: 64 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_direct_reactions_unique ON direct_reactions (message, user, emoji)",
      "CREATE INDEX idx_direct_reactions_message ON direct_reactions (message)",
    ],
  });
  app.save(directReactions);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("direct_reactions"));
  } catch {
    // The collection may not exist after a partial rollback.
  }
  const conversationMembers = app.findCollectionByNameOrId("conversation_members");
  for (const field of ["lastMessage", "lastReadAt"]) {
    try {
      conversationMembers.fields.removeByName(field);
    } catch {
      // Ignore fields already removed.
    }
  }
  app.save(conversationMembers);

  const callParticipants = app.findCollectionByNameOrId("call_participants");
  try {
    callParticipants.fields.removeByName("expiresAt");
  } catch {
    // Ignore fields already removed.
  }
  callParticipants.indexes = callParticipants.indexes.filter((index) => !index.includes("idx_call_participants_expires"));
  app.save(callParticipants);
});
