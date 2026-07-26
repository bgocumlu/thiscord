/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const users = app.findCollectionByNameOrId("users");
  const messages = app.findCollectionByNameOrId("messages");
  const directMessages = app.findCollectionByNameOrId("direct_messages");
  const conversations = app.findCollectionByNameOrId("conversations");

  // Account deletion needs ordered cleanup and ownership transfer, so it is
  // intentionally available only through /api/thiscord/account.
  users.deleteRule = null;
  app.save(users);

  messages.fields.add(new BoolField({ name: "embedsEnabled" }));
  messages.indexes = [
    ...messages.indexes,
    "CREATE INDEX idx_messages_channel_author_created ON messages (channel, author, created DESC)",
  ];
  app.save(messages);

  directMessages.fields.add(new BoolField({ name: "embedsEnabled" }));
  directMessages.fields.add(new BoolField({ name: "pinned" }));
  app.save(directMessages);

  const directTyping = new Collection({
    type: "base",
    name: "direct_typing",
    listRule: `${authenticated} && @collection.conversation_members:auth.conversation ?= conversation && @collection.conversation_members:auth.user ?= @request.auth.id`,
    viewRule: `${authenticated} && @collection.conversation_members:auth.conversation ?= conversation && @collection.conversation_members:auth.user ?= @request.auth.id`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "conversation", required: true, maxSelect: 1, collectionId: conversations.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "date", name: "expiresAt", required: true },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_direct_typing_conversation_user ON direct_typing (conversation, user)",
      "CREATE INDEX idx_direct_typing_expires ON direct_typing (expiresAt)",
    ],
  });
  app.save(directTyping);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("direct_typing"));
  } catch {
    // The collection may not exist after a partial rollback.
  }

  const messages = app.findCollectionByNameOrId("messages");
  try {
    messages.fields.removeByName("embedsEnabled");
  } catch {
    // The field may not exist after a partial rollback.
  }
  messages.indexes = messages.indexes.filter((index) => !index.includes("idx_messages_channel_author_created"));
  app.save(messages);

  const directMessages = app.findCollectionByNameOrId("direct_messages");
  try {
    directMessages.fields.removeByName("embedsEnabled");
  } catch {
    // The field may not exist after a partial rollback.
  }
  try {
    directMessages.fields.removeByName("pinned");
  } catch {
    // The field may not exist after a partial rollback.
  }
  app.save(directMessages);

  const users = app.findCollectionByNameOrId("users");
  users.deleteRule = "id = @request.auth.id";
  app.save(users);
});
