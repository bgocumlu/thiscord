import type {
  MemberRole,
  Membership,
  PresenceStatus,
} from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export interface PresenceRecord {
  readonly id: string
  readonly user: string
  readonly status: PresenceStatus
  readonly deviceId: string
  readonly expiresAt: string
}

export interface CommunityMemberPage {
  readonly page: number
  readonly perPage: number
  readonly hasMore: boolean
  readonly items: Membership[]
  readonly memberRoles: Array<{ readonly id: string; readonly membership: string; readonly role: string }>
  readonly presence: PresenceRecord[]
}

export const memberApi = {
  findByHandle(client: PocketBase, handle: string) {
    return client.collection('users').getFirstListItem(
      client.filter('handle = {:handle}', { handle }),
    )
  },
  list(
    client: PocketBase,
    communityId: string,
    input: { readonly page: number; readonly perPage?: number; readonly query?: string },
  ) {
    const search = new URLSearchParams({
      page: String(input.page),
      perPage: String(input.perPage ?? 50),
    })
    if (input.query) search.set('query', input.query)
    return client.send<CommunityMemberPage>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/members?${search}`,
      {},
    )
  },
  async roles(client: PocketBase, membershipId: string) {
    return await client.collection('member_roles').getFullList({
      filter: client.filter('membership = {:membership}', { membership: membershipId }),
    }) as unknown as MemberRole[]
  },
  setRoles(client: PocketBase, membershipId: string, roleIds: readonly FormDataEntryValue[]) {
    return client.send(`/api/thiscord/memberships/${encodeURIComponent(membershipId)}/roles`, {
      method: 'PUT',
      body: { roleIds },
    })
  },
  updateNickname(
    client: PocketBase,
    membershipId: string,
    nickname: FormDataEntryValue | null,
  ) {
    return client.send(`/api/thiscord/memberships/${encodeURIComponent(membershipId)}`, {
      method: 'PATCH',
      body: { nickname },
    })
  },
  moderate(
    client: PocketBase,
    communityId: string,
    input: {
      readonly action: 'kick' | 'ban' | 'timeout' | 'untimeout'
      readonly userId: string
      readonly reason: string
      readonly durationMinutes?: number
    },
  ) {
    return client.send(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/moderation`,
      { method: 'POST', body: input },
    )
  },
  updatePresence(
    client: PocketBase,
    input: { readonly deviceId: string; readonly status: 'online' | 'idle' | 'dnd' | 'offline' },
  ) {
    return client.send('/api/thiscord/presence', { method: 'POST', body: input })
  },
} as const
