/// <reference path="../../pb_data/types.d.ts" />

const routes = require(`${__hooks}/lib/routes/channels.js`);
routes.registerChannels();
routes.registerChannelPermissions();
