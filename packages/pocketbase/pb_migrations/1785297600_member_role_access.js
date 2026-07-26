/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const authenticated = "@request.auth.id != ''";
  const rule = (
    `${authenticated} && @collection.memberships:viewer.community ?= membership.community`
    + " && @collection.memberships:viewer.user ?= @request.auth.id"
    + " && @collection.memberships:viewer.state ?= 'active'"
  );
  const collection = app.findCollectionByNameOrId("member_roles");
  collection.listRule = rule;
  collection.viewRule = rule;
  app.save(collection);
}, (app) => {
  const authenticated = "@request.auth.id != ''";
  const rule = (
    `${authenticated} && @collection.memberships:viewer.community ?= membership.community`
    + " && @collection.memberships:viewer.user ?= @request.auth.id"
    + " && @collection.memberships:viewer.state = 'active'"
  );
  const collection = app.findCollectionByNameOrId("member_roles");
  collection.listRule = rule;
  collection.viewRule = rule;
  app.save(collection);
});
