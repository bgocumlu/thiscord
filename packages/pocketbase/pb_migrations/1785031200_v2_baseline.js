/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const conversationMemberLimit = 25;
  const authenticated = "@request.auth.id != ''";
  const communityMember = `${authenticated} && @collection.memberships:auth.community ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const relatedCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const channelCommunityMember = `${authenticated} && @collection.memberships:auth.community ?= channel.community && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.state ?= 'active'`;
  const conversationMember = `${authenticated} && @collection.conversation_members:auth.conversation ?= conversation && @collection.conversation_members:auth.user ?= @request.auth.id`;
  const directReactionMember = `${authenticated} && @collection.conversation_members:auth.conversation ?= message.conversation && @collection.conversation_members:auth.user ?= @request.auth.id`;
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
  users.updateRule = "id = @request.auth.id && @request.body.preferences:isset = false";
  // Account deletion requires ordered cleanup and ownership transfer.
  users.deleteRule = null;
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
  users.fields.add(new JSONField({
    name: "preferences",
    maxSize: 32 * 1024,
    hidden: true,
  }));
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
      { type: "number", name: "accessRevision", min: 0, onlyInt: true },
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
  const ownMembership = `${authenticated} && user = @request.auth.id`;
  memberships.listRule = `(${relatedCommunityMember}) || (${ownMembership})`;
  memberships.viewRule = memberships.listRule;
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
      { type: "bool", name: "embedsEnabled" },
    ],
    indexes: [
      "CREATE INDEX idx_messages_channel_created ON messages (channel, created DESC)",
      "CREATE INDEX idx_messages_author_created ON messages (author, created DESC)",
      "CREATE INDEX idx_messages_channel_author_created ON messages (channel, author, created DESC)",
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
    listRule: null,
    viewRule: null,
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
      { type: "date", name: "lastMessageAt", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_conversations_activity ON conversations (lastMessageAt DESC, id DESC)",
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
  app.db().newQuery(
    "CREATE TRIGGER validate_conversation_member_limit BEFORE INSERT ON conversation_members "
    + "WHEN (SELECT kind FROM conversations WHERE id = NEW.conversation) = 'group' "
    + `AND (SELECT COUNT(*) FROM conversation_members WHERE conversation = NEW.conversation) >= ${conversationMemberLimit} `
    + "BEGIN SELECT RAISE(ABORT, 'Groups cannot exceed the conversation member limit.'); END"
  ).execute();
  app.db().newQuery(
    "CREATE TRIGGER validate_conversation_owner_update BEFORE UPDATE OF owner ON conversations "
    + "WHEN NOT EXISTS (SELECT 1 FROM conversation_members "
    + "WHERE conversation = NEW.id AND user = NEW.owner) "
    + "BEGIN SELECT RAISE(ABORT, 'A conversation owner must be a member.'); END"
  ).execute();
  app.db().newQuery(
    "CREATE TRIGGER validate_conversation_owner_member_delete BEFORE DELETE ON conversation_members "
    + "WHEN EXISTS (SELECT 1 FROM conversations "
    + "WHERE id = OLD.conversation AND owner = OLD.user) "
    + "BEGIN SELECT RAISE(ABORT, 'Transfer ownership before removing the owner.'); END"
  ).execute();
  conversations.listRule = `${authenticated} && @collection.conversation_members:auth.conversation ?= id && @collection.conversation_members:auth.user ?= @request.auth.id`;
  conversations.viewRule = conversations.listRule;
  saveCollection(conversations);
  conversationMembers.listRule = `${authenticated} && (user = @request.auth.id || (@collection.conversation_members:viewer.conversation ?= conversation && @collection.conversation_members:viewer.user ?= @request.auth.id))`;
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
      { type: "bool", name: "embedsEnabled" },
      { type: "bool", name: "pinned" },
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
  conversationMembers.fields.add(new DateField({ name: "lastReadAt" }));
  conversationMembers.fields.add(new RelationField({
    name: "lastMessage",
    maxSelect: 1,
    collectionId: directMessages.id,
    cascadeDelete: false,
  }));
  saveCollection(conversationMembers);

  const directReactions = new Collection({
    type: "base",
    name: "direct_reactions",
    listRule: directReactionMember,
    viewRule: directReactionMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "message", required: true, maxSelect: 1, collectionId: directMessages.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "text", name: "emoji", required: true, max: 64 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_direct_reactions_unique ON direct_reactions (message, user, emoji)",
      "CREATE INDEX idx_direct_reactions_message ON direct_reactions (message)",
    ],
  });
  saveCollection(directReactions);

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
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_direct_typing_conversation_user ON direct_typing (conversation, user)",
      "CREATE INDEX idx_direct_typing_expires ON direct_typing (expiresAt)",
    ],
  });
  saveCollection(directTyping);

  const callRoomMember = (
    `${authenticated} && (`
    + "(@collection.memberships:callcommunity.community ?= channel.community"
    + " && @collection.memberships:callcommunity.user ?= @request.auth.id"
    + " && @collection.memberships:callcommunity.state ?= 'active')"
    + " || (@collection.conversation_members:callconversation.conversation ?= conversation"
    + " && @collection.conversation_members:callconversation.user ?= @request.auth.id)"
    + ")"
  );
  const callSessionMember = (
    `${authenticated} && (`
    + "(@collection.memberships:callcommunity.community ?= room.channel.community"
    + " && @collection.memberships:callcommunity.user ?= @request.auth.id"
    + " && @collection.memberships:callcommunity.state ?= 'active')"
    + " || (@collection.conversation_members:callconversation.conversation ?= room.conversation"
    + " && @collection.conversation_members:callconversation.user ?= @request.auth.id)"
    + ")"
  );
  const callParticipantMember = (
    `${authenticated} && (`
    + "(@collection.memberships:callcommunity.community ?= call.room.channel.community"
    + " && @collection.memberships:callcommunity.user ?= @request.auth.id"
    + " && @collection.memberships:callcommunity.state ?= 'active')"
    + " || (@collection.conversation_members:callconversation.conversation ?= call.room.conversation"
    + " && @collection.conversation_members:callconversation.user ?= @request.auth.id)"
    + ")"
  );

  const callRooms = new Collection({
    type: "base",
    name: "call_rooms",
    listRule: callRoomMember,
    viewRule: callRoomMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "channel", maxSelect: 1, collectionId: channels.id, cascadeDelete: true },
      { type: "relation", name: "conversation", maxSelect: 1, collectionId: conversations.id, cascadeDelete: true },
      { type: "text", name: "roomName", required: true, max: 160, hidden: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_call_rooms_channel ON call_rooms (channel) WHERE channel != ''",
      "CREATE UNIQUE INDEX idx_call_rooms_conversation ON call_rooms (conversation) WHERE conversation != ''",
      "CREATE UNIQUE INDEX idx_call_rooms_room_name ON call_rooms (roomName)",
    ],
  });
  saveCollection(callRooms);
  const exactlyOneCallTarget = (
    "(CASE WHEN COALESCE(NEW.channel, '') != '' THEN 1 ELSE 0 END"
    + " + CASE WHEN COALESCE(NEW.conversation, '') != '' THEN 1 ELSE 0 END) != 1"
  );
  app.db().newQuery(
    `CREATE TRIGGER validate_call_rooms_target_insert BEFORE INSERT ON call_rooms WHEN ${exactlyOneCallTarget} `
    + "BEGIN SELECT RAISE(ABORT, 'A call room must have exactly one target.'); END"
  ).execute();
  app.db().newQuery(
    `CREATE TRIGGER validate_call_rooms_target_update BEFORE UPDATE OF channel, conversation ON call_rooms WHEN ${exactlyOneCallTarget} `
    + "BEGIN SELECT RAISE(ABORT, 'A call room must have exactly one target.'); END"
  ).execute();

  const callSessions = new Collection({
    type: "base",
    name: "call_sessions",
    listRule: callSessionMember,
    viewRule: callSessionMember,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "room", required: true, maxSelect: 1, collectionId: callRooms.id, cascadeDelete: true },
      { type: "relation", name: "startedBy", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
      { type: "date", name: "endedAt" },
    ],
    indexes: [
      "CREATE INDEX idx_call_sessions_room_created ON call_sessions (room, created DESC)",
      "CREATE UNIQUE INDEX idx_call_sessions_active_room ON call_sessions (room) WHERE endedAt = ''",
    ],
  });
  saveCollection(callSessions);

  const callParticipants = new Collection({
    type: "base",
    name: "call_participants",
    listRule: callParticipantMember,
    viewRule: callParticipantMember,
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
      { type: "json", name: "devices", maxSize: 16 * 1024 },
      { type: "date", name: "expiresAt" },
    ],
    indexes: [
      "CREATE INDEX idx_call_participants_call_left ON call_participants (call, leftAt)",
      "CREATE UNIQUE INDEX idx_call_participants_active_user ON call_participants (call, user) WHERE leftAt = ''",
      "CREATE INDEX idx_call_participants_expires ON call_participants (expiresAt)",
    ],
  });
  saveCollection(callParticipants);

  const callTokenVersions = new Collection({
    type: "base",
    name: "call_token_versions",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "room", required: true, maxSelect: 1, collectionId: callRooms.id, cascadeDelete: true },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "number", name: "version", required: true, min: 1, onlyInt: true },
      { type: "date", name: "expiresAt", required: true },
      { type: "number", name: "revokedThrough", min: 0, onlyInt: true },
      { type: "date", name: "revokedExpiresAt" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_call_token_versions_room_user ON call_token_versions (room, user)",
      "CREATE INDEX idx_call_token_versions_expires ON call_token_versions (expiresAt)",
    ],
  });
  saveCollection(callTokenVersions);

  const callEjections = new Collection({
    type: "base",
    name: "call_ejections",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "roomName", required: true, max: 160, hidden: true },
      { type: "text", name: "userId", required: true, max: 64, hidden: true },
      { type: "select", name: "action", required: true, maxSelect: 1, values: ["kick", "policy"] },
      { type: "bool", name: "canSpeak" },
      { type: "bool", name: "canStreamVideo" },
      { type: "number", name: "tokenVersion", min: 0, onlyInt: true },
      { type: "date", name: "tokenExpiresAt" },
      { type: "number", name: "revision", min: 0, onlyInt: true, hidden: true },
      { type: "number", name: "attempts", min: 0, onlyInt: true },
      { type: "text", name: "lastError", max: 1000, hidden: true },
      { type: "date", name: "nextAttemptAt", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_call_ejections_target ON call_ejections (roomName, userId)",
      "CREATE INDEX idx_call_ejections_retry ON call_ejections (nextAttemptAt)",
    ],
  });
  saveCollection(callEjections);

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
  app.db().newQuery("DROP TRIGGER IF EXISTS validate_conversation_owner_member_delete").execute();
  app.db().newQuery("DROP TRIGGER IF EXISTS validate_conversation_owner_update").execute();
  app.db().newQuery("DROP TRIGGER IF EXISTS validate_conversation_member_limit").execute();
  app.db().newQuery("DROP TRIGGER IF EXISTS validate_call_rooms_target_update").execute();
  app.db().newQuery("DROP TRIGGER IF EXISTS validate_call_rooms_target_insert").execute();
  const names = [
    "notifications",
    "call_ejections",
    "call_participants",
    "call_sessions",
    "call_token_versions",
    "call_rooms",
    "direct_typing",
    "direct_reactions",
    "conversation_members",
    "direct_messages",
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
