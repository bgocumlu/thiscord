import type {
  Community,
  Invite,
  InvitePreview,
  Membership,
  User,
} from '@thiscord/shared'
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'

export interface MembershipWithCommunity extends Membership {
  readonly expand?: {
    readonly user?: User
    readonly community?: Community
  }
}

export interface BanRecord extends RecordModel {
  readonly user: string
  readonly moderator: string
  readonly reason: string
  readonly expiresAt: string
  readonly expand?: {
    readonly user?: User
    readonly moderator?: User
  }
}

export const communityApi = {
  async memberships(client: PocketBase, userId: string) {
    return await client.collection('memberships').getFullList({
      filter: client.filter("user = {:user} && state = 'active'", { user: userId }),
      expand: 'community',
      sort: 'created',
    }) as unknown as MembershipWithCommunity[]
  },
  create(
    client: PocketBase,
    input: {
      readonly name: FormDataEntryValue | null
      readonly description: FormDataEntryValue | null
    },
  ) {
    return client.send<Community>('/api/thiscord/communities', { method: 'POST', body: input })
  },
  previewInvite(client: PocketBase, code: string) {
    return client.send<InvitePreview>(
      `/api/thiscord/invites/${encodeURIComponent(code)}/preview`,
      {},
    )
  },
  acceptInvite(client: PocketBase, code: string) {
    return client.send<Membership>(
      `/api/thiscord/invites/${encodeURIComponent(code)}/accept`,
      { method: 'POST' },
    )
  },
  invites(client: PocketBase, communityId: string, page: number, perPage = 30) {
    return client.send<{
      readonly page: number
      readonly perPage: number
      readonly hasMore: boolean
      readonly items: Invite[]
    }>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/invites?perPage=${perPage}&page=${page}`,
      {},
    )
  },
  audit(client: PocketBase, communityId: string, page: number, perPage = 50) {
    return client.send<{
      readonly page: number
      readonly perPage: number
      readonly items: Array<RecordModel & { readonly expand?: { readonly actor?: User } }>
    }>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/audit?perPage=${perPage}&page=${page}`,
      {},
    )
  },
  bans(client: PocketBase, communityId: string, page: number, perPage = 50) {
    return client.send<{
      readonly page: number
      readonly perPage: number
      readonly hasMore: boolean
      readonly items: BanRecord[]
    }>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/bans?page=${page}&perPage=${perPage}`,
      {},
    )
  },
  update(client: PocketBase, communityId: string, patch: Record<string, unknown>) {
    return client.send(`/api/thiscord/communities/${encodeURIComponent(communityId)}`, {
      method: 'PATCH',
      body: patch,
    })
  },
  createInvite(
    client: PocketBase,
    communityId: string,
    input: { readonly expiresInHours: number; readonly maxUses: number },
  ) {
    return client.send<Invite>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/invites`,
      { method: 'POST', body: input },
    )
  },
  revokeInvite(client: PocketBase, inviteId: string) {
    return client.send(`/api/thiscord/invites/${encodeURIComponent(inviteId)}`, {
      method: 'DELETE',
    })
  },
  unban(client: PocketBase, banId: string) {
    return client.send(`/api/thiscord/bans/${encodeURIComponent(banId)}`, {
      method: 'DELETE',
    })
  },
  remove(client: PocketBase, communityId: string) {
    return client.send(`/api/thiscord/communities/${encodeURIComponent(communityId)}`, {
      method: 'DELETE',
    })
  },
  leave(client: PocketBase, communityId: string) {
    return client.send(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/leave`,
      { method: 'POST' },
    )
  },
  transfer(client: PocketBase, communityId: string, userId: FormDataEntryValue | null) {
    return client.send(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/transfer`,
      { method: 'POST', body: { userId } },
    )
  },
} as const
