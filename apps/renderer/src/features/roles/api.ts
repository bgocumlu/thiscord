import type { Role } from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export const roleApi = {
  async list(client: PocketBase, communityId: string) {
    return await client.collection('roles').getFullList({
      filter: client.filter('community = {:community}', { community: communityId }),
      sort: '-position',
    }) as unknown as Role[]
  },
  create(
    client: PocketBase,
    communityId: string,
    input: {
      readonly name: FormDataEntryValue | null
      readonly color: FormDataEntryValue | null
      readonly permissions: readonly string[]
    },
  ) {
    return client.send<Role>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/roles`,
      { method: 'POST', body: input },
    )
  },
  update(client: PocketBase, roleId: string, patch: Record<string, unknown>) {
    return client.send(`/api/thiscord/roles/${encodeURIComponent(roleId)}`, {
      method: 'PATCH',
      body: patch,
    })
  },
  remove(client: PocketBase, roleId: string) {
    return client.send(`/api/thiscord/roles/${encodeURIComponent(roleId)}`, {
      method: 'DELETE',
    })
  },
  order(client: PocketBase, communityId: string, ids: readonly string[]) {
    return client.send(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/roles/order`,
      { method: 'PUT', body: { ids } },
    )
  },
} as const
