/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const sharesActiveCommunity = [
    "memberships_via_user.state ?= 'active'",
    "memberships_via_user.community.memberships_via_community.user ?= @request.auth.id",
    "memberships_via_user.community.memberships_via_community.state ?= 'active'",
  ].join(" && ");
  const sharesConversation = "conversation_members_via_user.conversation.conversation_members_via_conversation.user ?= @request.auth.id";
  const directoryAccess = `${authenticated} && (id = @request.auth.id || (${sharesActiveCommunity}) || (${sharesConversation}))`;

  const users = app.findCollectionByNameOrId("users");
  users.listRule = directoryAccess;
  users.viewRule = directoryAccess;
  users.updateRule = "id = @request.auth.id && @request.body.preferences:isset = false && @request.body.status:isset = false";
  for (const name of ["status", "lastSeenAt", "preferences"]) {
    users.fields.getByName(name).hidden = true;
  }
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "id = @request.auth.id";
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id && @request.body.preferences:isset = false && @request.body.status:isset = false";
  for (const name of ["status", "lastSeenAt", "preferences"]) {
    users.fields.getByName(name).hidden = true;
  }
  app.save(users);
});
