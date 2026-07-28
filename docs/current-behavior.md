# Current behavior and regression baseline

This document records the authorization and lifecycle behavior preserved by the
current architecture. It is both the current behavior reference and the
regression contract for future changes.

## Community and channel authorization

All protected operations require an authenticated user and an active
`memberships` record for the community. The community owner receives every
permission. For other members, permissions are the union of the managed
everyone role and explicitly assigned roles. An `administrator` grant expands
to every permission.

Channel permission layers are applied in this order:

1. the parent category, when present;
2. the channel;
3. within each layer, the everyone overwrite;
4. all matching role overwrites as a union of denies followed by allows;
5. the member overwrite.

At each overwrite level, an allow wins over a deny at the same level.
`administrator` cannot be granted by an overwrite. Owners and administrators
bypass channel overwrites.

When `view_channels` is absent after channel resolution, the resolver also
removes message history, composing, reactions, attachments, embeds, everyone
mentions, voice connection, speaking, and video streaming. A current timeout
retains channel visibility and message history but removes those interaction
and voice permissions. Owners and administrators bypass timeout removal.

PocketBase collection rules first restrict community data to active community
members. Raw built-in list endpoints for channel- and call-scoped collections
are disabled because PocketBase request hooks run after pagination. Product list
routes authorize records before filling stable pages. Request hooks still apply
channel-specific resolution to exact views, file downloads, and realtime
delivery:

- channel records and call/typing records require `view_channels`;
- messages, reactions, and read states require `read_history`;
- message attachments require `read_history`;
- unauthorized realtime events are dropped rather than sent.

Authenticated users can resolve the public profile fields of users who share an
active community or a direct/group conversation with them. Private account
presence, last-seen state, preferences, and auth fields remain hidden; shared
presence comes only from the scoped presence collections.

Each user may still read their own membership tombstone after a kick, ban,
leave, or parent-record cascade. The realtime client subscribes to that
user-scoped record so access removal invalidates cached communities even after
the active-membership rule stops authorizing the related community.

Role and channel-overwrite editors send the exact permission set that was
editable in the form. The server merges that set into the stored permissions,
preserving grants that were hidden by search or that the current manager is not
allowed to grant. An explicit overwrite reset still removes the whole
overwrite. Channel deletion increments the community access revision, whose
realtime event invalidates channel caches even though the deleted channel can no
longer authorize its own realtime event.

Channel create and update routes enforce the canonical capability table:
categories cannot have parents, topics, slowmode, or age restriction; voice
channels cannot have slowmode; and parent relations must reference another
category in the same community. Identity and position changes use their
dedicated routes. Non-owner role management exposes and reorders only roles
strictly below the manager's highest role, leaving equal and higher roles
untouched.

## Channel message policy

Only text and announcement channels accept messages. Sending requires
`send_messages`; announcements additionally require `manage_messages`.
Messages have at most 4,000 trimmed characters and need text or an attachment.
Attachments require `attach_files`, and `@everyone` requires
`mention_everyone`. Members without message-management authority are subject to
the channel slowmode. Replies require `read_history` and must target a message
in the same channel. The slowmode check and insert share one transaction, so
simultaneous sends cannot bypass the interval.

Authors may edit and soft-delete their messages. A member with
`manage_messages` may edit or delete another member's message and may pin or
unpin. Reactions require `add_reactions`, and each toggle is serialized with
its unique-key mutation. Soft deletion clears content and attachments and sets
`deletedAt`. History and search use `created` plus record ID for stable
ordering; read pointers advance monotonically and require a concrete message.
Edits change message text only, so attachment selection is disabled while the
composer is in edit mode.

Notifications are created for accessible, unmuted reply and mention targets.
Role mentions only notify active members of mentionable roles. `@everyone`
notification fan-out is performed only when the author has that permission.

## Conversation authorization and messages

Conversation access is based on an exact `conversation_members` record; a
community membership or client-supplied conversation identifier is
insufficient. The same membership check protects conversation records, direct
messages, reactions, typing state, attachments, read state, and search results.

A new conversation contains 2–25 unique users including its creator. Two users
produce an idempotent direct conversation keyed by the sorted user IDs; three
or more produce a group. Direct conversations cannot be renamed, expanded, or
left through group controls. The group owner may rename the group and add or
remove members; any group member may remove themselves. Groups are capped at 25
members. When an owner leaves, ownership transfers to the earliest remaining
member; an empty group is deleted.

Direct messages use the same 4,000-character and non-empty rules as channel
messages, and replies must stay in the conversation. Any member can react, mark
read, publish typing state, and pin. Only the author can edit or soft-delete.
Each direct message notifies every other current member.

Conversation ordering is persisted in `lastMessageAt` in the same transaction
as a direct-message insert. The directory uses a `lastMessageAt` plus
conversation-ID cursor rather than offset pages, so new activity cannot create
overlapping pages. Soft-deleted messages are excluded when the server computes
the newest unread message. Removed users may read only their own
`conversation_members` tombstone, allowing the deletion event to invalidate
their cached conversation without exposing other conversations.

The renderer supplies both contexts through one message-surface lifecycle for
pagination, search, composing, attachments, edits, soft deletion, replies,
reactions, pins, typing, read state, and failure states. The channel and
conversation adapters remain separate: channel disabled states and moderation
come from resolved permissions, while conversation behavior comes from exact
membership and ownership rules. Their PocketBase collections remain separate.

Global search reauthorizes every result on the server across all joined
communities and conversations. Realtime events invalidate it immediately for
the focused community and direct conversations; while a query remains active,
a five-second refresh also covers changes in non-focused communities without
subscribing the client to all of their message traffic.

## Account presence lifecycle

Each renderer page owns a random in-memory presence lease and a monotonic
sequence. One request may be in flight and only the latest additional heartbeat
is retained. Page hide, unmount, and explicit sign-out close the lease with a
higher sequence; the server keeps a bounded tombstone so delayed online or idle
writes cannot undo that close. Duplicate tabs therefore have independent
leases, including tabs created by session duplication.

The server reduces active leases to one private account aggregate and one
privacy-scoped aggregate for each active community. Realtime events contain
only community, user, and status. Lease identifiers, expiry, and ordering state
are not readable by clients. Member-directory responses are already filtered
against server time, so browser clock skew cannot mark members offline.
Unchanged heartbeats do not update public aggregates or invalidate directories.
Realtime callbacks patch the matching cached row, while the 30-second poll is a
degraded-mode fallback.

Automatic idle begins after five minutes without keyboard, pointer, or touch
activity; merely hiding a page does not make it idle, and an active call keeps
automatic presence online. Invisible mode closes once and does not heartbeat.
`lastSeenAt` advances only when the last active lease ends or expires.

## Call token and occupancy lifecycle

Calls use a generic `CallTarget`: either a community voice channel or a direct
or group conversation. Each target has one durable `call_rooms` record with an
opaque media room name and at most one active `call_sessions` record. Database
triggers and request hooks require every room to reference exactly one target.

Channel token issuance requires `connect_voice`, rejects non-voice channels,
and derives speaking, video, mute-member, and remove-member capabilities from
resolved permissions. Conversation token issuance requires an exact
current membership and grants the common conversation media capabilities
without community moderation. Both paths require complete Jitsi server
configuration and return a five-minute JWT. Recording, livestreaming,
transcription, and file upload are disabled in the token. Tokens include a
transactional per-room/user version used by the media service to reject stale
reconnects. They contain the public display name and an avatar URL rooted at the
configured PocketBase public origin, but never the account email.

Browser JWTs never receive Jitsi's coarse moderator role. Server-mute,
server-unmute, and remove actions use an authenticated PocketBase route and the private Prosody control
channel, where the target occupant is resolved from its signed Thiscord user
identity. Call moderation rechecks the actor's channel permission and community
role hierarchy inside its write transaction. A server mute is stored on the
logical call participant, survives reconnects within that live call, and keeps
the target outside the speaking whitelist until an authorized moderator removes
it. Signed speaking and video claims drive Jitsi AV-moderation
whitelists, so those media restrictions are enforced by the media service as
well as by the client controls. Restrictive updates force-mute already
published audio, camera, and desktop sources through Jicofo. AV-moderation
rejection events also mute or dispose local tracks, and a client cleanup
failure leaves the call. Approval events restore the corresponding client
controls without requiring a reconnect. Authorization changes revoke through
the latest token version even before product presence exists. Prosody durably
records that version until the affected token has expired; a reconnect with an
older or equal version is rejected, while a newly authorized token receives a
higher version and can join normally.

The first join creates or reuses the target room, recovers a concurrent
first-session uniqueness race, and creates one logical active participant per
account. Repeated page-lease joins and updates reuse that participant, refresh
its two-minute expiry, and retain private per-lease media state. Leaving one
page removes only that lease; the logical participant leaves after its last
lease and the call ends when no unexpired participants remain.

The client sends a joined heartbeat after the Jitsi conference joins and an
update every 25 seconds. Transient cleanup runs once per minute, marks expired
participants left, and ends empty calls. Target authorization is re-evaluated
inside the same transaction that creates or refreshes presence. Each call page
uses a random in-memory lease with monotonic sequence numbers. The client keeps
at most one write in flight and one latest queued update. Final departure drops
the queued update and sends a higher-sequence close without waiting for an older
request; the server retains a private tombstone, so an older late write cannot
recreate a participant after leaving.
Each heartbeat returns refreshed media and moderation capabilities. A false
speaking or video capability immediately mutes or disposes the corresponding
local microphone, camera, desktop, and screen-audio resources; cleanup failure
leaves the call. A media-service `KICKED` event also performs terminal local
cleanup and stops the heartbeat. After a successful moderator kick, the
matching product participant is marked left idempotently so shared occupancy
cannot remain ghosted. Explicit sign-out leaves the active call before clearing
the authentication token, so its final occupancy update remains authorized.

Remote-participant call context menus are available from call tiles and the
participant rows nested under community voice channels. Desktop users can
right click, keyboard users can press the Menu key or Shift+F10, and touch users
can press and hold for 500 ms; moving to scroll cancels the long press. An
explicit more-actions button remains available as a touch and accessibility
fallback. These call contexts combine profile and message actions with local
audio and eligible server moderation controls. The general community member
list intentionally excludes local audio, server mute, and call-disconnect
controls; its menu remains focused on profile, messaging, timeout, kick, and
ban. Destructive community actions retain their reason and confirmation dialog.

Each client keeps a versioned, device-local per-user audio map. Local mute and
0–100 percent volume affect only the remote `<audio>` element on that client;
they do not publish presence, change server state, or notify the other member.
Unmuting preserves the previously selected volume. Deafen remains a separate
call-wide local output control and takes precedence over individual settings.

Local browser media is stopped before conference departure, transport
disconnect, or product-presence network work, and all of those network waits
are bounded. Recoverable media failures retry after 750 ms, 1.5 seconds, and 3 seconds.
Automatic reconnect retains local tracks and does not announce a departure.
A conference must remain joined for ten seconds before it resets the attempt
count, so a flapping connection still exhausts the bounded retry budget.
Exhaustion reports an error and announces departure; if that request fails,
expiry cleanup is the fallback. A stale dynamically imported Jitsi module may trigger one guarded
service-worker/cache-clearing reload per 30 seconds and records the generic call
target for resume. Calls remain active across channel and conversation
navigation. Resume resolves its exact channel or conversation descriptor
directly when the target is outside the currently loaded navigation pages.
Access revocation removes only participants who actually lose
target access and also ejects their live Jitsi occupants through the private
call-control endpoint. Revocation targets the user identity verified from each
occupant's JWT session; client-reported media identifiers are never trusted as
ejection authority. If the media-control endpoint is temporarily unavailable,
the authorization change still commits and a private durable outbox retries the
ejection with bounded backoff from the transient-cleanup cron. Each queued
intent has a monotonic revision, so an older worker can mutate it only if the
exact revision it loaded is still current; final delete and retry updates use
atomic ID-and-revision comparisons. A fresh intent resets retry state.
A queued
policy-fallback ejection is retained while either speaking or video authority
is still restricted, even when voice-channel access itself remains allowed.
Inline dispatch considers only the exact intent revisions queued by that
mutation, groups compatible room/action operations into multi-user control
requests, and has a five-second wall-time budget. Restored channel authority
emits a policy update that clears stale media restrictions. Cron retries page
through due intents, group compatible kick, policy, and token-revocation
operations, and stop at a twenty-second budget. A required token revocation
must succeed before its dependent kick or policy update is dispatched.
Terminal media failures disconnect Jitsi and dispose microphone, camera,
desktop, and captured screen-audio resources before leaving retry metadata in
the call UI.

On Windows desktop builds, the source picker defaults its per-share "Share
system audio" choice off. Display capture requests Electron loopback audio only
after that explicit choice; closing or completing the picker discards consent.

## Account deletion lifecycle

Account deletion is transactional:

- communities owned by the account are deleted with their related data;
- two-person direct conversations involving the account are deleted;
- group conversations remain, and ownership transfers to the earliest
  remaining member or the empty group is deleted;
- authored channel and direct messages and created invites are deleted;
- bans moderated by the account transfer to the community owner, or are
  deleted if their community no longer exists;
- calls started by the account transfer to the community owner and are ended
  when no other unexpired participant remains;
- audit and notification actor references are cleared;
- the user is deleted last, allowing relation cascades to remove memberships,
  presence, participation, and other user-owned records.

## Automated protection

Focused tests cover permission layering, hidden channels, timeouts,
conversation membership, messaging adapters and read-receipt deduplication,
message restrictions, Jitsi claims and expiry, generic occupancy isolation,
simultaneous devices, concurrent first joins, revoked-media cleanup, reconnect
and retained-track policies, precise permission-change ejection, deep links,
realtime retry and invalidation, and account deletion.

The canonical policy manifest generates the TypeScript and PocketBase runtime
artifacts. Repository checks also validate the clean baseline's policy-derived
schema snapshot so runtime policy and fresh-install schema cannot drift.

User preferences are a hidden auth-record field. Standard authenticated user
list, view, and auth responses never serialize it; only the owner-only account
preferences routes read or update it. Preference updates are validated
field-level patches merged transactionally with the current private value, so
concurrent feature-specific writes do not erase unrelated settings. Profile
and mute controls merge the private response into the local authenticated-user
state. Notification and call hooks decode PocketBase's JSONRaw representation
through the same preference reader before applying mute settings.
