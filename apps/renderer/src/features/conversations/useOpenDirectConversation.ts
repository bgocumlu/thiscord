import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { useAppRouter } from '../../lib/router'
import { appRoutes } from '../navigation/routes'
import { conversationApi } from './api'
import { conversationKeys } from './queryKeys'

export function useOpenDirectConversation() {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { navigate } = useAppRouter()
  const [error, setError] = useState('')
  const open = useCallback(async (userId: string) => {
    setError('')
    try {
      const conversation = await conversationApi.create(client, {
        kind: 'direct',
        userIds: [userId],
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationKeys.members }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
      ])
      navigate(appRoutes.conversations(conversation.id))
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }, [client, navigate, queryClient])
  return { error, open, clearError: () => setError('') }
}
