import type { UserPreferences } from '@thiscord/shared'
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'

interface PreferencesResponse {
  readonly preferences: UserPreferences
}

function resolvedPreferences(
  preferences: UserPreferences | undefined,
): UserPreferences {
  return {
    theme: preferences?.theme ?? 'dark',
    compactMode: preferences?.compactMode ?? false,
    reduceMotion: preferences?.reduceMotion ?? false,
    notificationSound: preferences?.notificationSound ?? true,
    presenceStatus: preferences?.presenceStatus ?? 'online',
    mutedChannels: preferences?.mutedChannels ?? [],
    mutedConversations: preferences?.mutedConversations ?? [],
  }
}

export async function getOwnPreferences(client: PocketBase) {
  const result = await client.send<PreferencesResponse>(
    '/api/thiscord/account/preferences',
    {},
  )
  return resolvedPreferences(result.preferences)
}

export async function updateOwnPreferences(
  client: PocketBase,
  preferences: Partial<UserPreferences>,
  baseRecord: RecordModel | null = client.authStore.record,
) {
  const result = await client.send<PreferencesResponse>(
    '/api/thiscord/account/preferences',
    { method: 'PATCH', body: { preferences } },
  )
  if (baseRecord) {
    client.authStore.save(client.authStore.token, {
      ...baseRecord,
      status: result.preferences.presenceStatus ?? 'online',
      preferences: result.preferences,
    })
  }
  return result.preferences
}
