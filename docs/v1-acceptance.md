# V1 acceptance checklist

This checklist is the release gate for the first complete Thiscord version. An
item is only complete after implementation and proportional automated or
browser verification.

The two unchecked items are release-candidate device gates, not missing product
surfaces: they require two independent camera/microphone clients and a packaged
desktop session with real OS media permissions. Run them against the production
domains before publishing an installer.

## Data correctness and reliability

- [x] Account deletion works for owners, authors, moderators, call starters,
      conversation owners, and ordinary members without leaving invalid records.
- [x] Moderation cancel never performs an action; destructive member and group
      actions require explicit confirmation.
- [x] Invite acceptance is transactionally idempotent and does not duplicate
      membership audit events or invite usage.
- [x] Slow mode compares against the author's newest message.
- [x] Presence does not flicker offline during React lifecycle changes and
      surfaces connectivity failures.
- [x] Realtime subscriptions reconnect or expose degraded state instead of
      silently failing.
- [x] Channel and direct-message history paginate beyond 100 messages.
- [x] Reactions, notifications, unread state, and audit history do not require
      loading unbounded collections.

## Search, notifications, and messaging

- [x] Global search works from community and direct-message routes on desktop
      and responsive layouts.
- [x] Search covers accessible channels, people, channel messages, and direct
      messages with loading, empty, and error states.
- [x] Message search results navigate to and highlight the matching message.
- [x] Channel search is server-backed and distinguishes no matches from an empty
      channel.
- [x] Member search opens a member summary with an explicit Message action.
- [x] Notifications paginate, can be marked read in bulk, and respect muted
      channels.
- [x] Inbox remains accessible on responsive layouts.
- [x] Notification sound preference has runtime behavior.
- [x] Channel and direct-message typing indicators work.
- [x] Message actions are available by keyboard and touch, not hover only.
- [x] Attachments show upload state, validation, image previews, and safe
      download/open behavior.
- [x] Messages support safe Markdown, links, mention presentation, and link
      previews when permission permits.
- [x] Emoji insertion and reactions use a usable picker instead of one fixed
      emoji.
- [x] DMs support search, typing, and appropriate message actions.

## Communities, roles, and channels

- [x] Categories can be created and channels/categories can be reordered.
- [x] Announcement and age-restricted channels have visible, meaningful
      behavior.
- [x] Role ordering, colors, hoisting, mentionability, and member grouping are
      applied consistently.
- [x] Member nicknames can be edited by authorized users.
- [x] `embed_links`, `mention_everyone`, `move_members`, and `deafen_members`
      permissions are either implemented or removed from the v1 surface.
- [x] Community banners are rendered.
- [x] Channel permission overrides are grouped, searchable, resettable, and do
      not require an unreadable wall of controls.
- [x] Member, role, invite, ban, clipboard, and audit actions expose success and
      failure states.
- [x] Audit history paginates and displays human-readable targets.
- [x] Groups have a complete empty state, member confirmations, busy states, and
      an avatar treatment.

## Account, settings, accessibility, and visual quality

- [x] Auth mode changes clear stale errors and all submissions prevent duplicate
      requests.
- [x] Registration and verification-email outcomes are sequenced and visible.
- [x] Profile/community image controls are styled, previewable, removable, and
      responsive.
- [x] Theme, compact mode, reduced motion, notification sound, and muted-channel
      preferences have UI and runtime behavior.
- [x] All forms expose busy, success, and error states without contradictory
      feedback.
- [x] Modals close with Escape, trap and restore focus, label controls, and hide
      background content from assistive technology.
- [x] Icon-only controls have accessible names and search is announced as search.
- [x] Touch, keyboard, focus, and reduced-motion behavior are verified.
- [x] Native white controls, stretched avatars, tiny text, bright scrollbars,
      verification-row collisions, and narrow settings layouts are removed.
- [x] Desktop and responsive layouts use space efficiently without hiding core
      actions.

## Voice and Jitsi

- [x] Joining keeps the current text view; selecting the connected voice channel
      opens the full voice surface.
- [x] Dock and full voice controls are consistent without confusing duplicates.
- [x] Device-selection failures and Jitsi connection errors are visible and
      recoverable.
- [x] Moderator mute and remove actions match exposed permissions; unsupported
      move and deafen permissions are not exposed.
- [ ] Two independent clients verify audio-state, video-state, screen sharing,
      presence, disconnect, and call cleanup.
- [x] Wide and responsive call layouts use available space efficiently.

## Distribution and operations

- [x] Runtime distribution branding updates the PWA name, manifest, icons,
      document metadata, and support surface.
- [x] Electron protocol and product branding derive from release configuration.
- [x] PWA provides conventional install icons and documents offline behavior.
- [x] Update and support configuration is reachable in the app.
- [ ] Windows packaged authentication and call flows are smoke-tested.
- [x] macOS/Linux runtime limitations and required signing tests are explicit.
- [x] Build size and dependency advisories are documented with an upgrade path.
- [x] Development, deployment, administration, backup, and release instructions
      remain concise and accurate.
