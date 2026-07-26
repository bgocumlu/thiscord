/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const roles = app.findCollectionByNameOrId("roles");
  roles.fields.getByName("permissions").required = false;
  app.save(roles);
}, (app) => {
  const roles = app.findCollectionByNameOrId("roles");
  roles.fields.getByName("permissions").required = true;
  app.save(roles);
});
