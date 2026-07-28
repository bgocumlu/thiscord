import {
  Ban,
  Clock3,
  Maximize2,
  MessageSquareText,
  MicOff,
  UserRound,
  UserX,
  VolumeX,
} from 'lucide-react'
import type { Membership, User } from '@thiscord/shared'
import { useState } from 'react'
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSlider,
} from '../../components/ContextMenu'
import type { CommunityModerationAction } from './memberInteractions'

export function MemberContextMenuItems({
  user,
  membership,
  currentUserId,
  onOpenProfile,
  onMessage,
  localAudio,
  spotlight,
  callModeration,
  communityModeration,
}: {
  readonly user?: User
  readonly membership?: Membership
  readonly currentUserId: string
  readonly onOpenProfile?: () => void
  readonly onMessage?: () => void
  readonly localAudio?: {
    readonly muted: boolean
    readonly volume: number
    readonly onMutedChange: (muted: boolean) => void
    readonly onVolumeChange: (volume: number) => void
  }
  readonly spotlight?: {
    readonly active: boolean
    readonly onToggle: () => void
  }
  readonly callModeration?: {
    readonly serverMuted: boolean
    readonly canServerMute: boolean
    readonly canDisconnect: boolean
    readonly onServerMuteChange: (serverMuted: boolean) => void
    readonly onDisconnect: () => void
  }
  readonly communityModeration?: {
    readonly onAction: (action: CommunityModerationAction) => void
  }
}) {
  const [mountedAt] = useState(() => Date.now())
  const isCurrentUser = user?.id === currentUserId
  const hasIdentityActions = Boolean(user && (onOpenProfile || (!isCurrentUser && onMessage)))
  const hasPersonalCallActions = Boolean(localAudio || spotlight)
  const hasCallModeration = Boolean(
    callModeration && (callModeration.canServerMute || callModeration.canDisconnect),
  )

  return (
    <>
      {user && onOpenProfile ? (
        <ContextMenuItem icon={<UserRound size={15} />} onSelect={onOpenProfile}>
          View Profile
        </ContextMenuItem>
      ) : null}
      {user && !isCurrentUser && onMessage ? (
        <ContextMenuItem icon={<MessageSquareText size={15} />} onSelect={onMessage}>
          Message
        </ContextMenuItem>
      ) : null}

      {hasIdentityActions && hasPersonalCallActions ? <ContextMenuSeparator /> : null}
      {localAudio ? (
        <>
          <ContextMenuItem
            icon={<VolumeX size={15} />}
            checked={localAudio.muted}
            onSelect={() => localAudio.onMutedChange(!localAudio.muted)}
          >
            Mute Locally
          </ContextMenuItem>
          <ContextMenuSlider
            label="User Volume"
            value={localAudio.volume}
            onChange={localAudio.onVolumeChange}
          />
        </>
      ) : null}
      {spotlight ? (
        <ContextMenuItem
          icon={<Maximize2 size={15} />}
          checked={spotlight.active}
          onSelect={spotlight.onToggle}
        >
          Spotlight Video
        </ContextMenuItem>
      ) : null}

      {(hasIdentityActions || hasPersonalCallActions) && hasCallModeration
        ? <ContextMenuSeparator />
        : null}
      {callModeration?.canServerMute ? (
        <ContextMenuItem
          icon={<MicOff size={15} />}
          checked={callModeration.serverMuted}
          onSelect={() => callModeration.onServerMuteChange(!callModeration.serverMuted)}
        >
          {callModeration.serverMuted ? 'Remove Server Mute' : 'Server Mute'}
        </ContextMenuItem>
      ) : null}
      {callModeration?.canDisconnect ? (
        <ContextMenuItem
          icon={<UserX size={15} />}
          danger
          onSelect={callModeration.onDisconnect}
        >
          Disconnect From Call
        </ContextMenuItem>
      ) : null}

      {communityModeration && membership ? (
        <>
          {(hasIdentityActions || hasPersonalCallActions || hasCallModeration)
            ? <ContextMenuSeparator />
            : null}
          <ContextMenuItem
            icon={<Clock3 size={15} />}
            onSelect={() => communityModeration.onAction(
              membership.timeoutUntil && new Date(membership.timeoutUntil).getTime() > mountedAt
                ? 'untimeout'
                : 'timeout',
            )}
          >
            {membership.timeoutUntil && new Date(membership.timeoutUntil).getTime() > mountedAt
              ? 'Remove Timeout'
              : 'Timeout'}
          </ContextMenuItem>
          <ContextMenuItem
            icon={<UserX size={15} />}
            danger
            onSelect={() => communityModeration.onAction('kick')}
          >
            Kick From Community
          </ContextMenuItem>
          <ContextMenuItem
            icon={<Ban size={15} />}
            danger
            onSelect={() => communityModeration.onAction('ban')}
          >
            Ban From Community
          </ContextMenuItem>
        </>
      ) : null}
    </>
  )
}
