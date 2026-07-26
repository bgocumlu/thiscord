# Thiscord Product Plan

This document records the durable product decisions agreed before and during implementation. It is the source of truth for product direction; implementation details are documented separately.

## Product

Thiscord is an open, white-label communication platform. It provides text channels and Jitsi-powered voice, video, and screen sharing.

Each distribution is its own branded product built from the Thiscord source. A distribution can have its own name, icons, colors, domains, support links, installers, update feed, PocketBase deployment, and Jitsi deployment.

Example:

```text
yourcord.com          optional marketing and downloads
app.yourcord.com      static web application
api.yourcord.com      PocketBase API and administration
meet.yourcord.com     Jitsi
Yourcord.exe/.dmg     preconfigured branded desktop application
```

The desktop application is not a generic instance picker. It is built for one distribution and opens that distribution automatically.

## Confirmed decisions

- Upstream product name: **Thiscord**
- Initial clients: Windows, macOS, Linux, and a responsive installable web app
- Initial phone and tablet experience: responsive PWA
- Native iOS and Android applications: deferred until after the initial release
- Repository: one monorepo for clients, backend extensions, deployment, branding, documentation, and shared packages
- Distribution model: independent white-label installations
- Initial federation: not included
- User count is not a hard product, code, or configuration boundary
- Product backend: PocketBase
- Durable database: PocketBase's embedded SQLite database
- Authentication: PocketBase auth collections
- Application realtime: PocketBase realtime subscriptions
- Files: PocketBase local file storage, with optional S3-compatible storage
- Media: a self-hosted Jitsi deployment
- Reverse proxy and TLS: Caddy
- Frontend deployment: static hosting without Docker
- Backend deployment: Docker Compose for PocketBase, Jitsi, and TURN
- The approved visual direction is implemented against the real backend; mock data is no longer part of the application

## Architecture

```text
React web application ───────┐
                             ├── PocketBase
Electron desktop application ┘     ├── authentication
                                   ├── SQLite data
                                   ├── files
                                   ├── realtime SSE
                                   └── small JS/Go extensions

React web application ───────┐
                             ├── Jitsi Meet
Electron desktop application ┘     ├── Prosody
                                   ├── Jicofo
                                   ├── Videobridge
                                   └── Coturn
```

PocketBase owns persistent product state. Jitsi owns live media sessions. Jitsi chat and conference state are not the durable source of truth for Thiscord.

## PocketBase responsibilities

Expected collections include:

```text
users
communities
memberships
roles
member_roles
channels
messages
reactions
read_states
invites
bans
audit_events
presence
typing
direct_typing
notifications
conversations
conversation_members
direct_messages
direct_reactions
call_sessions
call_participants
```

PocketBase API rules provide basic instance and membership isolation. Complex Discord-style permission evaluation and privileged operations use small authenticated PocketBase JavaScript routes or hooks.

Protected route groups:

```text
communities, channels, ordering, permissions
messages, reactions, typing, read state, search
roles, memberships, invites, bans, moderation, audit
conversations, direct messages, notifications
presence, Jitsi tokens, call occupancy, account deletion
```

This is extension code inside the PocketBase process, not a separate general-purpose backend service.

## Jitsi responsibilities

Jitsi provides:

- Voice calls
- Video calls
- Screen sharing
- Live conference participants
- Media-device selection
- Conference moderation primitives

The PocketBase Jitsi-token route authenticates the user, evaluates voice permissions, checks bans and timeouts, and returns a short-lived JWT for an opaque room identifier. Jitsi secrets never ship in browser or Electron code.

Recording through Jibri is optional and not part of the first release.

## Initial product scope

- Account registration, login, verification, and profile
- Communities and membership
- Text and voice/video channels
- Roles and per-channel permissions
- Invites, kicks, bans, and timeouts
- Messages, edits, deletion, replies, reactions, pins, and attachments
- Presence, typing, unread markers, and mentions
- Direct messages and small group messages
- Voice, video, mute, deafen, camera, and screen sharing
- Member list, settings, search, and notifications
- Branded responsive PWA and desktop builds
- PWA installation and an offline application shell
- Desktop packaging and updates

Native mobile applications, threads, forums, bots, webhooks, federation, stages, and recording can follow after the core product.

Deferred product improvements are maintained in the
[enhancement backlog](enhancements.md). That backlog is separate from the v1
release gate so adding an idea does not silently change the meaning of an
accepted release.

## Visual direction

Thiscord should feel like its own product rather than a reskinned Discord.

- Square and subtly chamfered shapes instead of circles and pills
- Avatars and community icons use small corner radii
- Dense desktop layout with clear panel boundaries
- Dark neutral foundation with distribution-controlled accent tokens
- Strong typography and restrained decoration
- Status dots may remain circular because their shape carries meaning
- The Jitsi surface should inherit the distribution's square visual language where practical

## Implementation baseline

The monorepo now contains the persistent PocketBase schema and protected routes,
the real React PWA, the Electron shell, Jitsi JWT integration, distribution
configuration, a static frontend deployment, and a backend-only Compose
deployment. Local mock repositories were removed.

The marketing and download site is intentionally a separate deployable surface and is not required to operate a Thiscord installation. Native mobile applications remain deferred; the initial phone and tablet surface is the responsive PWA.

## Target monorepo

The existing npm-workspaces repository remains the foundation. It should evolve toward:

```text
apps/
  desktop/          Electron main and preload
  renderer/         shared React product client for Electron and web
  local-backend/    packaged desktop renderer host
  marketing/        optional branded marketing site

packages/
  shared/           cross-process and domain types
  ui/               reusable branded UI components
  pocketbase/       schema, migrations, hooks, and custom routes
  branding/         distribution configuration and tokens

infra/
  compose/          complete deployment
  caddy/            proxy and TLS templates
  jitsi/            Jitsi configuration
  pocketbase/       pinned PocketBase image

distributions/
  example/          example brand configuration and assets

docs/
  product-plan.md
  deployment/
  development/
```

This is a target layout, not a requirement to create empty packages before they contain real code.

## Known constraints

- PocketBase remains pre-1.0, so upgrades must be pinned, reviewed, backed up, and tested.
- The initial architecture favors a simple single-server backend but does not enforce a user cap.
- Presence and typing use conservative heartbeat/expiry behavior to avoid needless SQLite writes.
- Jitsi capacity is driven by simultaneous media usage, not registered Thiscord users.
- A branded macOS or Windows desktop release requires that distribution's signing and update configuration.
