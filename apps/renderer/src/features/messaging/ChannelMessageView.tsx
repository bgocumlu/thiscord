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
}: {
  readonly channel: Channel
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { search } = useAppRouter()
  const { messages, typing } = useChannelMessages(channel.id)
  const adapter = useMemo(
    () => createChannelMessageAdapter({ client, queryClient, channel, permissions }),
    [channel, client, permissions, queryClient],
  )
  const typingUsers = useMemo(
    () => (typing.data ?? [])
      .filter((item) => item.user !== currentUser.id)
      .map((item) => item.expand?.user?.displayName)
      .filter((name): name is string => Boolean(name)),
    [currentUser.id, typing.data],
  )
  const highlightedMessageId = new URLSearchParams(search).get('message') ?? ''

  return (
    <MessageSurface
      key={channel.id}
      adapter={adapter}
      history={messages}
      currentUser={currentUser}
      typingUsers={typingUsers}
      intro={(
        <div className="channel-intro">
          <span>{channel.kind === 'announcement' ? <Megaphone size={24} /> : <Hash size={24} />}</span>
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
      searchErrorLabel="Could not search messages."
      historyErrorLabel="Could not load messages."
      className="chat-view"
    />
  )
}
