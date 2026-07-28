/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  require(`${__hooks}/lib/callAccess.js`).validateRoomTarget(e.record);
  e.next();
}, "call_rooms");

onRecordUpdateRequest((e) => {
  require(`${__hooks}/lib/callAccess.js`).validateRoomTarget(e.record);
  e.next();
}, "call_rooms");
