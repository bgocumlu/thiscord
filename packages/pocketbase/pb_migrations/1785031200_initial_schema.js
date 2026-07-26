/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const communityMember = `${authenticated} && @collection.memberships:auth.community ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const relatedCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const channelCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const conversationMember = `${authenticated} && @collection.conversation_members:auth.conversation ?= conversation && @collection.conversation_members:auth.user ?= @request.auth.id`;
  const saveCollection = (collection) => {
    if (!collection.fields.getByName("created")) {
      collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
      collection.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
    }
    app.save(collection);
  };

  // PocketBase initializes a users auth collection on first boot. Extend that
  // canonical collection so a clean install and an existing install behave alike.
  const users = app.findCollectionByNameOrId("users");
  users.listRule = authenticated;
  users.viewRule = authenticated;
  users.createRule = "";
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = "id = @request.auth.id";
  users.authRule = "";
  users.fields.add(new TextField({
    name: "handle",
    required: true,
    min: 2,
    max: 32,
    pattern: "^[a-z0-9._-]+$",
    presentable: true,
  }));
  users.fields.add(new TextField({ name: "displayName", required: true, min: 1, max: 80, presentable: true }));
  users.fields.add(new TextField({ name: "bio", max: 500 }));
  users.fields.add(new SelectField({
    name: "status",
    required: true,
    maxSelect: 1,
    values: ["online", "idle", "dnd", "offline"],
  }));
  users.fields.add(new TextField({ name: "customStatus", max: 120 }));
  users.fields.add(new DateField({ name: "lastSeenAt" }));
  users.fields.add(new JSONField({ name: "preferences", maxSize: 32 * 1024 }));
  users.indexes = [...users.indexes, "CREATE UNIQUE INDEX idx_users_handle ON users (handle)"];
  users.passwordAuth.enabled = true;
  users.passwordAuth.identityFields = ["email", "handle"];
  saveCollection(users);

  const communities = new Collection({
    type: "base",
    name: "communities",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, min: 1, max: 100, presentable: true },
      { type: "text", name: "slug", required: true, min: 2, max: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      { type: "text", name: "description", max: 1000 },
      { type: "file", name: "icon", maxSelect: 1, maxSize: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
      { type: "file", name: "banner", maxSelect: 1, maxSize: 10 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { type: "relation", name: "owner", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "json", name: "settings", maxSize: 32 * 1024 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_communities_slug ON communities (LOWER(slug))",
      "CREATE INDEX idx_communities_owner ON communities (owner)",
    ],
  });
  saveCollection(communities);

  const memberships = new Collection({
    type: "base",
    name: "memberships",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "nickname", max: 80 },
      { type: "select", name: "state", required: true, maxSelect: 1, values: ["active", "pending", "banned", "left"] },
      { type: "date", name: "joinedAt", required: true },
      { type: "date", name: "timeoutUntil" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_memberships_community_user ON memberships (community, user)",
      "CREATE INDEX idx_memberships_user_state ON memberships (user, state)",
    ],
  });
  saveCollection(memberships);
  communities.listRule = communityMember;
  communities.viewRule = communityMember;
  saveCollection(communities);
  memberships.listRule = relatedCommunityMember;
  memberships.viewRule = relatedCommunityMember;
  saveCollection(memberships);

  const roles = new Collection({
    type: "base",
    name: "roles",
    listRule: relatedCommunityMember,
    viewRule: relatedCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "text", name: "name", required: true, max: 80, presentable: true },
      { type: "text", name: "color", max: 20 },
      { type: "number", name: "position", min: 0, onlyInt: true },
      { type: "json", name: "permissions", maxSize: 16 * 1024 },
      { type: "bool", name: "hoist" },
      { type: "bool", name: "mentionable" },
      { type: "bool", name: "managed" },
    ],
    indexes: [
      "CREATE INDEX idx_roles_community_position ON roles (community, position)",
    ],
  });
  saveCollection(roles);

  const memberRoles = new Collection({
    type: "base",
    name: "member_roles",
    listRule: `${authenticated} && @collection.memberships:viewer.community ?= membership.community && @collection.memberships:viewer.user ?= @request.auth.id && @collection.memberships:viewer.state ?= 'active'`,
    viewRule: `${authenticated} && @collection.memberships:viewer.community ?= membership.community && @collection.memberships:viewer.user ?= @request.auth.id && @collection.memberships:viewer.state ?= 'active'`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "membership", required: true, maxSelect: 1, collectionId: memberships.id, cascadeDelete: true },
      { type: "relation", name: "role", required: true, maxSelect: 1, collectionId: roles.id, cascadeDelete: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_member_roles_pair ON member_roles (membership, role)",
    ],
  });
  saveCollection(memberRoles);

  const channels = new Collection({
    type: "base",
    name: "channels",
    listRule: relatedCommunityMember,
    viewRule: relatedCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "text", name: "name", required: true, min: 1, max: 100, presentable: true },
      { type: "text", name: "topic", max: 1024 },
      { type: "select", name: "kind", required: true, maxSelect: 1, values: ["category", "text", "announcement", "voice"] },
      { type: "number", name: "position", min: 0, onlyInt: true },
      { type: "bool", name: "nsfw" },
      { type: "number", name: "slowmodeSeconds", min: 0, max: 21600, onlyInt: true },
      { type: "text", name: "jitsiRoom", max: 160 },
    ],
    indexes: [
      "CREATE INDEX idx_channels_community_position ON channels (community, position)",
    ],
  });
  saveCollection(channels);
  channels.fields.add(new RelationField({
    name: "parent",
    maxSelect: 1,
    collectionId: channels.id,
    cascadeDelete: false,
  }));
  saveCollection(channels);

  const channelPermissions = new Collection({
    type: "base",
    name: "channel_permissions",
    listRule: `${authenticated} && @collection.memberships:auth.community ?= channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    viewRule: `${authenticated} && @collection.memberships:auth.community ?= channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "channel", required: true, maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "select", name: "targetType", required: true, maxSelect: 1, values: ["role", "member"] },
      { type: "text", name: "targetId", required: true, max: 32 },
      { type: "json", name: "allow", maxSize: 16 * 1024 },
      { type: "json", name: "deny", maxSize: 16 * 1024 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_channel_permissions_target ON channel_permissions (channel, targetType, targetId)",
    ],
  });
  saveCollection(channelPermissions);

  const messages = new Collection({
    type: "base",
    name: "messages",
    listRule: channelCommunityMember,
    viewRule: channelCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "channel", required: true, maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "author", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "content", max: 4000 },
      { type: "file", name: "attachments", maxSelect: 10, maxSize: 25 * 1024 * 1024 },
      { type: "date", name: "editedAt" },
      { type: "date", name: "deletedAt" },
      { type: "bool", name: "pinned" },
    ],
    indexes: [
      "CREATE INDEX idx_messages_channel_created ON messages (channel, created DESC)",
      "CREATE INDEX idx_messages_author_created ON messages (author, created DESC)",
    ],
  });
  saveCollection(messages);
  messages.fields.add(new RelationField({
    name: "replyTo",
    maxSelect: 1,
    collectionId: messages.id,
    cascadeDelete: false,
  }));
  saveCollection(messages);

  const reactions = new Collection({
    type: "base",
    name: "reactions",
    listRule: `${authenticated} && @collection.memberships:auth.community ?= message.channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    viewRule: `${authenticated} && @collection.memberships:auth.community ?= message.channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "message", required: true, maxSelect: 1, collectionId: messages.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "emoji", required: true, min: 1, max: 64 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_reactions_message_user_emoji ON reactions (message, user, emoji)",
      "CREATE INDEX idx_reactions_message ON reactions (message)",
    ],
  });
  saveCollection(reactions);

  const readStates = new Collection({
    type: "base",
    name: "read_states",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "relation", name: "channel", required: true, maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "lastMessage", maxSelect: 1, collectionId: messages.id, cascadeDelete: false },
      { type: "date", name: "lastReadAt", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_read_states_user_channel ON read_states (user, channel)",
    ],
  });
  saveCollection(readStates);

  const invites = new Collection({
    type: "base",
    name: "invites",
    listRule: relatedCommunityMember,
    viewRule: `${relatedCommunityMember} || code = @request.query.code`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "creator", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "code", required: true, min: 8, max: 32 },
      { type: "date", name: "expiresAt" },
      { type: "number", name: "maxUses", min: 0, onlyInt: true },
      { type: "number", name: "uses", min: 0, onlyInt: true },
      { type: "bool", name: "revoked" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_invites_code ON invites (code)",
      "CREATE INDEX idx_invites_community ON invites (community)",
    ],
  });
  saveCollection(invites);

  const bans = new Collection({
    type: "base",
    name: "bans",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "relation", name: "moderator", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "reason", max: 1000 },
      { type: "date", name: "expiresAt" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_bans_community_user ON bans (community, user)",
    ],
  });
  saveCollection(bans);

  const auditEvents = new Collection({
    type: "base",
    name: "audit_events",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "community", required: true, maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "actor", maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "action", required: true, max: 120 },
      { type: "text", name: "targetType", max: 80 },
      { type: "text", name: "targetId", max: 32 },
      { type: "text", name: "reason", max: 1000 },
      { type: "json", name: "metadata", maxSize: 32 * 1024 },
    ],
    indexes: [
      "CREATE INDEX idx_audit_events_community_created ON audit_events (community, created DESC)",
    ],
  });
  saveCollection(auditEvents);

  const presence = new Collection({
    type: "base",
    name: "presence",
    listRule: authenticated,
    viewRule: authenticated,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["online", "idle", "dnd", "offline"] },
      { type: "text", name: "deviceId", required: true, max: 120 },
      { type: "date", name: "expiresAt", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_presence_user_device ON presence (user, deviceId)",
      "CREATE INDEX idx_presence_expires ON presence (expiresAt)",
    ],
  });
  saveCollection(presence);

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
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_typing_channel_user ON typing (channel, user)",
      "CREATE INDEX idx_typing_expires ON typing (expiresAt)",
    ],
  });
  saveCollection(typing);

  const conversations = new Collection({
    type: "base",
    name: "conversations",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "select", name: "kind", required: true, maxSelect: 1, values: ["direct", "group"] },
      { type: "text", name: "name", max: 100 },
      { type: "text", name: "directKey", max: 80, hidden: true },
      { type: "relation", name: "owner", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
    ],
    indexes: [
      "CREATE INDEX idx_conversations_owner_created ON conversations (owner, created DESC)",
      "CREATE UNIQUE INDEX idx_conversations_direct_key ON conversations (directKey) WHERE directKey != ''",
    ],
  });
  saveCollection(conversations);

  const conversationMembers = new Collection({
    type: "base",
    name: "conversation_members",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "conversation", required: true, maxSelect: 1, collectionId: conversations.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "nickname", max: 80 },
      { type: "date", name: "joinedAt", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_conversation_members_pair ON conversation_members (conversation, user)",
      "CREATE INDEX idx_conversation_members_user ON conversation_members (user)",
    ],
  });
  saveCollection(conversationMembers);
  conversations.listRule = `${authenticated} && @collection.conversation_members:auth.conversation ?= id && @collection.conversation_members:auth.user ?= @request.auth.id`;
  conversations.viewRule = conversations.listRule;
  saveCollection(conversations);
  conversationMembers.listRule = `${authenticated} && @collection.conversation_members:viewer.conversation ?= conversation && @collection.conversation_members:viewer.user ?= @request.auth.id`;
  conversationMembers.viewRule = conversationMembers.listRule;
  saveCollection(conversationMembers);

  const directMessages = new Collection({
    type: "base",
    name: "direct_messages",
    listRule: conversationMember,
    viewRule: conversationMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "conversation", required: true, maxSelect: 1, collectionId: conversations.id, cascadeDelete: true },
      { type: "relation", name: "author", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "content", max: 4000 },
      { type: "file", name: "attachments", maxSelect: 10, maxSize: 25 * 1024 * 1024 },
      { type: "date", name: "editedAt" },
      { type: "date", name: "deletedAt" },
    ],
    indexes: [
      "CREATE INDEX idx_direct_messages_conversation_created ON direct_messages (conversation, created DESC)",
    ],
  });
  saveCollection(directMessages);
  directMessages.fields.add(new RelationField({
    name: "replyTo",
    maxSelect: 1,
    collectionId: directMessages.id,
    cascadeDelete: false,
  }));
  saveCollection(directMessages);

  const callSessions = new Collection({
    type: "base",
    name: "call_sessions",
    listRule: channelCommunityMember,
    viewRule: channelCommunityMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "channel", required: true, maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "startedBy", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "text", name: "roomName", required: true, max: 160 },
      { type: "date", name: "endedAt" },
    ],
    indexes: [
      "CREATE INDEX idx_call_sessions_channel_created ON call_sessions (channel, created DESC)",
    ],
  });
  saveCollection(callSessions);

  const callParticipants = new Collection({
    type: "base",
    name: "call_participants",
    listRule: `${authenticated} && @collection.memberships:auth.community ?= call.channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    viewRule: `${authenticated} && @collection.memberships:auth.community ?= call.channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "call", required: true, maxSelect: 1, collectionId: callSessions.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "date", name: "joinedAt", required: true },
      { type: "date", name: "leftAt" },
      { type: "bool", name: "muted" },
      { type: "bool", name: "deafened" },
      { type: "bool", name: "camera" },
      { type: "bool", name: "sharing" },
    ],
    indexes: [
      "CREATE INDEX idx_call_participants_call_left ON call_participants (call, leftAt)",
    ],
  });
  saveCollection(callParticipants);

  const notifications = new Collection({
    type: "base",
    name: "notifications",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "relation", name: "actor", maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "relation", name: "community", maxSelect: 1, collectionId: communities.id, cascadeDelete: true },
      { type: "relation", name: "channel", maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "message", maxSelect: 1, collectionId: messages.id, cascadeDelete: true },
      { type: "text", name: "type", required: true, max: 80 },
      { type: "date", name: "readAt" },
      { type: "json", name: "data", maxSize: 16 * 1024 },
    ],
    indexes: [
      "CREATE INDEX idx_notifications_user_read_created ON notifications (user, readAt, created DESC)",
    ],
  });
  saveCollection(notifications);
}, (app) => {
  const names = [
    "notifications",
    "call_participants",
    "call_sessions",
    "direct_messages",
    "conversation_members",
    "conversations",
    "typing",
    "presence",
    "audit_events",
    "bans",
    "invites",
    "read_states",
    "reactions",
    "messages",
    "channel_permissions",
    "channels",
    "member_roles",
    "roles",
    "memberships",
    "communities",
  ];

  for (const name of names) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {
      // The migration rollback is idempotent.
    }
  }

  try {
    const users = app.findCollectionByNameOrId("users");
    for (const field of ["handle", "displayName", "bio", "status", "customStatus", "lastSeenAt", "preferences"]) {
      users.fields.removeByName(field);
    }
    users.indexes = users.indexes.filter((index) => !index.includes("idx_users_handle"));
    users.passwordAuth.identityFields = ["email"];
    users.listRule = null;
    users.viewRule = null;
    users.createRule = "";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
  } catch {
    // The users collection is managed by PocketBase and may already be reset.
  }
});
