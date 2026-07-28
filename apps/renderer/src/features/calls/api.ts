import type { CallJoin, CallParticipantRecord, CallTarget } from '@thiscord/shared'
import type PocketBase from 'pocketbase'

interface CallPresence {
  readonly state: 'joined' | 'update' | 'left'
  readonly leaseId: string
  readonly sequence: number
  readonly muted?: boolean
  readonly deafened?: boolean
  readonly camera?: boolean
  readonly sharing?: boolean
}

interface CallPresenceResult {
  readonly active: boolean
  readonly accepted: boolean
  readonly sequence: number
  readonly canSpeak?: boolean
  readonly canStreamVideo?: boolean
  readonly canMuteMembers?: boolean
  readonly canRemoveMembers?: boolean
}

export function callAccessWasRevoked(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'status' in error
    && ((error as { status?: unknown }).status === 403 || (error as { status?: unknown }).status === 404)
}

export const callApi = {
  occupancy(client: PocketBase, targets: readonly CallTarget[]) {
    return client.send<{ readonly participants: CallParticipantRecord[] }>(
      '/api/thiscord/calls/occupancy',
      { method: 'POST', body: { targets } },
    )
  },
  join(client: PocketBase, target: CallTarget) {
    return client.send<CallJoin>(
      `/api/thiscord/calls/${target.kind}/${encodeURIComponent(target.id)}/join`,
      {},
    )
  },
  moderate(
    client: PocketBase,
    target: CallTarget,
    userId: string,
    action: 'server_mute' | 'server_unmute' | 'kick',
  ) {
    return client.send(
      `/api/thiscord/calls/${target.kind}/${encodeURIComponent(target.id)}/moderate`,
      { method: 'POST', body: { userId, action } },
    )
  },
  reportPresence(
    client: PocketBase,
    target: CallTarget,
    presence: CallPresence,
    signal?: AbortSignal,
  ) {
    return client.send<CallPresenceResult>(
      `/api/thiscord/calls/${target.kind}/${encodeURIComponent(target.id)}/presence`,
      { method: 'POST', body: presence, requestKey: null, signal },
    )
  },
} as const
