# V2 Phase 3 call decisions

These decisions satisfied the architecture plan's Phase 3 prerequisites and
remain the current call policy. Phases 3 and 4 are complete: the generic storage
and authorization contracts serve both community voice channels and
conversations.

1. Call rooms are durable. A voice channel receives its room when the channel
   is created. A conversation will receive its room when conversation calling
   is first initiated, so conversations that never call do not create unused
   media identifiers.
2. Each target has one durable room and at most one active call session. A later
   call reuses the room but creates a new session after the previous one ends.
3. Any current conversation member may initiate or join its call. A separate
   invitation is not required.
4. Removing, leaving, or deleting a conversation member revokes call access
   immediately. The backend ends that user's active participant presence and
   removes each connected media occupant through the private Prosody
   call-control endpoint; normal expiry remains the transport-failure fallback.
5. Conversation calls use a simple current-membership policy. Community voice
   permissions remain specific to channel targets and are not reused for
   private conversations.
6. Call notifications will respect conversation mute and do-not-disturb
   preferences. They may fan out to all active devices, while occupancy remains
   one logical participant per account.
7. The pre-user migration history is consolidated into
   `1785031200_v2_baseline.js`. Developers adopting this source must recreate
   disposable PocketBase data; there is intentionally no V1 data migration,
   call endpoint alias, or compatibility branch.
