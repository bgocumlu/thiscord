function registerNotifications() {
routerAdd("GET", "/api/thiscord/notifications/unread-count", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  return e.json(200, {
    count: h.countRecordsByFilter(
      e.app,
      "notifications",
      "user = {:user} && readAt = ''",
      { user: e.auth.id },
    ),
  });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/notifications/{id}/read", (e) => {
  const notification = e.app.findRecordById("notifications", e.request.pathValue("id"));
  if (notification.getString("user") !== e.auth.id) throw new ForbiddenError("This notification does not belong to you.");
  notification.set("readAt", new Date().toISOString());
  e.app.save(notification);
  return e.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/thiscord/notifications/read-all", (e) => {
  const h = require(`${__hooks}/lib/permissions.js`);
  const unread = h.findAllRecordsByFilter(
    e.app,
    "notifications",
    "user = {:user} && readAt = ''",
    "",
    { user: e.auth.id },
  );
  const now = new Date().toISOString();
  e.app.runInTransaction((tx) => {
    for (const notification of unread) {
      notification.set("readAt", now);
      tx.save(notification);
    }
  });
  return e.json(200, { updated: unread.length });
}, $apis.requireAuth("users"));

}

module.exports = {
  registerNotifications,
};
