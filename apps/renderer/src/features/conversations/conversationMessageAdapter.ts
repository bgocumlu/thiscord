import type {
  Conversation,
  ConversationMember,
  DirectMessage,
} from '@thiscord/shared'
import type { QueryClient } from '@tanstack/react-query'
import type PocketBase from 'pocketbase'
import { t } from '../../lib/i18n'
import type { MessageSurfaceAdapter } from '../messaging/messageSurfaceContract'
import { fetchReactionBatches } from '../messaging/reactionBatches'
import { conversationApi } from './api'
import { conversationKeys } from './queryKeys'

export function createConversationMessageAdapter({
  client,
  queryClient,
  conversation,
  membership,
}: {
  readonly client: PocketBase
  readonly queryClient: QueryClient
  readonly conversation: Conversation
  readonly membership: ConversationMember
}): MessageSurfaceAdapter<DirectMessage> {
  const messageKey = conversationKeys.messages(conversation.id)
  const reactionsKey = conversationKeys.reactionsRoot(conversation.id)
  const searchRoot = conversationKeys.searchRoot(conversation.id)
  return {
    kind: 'conversation',
    targetId: conversation.id,
    messageKey,
    reactionsKey,
    searchRoot,
    searchKey: (query, pinned) => conversationKeys.search(conversation.id, query, pinned),
    reverseSearchResults: true,
    persistedReadMessage: membership.lastMessage,
    policy: {
      canEdit: (message, currentUser) => message.author === currentUser.id,
      canDelete: (message, currentUser) => message.author === currentUser.id,
      canPin: () => true,
    },
    async search(query, pinned, page) {
      const result = await conversationApi.searchMessages(client, {
        conversationId: conversation.id,
        query,
        pinned,
        page,
      })
      return {
        items: result.items,
        page: result.page,
        hasMore: result.page < result.totalPages,
      }
    },
    async load(messageId) {
      const message = await conversationApi.getMessage(client, messageId)
      if (message.conversation !== conversation.id) {
        throw new Error(t("conversations.messageAdapter.linkedMessageOutsideConversation"))
      }
      return message
    },
    loadReactions: (messageIds) => fetchReactionBatches(
      messageIds,
      async (batch) => (
        await conversationApi.reactions(client, conversation.id, batch)
      ).reactions,
    ),
    async save({ content, files, reply, editing }) {
      if (editing) {
        await conversationApi.updateMessage(client, editing.id, { content })
      } else {
        await conversationApi.createMessage(client, {
          conversation: conversation.id,
          content,
          replyTo: reply?.id ?? '',
          attachments: files,
        })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.members }),
      ])
    },
    async remove(message) {
      await conversationApi.removeMessage(client, message.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
      ])
    },
    async react(message, emoji) {
      await conversationApi.react(client, message.id, emoji)
      await queryClient.invalidateQueries({ queryKey: reactionsKey })
    },
    async pin(message) {
      await conversationApi.updateMessage(client, message.id, { pinned: !message.pinned })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
      ])
    },
    async markRead(messageId) {
      await conversationApi.markRead(client, conversation.id, messageId)
      await queryClient.invalidateQueries({ queryKey: conversationKeys.members })
    },
  }
}
