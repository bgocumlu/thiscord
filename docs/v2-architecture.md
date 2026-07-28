# Thiscord V2 Architecture Plan

## Purpose

V2 is the architecture and maintainability program for Thiscord. Its purpose is
to remove assumptions that make new communication contexts expensive to add,
especially the current assumption that every call belongs to a community voice
channel.

V2 is not a big-bang rewrite, but it is a pre-release clean break. Thiscord has
no production users or durable installations to preserve, so V2 must not carry
legacy schema, compatibility endpoints, data backfills, or old-client support
without a current product reason. Work still proceeds in reviewable stages and
keeps the development build usable throughout the transition.

The first feature that should benefit from this architecture is voice and video
calling in direct and group conversations.

## Why V2 was needed

Before the V2 work, several domain rules were repeated across the database
schema, PocketBase hooks, shared types, React queries, routing, and UI
components. The most important example was calling:

- Jitsi room identifiers were stored on community channels.
- Call sessions had a required channel relation.
- Call access was resolved only through community and channel permissions.
- Call presence and token routes were nested under channels.
- The client call provider accepted and retained a `Channel`.
- Occupancy queries were scoped to a community.

That design could not add a call to a direct or group conversation without
duplicating the call stack or changing every layer at once.

Other repeated assumptions create similar long-term costs:

- channel-kind behavior is expressed through scattered string comparisons;
- permission definitions and groups are duplicated between client and server;
- validation limits are repeated in schema, backend, and forms;
- community and direct messaging have parallel implementations;
- routes, API paths, collection names, query keys, and invalidation rules are
  embedded in large UI components;
- large feature files make unrelated changes difficult to isolate and review;
- several full-list queries and fixed record caps create practical scaling
  boundaries.

## V2 principles

1. **Prefer the clean target design.** There is no production data or supported
   previous client, so temporary compatibility layers are unnecessary.
2. **Preserve authorization semantics.** Refactoring must not silently widen
   access to channels, conversations, messages, files, or calls.
3. **Separate capability from container.** Calling is a capability that can be
   attached to a channel or conversation; it is not inherently a channel.
4. **Keep domain differences explicit.** Community channels and private
   conversations may share infrastructure without sharing identical policy.
5. **Prefer feature boundaries over bags of constants.** Extract cohesive
   behavior, data access, and tests rather than only moving strings into a
   constants file.
6. **Establish a clean V2 baseline.** Before V2 is released, the current
   pre-user migration history may be replaced or squashed into a clean baseline.
   Once that baseline is published and used by real installations, it becomes
   immutable and later schema changes use forward migrations.
7. **Avoid speculative generality.** V2 must support known contexts—channels
   and conversations—without introducing a plugin system or abstract framework
   that the product does not yet need.
8. **Every stage must be releasable.** A partially completed V2 phase must not
   leave unfinished controls or require an immediate follow-up deployment.

## Scope

V2 includes:

- feature-level client and PocketBase module boundaries;
- characterization tests for current behavior;
- canonical domain policy definitions;
- typed application routes and centralized data-access contracts;
- a generic call-room and call-target model;
- reuse of call infrastructure by community channels and conversations;
- shared messaging presentation and behavior adapters;
- more targeted realtime invalidation;
- removal of hidden practical user-count assumptions;
- stronger types for preferences, notifications, and domain references;
- consistent use of distribution branding in user-visible surfaces.

V2 does not initially include:

- merging community and direct messages into one database collection;
- threads, forums, stages, recording, bots, webhooks, or federation;
- a general plugin or dynamically loaded channel-type system;
- changing the stable `/api/thiscord` namespace;
- renaming internal storage, cache, or IPC identifiers for each distribution;
- making every development timeout, port, or visual measurement configurable.

V1 database and client compatibility are also out of scope because there are no
production users or installations to migrate.

## Target domain model

### Call targets

Client and shared contracts should represent the thing being called through a
discriminated target:

```ts
type CallTarget =
  | { kind: "channel"; id: string }
  | { kind: "conversation"; id: string };
```

A client-facing descriptor may add presentation and navigation data:

```ts
interface CallTargetDescriptor {
  target: CallTarget;
  name: string;
  href: string;
}
```

The call engine and React provider must depend on this descriptor rather than a
complete `Channel` record.

### Call rooms

An installation should have a durable call-room record that owns the opaque
Jitsi room identifier. A call room is attached to exactly one supported target.
Call sessions then belong to a call room instead of directly to a channel.

The final PocketBase representation is a `call_rooms` collection with explicit
nullable `channel` and `conversation` relations, unique indexes for each
relation, and both request-hook and database-trigger enforcement that exactly
one relation is populated. This retains referential integrity while supporting
both known target types.

Call access is resolved on the server:

- **channel target:** active community membership, channel visibility,
  channel permission overwrites, timeout state, and voice permissions;
- **conversation target:** current conversation membership and the conversation
  call policy;
- **future target:** a new explicit resolver and authorization policy.

The server remains authoritative. A target kind or identifier supplied by a
client never grants access by itself.

### Channel capabilities

`ChannelKind` remains a closed domain enum. V2 adds canonical capability
metadata so behavior is not reconstructed through scattered comparisons.

Initial capabilities include:

- container/category behavior;
- message support;
- call support;
- slowmode support;
- topics and age restriction;
- posting requirements;
- applicable permission groups;
- settings fields exposed by the client.

Adding a channel kind must require an explicit capability definition, backend
validation, UI rendering decision, migration decision, and test coverage.

### Canonical policies

A canonical policy manifest should define:

- permission identifiers, labels, and UI groups;
- permission implications and restrictions;
- permissions removed by hidden-channel and timeout states;
- channel capabilities;
- message and attachment limits;
- profile, community, channel, role, and conversation field limits;
- conversation member limits;
- heartbeat, expiry, and refresh timing where client/server coordination is
  required.

PocketBase hooks cannot depend directly on TypeScript runtime modules. The
build/check process should therefore generate or validate compatible
TypeScript and PocketBase JavaScript artifacts from the canonical manifest.
Generated artifacts must be deterministic and checked for drift.

The clean V2 baseline migration snapshots the policy values required to create
a new installation. Runtime policy artifacts remain canonical for application
behavior after installation.

## Feature boundaries

### Renderer

The renderer is organized into feature modules:

```text
features/
  calls/
  channels/
  communities/
  conversations/
  members/
  messaging/
  notifications/
  roles/
  search/
```

Each feature owns its relevant components, query hooks, mutations, cache-key
factory, and API adapter. Shared infrastructure remains domain-neutral.

The workspace shell coordinates routing, layout, and high-level composition.
Presence, notifications, search, call navigation, messaging, administration,
and dialog implementations live in their owning features.

### PocketBase hooks

Protected routes should be split by domain while retaining shared security
helpers:

```text
pb_hooks/
  routes/
    calls.pb.js
    channels.pb.js
    communities.pb.js
    conversations.pb.js
    members.pb.js
    messages.pb.js
    notifications.pb.js
    roles.pb.js
    search.pb.js
  lib/
    authorization.js
    policies.generated.js
    validation.js
```

Splitting files must not change route paths or access behavior by itself.

### Data access and routing

UI components should not assemble PocketBase filters, API paths, and cache
invalidation lists inline. Feature adapters should expose operations with typed
inputs and results.

Application navigation should use typed route parsing and builders for:

- community channels;
- direct and group conversations;
- messages and search targets;
- invites and authentication callbacks;
- focused call targets.

The current `@me` URL may remain for compatibility, but it should be represented
by route helpers rather than repeated as a sentinel throughout the UI.

Realtime collection events should map explicitly to affected query keys.
Correct invalidation must not depend on a collection name accidentally matching
the first element of a query key.

## Messaging strategy

V2 shares messaging behavior without merging persistence. The common
message-surface contract covers:

- pagination and search;
- composing and attachments;
- editing and soft deletion;
- replies, reactions, and pins;
- typing and read state;
- feature-specific authorization and disabled reasons.

Channel and conversation adapters implement that contract. Channel moderation
permissions and conversation membership/ownership rules remain explicit.

Database unification is deferred. It should be reconsidered only when a third
message context, such as threads or forums, demonstrates that maintaining
separate collections costs more than the authorization and migration
complexity of a unified model.

## Clean cutover strategy

### Schema baseline

V2 produces one coherent schema for fresh installations:

1. Add call-room storage and target relations to the intended V2 schema.
2. Make call sessions relate to call rooms instead of channels.
3. Remove `jitsiRoom` from channels.
4. Define channel and conversation call access against the same call-room
   service.
5. Remove channel-only call relations, rules, and collection assumptions.
6. Reset disposable development data and validate a fresh installation.
7. Replace the pre-user migrations with the single
   `1785031200_v2_baseline.js` migration before the first supported V2 release.

No channel-call backfill is required. Existing local PocketBase data is treated
as disposable and should be reset explicitly rather than carried through
production-oriented migration machinery.

### API cutover

Replace channel-specific call token and presence endpoints with the generic
call API. Do not retain deprecated aliases solely for hypothetical older
clients.

Generic APIs should use call terminology rather than exposing Jitsi as the
product contract. Jitsi remains the current media provider, not the domain
model.

The PWA, desktop renderer, PocketBase hooks, and schema are released as one V2
contract. A mixed V1/V2 deployment is unsupported before the first production
release.

### Development rollback

Rollback during development is source-control rollback plus recreation of the
disposable PocketBase database from the last known schema. Do not add runtime
compatibility branches for rollback.

## Delivery phases

Phases 0–5 are complete in the pre-release V2 source. The list below is retained
as the delivery record and as guidance for future architectural work.

### Phase 0 — Baseline and characterization

- Document current authorization and lifecycle behavior.
- Add focused tests for permission resolution, channel visibility, message
  policies, conversation membership, Jitsi token issuance, call occupancy,
  reconnect behavior, and account deletion.
- Establish checks that generated policy artifacts remain synchronized.

**Exit gate:** current behavior is protected well enough to move code without
depending only on end-to-end smoke tests.

### Phase 1 — Boundaries without behavior changes

- Split renderer features out of the workspace component.
- Split PocketBase route registrations by domain.
- Introduce API adapters, query-key factories, and route builders.
- Separate the Jitsi engine lifecycle from call-target presentation and
  navigation state.
- Preserve all existing API paths, records, and UI behavior.

**Risk:** low to medium.

**Exit gate:** current acceptance and smoke tests pass, diffs are feature-local,
and no schema migration is required.

### Phase 2 — Canonical contracts and policies

- Add the canonical permission and capability manifest.
- Generate or validate frontend and PocketBase artifacts.
- Centralize coordinated validation limits and transient timing.
- Add discriminated types for preferences, notifications, search targets, and
  call targets.
- Make conversation kind explicit rather than deriving it only from member
  count.

**Risk:** medium, with authorization work treated as security-sensitive.

**Exit gate:** client and server reject policy drift, and existing authorization
tests remain unchanged.

### Phase 3 — Generic call rooms

- Add the call-room model to the V2 schema baseline.
- Replace the pre-user call schema with the call-room model.
- Implement target-specific authorization resolvers.
- Make call sessions and occupancy operate through call rooms.
- Convert the current voice-channel UI to the generic client contract.
- Remove channel-only call endpoints and fields in the same phase.

**Risk:** high.

**Exit gate:** existing voice calls behave identically before any conversation
call control is exposed.

### Phase 4 — Conversation calls

- Define direct and group call permissions and initiation policy.
- Add conversation call discovery, join, leave, occupancy, and notifications.
- Add responsive and desktop UI entry points.
- Verify navigation does not end an active call.
- Verify group membership changes revoke access correctly.
- Cover simultaneous devices, reconnects, account deletion, and ownership
  transfer.

**Risk:** medium after Phase 3 is stable.

**Exit gate:** direct and group calls meet the same reliability and privacy
requirements as channel calls.

### Phase 5 — Scale and cleanup

- Replace full member-list and large OR-filter queries with paginated or
  server-aggregated APIs.
- Remove fixed query caps that silently undercount valid installations.
- Narrow realtime subscriptions and invalidation.
- Consolidate semantic design tokens and distribution-controlled branding.

**Risk:** medium.

## Verification requirements

Every V2 phase must pass:

- TypeScript type checks and renderer linting;
- PocketBase migration validation;
- backend and packaged-client smoke tests;
- fresh-install tests;
- authorization tests for visible and hidden channels;
- authorization tests for direct and group conversation membership;
- file-access tests for both messaging contexts;
- call join, leave, expiry, reconnect, and occupancy tests;
- desktop and PWA navigation tests;
- responsive checks for affected UI.

Call-room releases additionally require:

- no Jitsi secret or room identifier exposure beyond existing authenticated
  contracts;
- exactly-one-target validation;
- no occupancy leakage between communities or conversations;
- participant cleanup after disconnect and expiry;
- clean schema creation with no legacy channel-call fields or endpoints.

### Final implementation verification

The completed V2 architecture was verified on 2026-07-28 with:

- `npm run check`, including renderer lint, all workspace type checks, 48
  renderer tests, 75 PocketBase authorization and migration tests, and policy
  drift checks;
- `npm run build`;
- `git diff --check`;
- circular-dependency and unused-export scans over the renderer;
- local and production Docker Compose configuration parsing;
- `npm run package:dir` and `npm run smoke:package`;
- the PocketBase smoke suite against PocketBase 0.39.9 and a newly created
  temporary data directory, including pre-presence JWT revocation;
- baseline migration up, rollback, and re-apply operations against a separate
  temporary data directory; and
- a rebuilt `stable-10978` Prosody image, Lua syntax/startup checks, and
  persistent monotonic token-version storage across a container restart.

The production release validator is intentionally not a passing repository
check while `distribution.json` contains example hostnames. It must be rerun
with real release endpoints before distribution. Real camera, microphone,
screen-audio, and remote Jitsi transport behavior still require a manual
multi-device pass in the intended deployment environment. Windows packaged-app
launch was smoke-tested; installer signing and non-Windows packaging remain
release-environment checks rather than V2 architecture work.

## V2 success criteria

V2 is complete when:

- calls can belong to either a community voice channel or a conversation
  without duplicating the media stack;
- the call provider no longer depends on a `Channel`;
- permissions, channel capabilities, and coordinated limits have canonical
  definitions with automated drift checks;
- renderer and backend changes are organized by feature;
- route construction, data access, query keys, and realtime invalidation are
  explicit contracts;
- current community and direct messaging reuse common behavior while retaining
  their distinct authorization policies;
- practical scaling behavior matches the documented absence of a hard user
  count boundary;
- no unused V1 call schema, compatibility endpoints, or migration branches
  remain in the supported V2 baseline.

## Recorded call decisions

The Phase 3 prerequisites are resolved in
`docs/v2-phase3-decisions.md`. The final implementation uses lazy durable rooms
for conversations, one active session per target, membership-based
conversation call access, immediate revoked-participant cleanup, muted/DND
notification filtering, ordered private page leases with public aggregates,
and the clean V2 baseline.
