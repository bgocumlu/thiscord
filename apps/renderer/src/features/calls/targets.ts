import type {
  CallParticipantRecord,
  CallTarget,
  CallTargetDescriptor,
  Channel,
  Conversation,
  ConversationMember,
} from '@thiscord/shared'
import { appRoutes } from '../navigation/routes'

export function channelCallTarget(channel: Channel): CallTargetDescriptor {
  return {
    target: { kind: 'channel', id: channel.id },
    name: channel.name,
    href: appRoutes.channel(channel.community, channel.id),
  }
}

export function conversationCallTarget(
  conversation: Conversation,
  members: readonly ConversationMember[],
  currentUserId: string,
): CallTargetDescriptor {
  const name = conversation.kind === 'group'
    ? conversation.name
    : members.find((member) => (
      member.conversation === conversation.id && member.user !== currentUserId
    ))?.expand?.user?.displayName ?? 'Direct message'
  return {
    target: { kind: 'conversation', id: conversation.id },
    name,
    href: appRoutes.conversations(conversation.id),
  }
}

export function sameCallTarget(left: CallTarget, right: CallTarget) {
  return left.kind === right.kind && left.id === right.id
}

export function participantBelongsToTarget(
  participant: CallParticipantRecord,
  target: CallTarget,
) {
  const room = participant.expand?.call?.expand?.room
  return target.kind === 'channel'
    ? room?.channel === target.id
    : room?.conversation === target.id
}
