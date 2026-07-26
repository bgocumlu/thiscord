# Enhancement backlog

This document records desirable work that is intentionally outside the current
v1 acceptance gate. An item belongs here when the existing product remains
coherent without it and no unfinished or misleading control is exposed.

Moving an item into a release requires defining its UX, permissions, backend
contract, failure states, responsive behavior, and verification plan. Completed
items should be removed from this backlog and recorded in the relevant
acceptance or architecture document.

## Messaging and notifications

- Browser push notifications with explicit permission onboarding, per-device
  subscriptions, revocation, and installation-level configuration.
- Notification-history deletion or clearing, separate from the existing
  mark-all-read action.
- Composer mention autocomplete for members, mentionable roles, and
  `@everyone`, filtered by the current channel's permissions.
- Attachment transfer progress based on bytes uploaded rather than the current
  indeterminate uploading state.
- Attachment upload cancellation with reliable request abort and composer
  recovery.

## Communities and administration

- Drag-and-drop ordering for categories, channels, and roles. The existing
  accessible Move up/down controls must remain available as the keyboard and
  assistive-technology alternative.
- Permission presets for common channel patterns. Presets must remain editable
  and show the exact allow/deny changes before saving.
- A dedicated signed-out “Invite unavailable” screen for invalid, expired,
  revoked, or exhausted invites instead of presenting the error in the sign-in
  form.

## Voice and media

- Remote movement of a participant between voice channels. This requires
  authoritative backend permission checks, target-channel access validation,
  explicit participant feedback, and Jitsi reconnection behavior.
- Remote deafening of another participant. This needs a clear distinction
  between server-enforced moderation state and the participant's local audio
  output state.
- Surface unexpected per-track speaker-output routing failures after a speaker
  has passed the initial device-selection check.

The `move_members` and `deafen_members` permissions are not currently exposed.
They should only return with their corresponding behavior fully implemented.

## Larger product extensions

These remain compatible with the product direction but require their own scope
and acceptance criteria:

- Native iOS and Android applications.
- Threads and forum-style channels.
- Bots, webhooks, and an application integration model.
- Federation between independently operated installations.
- Stage-style voice channels.
- Jitsi recording through Jibri.
- An optional marketing and download site for a distribution.

## Adding an enhancement

Add new ideas to the appropriate section with:

- the user-visible outcome;
- important permission or safety requirements;
- dependencies or protocol constraints;
- what must be tested before it can leave this backlog.
