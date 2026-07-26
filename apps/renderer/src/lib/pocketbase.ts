import type { DistributionConfig, StoredAuthSession } from '@thiscord/shared'
import PocketBase, { BaseAuthStore, ClientResponseError, type RecordModel } from 'pocketbase'

export async function createPocketBase(config: DistributionConfig): Promise<PocketBase> {
  const desktop = window.desktop
  const authStore = desktop ? new BaseAuthStore() : undefined
  const client = new PocketBase(config.pocketBaseUrl.replace(/\/$/, ''), authStore)
  client.autoCancellation(false)

  if (desktop) {
    const stored = await desktop.getAuthSession()
    if (stored) authStore?.save(stored.token, stored.record as RecordModel)
    authStore?.onChange((token, record) => {
      if (!token || !record) {
        void desktop.clearAuthSession()
        return
      }
      const session: StoredAuthSession = {
        token,
        record: JSON.parse(JSON.stringify(record)) as Record<string, unknown>,
      }
      void desktop.setAuthSession(session)
    })
  }

  if (client.authStore.isValid) {
    try {
      await client.collection('users').authRefresh()
    } catch {
      client.authStore.clear()
    }
  }

  return client
}

export function errorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const data = error.response?.data as Record<string, { message?: string }> | undefined
    const fieldError = data ? Object.values(data).find((item) => item?.message)?.message : undefined
    return fieldError || error.response?.message || error.message
  }
  return error instanceof Error ? error.message : 'Something went wrong.'
}
