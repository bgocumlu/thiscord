# Architecture

## Runtime boundaries

The React renderer is one application delivered in two forms:

- the hosted installable PWA;
- the renderer bundled inside the Electron desktop package.

Both clients connect to the same installation-specific PocketBase and Jitsi services. Electron does not run a private product database. Its loopback backend only serves signed application assets and a health endpoint.

PocketBase owns authentication and durable product state. Jitsi owns live
media. The static frontend is deployed independently. Caddy terminates TLS only
for the PocketBase and Jitsi backend domains.

The renderer owns the complete call interface. It lazy-loads a pinned
`lib-jitsi-meet` client when a voice channel is selected and connects directly
to the installation’s Jitsi transport; it does not embed or expose the standard
Jitsi web interface. Call state lives above workspace routing, so text-channel
and direct-message navigation does not end the active conference. Joining and
opening a call are separate actions: the first voice-channel selection connects
in place, while selecting the connected channel opens its focused call surface.
The call surface owns microphone, camera, speaker selection and exposes Jitsi
mute/remove controls only to moderators. PocketBase call heartbeats make channel
occupancy visible to members who are not connected to the conference.

```text
Browser / Electron renderer
  ├─ HTTPS + SSE ─ PocketBase
  │                  ├─ SQLite and file storage
  │                  ├─ auth collections
  │                  ├─ API rules and realtime
  │                  └─ protected Thiscord routes
  └─ WebRTC ─────── Jitsi
                     ├─ web
                     ├─ Prosody
                     ├─ Jicofo
                     ├─ Videobridge
                     └─ Coturn
```

## Security model

Generic PocketBase mutation rules are closed for product collections. Privileged writes go through authenticated `/api/thiscord/*` routes that resolve membership, roles, channel overwrites, ownership, timeouts, and moderation authority.

Jitsi room names are opaque random values stored on voice channels. The browser receives a five-minute HS256 JWT only after the server checks the current user’s voice permission. The Jitsi signing secret exists only in PocketBase and Jitsi service environments.

Web authentication uses PocketBase’s local auth store. Electron supplies an isolated auth store whose serialized token is encrypted through Electron `safeStorage`; renderer code has no Node.js access. The desktop window uses context isolation, sandboxing, navigation allowlists, and origin-scoped media permissions.

## Durable data

The initial migration creates:

```text
users, communities, memberships, roles, member_roles
channels, channel_permissions
messages, reactions, read_states
invites, bans, audit_events
presence, typing, direct_typing, notifications
conversations, conversation_members, direct_messages, direct_reactions
call_sessions, call_participants
```

Presence, typing, and call-participant heartbeats expire automatically. PocketBase
stores shared voice occupancy and media state while Jitsi remains the source of
live tracks. Messages are soft-deleted so replies and audit history remain
coherent. File records use PocketBase storage and can be moved to its
S3-compatible storage option without changing client contracts. Message records
also persist whether server-approved link embeds are enabled so clients do not
need to infer permission decisions later.

## Distribution model

`distribution.json` controls the product name, application identifier, public
URLs, accent, support URL, and update URL. Static frontend builds and desktop
builds use `DISTRIBUTION_FILE` to select an installation-specific manifest.

Each fork can replace icons, signing identities, update feed, domains, and the manifest while retaining the Thiscord codebase. A packaged desktop application opens its configured installation directly.
