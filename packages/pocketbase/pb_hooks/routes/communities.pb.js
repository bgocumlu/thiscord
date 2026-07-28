/// <reference path="../../pb_data/types.d.ts" />

const routes = require(`${__hooks}/lib/routes/communities.js`);
routes.registerCommunities();
routes.registerCommunityAdministration();
routes.registerInvites();
