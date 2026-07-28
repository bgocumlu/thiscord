// Generated from packages/shared/policies/manifest.json. Do not edit.
const POLICY_MANIFEST = {
  "version": 1,
  "permissions": [
    {
      "id": "administrator",
      "label": "Administrator",
      "group": "administration",
      "channelOverride": false
    },
    {
      "id": "manage_community",
      "label": "Manage community",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "manage_channels",
      "label": "Manage channels",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "manage_roles",
      "label": "Manage roles",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "manage_messages",
      "label": "Manage messages",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "manage_members",
      "label": "Manage members",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "view_audit_log",
      "label": "View audit log",
      "group": "administration",
      "channelOverride": true
    },
    {
      "id": "create_invites",
      "label": "Create invites",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "view_channels",
      "label": "View channels",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "send_messages",
      "label": "Send messages",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "read_history",
      "label": "Read message history",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "add_reactions",
      "label": "Add reactions",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "attach_files",
      "label": "Attach files",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "embed_links",
      "label": "Embed links",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "mention_everyone",
      "label": "Mention everyone",
      "group": "text",
      "channelOverride": true
    },
    {
      "id": "connect_voice",
      "label": "Connect to voice",
      "group": "voice",
      "channelOverride": true
    },
    {
      "id": "speak",
      "label": "Speak",
      "group": "voice",
      "channelOverride": true
    },
    {
      "id": "stream_video",
      "label": "Stream video",
      "group": "voice",
      "channelOverride": true
    },
    {
      "id": "mute_members",
      "label": "Mute members",
      "group": "voice",
      "channelOverride": true
    }
  ],
  "permissionGroups": [
    {
      "id": "administration",
      "label": "Administration"
    },
    {
      "id": "text",
      "label": "Text"
    },
    {
      "id": "voice",
      "label": "Voice"
    }
  ],
  "defaultMemberPermissions": [
    "create_invites",
    "view_channels",
    "send_messages",
    "read_history",
    "add_reactions",
    "attach_files",
    "embed_links",
    "connect_voice",
    "speak",
    "stream_video"
  ],
  "permissionImplications": {
    "administrator": "*"
  },
  "permissionRestrictions": {
    "hiddenChannelRemoves": [
      "send_messages",
      "read_history",
      "add_reactions",
      "attach_files",
      "embed_links",
      "mention_everyone",
      "connect_voice",
      "speak",
      "stream_video"
    ],
    "timeoutRemoves": [
      "send_messages",
      "add_reactions",
      "attach_files",
      "embed_links",
      "mention_everyone",
      "connect_voice",
      "speak",
      "stream_video"
    ]
  },
  "channelCapabilities": {
    "category": {
      "container": true,
      "messages": false,
      "calls": false,
      "slowmode": false,
      "topics": false,
      "ageRestriction": false,
      "postingPermissions": [],
      "permissionGroups": [
        "administration",
        "text",
        "voice"
      ],
      "settingsFields": [
        "name"
      ]
    },
    "text": {
      "container": false,
      "messages": true,
      "calls": false,
      "slowmode": true,
      "topics": true,
      "ageRestriction": true,
      "postingPermissions": [
        "send_messages"
      ],
      "permissionGroups": [
        "administration",
        "text",
        "voice"
      ],
      "settingsFields": [
        "name",
        "topic",
        "parent",
        "slowmodeSeconds",
        "nsfw"
      ]
    },
    "announcement": {
      "container": false,
      "messages": true,
      "calls": false,
      "slowmode": true,
      "topics": true,
      "ageRestriction": true,
      "postingPermissions": [
        "send_messages",
        "manage_messages"
      ],
      "permissionGroups": [
        "administration",
        "text",
        "voice"
      ],
      "settingsFields": [
        "name",
        "topic",
        "parent",
        "slowmodeSeconds",
        "nsfw"
      ]
    },
    "voice": {
      "container": false,
      "messages": false,
      "calls": true,
      "slowmode": false,
      "topics": true,
      "ageRestriction": true,
      "postingPermissions": [],
      "permissionGroups": [
        "administration",
        "text",
        "voice"
      ],
      "settingsFields": [
        "name",
        "topic",
        "parent",
        "nsfw"
      ]
    }
  },
  "limits": {
    "profile": {
      "handleMin": 2,
      "handleMax": 32,
      "displayNameMax": 80,
      "bioMax": 500,
      "customStatusMax": 120,
      "preferencesBytesMax": 32768
    },
    "community": {
      "nameMax": 100,
      "slugMin": 2,
      "slugMax": 80,
      "descriptionMax": 1000
    },
    "channel": {
      "nameMax": 100,
      "topicMax": 1024,
      "slowmodeSecondsMax": 21600
    },
    "role": {
      "nameMax": 80,
      "colorMax": 20
    },
    "membership": {
      "nicknameMax": 80,
      "timeoutMinutesMax": 40320
    },
    "conversation": {
      "nameMax": 100,
      "membersMin": 2,
      "membersMax": 25
    },
    "message": {
      "contentMax": 4000,
      "attachmentsMax": 10,
      "attachmentBytesMax": 26214400,
      "emojiMax": 64
    },
    "search": {
      "queryMin": 2,
      "queryMax": 120
    }
  },
  "transientTimings": {
    "typingExpiryMs": 10000,
    "typingRefreshMs": 5000,
    "typingPollMs": 8000,
    "presenceExpiryMs": 120000,
    "presenceHeartbeatMs": 25000,
    "presencePollMs": 30000,
    "callParticipantExpiryMs": 120000,
    "callHeartbeatMs": 25000,
    "callOccupancyPollMs": 20000,
    "callTokenLifetimeMs": 300000,
    "transientCleanupCron": "* * * * *",
    "jitsiReloadCooldownMs": 30000,
    "automaticReconnectDelaysMs": [
      750,
      1500,
      3000
    ]
  }
};

const PERMISSION_DEFINITIONS = POLICY_MANIFEST.permissions;
const PERMISSION_GROUPS = POLICY_MANIFEST.permissionGroups;
const ALL_PERMISSIONS = PERMISSION_DEFINITIONS.map((permission) => permission.id);
const DEFAULT_MEMBER_PERMISSIONS = POLICY_MANIFEST.defaultMemberPermissions;
const PERMISSION_IMPLICATIONS = POLICY_MANIFEST.permissionImplications;
const PERMISSION_RESTRICTIONS = POLICY_MANIFEST.permissionRestrictions;
const CHANNEL_CAPABILITIES = POLICY_MANIFEST.channelCapabilities;
const CHANNEL_KINDS = Object.keys(CHANNEL_CAPABILITIES);
const POLICY_LIMITS = POLICY_MANIFEST.limits;
const TRANSIENT_TIMINGS = POLICY_MANIFEST.transientTimings;

module.exports = {
  POLICY_MANIFEST,
  PERMISSION_DEFINITIONS,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
  PERMISSION_IMPLICATIONS,
  PERMISSION_RESTRICTIONS,
  CHANNEL_CAPABILITIES,
  CHANNEL_KINDS,
  POLICY_LIMITS,
  TRANSIENT_TIMINGS,
};
