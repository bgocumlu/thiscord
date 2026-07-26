/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const membershipRule = (target) => (
    `${authenticated} && @collection.memberships:auth.community ?= ${target}`
    + " && @collection.memberships:auth.user ?= @request.auth.id"
    + " && @collection.memberships:auth.state ?= 'active'"
  );
  const conversationRule = (target) => (
    `${authenticated} && @collection.conversation_members:auth.conversation ?= ${target}`
    + " && @collection.conversation_members:auth.user ?= @request.auth.id"
  );
  const setRules = (name, rule) => {
    const collection = app.findCollectionByNameOrId(name);
    collection.listRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  };

  setRules("communities", membershipRule("id"));
  for (const name of ["memberships", "roles", "channels", "invites"]) {
    setRules(name, membershipRule("community"));
  }
  setRules("channel_permissions", membershipRule("channel.community"));
  for (const name of ["messages", "typing", "call_sessions"]) {
    setRules(name, membershipRule("channel.community"));
  }
  setRules("reactions", membershipRule("message.channel.community"));
  setRules("call_participants", membershipRule("call.channel.community"));

  setRules("conversations", conversationRule("id"));
  setRules("direct_messages", conversationRule("conversation"));
  setRules("direct_reactions", conversationRule("message.conversation"));
  setRules("direct_typing", conversationRule("conversation"));
}, (app) => {
  const authenticated = "@request.auth.id != ''";
  const membershipRule = (target) => (
    `${authenticated} && @collection.memberships.community ?= ${target}`
    + " && @collection.memberships.user ?= @request.auth.id"
    + " && @collection.memberships.state = 'active'"
  );
  const conversationRule = (target) => (
    `${authenticated} && @collection.conversation_members.conversation ?= ${target}`
    + " && @collection.conversation_members.user ?= @request.auth.id"
  );
  const setRules = (name, rule) => {
    const collection = app.findCollectionByNameOrId(name);
    collection.listRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  };

  setRules("communities", membershipRule("id"));
  for (const name of ["memberships", "roles", "channels", "invites"]) {
    setRules(name, membershipRule("community"));
  }
  setRules("channel_permissions", membershipRule("channel.community"));
  for (const name of ["messages", "typing", "call_sessions"]) {
    setRules(name, membershipRule("channel.community"));
  }
  setRules("reactions", membershipRule("message.channel.community"));
  setRules("call_participants", membershipRule("call.channel.community"));
  setRules("conversations", conversationRule("id"));
  setRules("direct_messages", conversationRule("conversation"));
  setRules("direct_reactions", conversationRule("message.conversation"));
  setRules("direct_typing", conversationRule("conversation"));
});
