/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  for (const name of ["typing", "direct_typing"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
}, (app) => {
  const authenticated = "@request.auth.id != ''";
  const channelCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const conversationMember = `${authenticated} && @collection.conversation_members:auth.conversation ?= conversation && @collection.conversation_members:auth.user ?= @request.auth.id`;
  const users = app.findCollectionByNameOrId("users");
  const channels = app.findCollectionByNameOrId("channels");
  const conversations = app.findCollectionByNameOrId("conversations");

  const typing = new Collection({
    type: "base",
    name: "typing",
    listRule: channelCommunityMember,
    viewRule: channelCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "channel", required: true, maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "date", name: "expiresAt", required: true },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_typing_channel_user ON typing (channel, user)",
      "CREATE INDEX idx_typing_expires ON typing (expiresAt)",
    ],
  });
  app.save(typing);

  const directTyping = new Collection({
    type: "base",
    name: "direct_typing",
    listRule: conversationMember,
    viewRule: conversationMember,
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
});
