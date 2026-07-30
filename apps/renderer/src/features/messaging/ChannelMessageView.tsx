import { t } from '../../lib/i18n'
import type { Channel, Permission, User } from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Hash, Megaphone } from 'lucide-react'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { useAppRouter } from '../../lib/router'
import { createChannelMessageAdapter } from './channelMessageAdapter'
import { MessageSurface } from './MessageSurface'
import { useChannelMessages } from './queries'

export function ChannelMessageView({
  channel,
  currentUser,
  permissions,
  onOpenProfile,
}: {
  readonly channel: Channel
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
  readonly onOpenProfile: (user: User) => void
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { search } = useAppRouter()
  const { messages } = useChannelMessages(channel.id)
  const adapter = useMemo(
    () => createChannelMessageAdapter({ client, queryClient, channel, permissions }),
    [channel, client, permissions, queryClient],
  )
  const highlightedMessageId = new URLSearchParams(search).get('message') ?? ''

  return (
    <MessageSurface
      key={channel.id}
      adapter={adapter}
      history={messages}
      currentUser={currentUser}
      onOpenProfile={onOpenProfile}
      intro={(
        <div className="channel-intro">
          <span>{channel.kind === 'announcement' ? <Megaphone size={24} /> : <Hash size={24} />}</span>
          <small className="channel-intro-kicker">
            {channel.kind === 'announcement' ? t("messaging.channelMessageView.communityUpdates") : t("messaging.channelMessageView.communityChannel")}
          </small>
          <h1>{channel.kind === 'announcement' ? '' : '#'}{channel.name}</h1>
          {channel.topic ? <p>{channel.topic}</p> : null}
          {channel.kind === 'announcement' ? (
            <p className="announcement-note">

              {t("messaging.channelMessageView.announcementDescription")}
            </p>
          ) : null}
        </div>
      )}
      placeholder={t("messaging.channelMessageView.messageChannel", { channelName: channel.name })}
      searchLabel={t("messaging.channelMessageView.searchChannel", { channelName: channel.name })}
      highlightedMessageId={highlightedMessageId}
      messageElementPrefix="message-"
      emptyTitle={t("messaging.channelMessageView.noMessagesYet")}
      emptyDescription={t("messaging.channelMessageView.startConversation", { channelName: channel.name })}
      searchErrorLabel={t("messaging.channelMessageView.couldNotSearchMessages")}
      historyErrorLabel={t("messaging.channelMessageView.couldNotLoadMessages")}
      className="chat-view"
    />
  )
}
