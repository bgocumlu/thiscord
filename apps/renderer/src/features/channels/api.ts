import type { Channel, EffectivePermissions } from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export interface ChannelPage {
  readonly page: number
  readonly perPage: number
  readonly hasMore: boolean
  readonly items: Channel[]
}

export const channelApi = {
  create(
    client: PocketBase,
    communityId: string,
    input: {
      readonly name: FormDataEntryValue | null
      readonly kind: string
      readonly topic?: FormDataEntryValue | null
      readonly parent?: string
    },
  ) {
    return client.send<Channel>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/channels`,
      { method: 'POST', body: input },
    )
  },
  get(client: PocketBase, channelId: string) {
    return client.send<Channel>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}`,
      {},
    )
  },
  list(client: PocketBase, communityId: string, page: number, perPage = 50) {
    const search = new URLSearchParams({ page: String(page), perPage: String(perPage) })
    return client.send<ChannelPage>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/channels?${search}`,
      {},
    )
  },
  permissions(client: PocketBase, channelId: string) {
    return client.send<{ readonly items: Array<{
      readonly id: string
      readonly channel: string
      readonly targetType: 'role' | 'member'
      readonly targetId: string
      readonly allow: string[]
      readonly deny: string[]
    }> }>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}/permissions`,
      {},
    )
  },
  effectivePermissions(client: PocketBase, communityId: string, channelId = '') {
    const suffix = channelId ? `?channel=${encodeURIComponent(channelId)}` : ''
    return client.send<EffectivePermissions>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/permissions${suffix}`,
      {},
    )
  },
  update(client: PocketBase, channelId: string, patch: Record<string, unknown>) {
    return client.send(`/api/thiscord/channels/${encodeURIComponent(channelId)}`, {
      method: 'PATCH',
      body: patch,
    })
  },
  remove(client: PocketBase, channelId: string) {
    return client.send(`/api/thiscord/channels/${encodeURIComponent(channelId)}`, {
      method: 'DELETE',
    })
  },
  order(client: PocketBase, communityId: string, ids: readonly string[]) {
    return client.send(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/channels/order`,
      { method: 'PUT', body: { ids } },
    )
  },
  move(client: PocketBase, channelId: string, direction: -1 | 1) {
    return client.send<{ readonly ids: string[] }>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}/move`,
      { method: 'POST', body: { direction } },
    )
  },
  setPermissions(
    client: PocketBase,
    channelId: string,
    input: {
      readonly targetType: 'role' | 'member'
      readonly targetId: string
      readonly allow: readonly string[]
      readonly deny: readonly string[]
      readonly editedPermissions?: readonly string[]
    },
  ) {
    return client.send(`/api/thiscord/channels/${encodeURIComponent(channelId)}/permissions`, {
      method: 'PUT',
      body: input,
    })
  },
} as const
