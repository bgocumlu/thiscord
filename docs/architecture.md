# Architecture

## Runtime boundaries

The React renderer is one application delivered in two forms:

- the hosted installable PWA;
- the renderer bundled inside the Electron desktop package.

Both clients connect to the same installation-specific PocketBase and Jitsi services. Electron does not run a private product database. Its loopback backend only serves signed application assets and a health endpoint.

PocketBase owns authentication and durable product state. Jitsi owns live
media. The static frontend is deployed independently. Caddy terminates TLS only
for the PocketBase and Jitsi backend domains.

The renderer owns the complete call interface. Its call provider accepts a
generic call-target descriptor instead of a channel record. It lazy-loads a
pinned `lib-jitsi-meet` client when a voice-channel or conversation target is
joined and connects directly
to the installation’s Jitsi transport; it does not embed or expose the standard
Jitsi web interface. Call state lives above workspace routing, so text-channel
and direct-message navigation does not end the active conference. Joining and
opening a call are separate actions: voice-channel selection connects in place,
while direct and group conversations expose explicit start/join controls.
An active conversation call renders as a bounded media stage above the existing
message history and composer, so chat remains mounted and usable during the
call.
The call surface owns microphone, camera, speaker selection and exposes Jitsi
mute/remove controls only to moderators. PocketBase call-room sessions and
heartbeats make authorized target occupancy visible to members who are not
connected to the conference.

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

Jitsi room names are opaque random values stored in hidden `call_rooms`
records. Each room has exactly one channel or conversation target. The browser
receives the room name and a five-minute HS256 JWT only from the authenticated
generic call-join route after the server resolves that target's access policy.
Failed media-server removals are stored in the private `call_ejections` outbox
and retried by transient cleanup, so Jitsi availability cannot block an
authorization change. A pending removal is cancelled only after target access
and unrestricted speaking/video authority are both restored.
Request-time dispatch is limited to intents created by that mutation, while
exact monotonic revisions prevent a stale worker from deleting or rescheduling
a newer intent. Finalization uses atomic ID-and-revision database mutations.
Compatible per-room operations are combined into multi-user control requests.
The cleanup worker pages and groups due intents until its bounded time budget
is exhausted, so a large media outage backlog drains promptly without creating
unbounded API or cron latency.
The Jitsi signing secret exists only in PocketBase and Jitsi service
environments. Community calls require resolved voice permissions. Any current
direct or group conversation member may initiate or join its call, speak, and
use video; conversation calls do not inherit community moderation permissions.
Conversation call notifications exclude muted conversations and users in
do-not-disturb mode.
Jitsi's combined moderator role is not delegated to browser tokens. PocketBase
authorizes mute and remove actions independently and forwards them over the
private Prosody control endpoint. Signed speaking and video claims are applied
to Jitsi AV-moderation whitelists, keeping media permission enforcement on the
server boundary. A restrictive policy update also asks Jicofo to force-mute
already-published audio, camera, and desktop sources. The client mirrors that
revocation by muting or disposing its local tracks and leaves the call if local
  cleanup fails. Each JWT carries a transactional per-room/user token version.
  Permission changes revoke through the latest issued version even when the
  client has not reported presence, and Prosody persists that cutoff through
  the token lifetime. Reconnecting with any revoked version cannot restore
  removed access or stale publishing authority; a newly authorized token gets
  a higher version and remains usable.
Each in-memory page lease heartbeat records only media state and expiry. The
lease identifier, ordering sequence, and per-lease media JSON are private
server fields; shared occupancy exposes only the logical participant aggregate.
When membership or
voice access is revoked, PocketBase calls a private, shared-secret Prosody
endpoint with the affected PocketBase user ID. Prosody removes every matching
occupant by the user identity verified from its JWT session before PocketBase
clears product presence. Client-reported media identifiers are not trusted.
The same verified identity is injected into occupant presence through
`presence_identity`, so renderer media tracks reconcile to account-level
occupancy without trusting display names.
This prevents an already-connected client from remaining in the media room
until its short-lived join token expires. Heartbeat authorization and the
presence write share one database transaction, so a stale request cannot
recreate presence after a racing revocation.

Web authentication uses PocketBase’s local auth store. Electron supplies an isolated auth store whose serialized token is encrypted through Electron `safeStorage`; renderer code has no Node.js access. The desktop window uses context isolation, sandboxing, navigation allowlists, and origin-scoped media permissions.

User directory access is relationship-scoped: authenticated users may resolve
public profile fields for accounts that share an active community or a
conversation. Account presence, last-seen state, and preferences stay hidden on
user records and are exposed only through their purpose-built scoped routes.

## Durable data

The V2 baseline and subsequent forward migrations create:

```text
users, communities, memberships, roles, member_roles
channels, channel_permissions
messages, reactions, read_states
invites, bans, audit_events
presence, presence_leases, community_presence, notifications
conversations, conversation_members, direct_messages, direct_reactions
call_rooms, call_sessions, call_participants, call_presence_leases, call_ejections
```

Presence and call-participant heartbeats expire automatically.
PocketBase reduces private account leases to one public status per community
and private call leases to one logical occupant per account. It derives shared
occupancy without exposing browser/device state and revokes both
product presence and live media access when membership ends. Jitsi remains the
source of live tracks. Messages are soft-deleted so replies and audit history remain
coherent. File records use PocketBase storage and can be moved to its
S3-compatible storage option without changing client contracts. Message records
also persist whether server-approved link embeds are enabled so clients do not
need to infer permission decisions later.

## Distribution model

`distribution.json` controls the product name, application identifier, public
URLs, accent, support URL, and update URL. Static frontend builds and desktop
builds use `DISTRIBUTION_FILE` to select an installation-specific manifest.

Each fork can replace icons, signing identities, update feed, domains, and the manifest while retaining the Thiscord codebase. A packaged desktop application opens its configured installation directly.
