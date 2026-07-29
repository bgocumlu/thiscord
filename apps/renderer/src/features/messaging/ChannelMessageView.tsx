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
            {channel.kind === 'announcement' ? 'Community updates' : 'Community channel'}
          </small>
          <h1>{channel.kind === 'announcement' ? '' : '#'}{channel.name}</h1>
          {channel.topic ? <p>{channel.topic}</p> : null}
          {channel.kind === 'announcement' ? (
            <p className="announcement-note">
              Updates posted here are highlighted for every member. Only members with
              message-management permission can publish.
            </p>
          ) : null}
        </div>
      )}
      placeholder={`Message #${channel.name}`}
      searchLabel={`Search #${channel.name}`}
      highlightedMessageId={highlightedMessageId}
      messageElementPrefix="message-"
      emptyTitle="No messages yet"
      emptyDescription={`Start the conversation in #${channel.name}. Share an update, question, or idea.`}
      searchErrorLabel="Could not search messages."
      historyErrorLabel="Could not load messages."
      className="chat-view"
    />
  )
}
