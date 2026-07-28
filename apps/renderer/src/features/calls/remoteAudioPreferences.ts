export interface RemoteAudioPreference {
  readonly muted: boolean
  readonly volume: number
}

export type RemoteAudioPreferences = Readonly<Record<string, RemoteAudioPreference>>

const STORAGE_KEY = 'thiscord_remote_audio_v1'
const DEFAULT_PREFERENCE: RemoteAudioPreference = Object.freeze({
  muted: false,
  volume: 100,
})
const MAX_SAVED_USERS = 500

function normalizedPreference(value: unknown): RemoteAudioPreference | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as { readonly muted?: unknown; readonly volume?: unknown }
  if (typeof candidate.muted !== 'boolean' || typeof candidate.volume !== 'number') return null
  if (!Number.isFinite(candidate.volume)) return null
  return {
    muted: candidate.muted,
    volume: Math.round(Math.max(0, Math.min(100, candidate.volume))),
  }
}

export function readRemoteAudioPreferences(
  storage: Pick<Storage, 'getItem'> = localStorage,
): RemoteAudioPreferences {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const preferences: Record<string, RemoteAudioPreference> = {}
    for (const [userId, value] of Object.entries(parsed).slice(0, MAX_SAVED_USERS)) {
      if (!userId) continue
      const preference = normalizedPreference(value)
      if (preference && (preference.muted || preference.volume !== 100)) {
        preferences[userId] = preference
      }
    }
    return preferences
  } catch {
    return {}
  }
}

export function remoteAudioPreference(
  preferences: RemoteAudioPreferences,
  userId: string,
): RemoteAudioPreference {
  return preferences[userId] ?? DEFAULT_PREFERENCE
}

export function updateRemoteAudioPreference(
  preferences: RemoteAudioPreferences,
  userId: string,
  patch: Partial<RemoteAudioPreference>,
): RemoteAudioPreferences {
  if (!userId) return preferences
  const current = remoteAudioPreference(preferences, userId)
  const next = normalizedPreference({ ...current, ...patch }) ?? current
  const updated = { ...preferences }
  if (!next.muted && next.volume === 100) delete updated[userId]
  else updated[userId] = next
  return updated
}

export function writeRemoteAudioPreferences(
  preferences: RemoteAudioPreferences,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  const entries = Object.entries(preferences).slice(-MAX_SAVED_USERS)
  storage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
}
