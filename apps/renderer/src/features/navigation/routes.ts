export type AppRoute =
  | { readonly kind: 'channel'; readonly communityId: string; readonly channelId: string }
  | { readonly kind: 'conversations'; readonly conversationId: string }
  | { readonly kind: 'invite'; readonly code: string }
  | { readonly kind: 'auth'; readonly action: 'verify' | 'reset' }
  | { readonly kind: 'unknown' }

const directMessagesId = '@me'

function segment(value: string) {
  return encodeURIComponent(value)
}

function decodedSegment(value: string | undefined) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function focusedPath(path: string, key: 'message' | 'directMessage', value?: string) {
  return value ? `${path}?${key}=${segment(value)}` : path
}

export const appRoutes = {
  conversations(conversationId = '', directMessageId?: string) {
    const path = `/channels/${directMessagesId}${conversationId ? `/${segment(conversationId)}` : ''}`
    return focusedPath(path, 'directMessage', directMessageId)
  },
  channel(communityId: string, channelId = '', messageId?: string) {
    const path = `/channels/${segment(communityId)}${channelId ? `/${segment(channelId)}` : ''}`
    return focusedPath(path, 'message', messageId)
  },
  invite(code: string) {
    return `/invite/${segment(code)}`
  },
  auth(action: 'verify' | 'reset') {
    return `/auth/${action}`
  },
} as const

export function parseAppRoute(pathname: string): AppRoute {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'channels' && parts[1] === directMessagesId && parts.length <= 3) {
    const conversationId = decodedSegment(parts[2])
    if (conversationId === null) return { kind: 'unknown' }
    return {
      kind: 'conversations',
      conversationId,
    }
  }
  if (parts[0] === 'channels' && parts[1] && parts.length <= 3) {
    const communityId = decodedSegment(parts[1])
    const channelId = decodedSegment(parts[2])
    if (communityId === null || channelId === null) return { kind: 'unknown' }
    return {
      kind: 'channel',
      communityId,
      channelId,
    }
  }
  if (parts[0] === 'invite' && parts[1] && parts.length === 2) {
    const code = decodedSegment(parts[1])
    return code === null ? { kind: 'unknown' } : { kind: 'invite', code }
  }
  if (
    parts[0] === 'auth'
    && (parts[1] === 'verify' || parts[1] === 'reset')
    && parts.length === 2
  ) {
    return { kind: 'auth', action: parts[1] }
  }
  return { kind: 'unknown' }
}
