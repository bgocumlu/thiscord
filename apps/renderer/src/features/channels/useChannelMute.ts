import type { Channel, User } from '@thiscord/shared'
import { useCallback, useState } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { updateOwnPreferences } from '../members/preferences'

export function useChannelMute(user: User, channel: Channel | undefined) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const channelId = channel?.id ?? ''
  const muted = Boolean(channelId && user.preferences?.mutedChannels?.includes(channelId))
  const toggle = useCallback(async () => {
    if (!channelId) return
    const current = new Set(user.preferences?.mutedChannels ?? [])
    if (current.has(channelId)) current.delete(channelId)
    else current.add(channelId)
    setError('')
    try {
      await updateOwnPreferences(client, {
        mutedChannels: [...current],
      })
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }, [channelId, client, user.preferences])
  return { error, muted, toggle, clearError: () => setError('') }
}
