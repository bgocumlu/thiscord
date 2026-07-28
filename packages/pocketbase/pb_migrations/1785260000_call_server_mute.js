/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const participants = app.findCollectionByNameOrId("call_participants");
  participants.fields.add(new BoolField({
    name: "serverMuted",
  }));
  app.save(participants);
}, (app) => {
  const participants = app.findCollectionByNameOrId("call_participants");
  participants.fields.removeByName("serverMuted");
  app.save(participants);
});
