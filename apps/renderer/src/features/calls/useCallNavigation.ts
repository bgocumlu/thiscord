import type {
  CallParticipantRecord,
  CallTargetDescriptor,
  Channel,
} from '@thiscord/shared'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { useAppRouter } from '../../lib/router'
import { usePocketBase } from '../../lib/contexts'
import { appRoutes } from '../navigation/routes'
import { channelApi } from '../channels/api'
import { conversationApi } from '../conversations/api'
import { useCall } from './CallProvider'
import { channelSelectionClosesNavigation } from './callNavigationBehavior'
import {
  clearResumeCallTarget,
  readResumeCallTarget,
} from './jitsiEngine'
import {
  channelCallTarget,
  conversationCallTarget,
  participantBelongsToTarget,
  sameCallTarget,
} from './targets'

export function useCallNavigation({
  targets,
  occupancy,
  activeChannel,
  userId,
  onNavigationClosed,
}: {
  readonly targets: readonly CallTargetDescriptor[]
  readonly occupancy: readonly CallParticipantRecord[]
  readonly activeChannel: Channel | undefined
  readonly userId: string
  readonly onNavigationClosed: () => void
}) {
  const { pathname, navigate } = useAppRouter()
  const client = usePocketBase()
  const call = useCall()
  const previousVoiceMedia = useRef<ReadonlySet<string>>(new Set())
  const session = call.session
  const join = call.join

  useEffect(() => {
    if (session) return
    const resumeTarget = readResumeCallTarget()
    if (!resumeTarget) return
    const cached = targets.find((candidate) => sameCallTarget(candidate.target, resumeTarget))
    let cancelled = false
    const resume = async () => {
      let descriptor = cached
      if (!descriptor) {
        if (resumeTarget.kind === 'channel') {
          const channel = await channelApi.get(client, resumeTarget.id)
          if (channel.kind !== 'voice') return
          descriptor = channelCallTarget(channel)
        } else {
          const target = await conversationApi.get(client, resumeTarget.id)
          descriptor = conversationCallTarget(target.conversation, target.members, userId)
        }
      }
      if (cancelled || !descriptor) return
      clearResumeCallTarget()
      await join(descriptor)
    }
    void resume().catch(() => {
      // Keep the target for a later retry when direct resolution is transiently unavailable.
    })
    return () => {
      cancelled = true
    }
  }, [client, join, session, targets, userId])

  const activeVoiceMedia = useMemo(() => {
    if (!session) return new Set<string>()
    const next = new Set<string>()
    for (const participant of session.participants) {
      if (participant.videoTrack) next.add(`${participant.userId || participant.id}:camera`)
      if (participant.screenTrack) next.add(`${participant.userId || participant.id}:screen`)
    }
    for (const participant of occupancy) {
      if (!participantBelongsToTarget(participant, session.target.target)) continue
      if (participant.camera) next.add(`${participant.user}:camera`)
      if (participant.sharing) next.add(`${participant.user}:screen`)
    }
    return next
  }, [occupancy, session])

  useEffect(() => {
    const previous = previousVoiceMedia.current
    previousVoiceMedia.current = activeVoiceMedia
    if (!session || session.status === 'error') return
    const mediaStarted = [...activeVoiceMedia].some((item) => !previous.has(item))
    if (mediaStarted && pathname !== session.target.href) navigate(session.target.href)
  }, [activeVoiceMedia, navigate, pathname, session])

  const selectChannel = useCallback((channel: Channel) => {
    if (channel.kind !== 'voice') {
      navigate(appRoutes.channel(channel.community, channel.id))
    } else if (
      session
      && sameCallTarget(session.target.target, { kind: 'channel', id: channel.id })
    ) {
      navigate(appRoutes.channel(channel.community, channel.id))
    } else {
      const replacingFocusedCall = activeChannel?.kind === 'voice' && session
        ? sameCallTarget(session.target.target, { kind: 'channel', id: activeChannel.id })
        : false
      void join(channelCallTarget(channel))
      if (replacingFocusedCall) navigate(appRoutes.channel(channel.community, channel.id))
    }
    if (channelSelectionClosesNavigation(channel.kind)) onNavigationClosed()
  }, [activeChannel, join, navigate, onNavigationClosed, session])

  const openCallTarget = useCallback((target: CallTargetDescriptor) => {
    navigate(target.href)
    onNavigationClosed()
  }, [navigate, onNavigationClosed])

  return { openCallTarget, selectChannel }
}
