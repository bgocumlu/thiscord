import type { Channel, Message, Permission } from '@thiscord/shared'
import type { QueryClient } from '@tanstack/react-query'
import type PocketBase from 'pocketbase'
import { t } from '../../lib/i18n'
import { messageApi } from './api'
import type { MessageSurfaceAdapter } from './messageSurfaceContract'
import { messageKeys } from './queryKeys'
import { fetchReactionBatches } from './reactionBatches'

export function createChannelMessageAdapter({
  client,
  queryClient,
  channel,
  permissions,
}: {
  readonly client: PocketBase
  readonly queryClient: QueryClient
  readonly channel: Channel
  readonly permissions: ReadonlySet<Permission>
}): MessageSurfaceAdapter<Message> {
  const messageKey = messageKeys.channel(channel.id)
  const reactionsKey = messageKeys.reactionsRoot(channel.id)
  const searchRoot = messageKeys.searchRoot(channel.community, channel.id)
  return {
    kind: 'channel',
    targetId: channel.id,
    messageKey,
    reactionsKey,
    searchRoot,
    searchKey: (query, pinned) => messageKeys.search(channel.community, channel.id, query, pinned),
    reverseSearchResults: false,
    persistedReadMessage: '',
    policy: {
      disabledReason: channel.kind === 'announcement' && !permissions.has('manage_messages')
        ? t("messaging.channelMessageAdapter.onlyModeratorsCanPostAnnouncements")
        : permissions.has('send_messages')
          ? undefined
          : t("messaging.channelMessageAdapter.youCannotSendMessagesInThisChannel"),
      canEdit: (message, currentUser) => (
        message.author === currentUser.id || permissions.has('manage_messages')
      ),
      canDelete: (message, currentUser) => (
        message.author === currentUser.id || permissions.has('manage_messages')
      ),
      canPin: () => permissions.has('manage_messages'),
    },
    search: (query, pinned, page) => messageApi.search(client, {
      communityId: channel.community,
      channelId: channel.id,
      query,
      pinned,
      page,
    }),
    async load(messageId) {
      const message = await messageApi.get(client, messageId)
      if (message.channel !== channel.id) {
        throw new Error(t("messaging.channelMessageAdapter.linkedMessageOutsideChannel"))
      }
      return message
    },
    loadReactions: (messageIds) => fetchReactionBatches(
      messageIds,
      async (batch) => (await messageApi.reactions(client, channel.id, batch)).reactions,
    ),
    async save({ content, files, reply, editing }) {
      if (editing) {
        await messageApi.update(client, editing.id, { content })
      } else {
        await messageApi.create(client, {
          channel: channel.id,
          content,
          replyTo: reply?.id ?? '',
          attachments: files,
        })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
      ])
    },
    async remove(message) {
      await messageApi.remove(client, message.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
      ])
    },
    async react(message, emoji) {
      await messageApi.react(client, message.id, emoji)
      await queryClient.invalidateQueries({ queryKey: reactionsKey })
    },
    async pin(message) {
      await messageApi.update(client, message.id, { pinned: !message.pinned })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKey }),
        queryClient.invalidateQueries({ queryKey: searchRoot }),
      ])
    },
    async markRead(messageId) {
      await messageApi.markRead(client, channel.id, messageId)
      await queryClient.invalidateQueries({ queryKey: messageKeys.unreadSummary(channel.community) })
    },
  }
}
