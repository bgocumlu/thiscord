import type { Conversation, User } from '@thiscord/shared'
import { useCallback, useState } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { updateOwnPreferences } from '../members/preferences'

export function useConversationMute(user: User, conversation: Conversation | null) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const conversationId = conversation?.id ?? ''
  const muted = Boolean(
    conversationId && user.preferences?.mutedConversations?.includes(conversationId),
  )
  const toggle = useCallback(async () => {
    if (!conversationId) return
    const current = new Set(user.preferences?.mutedConversations ?? [])
    if (current.has(conversationId)) current.delete(conversationId)
    else current.add(conversationId)
    setError('')
    try {
      await updateOwnPreferences(client, {
        mutedConversations: [...current],
      })
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }, [client, conversationId, user.preferences])
  return { error, muted, toggle, clearError: () => setError('') }
}
