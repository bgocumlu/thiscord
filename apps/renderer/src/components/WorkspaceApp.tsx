import type {
  Channel,
  ChannelPermission,
  CallParticipantRecord,
  Community,
  Conversation,
  ConversationMember,
  DirectMessage,
  DirectReaction,
  Invite,
  MemberRole,
  Membership,
  Message,
  Permission,
  Reaction,
  Role,
  UpdateState,
  User,
} from '@thiscord/shared'
import { permissions } from '@thiscord/shared'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Hash,
  Headphones,
  Inbox,
  LogOut,
  Menu,
  Megaphone,
  MessageSquareText,
  Mic,
  MicOff,
  Paperclip,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  SmilePlus,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isTokenExpired, type RecordModel } from 'pocketbase'
import { useAuth } from '../auth/AuthProvider'
import {
  useChannelData,
  useCommunityData,
  useConversations,
  useDirectMessages,
  useDirectReactions,
  useDirectTyping,
  useEffectivePermissions,
  useMemberships,
  useNotifications,
  useVoiceOccupancy,
  type PresenceRecord,
} from '../data/queries'
import { useFileToken } from '../hooks/useFileToken'
import { useRealtimeInvalidation } from '../hooks/useRealtimeInvalidation'
import { usePocketBase, useRuntimeConfig } from '../lib/contexts'
import { errorMessage } from '../lib/pocketbase'
import { useAppRouter } from '../lib/router'
import { mergeCallParticipants, useCall } from '../call/CallProvider'
import { CallDock, VoiceChannelSurface } from '../call/CallSurface'

type Modal =
  | { readonly kind: 'community' }
  | { readonly kind: 'channel'; readonly parent: string }
  | { readonly kind: 'channelSettings'; readonly channel: Channel }
  | { readonly kind: 'settings' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'member'; readonly user: User }
  | { readonly kind: 'direct' }
  | null

type SearchChannel = Channel & { readonly expand?: { readonly community?: Community } }
type SearchMessage = Omit<Message, 'expand'> & {
  readonly expand?: {
    readonly author?: User
    readonly channel?: SearchChannel
  }
}
type SearchDirectMessage = Omit<DirectMessage, 'expand'> & {
  readonly expand?: {
    readonly author?: User
    readonly conversation?: Conversation
  }
}
interface GlobalSearchResult {
  readonly channels: SearchChannel[]
  readonly messages: SearchMessage[]
  readonly directMessages: SearchDirectMessage[]
  readonly people: User[]
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

function formatTime(value: string) {
  const date = new Date(value)
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = date.toDateString() === today.toDateString()
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

function DataFailure({ error, onRetry, label = 'Could not load this content.' }: {
  readonly error: unknown
  readonly onRetry: () => void
  readonly label?: string
}) {
  return (
    <div className="data-failure" role="alert">
      <strong>{label}</strong>
      <span>{errorMessage(error)}</span>
      <button type="button" onClick={onRetry}>Try again</button>
    </div>
  )
}

function resolvedPresence(userId: string, presence: PresenceRecord[]): User['status'] {
  const active = presence.filter((item) => (
    item.user === userId && new Date(item.expiresAt).getTime() > Date.now()
  ))
  if (active.some((item) => item.status === 'dnd')) return 'dnd'
  if (active.some((item) => item.status === 'online')) return 'online'
  if (active.some((item) => item.status === 'idle')) return 'idle'
  return 'offline'
}

function Avatar({
  user,
  size = 'medium',
  status,
}: {
  readonly user: User
  readonly size?: 'small' | 'medium' | 'hero'
  readonly status?: string
}) {
  const client = usePocketBase()
  const url = user.avatar ? client.files.getURL(user as unknown as RecordModel, user.avatar, { thumb: '128x128' }) : ''
  const color = `hsl(${[...user.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360} 62% 58%)`
  return (
    <span className={`avatar avatar-${size}`} style={{ '--avatar-color': color } as CSSProperties} aria-label={user.displayName}>
      {url ? <img src={url} alt="" /> : initials(user.displayName || user.handle)}
      {status ? <span className={`presence-dot presence-${status}`} /> : null}
    </span>
  )
}

function ImageFileField({
  name,
  label,
  currentUrl = '',
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  banner = false,
}: {
  readonly name: string
  readonly label: string
  readonly currentUrl?: string
  readonly accept?: string
  readonly banner?: boolean
}) {
  const [preview, setPreview] = useState(currentUrl)
  const [removed, setRemoved] = useState(false)
  const objectUrl = useRef('')
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
  }, [])
  return (
    <div className={`image-file-field ${banner ? 'banner-file-field' : ''}`}>
      <span className="field-label">{label}</span>
      <div>
        <span className="image-file-preview">{preview && !removed ? <img src={preview} alt={`${label} preview`} /> : initials(label)}</span>
        <label className="file-select-button">
          Choose image
          <input name={name} type="file" accept={accept} onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
            objectUrl.current = URL.createObjectURL(file)
            setPreview(objectUrl.current)
            setRemoved(false)
          }} />
        </label>
        {(currentUrl || preview) && !removed ? <button className="secondary-action compact-action" type="button" onClick={() => { setRemoved(true); setPreview('') }}>Remove</button> : null}
      </div>
      <input type="hidden" name={`${name}Remove`} value={removed ? '1' : '0'} />
    </div>
  )
}

function ChannelIcon({ kind }: { readonly kind: Channel['kind'] }) {
  if (kind === 'voice') return <Volume2 size={17} />
  if (kind === 'announcement') return <Megaphone size={17} />
  return <Hash size={17} />
}

function ModalFrame({ title, onClose, children }: {
  readonly title: string
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button></header>
        {children}
      </section>
    </div>,
    document.body,
  )
}

function useDialogAccessibility(
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? [])
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      root?.removeAttribute('inert')
      previousFocus?.focus()
    }
  }, [dialogRef])
}

function CommunityRail({
  communities,
  activeId,
  onOpenDirect,
  onSelect,
  onAdd,
}: {
  readonly communities: Community[]
  readonly activeId: string
  readonly onOpenDirect: () => void
  readonly onSelect: (community: Community) => void
  readonly onAdd: () => void
}) {
  const client = usePocketBase()
  return (
    <nav className="server-rail" aria-label="Communities">
      <button className={`server-button direct-button ${activeId === '@me' ? 'active' : ''}`} type="button" title="Direct messages" onClick={onOpenDirect}>
        <MessageSquareText size={22} strokeWidth={1.9} />
      </button>
      <span className="rail-divider" />
      {communities.map((community) => {
        const icon = community.icon
          ? client.files.getURL(community as unknown as RecordModel, community.icon, { thumb: '128x128' })
          : ''
        return (
          <button
            className={`server-button ${community.id === activeId ? 'active' : ''}`}
            type="button"
            key={community.id}
            title={community.name}
            onClick={() => onSelect(community)}
          >
            {icon ? <img src={icon} alt="" /> : <span>{initials(community.name)}</span>}
          </button>
        )
      })}
      <button className="server-button utility-button" type="button" title="Add a community" onClick={onAdd}>
        <Plus size={21} />
      </button>
    </nav>
  )
}

function ChannelSidebar({
  community,
  channels,
  activeChannelId,
  currentUser,
  currentStatus,
  onSelect,
  onCreate,
  onCategorySettings,
  onSettings,
  onProfile,
  onOpenVoice,
  unreadChannelIds,
  permissions: effectivePermissions,
  voiceOccupancy,
}: {
  readonly community: Community
  readonly channels: Channel[]
  readonly activeChannelId: string
  readonly currentUser: User
  readonly currentStatus: User['status']
  readonly onSelect: (channel: Channel) => void
  readonly onCreate: (parent: string) => void
  readonly onCategorySettings: (category: Channel) => void
  readonly onSettings: () => void
  readonly onProfile: () => void
  readonly onOpenVoice: (channel: Channel) => void
  readonly unreadChannelIds: ReadonlySet<string>
  readonly permissions: ReadonlySet<Permission>
  readonly voiceOccupancy: readonly CallParticipantRecord[]
}) {
  const call = useCall()
  const client = usePocketBase()
  const bannerUrl = community.banner
    ? client.files.getURL(community as unknown as RecordModel, community.banner, { thumb: '640x180' })
    : ''
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const categories = channels.filter((channel) => channel.kind === 'category')
  const categoryIds = new Set(categories.map((category) => category.id))
  const uncategorized = channels.filter((channel) => (
    channel.kind !== 'category' && (!channel.parent || !categoryIds.has(channel.parent))
  ))
  return (
    <aside className="channel-sidebar">
      <div className="community-header">
        <span><strong>{community.name}</strong></span>
        <button type="button" onClick={onSettings} title="Community settings"><Settings size={16} /></button>
      </div>
      {bannerUrl ? <img className="community-banner" src={bannerUrl} alt="" /> : null}
      <div className="channel-scroll">
        {uncategorized.map((channel) => (
          <ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} key={channel.id} />
        ))}
        {categories.map((category) => (
          <section className="channel-category" key={category.id}>
            <div className="category-heading">
              <button type="button" aria-expanded={!collapsed.has(category.id)} onClick={() => setCollapsed((current) => {
                const next = new Set(current)
                if (next.has(category.id)) next.delete(category.id)
                else next.add(category.id)
                return next
              })}><ChevronDown className={collapsed.has(category.id) ? 'collapsed' : ''} size={13} />{category.name}</button>
              {effectivePermissions.has('manage_channels') ? (
                <span className="category-actions">
                  <button type="button" title={`Category settings for ${category.name}`} onClick={() => onCategorySettings(category)}><Settings size={13} /></button>
                  <button type="button" title={`Create channel in ${category.name}`} onClick={() => onCreate(category.id)}><Plus size={14} /></button>
                </span>
              ) : null}
            </div>
            {!collapsed.has(category.id) ? channels.filter((channel) => channel.parent === category.id).map((channel) => (
              <ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} key={channel.id} />
            )) : null}
          </section>
        ))}
      </div>
      <div className="sidebar-footer">
        <CallDock onOpen={onOpenVoice} />
        <div className="user-panel">
          <Avatar user={currentUser} size="small" status={currentStatus} />
          <div className="user-panel-copy"><strong>{currentUser.displayName}</strong><small>@{currentUser.handle}</small></div>
          <button className={call.microphoneMuted ? 'active' : ''} type="button" disabled={Boolean(call.session && (call.session.actionBusy || !call.session.canSpeak))} title={call.session ? !call.session.canSpeak ? 'You do not have permission to speak' : call.microphoneMuted ? 'Unmute' : 'Mute' : call.microphoneMuted ? 'Unmute before joining' : 'Mute before joining'} onClick={() => void call.toggleMicrophone()}>
            {call.microphoneMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button className={call.deafened ? 'active' : ''} type="button" disabled={Boolean(call.session?.actionBusy)} title={call.deafened ? 'Undeafen' : call.session ? 'Deafen' : 'Deafen before joining'} onClick={() => void call.toggleDeafen()}>
            <Headphones size={16} />
          </button>
          <button type="button" title="User settings" onClick={onProfile}><Settings size={16} /></button>
        </div>
      </div>
    </aside>
  )
}

function ChannelButton({ channel, active, unread, onSelect, occupants }: {
  readonly channel: Channel
  readonly active: boolean
  readonly unread: boolean
  readonly onSelect: (channel: Channel) => void
  readonly occupants: readonly CallParticipantRecord[]
}) {
  const call = useCall()
  const sharedParticipants = occupants.filter((participant) => participant.expand?.call?.channel === channel.id)
  const liveParticipants = call.session?.channel.id === channel.id ? call.session.participants : []
  const callParticipants = mergeCallParticipants(liveParticipants, sharedParticipants, channel.id)
  return (
    <>
      <button className={`channel-row ${active ? 'active' : ''} ${unread ? 'unread' : ''} ${callParticipants.length ? 'connected' : ''}`} type="button" onClick={() => onSelect(channel)}>
        <ChannelIcon kind={channel.kind} />
        <span className="channel-name">{channel.name}</span>
      </button>
      {callParticipants.length ? (
        <div className="voice-member-list">
          {callParticipants.map((participant) => (
            <button type="button" onClick={() => onSelect(channel)} key={participant.id}>
              <span className={`voice-member-avatar ${participant.speaking ? 'speaking' : ''}`}>{initials(participant.name)}</span>
              <span>{participant.name}</span>
              {participant.muted ? <MicOff size={12} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}

function MessageRow({
  message,
  reactions,
  currentUser,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
}: {
  readonly message: Message | DirectMessage
  readonly reactions: Array<Reaction | DirectReaction>
  readonly currentUser: User
  readonly onReact: (emoji: string) => void | Promise<void>
  readonly onReply: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void | Promise<void>
  readonly onPin?: () => void | Promise<void>
}) {
  const [reactionOpen, setReactionOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const author = message.expand?.author
  if (!author) return null
  const deleted = Boolean(message.deletedAt)
  const grouped = reactions.reduce<Map<string, Array<Reaction | DirectReaction>>>((map, reaction) => {
    map.set(reaction.emoji, [...(map.get(reaction.emoji) ?? []), reaction])
    return map
  }, new Map())
  const run = async (action: () => void | Promise<void>) => {
    setActionError('')
    try {
      await action()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
  }
  return (
    <article className={`message-row ${deleted ? 'message-deleted' : ''}`} tabIndex={deleted ? undefined : 0}>
      <Avatar user={author} />
      <div className="message-body">
        {message.expand?.replyTo ? (
          <div className="reply-context">
            <span className="reply-line" />
            <strong>{message.expand.replyTo.expand?.author?.displayName ?? 'Unknown'}</strong>
            <span>{message.expand.replyTo.content || 'Message unavailable'}</span>
          </div>
        ) : null}
        <div className="message-meta">
          <strong>{author.displayName}</strong>
          <time dateTime={message.created}>{formatTime(message.created)}</time>
          {message.editedAt ? <small className="edited">edited</small> : null}
        </div>
        {deleted ? <p>Message deleted</p> : <RichMessage content={message.content} embedsEnabled={message.embedsEnabled} />}
        {!deleted && message.attachments.length ? <MessageAttachments message={message} userId={currentUser.id} /> : null}
        {grouped.size ? (
          <div className="reactions">
            {[...grouped.entries()].map(([emoji, items]) => (
              <button className={items.some((item) => item.user === currentUser.id) ? 'mine' : ''} type="button" onClick={() => void run(() => onReact(emoji))} key={emoji}>
                <span>{emoji}</span>{items.length}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {!deleted ? (
        <div className="message-actions">
          <button type="button" title="Add reaction" onClick={() => setReactionOpen((value) => !value)}><SmilePlus size={15} /></button>
          {onPin ? <button type="button" title={'pinned' in message && message.pinned ? 'Unpin' : 'Pin'} onClick={() => void run(onPin)}><Pin size={15} /></button> : null}
          <button type="button" title="Reply" onClick={onReply}><MessageSquareText size={15} /></button>
          {message.author === currentUser.id ? <button type="button" title="Edit" onClick={onEdit}><FileText size={15} /></button> : null}
          {message.author === currentUser.id ? <button type="button" title="Delete" onClick={() => void run(onDelete)}><X size={15} /></button> : null}
        </div>
      ) : null}
      {reactionOpen ? <EmojiPicker onSelect={(emoji) => { void run(() => onReact(emoji)); setReactionOpen(false) }} /> : null}
      {actionError ? <div className="message-action-error" role="alert">{actionError}</div> : null}
    </article>
  )
}

function MessageAttachments({
  message,
  userId,
}: {
  readonly message: Message | DirectMessage
  readonly userId: string
}) {
  const client = usePocketBase()
  const fileToken = useFileToken(userId, message.attachments.length > 0)
  const token = fileToken.data && !isTokenExpired(fileToken.data) ? fileToken.data : ''
  const tokenError = Boolean(fileToken.error)
  if (!token) {
    return (
      <div className="attachment-status" role={tokenError ? 'alert' : 'status'}>
        <span>{tokenError ? 'Attachments could not be authorized.' : 'Authorizing attachments…'}</span>
        {tokenError ? <button type="button" onClick={() => void fileToken.refetch()}>Retry</button> : null}
      </div>
    )
  }
  return (
    <div className="message-attachments">
      {message.attachments.map((filename) => {
        const openUrl = client.files.getURL(message as unknown as RecordModel, filename, { token })
        const downloadUrl = client.files.getURL(message as unknown as RecordModel, filename, { download: true, token })
        const displayName = filename.replace(/_[a-zA-Z0-9]+\.[^.]+$/, (suffix) => suffix.slice(suffix.lastIndexOf('.')))
        const image = /\.(?:avif|gif|jpe?g|png|webp)$/i.test(filename)
        return image ? (
          <figure className="attachment-image" key={filename}>
            <a href={openUrl} target="_blank" rel="noreferrer"><img src={openUrl} alt={displayName} loading="lazy" /></a>
            <figcaption><span>{displayName}</span><a href={downloadUrl}>Download</a></figcaption>
          </figure>
        ) : (
          <a className="attachment-card" href={downloadUrl} key={filename}>
            <span><FileText size={21} /></span>
            <span><strong>{displayName}</strong><small>Download attachment</small></span>
          </a>
        )
      })}
    </div>
  )
}

const commonEmoji = [
  '😀', '😄', '😂', '😊', '😍', '🤔', '😮', '😢', '😡', '👍', '👎', '👏',
  '🙌', '🙏', '❤️', '💜', '🔥', '🎉', '✅', '❌', '👀', '💯', '🚀', '✨',
]

function EmojiPicker({ onSelect }: { readonly onSelect: (emoji: string) => void }) {
  return (
    <div className="reaction-picker" role="group" aria-label="Choose emoji">
      {commonEmoji.map((emoji) => <button type="button" aria-label={`Insert ${emoji}`} onClick={() => onSelect(emoji)} key={emoji}>{emoji}</button>)}
    </div>
  )
}

function highlightMentions(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return children.split(/(@(?:everyone|[a-z0-9._-]{2,32}))/gi).map((part, index) => (
      /^@(?:everyone|[a-z0-9._-]{2,32})$/i.test(part)
        ? <span className="message-mention" key={`${part}-${index}`}>{part}</span>
        : part
    ))
  }
  if (Array.isArray(children)) return children.map((child) => highlightMentions(child))
  return children
}

function RichMessage({ content, embedsEnabled }: {
  readonly content: string
  readonly embedsEnabled: boolean
}) {
  const urls = Array.from(new Set(content.match(/https?:\/\/[^\s<]+/gi) ?? [])).slice(0, 3)
  return (
    <div className="message-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="nofollow noopener noreferrer">{children}<ExternalLink size={12} /></a>,
          p: ({ children }) => <p>{highlightMentions(children)}</p>,
          li: ({ children }) => <li>{highlightMentions(children)}</li>,
        }}
      >
        {content}
      </Markdown>
      {embedsEnabled && urls.length ? (
        <div className="link-previews">
          {urls.map((url) => {
            let label = url
            try {
              const parsed = new URL(url)
              label = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
            } catch {
              // The Markdown link remains usable if URL parsing fails.
            }
            return <a href={url} target="_blank" rel="nofollow noopener noreferrer" key={url}><ExternalLink size={15} /><span><strong>{label}</strong><small>{url}</small></span></a>
          })}
        </div>
      ) : null}
    </div>
  )
}

function MessageComposer({
  placeholder,
  reply,
  editing,
  onCancelContext,
  onSend,
  onTyping,
  disabledReason,
}: {
  readonly placeholder: string
  readonly reply: Message | DirectMessage | null
  readonly editing: Message | DirectMessage | null
  readonly onCancelContext: () => void
  readonly onSend: (content: string, files: File[]) => Promise<void>
  readonly onTyping?: () => void
  readonly disabledReason?: string
}) {
  const [draft, setDraft] = useState(editing?.content ?? '')
  const [files, setFiles] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)

  const addFiles = (selected: File[]) => {
    setError('')
    const combined = [...files, ...selected]
    if (combined.length > 10) {
      setError('You can attach up to 10 files.')
      return
    }
    const tooLarge = combined.find((file) => file.size > 25 * 1024 * 1024)
    if (tooLarge) {
      setError(`${tooLarge.name} is larger than 25 MB.`)
      return
    }
    setFiles(combined)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const content = draft.trim()
    if ((!content && !files.length) || disabledReason) return
    setBusy(true)
    setError('')
    try {
      await onSend(content, files)
      setDraft('')
      setFiles([])
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="composer-wrap">
      {reply || editing ? (
        <div className="composer-context">
          <span>{editing ? 'Editing message' : `Replying to ${reply?.expand?.author?.displayName ?? 'message'}`}</span>
          <button type="button" onClick={onCancelContext}><X size={14} /></button>
        </div>
      ) : null}
      {files.length ? (
        <div className="composer-files">
          {files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}<small>{Math.max(1, Math.round(file.size / 1024))} KB</small><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>)}
        </div>
      ) : null}
      {busy && files.length ? <div className="upload-progress" role="status"><span />Uploading {files.length} attachment{files.length === 1 ? '' : 's'}…</div> : null}
      {error ? <p className="composer-error" role="alert">{error}</p> : null}
      <form className="composer" onSubmit={(event) => void submit(event)}>
        <input ref={fileInput} type="file" multiple hidden onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} />
        <button type="button" disabled={Boolean(disabledReason) || busy} className="composer-add" title="Add attachment" onClick={() => fileInput.current?.click()}><Paperclip size={18} /></button>
        <input value={draft} disabled={Boolean(disabledReason) || busy} onChange={(event) => { setDraft(event.target.value); onTyping?.() }} placeholder={disabledReason || placeholder} maxLength={4000} />
        <button type="button" disabled={Boolean(disabledReason) || busy} title="Add emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((value) => !value)}><SmilePlus size={18} /></button>
        <button className="send-button" type="submit" title="Send message" disabled={Boolean(disabledReason) || busy || (!draft.trim() && !files.length)}><Send size={17} /></button>
      </form>
      {emojiOpen ? <div className="composer-emoji-picker"><EmojiPicker onSelect={(emoji) => { setDraft((value) => `${value}${value && !value.endsWith(' ') ? ' ' : ''}${emoji}`); setEmojiOpen(false) }} /></div> : null}
    </div>
  )
}

function ChatView({
  channel,
  currentUser,
  permissions: effectivePermissions,
}: {
  readonly channel: Channel
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { search: routeSearch } = useAppRouter()
  const { messages, reactions, typing } = useChannelData(channel.id)
  const [reply, setReply] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const deferredChannelSearch = useDeferredValue(search.trim())
  const typingTimer = useRef<number | undefined>(undefined)
  const listRef = useRef<HTMLDivElement>(null)
  const priorHeight = useRef(0)
  const wasNearBottom = useRef(true)
  const highlightedMessageId = new URLSearchParams(routeSearch).get('message') ?? ''

  const filteredMessages = useInfiniteQuery({
    queryKey: ['message_search', channel.community, channel.id, deferredChannelSearch, pinnedOnly],
    enabled: deferredChannelSearch.length >= 2 || pinnedOnly,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => client.send<{ page: number; hasMore: boolean; items: Message[] }>(
      `/api/thiscord/communities/${channel.community}/search?channel=${encodeURIComponent(channel.id)}&q=${encodeURIComponent(deferredChannelSearch)}&pinned=${pinnedOnly ? '1' : '0'}&page=${pageParam}&perPage=50`,
      {},
    ),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (priorHeight.current) {
      list.scrollTop += list.scrollHeight - priorHeight.current
      priorHeight.current = 0
      return
    }
    const target = highlightedMessageId ? document.getElementById(`message-${highlightedMessageId}`) : null
    if (target) {
      target.scrollIntoView({ block: 'center' })
      return
    }
    if (wasNearBottom.current) list.scrollTo({ top: list.scrollHeight })
  }, [highlightedMessageId, messages.data?.length])

  useEffect(() => {
    const lastMessage = messages.data?.at(-1)
    if (!lastMessage) return
    void client.send(`/api/thiscord/channels/${channel.id}/read`, {
      method: 'POST',
      body: { lastMessage: lastMessage.id },
    }).then(() => queryClient.invalidateQueries({ queryKey: ['read_states'] }))
  }, [channel.id, client, messages.data, queryClient])

  const send = async (content: string, files: File[]) => {
    if (editing) {
      await client.send(`/api/thiscord/messages/${editing.id}`, { method: 'PATCH', body: { content } })
      setEditing(null)
    } else {
      await client.send('/api/thiscord/messages', {
        method: 'POST',
        body: {
          channel: channel.id,
          content,
          replyTo: reply?.id ?? '',
          attachments: files,
        },
      })
      setReply(null)
    }
    await queryClient.invalidateQueries({ queryKey: ['messages', channel.id] })
  }

  const react = async (messageId: string, emoji: string) => {
    await client.send(`/api/thiscord/messages/${messageId}/reactions`, { method: 'POST', body: { emoji } })
    await queryClient.invalidateQueries({ queryKey: ['reactions', channel.id] })
  }

  const deleteMessage = async (messageId: string) => {
    await client.send(`/api/thiscord/messages/${messageId}`, { method: 'DELETE' })
    await queryClient.invalidateQueries({ queryKey: ['messages', channel.id] })
  }

  const pinMessage = async (message: Message) => {
    await client.send(`/api/thiscord/messages/${message.id}`, {
      method: 'PATCH',
      body: { pinned: !message.pinned },
    })
    await queryClient.invalidateQueries({ queryKey: ['messages', channel.id] })
  }

  const reportTyping = () => {
    if (typingTimer.current) return
    void client.send(`/api/thiscord/channels/${channel.id}/typing`, { method: 'POST' }).catch(() => undefined)
    typingTimer.current = window.setTimeout(() => { typingTimer.current = undefined }, 5_000)
  }

  const searchActive = deferredChannelSearch.length >= 2 || pinnedOnly
  const visibleMessages = searchActive
    ? (filteredMessages.data?.pages.flatMap((page) => page.items) ?? [])
    : (messages.data ?? [])
  const typingUsers = (typing.data ?? []).filter((item) => item.user !== currentUser.id).map((item) => item.expand?.user?.displayName).filter(Boolean)

  return (
    <div className="chat-view">
      <div className="chat-inline-search" role="search">
        <Search size={14} />
        <input type="search" aria-label={`Search #${channel.name}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this channel" />
        <button
          className={pinnedOnly ? 'active' : ''}
          type="button"
          aria-pressed={pinnedOnly}
          title={pinnedOnly ? 'Show all messages' : 'Show pinned messages only'}
          onClick={() => setPinnedOnly((value) => !value)}
        ><Pin size={13} />{pinnedOnly ? 'Pinned only' : 'Pinned messages'}</button>
      </div>
      <div className="message-scroll" ref={listRef} onScroll={(event) => {
        const element = event.currentTarget
        wasNearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120
      }}>
        <div className="channel-intro">
          <span>{channel.kind === 'announcement' ? <Megaphone size={24} /> : <Hash size={24} />}</span>
          <h1>{channel.kind === 'announcement' ? '' : '#'}{channel.name}</h1>
          {channel.topic ? <p>{channel.topic}</p> : null}
          {channel.kind === 'announcement' ? <p className="announcement-note">Updates posted here are highlighted for every member. Only members with message-management permission can publish.</p> : null}
        </div>
        {messages.isLoading ? <div className="loading-state">Loading messages…</div> : null}
        {messages.isError ? <DataFailure error={messages.error} onRetry={() => void messages.refetch()} label="Could not load messages." /> : null}
        {!searchActive && messages.hasNextPage ? <button className="load-older" type="button" disabled={messages.isFetchingNextPage} onClick={() => {
          priorHeight.current = listRef.current?.scrollHeight ?? 0
          void messages.fetchNextPage()
        }}>{messages.isFetchingNextPage ? 'Loading…' : 'Load older messages'}</button> : null}
        {searchActive && filteredMessages.isLoading ? <div className="loading-state">Searching messages…</div> : null}
        {searchActive && filteredMessages.isError ? <DataFailure error={filteredMessages.error} onRetry={() => void filteredMessages.refetch()} label="Could not search messages." /> : null}
        {visibleMessages.length ? (
          <div className="message-list">
            {visibleMessages.map((message) => (
              <div id={`message-${message.id}`} className={highlightedMessageId === message.id ? 'message-highlight' : ''} key={message.id}>
                <MessageRow
                  message={message}
                  reactions={(reactions.data ?? []).filter((reaction) => reaction.message === message.id)}
                  currentUser={currentUser}
                  onReact={(emoji) => react(message.id, emoji)}
                  onReply={() => { setReply(message); setEditing(null) }}
                  onEdit={() => { setEditing(message); setReply(null) }}
                  onDelete={() => deleteMessage(message.id)}
                  onPin={effectivePermissions.has('manage_messages') ? () => pinMessage(message) : undefined}
                />
              </div>
            ))}
          </div>
        ) : !messages.isLoading && !messages.isError && !filteredMessages.isLoading ? (
          <div className="empty-channel"><span><Hash size={22} /></span><h2>{searchActive ? 'No matching messages' : 'No messages yet'}</h2>{searchActive ? <p>Try a different search or clear the pinned filter.</p> : null}</div>
        ) : null}
        {searchActive && filteredMessages.hasNextPage ? <button className="load-older" type="button" disabled={filteredMessages.isFetchingNextPage} onClick={() => void filteredMessages.fetchNextPage()}>{filteredMessages.isFetchingNextPage ? 'Loading…' : 'More results'}</button> : null}
      </div>
      <MessageComposer
        key={`${editing?.id ?? ''}:${reply?.id ?? ''}`}
        placeholder={`Message #${channel.name}`}
        reply={reply}
        editing={editing}
        onCancelContext={() => { setReply(null); setEditing(null) }}
        onSend={send}
        onTyping={reportTyping}
        disabledReason={
          channel.kind === 'announcement' && !effectivePermissions.has('manage_messages')
            ? 'Only moderators can post announcements.'
            : effectivePermissions.has('send_messages')
              ? undefined
              : 'You cannot send messages in this channel.'
        }
      />
      <div className="typing-line">{typingUsers.length ? <><strong>{typingUsers.join(', ')}</strong> {typingUsers.length === 1 ? 'is' : 'are'} typing…</> : null}</div>
    </div>
  )
}

function MembersPanel({
  memberships,
  presence,
  roles,
  memberRoles,
  onOpenMember,
}: {
  readonly memberships: Membership[]
  readonly presence: PresenceRecord[]
  readonly roles: Role[]
  readonly memberRoles: readonly { membership: string; role: string }[]
  readonly onOpenMember: (user: User) => void
}) {
  const statusFor = (user: User) => resolvedPresence(user.id, presence)
  const sorted = [...memberships].sort((left, right) => {
    const leftStatus = left.expand?.user ? statusFor(left.expand.user) : 'offline'
    const rightStatus = right.expand?.user ? statusFor(right.expand.user) : 'offline'
    return Number(rightStatus !== 'offline') - Number(leftStatus !== 'offline')
  })
  const roleFor = (membership: Membership, hoistOnly = false) => roles
    .filter((role) => (!hoistOnly || role.hoist) && memberRoles.some((item) => item.membership === membership.id && item.role === role.id))
    .sort((left, right) => right.position - left.position)[0]
  const hoistedRoles = roles.filter((role) => role.hoist && !role.managed).sort((left, right) => right.position - left.position)
  const groupedIds = new Set<string>()
  const groups: Array<{ label: string; items: Membership[]; role?: Role }> = []
  for (const role of hoistedRoles) {
    const items = sorted.filter((membership) => {
      if (groupedIds.has(membership.id) || roleFor(membership, true)?.id !== role.id) return false
      groupedIds.add(membership.id)
      return true
    })
    if (items.length) groups.push({ label: role.name, items, role })
  }
  const remaining = sorted.filter((membership) => !groupedIds.has(membership.id))
  groups.push(
    { label: 'Online', items: remaining.filter((membership) => membership.expand?.user && statusFor(membership.expand.user) !== 'offline') },
    { label: 'Offline', items: remaining.filter((membership) => membership.expand?.user && statusFor(membership.expand.user) === 'offline') },
  )
  const onlineCount = sorted.filter((membership) => membership.expand?.user && statusFor(membership.expand.user) !== 'offline').length

  return (
    <aside className="members-panel">
      <div className="members-summary"><div><strong>{memberships.length} members</strong><small>{onlineCount} online</small></div></div>
      <div className="members-scroll">
        {groups.map((group) => (
          <section className="member-group" key={group.label}>
            <h3 style={group.role?.color ? { color: group.role.color } : undefined}>{group.label} — {group.items.length}</h3>
            {group.items.map((membership) => {
              const user = membership.expand?.user
              if (!user) return null
              const status = statusFor(user)
              const highestRole = roleFor(membership)
              return (
                <button className={`member-row ${status === 'offline' ? 'offline' : ''}`} type="button" onClick={() => onOpenMember(user)} key={membership.id}>
                  <Avatar user={user} status={status} />
                  <span><strong style={highestRole?.color ? { color: highestRole.color } : undefined}>{membership.nickname || user.displayName}</strong><small>{user.customStatus || `@${user.handle}`}</small></span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </aside>
  )
}

function DirectSidebar({
  conversations,
  members,
  activeId,
  currentUser,
  currentStatus,
  onSelect,
  onCreate,
  onProfile,
  onOpenVoice,
}: {
  readonly conversations: Conversation[]
  readonly members: ConversationMember[]
  readonly activeId: string
  readonly currentUser: User
  readonly currentStatus: User['status']
  readonly onSelect: (conversation: Conversation) => void
  readonly onCreate: () => void
  readonly onProfile: () => void
  readonly onOpenVoice: (channel: Channel) => void
}) {
  const call = useCall()
  const nameFor = (conversation: Conversation) => {
    if (conversation.kind === 'group') return conversation.name
    return members.find((item) => item.conversation === conversation.id && item.user !== currentUser.id)?.expand?.user?.displayName ?? 'Direct message'
  }
  return (
    <aside className="channel-sidebar direct-sidebar">
      <div className="community-header direct-header"><strong>Messages</strong><button type="button" onClick={onCreate} title="New message"><Plus size={17} /></button></div>
      <div className="channel-scroll">
        {conversations.map((conversation) => (
          <button className={`direct-row ${conversation.id === activeId ? 'active' : ''} ${conversation.id !== activeId && (() => {
            const membership = members.find((item) => item.conversation === conversation.id && item.user === currentUser.id)
            return !membership?.lastReadAt || new Date(conversation.updated).getTime() > new Date(membership.lastReadAt).getTime()
          })() ? 'unread' : ''}`} type="button" onClick={() => onSelect(conversation)} key={conversation.id}>
            <span className="direct-avatar">{initials(nameFor(conversation))}</span>
            <span><strong>{nameFor(conversation)}</strong><small>{conversation.kind === 'group' ? 'Group message' : 'Direct message'}</small></span>
          </button>
        ))}
        {!conversations.length ? <div className="sidebar-empty">No conversations yet.</div> : null}
      </div>
      <div className="sidebar-footer">
        <CallDock onOpen={onOpenVoice} />
        <div className="user-panel">
          <Avatar user={currentUser} size="small" status={currentStatus} />
          <div className="user-panel-copy"><strong>{currentUser.displayName}</strong><small>@{currentUser.handle}</small></div>
          <button className={call.microphoneMuted ? 'active' : ''} type="button" disabled={Boolean(call.session && (call.session.actionBusy || !call.session.canSpeak))} title={call.session ? !call.session.canSpeak ? 'You do not have permission to speak' : call.microphoneMuted ? 'Unmute' : 'Mute' : call.microphoneMuted ? 'Unmute before joining' : 'Mute before joining'} onClick={() => void call.toggleMicrophone()}>
            {call.microphoneMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button className={call.deafened ? 'active' : ''} type="button" disabled={Boolean(call.session?.actionBusy)} title={call.deafened ? 'Undeafen' : call.session ? 'Deafen' : 'Deafen before joining'} onClick={() => void call.toggleDeafen()}>
            <Headphones size={16} />
          </button>
          <button type="button" onClick={onProfile} title="User settings"><Settings size={16} /></button>
        </div>
      </div>
    </aside>
  )
}

function DirectView({
  conversation,
  members,
  currentUser,
  onOpenNavigation,
}: {
  readonly conversation: Conversation | null
  readonly members: ConversationMember[]
  readonly currentUser: User
  readonly onOpenNavigation: () => void
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { search: routeSearch } = useAppRouter()
  const messages = useDirectMessages(conversation?.id ?? '')
  const messageIds = (messages.data ?? []).map((message) => message.id)
  const reactions = useDirectReactions(conversation?.id ?? '', messageIds)
  const typing = useDirectTyping(conversation?.id ?? '')
  const [reply, setReply] = useState<DirectMessage | null>(null)
  const [editing, setEditing] = useState<DirectMessage | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const deferredSearch = useDeferredValue(search.trim())
  const typingTimer = useRef<number | undefined>(undefined)
  const highlightedMessageId = new URLSearchParams(routeSearch).get('directMessage') ?? ''
  const filteredMessages = useInfiniteQuery({
    queryKey: ['direct_message_search', conversation?.id, deferredSearch, pinnedOnly],
    enabled: Boolean(conversation) && (deferredSearch.length >= 2 || pinnedOnly),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const conditions = [client.filter('conversation = {:conversation}', { conversation: conversation!.id })]
      if (deferredSearch) conditions.push(client.filter('content ~ {:query}', { query: deferredSearch }))
      if (pinnedOnly) conditions.push('pinned = true')
      const page = await client.collection('direct_messages').getList(pageParam, 50, {
        filter: conditions.join(' && '),
        expand: 'author,replyTo,replyTo.author',
        sort: '-created',
      })
      return { items: page.items as unknown as DirectMessage[], page: page.page, totalPages: page.totalPages }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  const conversationMembers = members.filter((item) => item.conversation === conversation?.id)
  const title = conversation?.kind === 'group'
    ? conversation.name
    : conversationMembers.find((item) => item.user !== currentUser.id)?.expand?.user?.displayName ?? 'Direct message'

  useEffect(() => {
    const lastMessage = messages.data?.at(-1)
    if (!lastMessage || !conversation) return
    void client.send(`/api/thiscord/conversations/${conversation.id}/read`, {
      method: 'POST',
      body: { lastMessage: lastMessage.id },
    }).then(() => queryClient.invalidateQueries({ queryKey: ['conversation_members'] }))
  }, [client, conversation, messages.data, queryClient])

  if (!conversation) {
    return <div className="direct-empty"><button className="mobile-nav-button" type="button" aria-label="Open messages navigation" onClick={onOpenNavigation}><Menu size={18} /></button><MessageSquareText size={34} /><h1>Your messages</h1><p>Select a conversation or start a new one.</p></div>
  }

  const send = async (content: string, files: File[]) => {
    if (editing) {
      await client.send(`/api/thiscord/direct-messages/${editing.id}`, { method: 'PATCH', body: { content } })
      setEditing(null)
    } else {
      await client.send('/api/thiscord/direct-messages', {
        method: 'POST',
        body: { conversation: conversation.id, content, replyTo: reply?.id ?? '', attachments: files },
      })
      setReply(null)
    }
    await queryClient.invalidateQueries({ queryKey: ['direct_messages', conversation.id] })
    await queryClient.invalidateQueries({ queryKey: ['conversations'] })
    await queryClient.invalidateQueries({ queryKey: ['conversation_members'] })
  }
  const react = async (messageId: string, emoji: string) => {
    await client.send(`/api/thiscord/direct-messages/${messageId}/reactions`, { method: 'POST', body: { emoji } })
    await queryClient.invalidateQueries({ queryKey: ['direct_reactions', conversation.id] })
  }
  const reportTyping = () => {
    if (!conversation || typingTimer.current) return
    void client.send(`/api/thiscord/conversations/${conversation.id}/typing`, { method: 'POST' }).catch(() => undefined)
    typingTimer.current = window.setTimeout(() => { typingTimer.current = undefined }, 5_000)
  }
  const pinMessage = async (message: DirectMessage) => {
    await client.send(`/api/thiscord/direct-messages/${message.id}`, {
      method: 'PATCH',
      body: { pinned: !message.pinned },
    })
    await queryClient.invalidateQueries({ queryKey: ['direct_messages', conversation.id] })
    await queryClient.invalidateQueries({ queryKey: ['direct_message_search', conversation.id] })
  }
  const searchActive = deferredSearch.length >= 2 || pinnedOnly
  const visibleMessages = searchActive
    ? (filteredMessages.data?.pages.flatMap((page) => page.items).reverse() ?? [])
    : (messages.data ?? [])
  const typingUsers = (typing.data ?? [])
    .filter((item) => item.user !== currentUser.id)
    .map((item) => item.expand?.user?.displayName)
    .filter(Boolean)

  return (
    <div className="direct-view">
      <header className="direct-view-header"><button className="mobile-nav-button" type="button" aria-label="Open messages navigation" onClick={onOpenNavigation}><Menu size={18} /></button><span className="conversation-header-avatar">{initials(title)}</span><span className="direct-view-title"><strong title={title}>{title}</strong><small>{conversationMembers.length} members</small></span>{conversation.kind === 'group' ? <button type="button" aria-label="Group settings" onClick={() => setSettingsOpen(true)}><Settings size={17} /></button> : null}</header>
      <div className="chat-inline-search direct-inline-search" role="search">
        <Search size={14} />
        <input type="search" aria-label={`Search ${title}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this conversation" />
        <button
          className={pinnedOnly ? 'active' : ''}
          type="button"
          aria-pressed={pinnedOnly}
          title={pinnedOnly ? 'Show all messages' : 'Show pinned messages only'}
          onClick={() => setPinnedOnly((value) => !value)}
        ><Pin size={13} />{pinnedOnly ? 'Pinned only' : 'Pinned messages'}</button>
      </div>
      <div className="message-scroll">
        <div className="channel-intro"><span><MessageSquareText size={24} /></span><h1>{title}</h1></div>
        {!searchActive && messages.hasNextPage ? <button className="load-older" type="button" disabled={messages.isFetchingNextPage} onClick={() => void messages.fetchNextPage()}>{messages.isFetchingNextPage ? 'Loading…' : 'Load older messages'}</button> : null}
        {searchActive && filteredMessages.isLoading ? <div className="loading-state">Searching messages…</div> : null}
        {searchActive && filteredMessages.isError ? <DataFailure error={filteredMessages.error} onRetry={() => void filteredMessages.refetch()} label="Could not search this conversation." /> : null}
        <div className="message-list">
          {messages.isError ? <DataFailure error={messages.error} onRetry={() => void messages.refetch()} label="Could not load this conversation." /> : null}
          {visibleMessages.map((message) => (
            <div id={`direct-message-${message.id}`} className={highlightedMessageId === message.id ? 'message-highlight' : ''} key={message.id}>
              <MessageRow
                message={message}
                reactions={(reactions.data ?? []).filter((reaction) => reaction.message === message.id)}
                currentUser={currentUser}
                onReact={(emoji) => react(message.id, emoji)}
                onReply={() => { setReply(message); setEditing(null) }}
                onEdit={() => { setEditing(message); setReply(null) }}
                onDelete={() => client.send(`/api/thiscord/direct-messages/${message.id}`, { method: 'DELETE' }).then(() => queryClient.invalidateQueries({ queryKey: ['direct_messages', conversation.id] })).then(() => undefined)}
                onPin={() => pinMessage(message)}
              />
            </div>
          ))}
        </div>
        {!visibleMessages.length && !messages.isLoading && !filteredMessages.isLoading ? <div className="empty-channel"><MessageSquareText size={22} /><h2>{searchActive ? 'No matching messages' : 'No messages yet'}</h2><p>{searchActive ? 'Try another search.' : 'Send the first message in this conversation.'}</p></div> : null}
        {searchActive && filteredMessages.hasNextPage ? <button className="load-older" type="button" disabled={filteredMessages.isFetchingNextPage} onClick={() => void filteredMessages.fetchNextPage()}>{filteredMessages.isFetchingNextPage ? 'Loading…' : 'More results'}</button> : null}
      </div>
      <MessageComposer key={`${editing?.id ?? ''}:${reply?.id ?? ''}`} placeholder={`Message ${title}`} reply={reply} editing={editing} onCancelContext={() => { setReply(null); setEditing(null) }} onSend={send} onTyping={reportTyping} />
      <div className="typing-line">{typingUsers.length ? <><strong>{typingUsers.join(', ')}</strong> {typingUsers.length === 1 ? 'is' : 'are'} typing…</> : null}</div>
      {settingsOpen ? <GroupSettingsDialog
        conversation={conversation}
        members={conversationMembers}
        currentUser={currentUser}
        onClose={() => setSettingsOpen(false)}
        onChanged={async () => {
          await queryClient.invalidateQueries({ queryKey: ['conversations'] })
          await queryClient.invalidateQueries({ queryKey: ['conversation_members'] })
        }}
      /> : null}
    </div>
  )
}

export function WorkspaceApp() {
  const { pathname, navigate } = useAppRouter()
  const routeParts = pathname.split('/').filter(Boolean)
  const communityId = routeParts[0] === 'channels' && routeParts[1] ? decodeURIComponent(routeParts[1]) : '@me'
  const channelId = routeParts[0] === 'channels' && routeParts[2] ? decodeURIComponent(routeParts[2]) : ''
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const call = useCall()
  const currentUser = user!
  useEffect(() => {
    const preferences = currentUser.preferences ?? {}
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const theme = preferences.theme === 'system'
        ? media.matches ? 'light' : 'dark'
        : preferences.theme === 'light' ? 'light' : 'dark'
      document.documentElement.dataset.theme = theme
      document.documentElement.classList.toggle('compact-mode', Boolean(preferences.compactMode))
      document.documentElement.classList.toggle('reduce-motion', Boolean(preferences.reduceMotion))
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [currentUser.preferences])
  const memberships = useMemberships(currentUser.id)
  const communities = (memberships.data ?? []).map((membership) => membership.expand?.community).filter(Boolean) as Community[]
  const community = communities.find((item) => item.id === communityId)
  const communityData = useCommunityData(community?.id ?? '')
  const voiceOccupancy = useVoiceOccupancy(community?.id ?? '')
  const conversationsData = useConversations(currentUser.id)
  const conversations = conversationsData.conversations.data ?? []
  const conversationMembers = conversationsData.members.data ?? []
  const activeConversation = conversations.find((item) => item.id === channelId) ?? null
  const channels = useMemo(() => communityData.channels.data ?? [], [communityData.channels.data])
  const activeChannel = channels.find((item) => item.id === channelId && item.kind !== 'category')
  const communityPermissionQuery = useEffectivePermissions(community?.id ?? '')
  const channelPermissionQuery = useEffectivePermissions(community?.id ?? '', activeChannel?.id ?? '')
  const communityPermissions = useMemo(
    () => new Set(communityPermissionQuery.data?.permissions ?? []),
    [communityPermissionQuery.data?.permissions],
  )
  const channelPermissions = useMemo(
    () => new Set(channelPermissionQuery.data?.permissions ?? []),
    [channelPermissionQuery.data?.permissions],
  )
  const notifications = useNotifications(currentUser.id)
  const [showMembers, setShowMembers] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [acknowledgedNsfw, setAcknowledgedNsfw] = useState<ReadonlySet<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('thiscord_nsfw_ack') ?? '[]') as string[])
    } catch {
      return new Set()
    }
  })
  const [presenceError, setPresenceError] = useState('')
  const realtimeStatus = useRealtimeInvalidation(true)
  const latestNotificationCreated = useRef<string | null>(null)
  const previousVoiceMedia = useRef<ReadonlySet<string>>(new Set())

  const muted = Boolean(activeChannel && currentUser.preferences?.mutedChannels?.includes(activeChannel.id))

  useEffect(() => {
    if (call.session) return
    const resumeChannelId = sessionStorage.getItem('thiscord_jitsi_resume_channel')
    if (!resumeChannelId) return
    const resumeChannel = channels.find((channel) => channel.id === resumeChannelId && channel.kind === 'voice')
    if (!resumeChannel) return
    sessionStorage.removeItem('thiscord_jitsi_resume_channel')
    void call.join(resumeChannel)
  }, [call, channels])

  const activeVoiceMedia = useMemo(() => {
    const session = call.session
    if (!session) return new Set<string>()
    const next = new Set<string>()
    for (const participant of session.participants) {
      if (participant.videoTrack) next.add(`${participant.userId || participant.id}:camera`)
      if (participant.screenTrack) next.add(`${participant.userId || participant.id}:screen`)
    }
    for (const participant of voiceOccupancy.data ?? []) {
      if (participant.expand?.call?.channel !== session.channel.id) continue
      if (participant.camera) next.add(`${participant.user}:camera`)
      if (participant.sharing) next.add(`${participant.user}:screen`)
    }
    return next
  }, [call.session, voiceOccupancy.data])

  useEffect(() => {
    const previous = previousVoiceMedia.current
    previousVoiceMedia.current = activeVoiceMedia
    const session = call.session
    if (!session || session.status === 'error') return
    const mediaStarted = [...activeVoiceMedia].some((item) => !previous.has(item))
    if (!mediaStarted) return
    const target = `/channels/${encodeURIComponent(session.channel.community)}/${encodeURIComponent(session.channel.id)}`
    if (pathname !== target) navigate(target)
  }, [activeVoiceMedia, call.session, navigate, pathname])

  useEffect(() => {
    const deviceIdKey = 'thiscord_device_id'
    let deviceId = localStorage.getItem(deviceIdKey)
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem(deviceIdKey, deviceId)
    }
    const preferredStatus = () => currentUser.status === 'offline'
      ? 'offline'
      : currentUser.status === 'dnd'
        ? 'dnd'
        : currentUser.status === 'idle' || document.hidden
          ? 'idle'
          : 'online'
    const heartbeat = () => void client.send('/api/thiscord/presence', {
      method: 'POST',
      body: { deviceId, status: preferredStatus() },
    }).then(() => setPresenceError('')).catch(() => setPresenceError('Presence could not reach the server. Retrying…'))
    const offline = () => {
      void fetch(`${client.baseURL}/api/thiscord/presence`, {
        method: 'POST',
        headers: {
          authorization: client.authStore.token,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ deviceId, status: 'offline' }),
        keepalive: true,
      }).catch(() => undefined)
    }
    heartbeat()
    const timer = window.setInterval(heartbeat, 25_000)
    document.addEventListener('visibilitychange', heartbeat)
    window.addEventListener('focus', heartbeat)
    window.addEventListener('online', heartbeat)
    window.addEventListener('pagehide', offline)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', heartbeat)
      window.removeEventListener('focus', heartbeat)
      window.removeEventListener('online', heartbeat)
      window.removeEventListener('pagehide', offline)
    }
  }, [client, currentUser.status])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setGlobalSearch('')
        setSearchOpen(false)
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (community && !activeChannel && channels.length) {
      const first = channels.find((item) => item.kind !== 'category')
      if (first) navigate(`/channels/${community.id}/${first.id}`, { replace: true })
    }
  }, [activeChannel, channels, community, navigate])

  const selectCommunity = (next: Community) => {
    const first = (next.id === community?.id ? channels : []).find((item) => item.kind !== 'category')
    navigate(`/channels/${next.id}${first ? `/${first.id}` : ''}`)
  }

  const unreadNotifications = (notifications.data ?? []).filter((item) => !item.readAt)
  useEffect(() => {
    if (!notifications.isSuccess) return
    const newestCreated = (notifications.data ?? []).reduce(
      (newest, item) => item.created > newest ? item.created : newest,
      '',
    )
    if (latestNotificationCreated.current === null) {
      latestNotificationCreated.current = newestCreated
      return
    }
    if (
      newestCreated > latestNotificationCreated.current
      && currentUser.preferences?.notificationSound !== false
      && currentUser.status !== 'dnd'
    ) {
      try {
        const AudioContextType = window.AudioContext
        const audio = new AudioContextType()
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.frequency.value = 540
        gain.gain.setValueAtTime(0.045, audio.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12)
        oscillator.connect(gain)
        gain.connect(audio.destination)
        oscillator.start()
        oscillator.stop(audio.currentTime + 0.12)
        oscillator.addEventListener('ended', () => void audio.close(), { once: true })
      } catch {
        // Browsers may block audio until the user interacts with the page.
      }
    }
    if (newestCreated > latestNotificationCreated.current) latestNotificationCreated.current = newestCreated
  }, [currentUser.preferences?.notificationSound, currentUser.status, notifications.data, notifications.isSuccess])
  const readByChannel = new Map((communityData.readStates.data ?? []).map((state) => [state.channel, state]))
  const unreadChannelIds = new Set(
    (communityData.unreadSummary.data?.items ?? [])
      .filter((item) => {
        if (item.author === currentUser.id || item.channel === activeChannel?.id) return false
        const readState = readByChannel.get(item.channel)
        return !readState || new Date(item.created).getTime() > new Date(readState.lastReadAt).getTime()
      })
      .map((item) => item.channel),
  )
  const deferredSearch = useDeferredValue(globalSearch.trim())
  const globalSearchQuery = useQuery({
    queryKey: ['global_search', deferredSearch],
    enabled: deferredSearch.length >= 2,
    queryFn: () => client.send<GlobalSearchResult>(
      `/api/thiscord/search?q=${encodeURIComponent(deferredSearch)}`,
      {},
    ),
    staleTime: 15_000,
  })
  const searchResultCount = globalSearchQuery.data
    ? globalSearchQuery.data.channels.length
      + globalSearchQuery.data.people.length
      + globalSearchQuery.data.messages.length
      + globalSearchQuery.data.directMessages.length
    : 0

  const openDirectWithUser = async (targetUserId: string) => {
    setActionError('')
    try {
      const conversation = await client.send<Conversation>('/api/thiscord/conversations', {
        method: 'POST',
        body: { userIds: [targetUserId] },
      })
      await queryClient.invalidateQueries({ queryKey: ['conversation_members'] })
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/channels/@me/${conversation.id}`)
      setGlobalSearch('')
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  const selectChannel = (channel: Channel) => {
    if (channel.kind !== 'voice') {
      navigate(`/channels/${channel.community}/${channel.id}`)
    } else if (call.session?.channel.id === channel.id) {
      navigate(`/channels/${channel.community}/${channel.id}`)
    } else {
      const replacingFocusedCall = activeChannel?.kind === 'voice'
        && activeChannel.id === call.session?.channel.id
      void call.join(channel)
      if (replacingFocusedCall) navigate(`/channels/${channel.community}/${channel.id}`)
    }
    setMobileSidebarOpen(false)
  }

  const toggleChannelMute = async () => {
    if (!activeChannel) return
    const current = new Set(currentUser.preferences?.mutedChannels ?? [])
    if (current.has(activeChannel.id)) current.delete(activeChannel.id)
    else current.add(activeChannel.id)
    setActionError('')
    try {
      const record = await client.collection('users').update(currentUser.id, {
        preferences: {
          ...(currentUser.preferences ?? {}),
          mutedChannels: [...current],
        },
      })
      client.authStore.save(client.authStore.token, record)
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
  }

  if (memberships.isError) {
    return <main className="fatal-startup"><section><h1>Could not load your communities</h1><p>{errorMessage(memberships.error)}</p><button className="primary-action" type="button" onClick={() => void memberships.refetch()}>Try again</button></section></main>
  }
  const backgroundFailure = communityPermissionQuery.isError
    ? { label: 'Could not load your community permissions.', error: communityPermissionQuery.error, retry: communityPermissionQuery.refetch }
    : channelPermissionQuery.isError
      ? { label: 'Could not load this channel’s permissions.', error: channelPermissionQuery.error, retry: channelPermissionQuery.refetch }
      : communityData.unreadSummary.isError
        ? { label: 'Could not refresh unread channels.', error: communityData.unreadSummary.error, retry: communityData.unreadSummary.refetch }
      : communityData.presence.isError
        ? { label: 'Could not refresh member presence.', error: communityData.presence.error, retry: communityData.presence.refetch }
        : voiceOccupancy.isError
          ? { label: 'Could not refresh voice occupancy.', error: voiceOccupancy.error, retry: voiceOccupancy.refetch }
      : null

  return (
    <div className="app-shell">
      <header className="app-titlebar">
        <div className="wordmark"><span className="wordmark-mark"><i /><i /></span><strong>{config.name.toLowerCase()}</strong></div>
        <button className="mobile-search-button" type="button" aria-label="Open search" onClick={() => { setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus()) }}><Search size={18} /></button>
        <div className={`global-search-wrap ${searchOpen ? 'mobile-open' : ''}`}>
          <div className="global-search" role="search"><Search size={15} /><input ref={searchInputRef} type="search" aria-label="Search messages, channels, or people" value={globalSearch} onFocus={() => setSearchOpen(true)} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search messages, channels, or people" /><kbd>Ctrl K</kbd><button className="search-close" type="button" aria-label="Close search" onClick={() => { setSearchOpen(false); setGlobalSearch('') }}><X size={15} /></button></div>
          {globalSearch.trim() ? (
            <div className="global-search-results" role="listbox" aria-label="Search results">
              {deferredSearch.length < 2 ? <p>Type at least two characters.</p> : null}
              {globalSearchQuery.isLoading ? <p>Searching…</p> : null}
              {globalSearchQuery.isError ? <div className="search-state-error"><span>{errorMessage(globalSearchQuery.error)}</span><button type="button" onClick={() => void globalSearchQuery.refetch()}>Retry</button></div> : null}
              {globalSearchQuery.data?.channels.map((match) => (
                <button type="button" onClick={() => { selectChannel(match); setGlobalSearch(''); setSearchOpen(false) }} key={`channel-${match.id}`}><ChannelIcon kind={match.kind} /><span>{match.name}<small>{match.expand?.community?.name ?? 'Community'} · channel</small></span></button>
              ))}
              {globalSearchQuery.data?.people.map((person) => (
                <button type="button" onClick={() => { setModal({ kind: 'member', user: person }); setGlobalSearch(''); setSearchOpen(false) }} key={`member-${person.id}`}><Avatar user={person} size="small" /><span>{person.displayName}<small>@{person.handle} · member</small></span></button>
              ))}
              {globalSearchQuery.data?.messages.map((message) => (
                <button type="button" onClick={() => {
                  const channel = message.expand?.channel
                  if (channel) navigate(`/channels/${channel.community}/${channel.id}?message=${message.id}`)
                  setGlobalSearch('')
                  setSearchOpen(false)
                }} key={`message-${message.id}`}><MessageSquareText size={17} /><span>{message.content}<small>#{message.expand?.channel?.name ?? 'channel'} · {formatTime(message.created)}</small></span></button>
              ))}
              {globalSearchQuery.data?.directMessages.map((message) => (
                <button type="button" onClick={() => {
                  navigate(`/channels/@me/${message.conversation}?directMessage=${message.id}`)
                  setGlobalSearch('')
                  setSearchOpen(false)
                }} key={`direct-message-${message.id}`}><MessageSquareText size={17} /><span>{message.content}<small>{message.expand?.conversation?.name || 'Direct message'} · {formatTime(message.created)}</small></span></button>
              ))}
              {globalSearchQuery.isSuccess && searchResultCount === 0 ? <p>No results found.</p> : null}
            </div>
          ) : null}
        </div>
        <div className="titlebar-actions">
          <button className={notificationsOpen ? 'active' : ''} type="button" title="Inbox" onClick={() => setNotificationsOpen((value) => !value)}>
            <Inbox size={17} />{unreadNotifications.length ? <span className="action-badge">{unreadNotifications.length}</span> : null}
          </button>
        </div>
        {notificationsOpen ? (
          <div className="notifications-popover">
            <header><span><strong>Inbox</strong><small>{unreadNotifications.length} unread</small></span>{unreadNotifications.length ? <button type="button" onClick={() => void client.send('/api/thiscord/notifications/read-all', { method: 'POST' }).then(() => queryClient.invalidateQueries({ queryKey: ['notifications', currentUser.id] }))}><Check size={14} />Mark all read</button> : null}</header>
            {(notifications.data ?? []).map((notification) => (
              <button type="button" onClick={() => {
                if (!notification.readAt) {
                  void client.send(`/api/thiscord/notifications/${notification.id}/read`, { method: 'POST' })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['notifications', currentUser.id] }))
                }
                if (notification.community && notification.channel) navigate(`/channels/${notification.community}/${notification.channel}`)
                else if (notification.data?.conversation) navigate(`/channels/@me/${notification.data.conversation}${notification.data.directMessage ? `?directMessage=${notification.data.directMessage}` : ''}`)
                setNotificationsOpen(false)
              }} key={notification.id}>
                <Avatar user={notification.expand?.actor ?? currentUser} size="small" />
                <span><strong>{notification.type.replace(/_/g, ' ')}</strong><small>{formatTime(notification.created)}</small></span>
                {!notification.readAt ? <i /> : null}
              </button>
            ))}
            {notifications.hasNextPage ? <button className="notifications-more" type="button" disabled={notifications.isFetchingNextPage} onClick={() => void notifications.fetchNextPage()}>{notifications.isFetchingNextPage ? 'Loading…' : 'Load older notifications'}</button> : null}
            {notifications.isError ? <DataFailure error={notifications.error} onRetry={() => void notifications.refetch()} label="Could not load notifications." /> : null}
            {!notifications.data?.length && !notifications.isError ? <p>No notifications.</p> : null}
          </div>
        ) : null}
      </header>

      <div className={`app-grid ${showMembers && community ? '' : 'members-hidden'} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
        <CommunityRail
          communities={communities}
          activeId={communityId}
          onOpenDirect={() => { navigate('/channels/@me'); setMobileSidebarOpen(true) }}
          onSelect={(next) => { selectCommunity(next); setMobileSidebarOpen(true) }}
          onAdd={() => setModal({ kind: 'community' })}
        />
        {community ? (
          <ChannelSidebar
            community={community}
            channels={channels}
            activeChannelId={activeChannel?.id ?? ''}
            currentUser={currentUser}
            currentStatus={resolvedPresence(currentUser.id, communityData.presence.data ?? [])}
            onSelect={selectChannel}
            onCreate={(parent) => setModal({ kind: 'channel', parent })}
            onCategorySettings={(category) => setModal({ kind: 'channelSettings', channel: category })}
            onSettings={() => setModal({ kind: 'settings' })}
            onProfile={() => setModal({ kind: 'profile' })}
            onOpenVoice={(channel) => navigate(`/channels/${channel.community}/${channel.id}`)}
            unreadChannelIds={unreadChannelIds}
            permissions={communityPermissions}
            voiceOccupancy={voiceOccupancy.data ?? []}
          />
        ) : (
          <DirectSidebar
            conversations={conversations}
            members={conversationMembers}
            activeId={activeConversation?.id ?? ''}
            currentUser={currentUser}
            currentStatus={currentUser.status}
            onSelect={(conversation) => { navigate(`/channels/@me/${conversation.id}`); setMobileSidebarOpen(false) }}
            onCreate={() => setModal({ kind: 'direct' })}
            onProfile={() => setModal({ kind: 'profile' })}
            onOpenVoice={(channel) => navigate(`/channels/${channel.community}/${channel.id}`)}
          />
        )}

        <main className="content-panel">
          {community && activeChannel ? (
            <>
              <header className="channel-toolbar">
                <button className="mobile-nav-button" type="button" aria-label="Open community navigation" onClick={() => setMobileSidebarOpen((value) => !value)}><Menu size={18} /></button>
                <div className="channel-toolbar-title"><ChannelIcon kind={activeChannel.kind} /><strong>{activeChannel.name}</strong>{activeChannel.topic ? <><span /><p>{activeChannel.topic}</p></> : null}</div>
                <div className="channel-toolbar-actions">
                  <button type="button" title={muted ? 'Unmute channel notifications' : 'Mute channel notifications'} onClick={() => void toggleChannelMute()}>{muted ? <BellOff size={18} /> : <Bell size={18} />}</button>
                  {(channelPermissions.has('manage_channels') || channelPermissions.has('manage_roles')) ? <button type="button" title="Channel settings" onClick={() => setModal({ kind: 'channelSettings', channel: activeChannel })}><Settings size={18} /></button> : null}
                  <button className={showMembers ? 'active' : ''} type="button" title="Member list" onClick={() => setShowMembers((value) => !value)}><Users size={19} /></button>
                </div>
              </header>
              {activeChannel.nsfw && !acknowledgedNsfw.has(activeChannel.id) ? (
                <section className="nsfw-gate"><strong>Age-restricted channel</strong><p>This channel may contain content intended for adults.</p><button className="primary-action" type="button" onClick={() => {
                  const next = new Set(acknowledgedNsfw)
                  next.add(activeChannel.id)
                  sessionStorage.setItem('thiscord_nsfw_ack', JSON.stringify([...next]))
                  setAcknowledgedNsfw(next)
                }}>Continue</button></section>
              ) : activeChannel.kind === 'voice'
                ? <VoiceChannelSurface channel={activeChannel} occupancy={voiceOccupancy.data ?? []} />
                : <ChatView channel={activeChannel} currentUser={currentUser} permissions={channelPermissions} />}
            </>
          ) : community ? (
            communityData.channels.isError
              ? <DataFailure error={communityData.channels.error} onRetry={() => void communityData.channels.refetch()} label="Could not load channels." />
              : <div className="loading-state">{communityData.channels.isLoading ? 'Loading channels…' : 'Select a channel.'}</div>
          ) : (
            conversationsData.conversations.isError || conversationsData.members.isError
              ? <DataFailure
                  error={conversationsData.conversations.error ?? conversationsData.members.error}
                  onRetry={() => { void conversationsData.conversations.refetch(); void conversationsData.members.refetch() }}
                  label="Could not load direct messages."
                />
              : <DirectView key={activeConversation?.id ?? '@me'} conversation={activeConversation} members={conversationMembers} currentUser={currentUser} onOpenNavigation={() => setMobileSidebarOpen((value) => !value)} />
          )}
        </main>
        {mobileSidebarOpen ? <button className="mobile-sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileSidebarOpen(false)} /> : null}
        {community && showMembers ? (
          communityData.members.isError
            ? <aside className="members-panel"><DataFailure error={communityData.members.error} onRetry={() => void communityData.members.refetch()} label="Could not load members." /></aside>
            : <MembersPanel
                memberships={communityData.members.data ?? []}
                presence={communityData.presence.data ?? []}
                roles={communityData.roles.data ?? []}
                memberRoles={communityData.memberRoles.data ?? []}
                onOpenMember={(person) => {
                  if (person.id === currentUser.id) setModal({ kind: 'profile' })
                  else void openDirectWithUser(person.id)
                }}
              />
        ) : null}
      </div>

      {modal?.kind === 'community' ? (
        <CommunityDialog
          onClose={() => setModal(null)}
          onCreated={async (created) => {
            await queryClient.invalidateQueries({ queryKey: ['memberships'] })
            setModal(null)
            navigate(`/channels/${created.id}`)
          }}
        />
      ) : null}
      {modal?.kind === 'channel' && community ? (
        <ChannelDialog
          community={community}
          parent={modal.parent}
          onClose={() => setModal(null)}
          onCreated={async (created) => {
            await queryClient.invalidateQueries({ queryKey: ['channels', community.id] })
            setModal(null)
            navigate(`/channels/${community.id}/${created.id}`)
          }}
        />
      ) : null}
      {modal?.kind === 'channelSettings' && community ? (
        <ChannelSettingsDialog
          community={community}
          channel={modal.channel}
          allChannels={channels}
          categories={channels.filter((item) => item.kind === 'category')}
          roles={communityData.roles.data ?? []}
          memberships={communityData.members.data ?? []}
          permissions={modal.channel.kind === 'category' ? communityPermissions : channelPermissions}
          onClose={() => setModal(null)}
          onUpdated={async () => {
            await queryClient.invalidateQueries({ queryKey: ['channels', community.id] })
            setModal(null)
          }}
          onDeleted={async () => {
            await queryClient.invalidateQueries({ queryKey: ['channels', community.id] })
            setModal(null)
            navigate(`/channels/${community.id}`, { replace: true })
          }}
        />
      ) : null}
      {modal?.kind === 'settings' && community ? (
        <CommunitySettingsDialog
          community={community}
          roles={communityData.roles.data ?? []}
          memberships={communityData.members.data ?? []}
          memberRoles={communityData.memberRoles.data ?? []}
          currentUser={currentUser}
          permissions={communityPermissions}
          onClose={() => setModal(null)}
          onChanged={() => Promise.all([
            queryClient.invalidateQueries({ queryKey: ['memberships'] }),
            queryClient.invalidateQueries({ queryKey: ['roles', community.id] }),
            queryClient.invalidateQueries({ queryKey: ['member_roles', community.id] }),
            queryClient.invalidateQueries({ queryKey: ['effective_permissions', community.id] }),
          ]).then(() => undefined)}
          onDeleted={() => {
            setModal(null)
            void queryClient.invalidateQueries({ queryKey: ['memberships'] })
            navigate('/channels/@me', { replace: true })
          }}
        />
      ) : null}
      {modal?.kind === 'profile' ? (
        <ProfileDialog user={currentUser} onClose={() => setModal(null)} onLogout={logout} />
      ) : null}
      {modal?.kind === 'member' ? (
        <MemberProfileDialog
          user={modal.user}
          onClose={() => setModal(null)}
          onMessage={modal.user.id === currentUser.id ? undefined : () => {
            const person = modal.user
            setModal(null)
            void openDirectWithUser(person.id)
          }}
        />
      ) : null}
      {modal?.kind === 'direct' ? (
        <DirectDialog onClose={() => setModal(null)} onCreated={async (created) => {
          await queryClient.invalidateQueries({ queryKey: ['conversations'] })
          await queryClient.invalidateQueries({ queryKey: ['conversation_members'] })
          setModal(null)
          navigate(`/channels/@me/${created.id}`)
        }} />
      ) : null}
      {actionError ? <div className="toast-error" role="alert">{actionError}<button type="button" onClick={() => setActionError('')}><X size={14} /></button></div> : null}
      {backgroundFailure ? <div className="toast-error" role="alert"><span><strong>{backgroundFailure.label}</strong> {errorMessage(backgroundFailure.error)}</span><button type="button" onClick={() => void backgroundFailure.retry()}>Retry</button></div> : null}
      {!backgroundFailure && (presenceError || realtimeStatus === 'degraded') ? <div className="toast-error connection-warning" role="status"><span>{presenceError || 'Live updates are reconnecting…'}</span></div> : null}
    </div>
  )
}

function CommunityDialog({ onClose, onCreated }: {
  readonly onClose: () => void
  readonly onCreated: (community: Community) => Promise<void>
}) {
  const client = usePocketBase()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      if (mode === 'create') {
        const community = await client.send<Community>('/api/thiscord/communities', {
          method: 'POST',
          body: { name: data.get('name'), slug: data.get('slug'), description: data.get('description') },
        })
        await onCreated(community)
      } else {
        const code = String(data.get('code') || '').trim().replace(/^.*\//, '')
        const membership = await client.send<Membership>(`/api/thiscord/invites/${encodeURIComponent(code)}/accept`, { method: 'POST' })
        const community = await client.collection('communities').getOne<Community>(membership.community)
        await onCreated(community)
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={mode === 'create' ? 'Create a community' : 'Join a community'} onClose={onClose}>
      <div className="modal-tabs"><button className={mode === 'create' ? 'active' : ''} type="button" onClick={() => setMode('create')}>Create</button><button className={mode === 'join' ? 'active' : ''} type="button" onClick={() => setMode('join')}>Join</button></div>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        {mode === 'create' ? (
          <>
            <label><span>Name</span><input name="name" required maxLength={100} autoFocus /></label>
            <label><span>Address</span><input name="slug" pattern="[a-z0-9-]+" placeholder="generated from the name" /></label>
            <label><span>Description</span><textarea name="description" maxLength={1000} rows={3} /></label>
          </>
        ) : <label><span>Invite code or link</span><input name="code" required autoFocus /></label>}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Working…' : mode === 'create' ? 'Create community' : 'Join community'}</button>
      </form>
    </ModalFrame>
  )
}

function ChannelDialog({ community, parent, onClose, onCreated }: {
  readonly community: Community
  readonly parent: string
  readonly onClose: () => void
  readonly onCreated: (channel: Channel) => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const kind = String(data.get('kind') || 'text')
      const channel = await client.send<Channel>(`/api/thiscord/communities/${community.id}/channels`, {
        method: 'POST',
        body: { name: data.get('name'), kind, topic: data.get('topic'), parent: kind === 'category' ? '' : parent },
      })
      await onCreated(channel)
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="Create channel" onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>Type</span><select name="kind"><option value="text">Text</option><option value="announcement">Announcement</option><option value="voice">Voice</option><option value="category">Category</option></select></label>
        <label><span>Name</span><input name="name" required maxLength={100} autoFocus /></label>
        <label><span>Topic</span><textarea name="topic" maxLength={1024} rows={3} /></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create channel'}</button>
      </form>
    </ModalFrame>
  )
}

function ChannelSettingsDialog({ community, channel, allChannels, categories, roles, memberships, permissions: effectivePermissions, onClose, onUpdated, onDeleted }: {
  readonly community: Community
  readonly channel: Channel
  readonly allChannels: Channel[]
  readonly categories: Channel[]
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly permissions: ReadonlySet<Permission>
  readonly onClose: () => void
  readonly onUpdated: () => Promise<void>
  readonly onDeleted: () => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await client.send(`/api/thiscord/channels/${channel.id}`, {
        method: 'PATCH',
        body: {
          name: data.get('name'),
          topic: data.get('topic'),
          parent: data.get('parent'),
          slowmodeSeconds: Number(data.get('slowmodeSeconds') || 0),
          nsfw: data.get('nsfw') === 'on',
        },
      })
      await onUpdated()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    const prompt = channel.kind === 'category'
      ? `Delete the ${channel.name} category? Its channels will be kept without a category.`
      : `Delete #${channel.name}? This cannot be undone.`
    if (!window.confirm(prompt)) return
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/channels/${channel.id}`, { method: 'DELETE' })
      await onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const move = async (direction: -1 | 1) => {
    const ordered = [...allChannels].sort((left, right) => left.position - right.position)
    const index = ordered.findIndex((item) => item.id === channel.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/communities/${community.id}/channels/order`, {
        method: 'PUT',
        body: { ids: next.map((item) => item.id) },
      })
      await onUpdated()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={`${channel.kind === 'category' ? 'Category' : 'Channel'} settings · ${community.name}`} onClose={onClose}>
      {effectivePermissions.has('manage_channels') ? <div className="ordering-actions"><span>Channel position</span><button className="secondary-action compact-action" type="button" disabled={busy || channel.id === [...allChannels].sort((a, b) => a.position - b.position)[0]?.id} onClick={() => void move(-1)}><ChevronUp size={15} />Move up</button><button className="secondary-action compact-action" type="button" disabled={busy || channel.id === [...allChannels].sort((a, b) => a.position - b.position).at(-1)?.id} onClick={() => void move(1)}><ChevronDown size={15} />Move down</button></div> : null}
      {effectivePermissions.has('manage_channels') ? <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>Name</span><input name="name" defaultValue={channel.name} required maxLength={100} /></label>
        {channel.kind !== 'category' ? <label><span>Topic</span><textarea name="topic" defaultValue={channel.topic} maxLength={1024} rows={3} /></label> : null}
        {channel.kind !== 'category' ? (
          <label><span>Category</span><select name="parent" defaultValue={channel.parent}><option value="">No category</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        ) : null}
        {['text', 'announcement'].includes(channel.kind) ? <label><span>Slow mode (seconds)</span><input name="slowmodeSeconds" type="number" min="0" max="21600" defaultValue={channel.slowmodeSeconds} /></label> : null}
        {channel.kind !== 'category' ? <label className="checkbox-line"><input name="nsfw" type="checkbox" defaultChecked={channel.nsfw} /><span>Age-restricted channel</span></label> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : `Save ${channel.kind === 'category' ? 'category' : 'channel'}`}</button>
      </form> : null}
      {effectivePermissions.has('manage_roles') ? <ChannelPermissionsEditor channel={channel} roles={roles} memberships={memberships} effectivePermissions={effectivePermissions} /> : null}
      {effectivePermissions.has('manage_channels') ? <button className="danger-action modal-logout" type="button" onClick={() => void remove()} disabled={busy}>Delete {channel.kind === 'category' ? 'category' : 'channel'}</button> : null}
    </ModalFrame>
  )
}

function ChannelPermissionsEditor({ channel, roles, memberships, effectivePermissions }: {
  readonly channel: Channel
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly effectivePermissions: ReadonlySet<Permission>
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const targets = [
    ...roles.map((role) => ({ key: `role:${role.id}`, type: 'role' as const, id: role.id, label: `Role · ${role.name}` })),
    ...memberships
      .filter((membership) => membership.expand?.user)
      .map((membership) => ({
        key: `member:${membership.id}`,
        type: 'member' as const,
        id: membership.id,
        label: `Member · ${membership.expand!.user!.displayName}`,
      })),
  ]
  const [targetKey, setTargetKey] = useState(targets[0]?.key ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState('')
  const overwrites = useQuery({
    queryKey: ['channel_permissions', channel.id],
    queryFn: async () => await client.collection('channel_permissions').getFullList({
      filter: client.filter('channel = {:channel}', { channel: channel.id }),
    }) as unknown as ChannelPermission[],
  })
  const selectedTarget = targets.find((target) => target.key === targetKey)
  const selectedOverwrite = selectedTarget
    ? (overwrites.data ?? []).find((overwrite) => overwrite.targetType === selectedTarget.type && overwrite.targetId === selectedTarget.id)
    : undefined

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTarget || busy) return
    setBusy(true)
    setError('')
    setSaved(false)
    const data = new FormData(event.currentTarget)
    const allow = permissions.filter((permission) => data.get(permission) === 'allow')
    const deny = permissions.filter((permission) => data.get(permission) === 'deny')
    try {
      await client.send(`/api/thiscord/channels/${channel.id}/permissions`, {
        method: 'PUT',
        body: {
          targetType: selectedTarget.type,
          targetId: selectedTarget.id,
          allow,
          deny,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['channel_permissions', channel.id] })
      await queryClient.invalidateQueries({ queryKey: ['channels'] })
      await queryClient.invalidateQueries({ queryKey: ['effective_permissions'] })
      setSaved(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="channel-permissions">
      <h3>Permission overrides</h3>
      <p>Allow or deny permissions for a role or individual member in this channel.</p>
      {targets.length ? (
        <>
          <label><span>Role or member</span><select value={targetKey} onChange={(event) => { setTargetKey(event.target.value); setSaved(false) }}>{targets.map((target) => <option value={target.key} key={target.key}>{target.label}</option>)}</select></label>
          <label><span>Find permission</span><input type="search" value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Search permissions" /></label>
          {selectedTarget ? (
            <form onSubmit={(event) => void save(event)} key={`${selectedTarget.key}:${selectedOverwrite?.id ?? ''}:${selectedOverwrite?.allow.join(',') ?? ''}:${selectedOverwrite?.deny.join(',') ?? ''}`}>
              {[
                ['Administration', ['manage_community', 'manage_channels', 'manage_roles', 'manage_messages', 'manage_members', 'view_audit_log']],
                ['Text', ['create_invites', 'view_channels', 'send_messages', 'read_history', 'add_reactions', 'attach_files', 'embed_links', 'mention_everyone']],
                ['Voice', ['connect_voice', 'speak', 'stream_video', 'mute_members']],
              ].map(([label, sectionPermissions]) => {
                const visible = (sectionPermissions as string[]).filter((permission) => (
                  permission.includes(permissionSearch.toLowerCase().replace(/\s+/g, '_'))
                  && (effectivePermissions.has('administrator') || effectivePermissions.has(permission as Permission))
                ))
                return visible.length ? <fieldset className="permission-section" key={label as string}><legend>{label as string}</legend><div className="permission-overwrite-grid">{visible.map((permission) => (
                  <label key={permission}>
                    <span>{permission.replace(/_/g, ' ')}</span>
                    <select name={permission} defaultValue={selectedOverwrite?.allow.includes(permission as Permission) ? 'allow' : selectedOverwrite?.deny.includes(permission as Permission) ? 'deny' : 'inherit'}>
                      <option value="inherit">Inherit</option>
                      <option value="allow">Allow</option>
                      <option value="deny">Deny</option>
                    </select>
                  </label>
                ))}</div></fieldset> : null
              })}
              {error ? <p className="form-error">{error}</p> : null}
              {saved ? <p className="form-notice">Permission overrides saved.</p> : null}
              <div className="role-actions"><button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save permission overrides'}</button><button className="secondary-action" type="button" disabled={busy || !selectedOverwrite} onClick={() => {
                const form = document.activeElement?.closest('form') ?? undefined
                if (form instanceof HTMLFormElement) {
                  for (const select of form.querySelectorAll<HTMLSelectElement>('.permission-overwrite-grid select')) select.value = 'inherit'
                  form.requestSubmit()
                }
              }}>Reset override</button></div>
            </form>
          ) : null}
        </>
      ) : <p>No roles or members are available.</p>}
    </section>
  )
}

type SettingsTab = 'general' | 'invites' | 'roles' | 'members' | 'audit'

interface BanRecord extends RecordModel {
  readonly user: string
  readonly moderator: string
  readonly reason: string
  readonly expiresAt: string
  readonly expand?: {
    readonly user?: User
    readonly moderator?: User
  }
}

function CommunitySettingsDialog({ community, roles, memberships, memberRoles, currentUser, permissions: effectivePermissions, onClose, onChanged, onDeleted }: {
  readonly community: Community
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly memberRoles: readonly { readonly membership: string; readonly role: string }[]
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
  readonly onClose: () => void
  readonly onChanged: () => Promise<void>
  readonly onDeleted: () => void
}) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<SettingsTab>('general')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  const iconUrl = community.icon ? client.files.getURL(community as unknown as RecordModel, community.icon, { thumb: '256x256' }) : ''
  const bannerUrl = community.banner ? client.files.getURL(community as unknown as RecordModel, community.banner, { thumb: '1200x300' }) : ''
  const availableTabs: SettingsTab[] = [
    'general',
    ...(effectivePermissions.has('create_invites') ? ['invites' as const] : []),
    ...(effectivePermissions.has('manage_roles') ? ['roles' as const] : []),
    ...(effectivePermissions.has('manage_members') || effectivePermissions.has('manage_roles') ? ['members' as const] : []),
    ...(effectivePermissions.has('view_audit_log') ? ['audit' as const] : []),
  ]
  const invites = useInfiniteQuery({
    queryKey: ['invites', community.id],
    enabled: tab === 'invites',
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = await client.collection('invites').getList(pageParam, 30, {
        filter: client.filter('community = {:community}', { community: community.id }),
        sort: '-created',
      })
      return { items: page.items as unknown as Invite[], page: page.page, totalPages: page.totalPages }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  const audit = useInfiniteQuery({
    queryKey: ['audit_events', community.id],
    enabled: tab === 'audit',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => client.send<{ page: number; perPage: number; items: Array<RecordModel & { expand?: { actor?: User } }> }>(
      `/api/thiscord/communities/${community.id}/audit?perPage=50&page=${pageParam}`,
      {},
    ),
    getNextPageParam: (lastPage) => lastPage.items.length === lastPage.perPage ? lastPage.page + 1 : undefined,
  })
  const bans = useQuery({
    queryKey: ['bans', community.id],
    enabled: tab === 'members' && effectivePermissions.has('manage_members'),
    queryFn: async () => await client.send<{ items: BanRecord[] }>(
      `/api/thiscord/communities/${community.id}/bans`,
      {},
    ),
  })
  const normalizedMemberSearch = memberSearch.trim().toLowerCase()
  const filteredMemberships = memberships.filter((membership) => {
    if (!normalizedMemberSearch) return true
    const user = membership.expand?.user
    return [
      membership.nickname,
      user?.displayName,
      user?.handle,
      user?.email,
    ].some((value) => value?.toLowerCase().includes(normalizedMemberSearch))
  })
  const administratorRoleIds = new Set(roles.filter((role) => role.permissions.includes('administrator')).map((role) => role.id))
  const transferCandidates = memberships.filter((membership) => (
    membership.user !== currentUser.id
    && membership.expand?.user
    && memberRoles.some((assignment) => assignment.membership === membership.id && administratorRoleIds.has(assignment.role))
  ))

  const saveGeneral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    const data = new FormData(event.currentTarget)
    try {
      await client.send(`/api/thiscord/communities/${community.id}`, {
        method: 'PATCH',
        body: {
          name: data.get('name'),
          description: data.get('description'),
          ...(data.get('iconRemove') === '1' ? { icon: null } : { icon: data.get('icon') }),
          ...(data.get('bannerRemove') === '1' ? { banner: null } : { banner: data.get('banner') }),
        },
      })
      await onChanged()
      setNotice('Community settings saved.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const invite = await client.send<Invite>(`/api/thiscord/communities/${community.id}/invites`, {
        method: 'POST',
        body: {
          expiresInHours: Number(data.get('expiresInHours') || 168),
          maxUses: Number(data.get('maxUses') || 0),
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['invites', community.id] })
      await navigator.clipboard.writeText(`${config.webUrl.replace(/\/$/, '')}/invite/${invite.code}`)
      setNotice('Invite created and copied.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const copyInvite = async (invite: Invite) => {
    setError('')
    setNotice('')
    try {
      await navigator.clipboard.writeText(`${config.webUrl.replace(/\/$/, '')}/invite/${invite.code}`)
      setNotice(`Invite ${invite.code} copied.`)
    } catch (caught) {
      setError(`Could not copy the invite: ${errorMessage(caught)}`)
    }
  }
  const revokeInvite = async (invite: Invite) => {
    if (!window.confirm(`Revoke invite ${invite.code}?`)) return
    setError('')
    try {
      await client.send(`/api/thiscord/invites/${invite.id}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['invites', community.id] })
      setNotice(`Invite ${invite.code} revoked.`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  const unban = async (ban: BanRecord) => {
    if (!window.confirm(`Unban ${ban.expand?.user?.displayName ?? 'this member'}?`)) return
    setError('')
    try {
      await client.send(`/api/thiscord/bans/${ban.id}`, { method: 'DELETE' })
      await bans.refetch()
      setNotice(`${ban.expand?.user?.displayName ?? 'Member'} was unbanned.`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const deleteCommunity = async () => {
    if (busy) return
    if (!window.confirm(`Permanently delete ${community.name} and all of its data?`)) return
    setBusy(true)
    try {
      await client.send(`/api/thiscord/communities/${community.id}`, { method: 'DELETE' })
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const leaveCommunity = async () => {
    if (busy) return
    if (!window.confirm(`Leave ${community.name}?`)) return
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/communities/${community.id}/leave`, { method: 'POST' })
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const transferOwnership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    if (!window.confirm('Transfer ownership? This changes who has final control of the community.')) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await client.send(`/api/thiscord/communities/${community.id}/transfer`, {
        method: 'POST',
        body: { userId: data.get('userId') },
      })
      await onChanged()
      setNotice('Ownership transferred.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} className="settings-card" role="dialog" aria-modal="true" aria-label={`${community.name} settings`}>
        <aside>
          <strong>{community.name}</strong>
          {availableTabs.map((item) => (
            <button className={tab === item ? 'active' : ''} type="button" onClick={() => { setTab(item); setError(''); setNotice('') }} key={item}>{item}</button>
          ))}
        </aside>
        <div className="settings-content">
          <header><h2>{tab[0].toUpperCase() + tab.slice(1)}</h2><button type="button" aria-label={`Close ${community.name} settings`} onClick={onClose}><X size={18} /></button></header>
          {error ? <p className="form-error settings-feedback">{error}</p> : null}
          {notice ? <p className="form-notice settings-feedback">{notice}</p> : null}
          {tab === 'general' ? (
            <>
              {effectivePermissions.has('manage_community') ? (
                <form className="modal-form" onSubmit={(event) => void saveGeneral(event)}>
                  <label><span>Name</span><input name="name" defaultValue={community.name} required maxLength={100} /></label>
                  <label><span>Description</span><textarea name="description" defaultValue={community.description} maxLength={1000} rows={4} /></label>
                  <ImageFileField name="icon" label="Community icon" currentUrl={iconUrl} />
                  <ImageFileField name="banner" label="Community banner" currentUrl={bannerUrl} accept="image/png,image/jpeg,image/webp" banner />
                  <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
                </form>
              ) : <div className="settings-summary"><h3>{community.name}</h3><p>{community.description || 'No description.'}</p></div>}
              {community.owner === currentUser.id ? (
                <>
                  <form className="modal-form compact-form" onSubmit={(event) => void transferOwnership(event)}>
                    <label><span>Transfer ownership to an administrator</span><select name="userId" required defaultValue="" disabled={!transferCandidates.length}><option value="" disabled>{transferCandidates.length ? 'Select an administrator' : 'No other administrators'}</option>{transferCandidates.map((membership) => <option value={membership.user} key={membership.id}>{membership.expand!.user!.displayName} (@{membership.expand!.user!.handle})</option>)}</select></label>
                    <button className="secondary-action" type="submit" disabled={busy || !transferCandidates.length}>Transfer ownership</button>
                  </form>
                  <section className="settings-danger"><h3>Delete community</h3><p>All channels, messages, roles, and memberships will be removed.</p><button className="danger-action" type="button" onClick={() => void deleteCommunity()}>Delete community</button></section>
                </>
              ) : <section className="settings-danger"><h3>Leave community</h3><button className="danger-action" type="button" onClick={() => void leaveCommunity()}>Leave community</button></section>}
            </>
          ) : null}
          {tab === 'invites' ? (
            <>
              <form className="modal-form compact-form invite-create-form" onSubmit={(event) => void createInvite(event)}>
                <label><span>Expires after</span><select name="expiresInHours" defaultValue="168"><option value="1">1 hour</option><option value="24">1 day</option><option value="168">7 days</option><option value="720">30 days</option><option value="0">Never</option></select><small>Choose when the invite link expires</small></label>
                <label><span>Maximum uses</span><input name="maxUses" type="number" min="0" defaultValue="0" /><small>0 means unlimited</small></label>
                <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create and copy invite'}</button>
              </form>
              <div className="settings-list">
                {(invites.data?.pages.flatMap((page) => page.items) ?? []).map((invite) => (
                  <article key={invite.id}>
                    <span><strong>{invite.code}</strong><small>{invite.revoked ? 'Revoked' : `${invite.uses}${invite.maxUses ? ` / ${invite.maxUses}` : ''} uses`} · {invite.expiresAt ? `expires ${formatTime(invite.expiresAt)}` : 'never expires'}</small></span>
                    <div><button type="button" onClick={() => void copyInvite(invite)}>Copy</button>{!invite.revoked ? <button type="button" onClick={() => void revokeInvite(invite)}>Revoke</button> : null}</div>
                  </article>
                ))}
                {invites.isLoading ? <p>Loading invites…</p> : null}
                {invites.hasNextPage ? <button className="secondary-action" type="button" disabled={invites.isFetchingNextPage} onClick={() => void invites.fetchNextPage()}>{invites.isFetchingNextPage ? 'Loading…' : 'Load older invites'}</button> : null}
              </div>
            </>
          ) : null}
          {tab === 'roles' ? <RolesSettings community={community} roles={roles} permissions={effectivePermissions} onChanged={onChanged} /> : null}
          {tab === 'members' ? (
            <>
              <div className="member-admin-toolbar">
                <div><strong>Community members</strong><small>Roles and nicknames apply across this community. Configure channel-specific access in Channel settings.</small></div>
                <label className="member-admin-search"><Search size={15} /><input type="search" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search members" aria-label="Search community members" /></label>
              </div>
              <p className="member-result-count">{normalizedMemberSearch ? `${filteredMemberships.length} of ${memberships.length} members` : `${memberships.length} members`}</p>
              <div className="settings-list member-admin-list">
                {filteredMemberships.map((membership) => <MemberAdminRow
                  community={community}
                  membership={membership}
                  roles={roles}
                  currentUser={currentUser}
                  canManageRoles={effectivePermissions.has('manage_roles')}
                  canManageMembers={effectivePermissions.has('manage_members')}
                  onChanged={onChanged}
                  key={membership.id}
                />)}
                {normalizedMemberSearch && !filteredMemberships.length ? <div className="member-search-empty"><strong>No matching members</strong><span>Try a display name, nickname, handle, or email address.</span></div> : null}
              </div>
              {effectivePermissions.has('manage_members') ? (
                <section className="ban-list">
                  <h3>Bans</h3>
                  {(bans.data?.items ?? []).map((ban) => <article key={ban.id}><span><strong>{ban.expand?.user?.displayName ?? ban.user}</strong><small>{ban.reason || 'No reason'}</small></span><button type="button" onClick={() => void unban(ban)}>Unban</button></article>)}
                  {bans.isLoading ? <p>Loading bans…</p> : null}
                  {bans.isError ? <DataFailure error={bans.error} onRetry={() => void bans.refetch()} label="Could not load bans." /> : null}
                  {!bans.isLoading && !bans.data?.items.length ? <p>No banned members.</p> : null}
                </section>
              ) : null}
            </>
          ) : null}
          {tab === 'audit' ? (
            <div className="audit-list">
              {(audit.data?.pages.flatMap((page) => page.items) ?? []).map((event) => (
                <article key={event.id} title={String(event.targetId)}><span><strong>{String(event.action).replace(/\./g, ' ')}</strong><small>{event.expand?.actor?.displayName ?? 'System'} · {formatTime(String(event.created))}{event.reason ? ` · ${String(event.reason)}` : ''}</small></span><code>{String(event.targetType || 'event')}</code></article>
              ))}
              {audit.isLoading ? <p>Loading audit log…</p> : null}
              {audit.hasNextPage ? <button className="secondary-action" type="button" disabled={audit.isFetchingNextPage} onClick={() => void audit.fetchNextPage()}>{audit.isFetchingNextPage ? 'Loading…' : 'Load older events'}</button> : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}

function RolesSettings({ community, roles, permissions: effectivePermissions, onChanged }: {
  readonly community: Community
  readonly roles: Role[]
  readonly permissions: ReadonlySet<Permission>
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editable = useMemo(() => roles.filter((role) => !role.managed), [roles])
  const effectiveSelectedId = editable.some((role) => role.id === selectedId) ? selectedId : editable[0]?.id ?? ''
  const selected = editable.find((role) => role.id === effectiveSelectedId)
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    setBusy(true)
    setError('')
    const data = new FormData(form)
    try {
      const role = await client.send<Role>(`/api/thiscord/communities/${community.id}/roles`, {
        method: 'POST',
        body: { name: data.get('name'), color: data.get('color'), permissions: [] },
      })
      await onChanged()
      setSelectedId(role.id)
      form.reset()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const move = async (role: Role, direction: -1 | 1) => {
    const ordered = [...editable].sort((left, right) => right.position - left.position)
    const index = ordered.findIndex((item) => item.id === role.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/communities/${community.id}/roles/order`, {
        method: 'PUT',
        body: { ids: next.map((item) => item.id) },
      })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="roles-settings">
      <form className="role-create" onSubmit={(event) => void create(event)}>
        <input name="name" placeholder="Role name" required maxLength={80} />
        <input name="color" type="color" defaultValue="#aeb4c0" aria-label="Role color" />
        <button className="primary-action" type="submit" disabled={busy}><Plus size={15} />{busy ? 'Working…' : 'Create'}</button>
      </form>
      <div className="role-layout">
        <nav>{roles.map((role) => {
          const ordered = [...editable].sort((left, right) => right.position - left.position)
          const index = ordered.findIndex((item) => item.id === role.id)
          return <div className="role-nav-row" key={role.id}><button className={effectiveSelectedId === role.id ? 'active' : ''} type="button" aria-pressed={effectiveSelectedId === role.id} disabled={role.managed} onClick={() => { setSelectedId(role.id); setError('') }}><i style={{ background: role.color }} />{role.name}{role.managed ? <small>managed</small> : null}</button>{!role.managed ? <span><button type="button" aria-label={`Move ${role.name} up`} disabled={busy || index <= 0} onClick={() => void move(role, -1)}><ChevronUp size={13} /></button><button type="button" aria-label={`Move ${role.name} down`} disabled={busy || index < 0 || index >= ordered.length - 1} onClick={() => void move(role, 1)}><ChevronDown size={13} /></button></span> : null}</div>
        })}</nav>
        {selected ? <RoleEditor role={selected} permissions={effectivePermissions} onChanged={onChanged} key={selected.id} /> : <p>Select an editable role.</p>}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}

function RoleEditor({ role, permissions: effectivePermissions, onChanged }: { readonly role: Role; readonly permissions: ReadonlySet<Permission>; readonly onChanged: () => Promise<void> }) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await client.send(`/api/thiscord/roles/${role.id}`, {
        method: 'PATCH',
        body: {
          name: data.get('name'),
          color: data.get('color'),
          hoist: data.get('hoist') === 'on',
          mentionable: data.get('mentionable') === 'on',
          permissions: data.getAll('permissions'),
        },
      })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (busy) return
    if (!window.confirm(`Delete the ${role.name} role?`)) return
    setBusy(true)
    try {
      await client.send(`/api/thiscord/roles/${role.id}`, { method: 'DELETE' })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="role-editor" onSubmit={(event) => void submit(event)}>
      <div className="role-fields"><input name="name" defaultValue={role.name} required /><input name="color" type="color" defaultValue={role.color || '#aeb4c0'} aria-label="Role color" /></div>
      <div className="permission-grid">{permissions.filter((permission) => effectivePermissions.has('administrator') || effectivePermissions.has(permission as Permission)).map((permission) => <label key={permission}><input name="permissions" type="checkbox" value={permission} defaultChecked={role.permissions.includes(permission as Permission)} /><span>{permission.replace(/_/g, ' ')}</span></label>)}</div>
      <label className="checkbox-line"><input name="hoist" type="checkbox" defaultChecked={role.hoist} /><span>Show separately in the member list</span></label>
      <label className="checkbox-line"><input name="mentionable" type="checkbox" defaultChecked={role.mentionable} /><span>Allow members to mention this role</span></label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="role-actions"><button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save role'}</button><button className="danger-action" type="button" disabled={busy} onClick={() => void remove()}>Delete role</button></div>
    </form>
  )
}

function MemberAdminRow({ community, membership, roles, currentUser, canManageRoles, canManageMembers, onChanged }: {
  readonly community: Community
  readonly membership: Membership
  readonly roles: Role[]
  readonly currentUser: User
  readonly canManageRoles: boolean
  readonly canManageMembers: boolean
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const user = membership.expand?.user
  const [error, setError] = useState('')
  const [mountedAt] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [moderationAction, setModerationAction] = useState<'kick' | 'ban' | 'timeout' | 'untimeout' | null>(null)
  const assignments = useQuery({
    queryKey: ['member_roles', membership.id],
    enabled: canManageRoles,
    queryFn: async () => await client.collection('member_roles').getFullList({
      filter: client.filter('membership = {:membership}', { membership: membership.id }),
    }) as unknown as MemberRole[],
  })
  if (!user) return null
  const saveRoles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await client.send(`/api/thiscord/memberships/${membership.id}/roles`, {
        method: 'PUT',
        body: { roleIds: data.getAll('roleIds') },
      })
      await assignments.refetch()
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const saveNickname = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await client.send(`/api/thiscord/memberships/${membership.id}`, {
        method: 'PATCH',
        body: { nickname: data.get('nickname') },
      })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const moderate = async (action: 'kick' | 'ban' | 'timeout' | 'untimeout', reason: string, durationMinutes?: number) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/communities/${community.id}/moderation`, {
        method: 'POST',
        body: { action, userId: user.id, reason, durationMinutes },
      })
      await onChanged()
      setModerationAction(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <article>
        <Avatar user={user} size="small" />
        <span><strong>{membership.nickname || user.displayName}</strong><small>@{user.handle}</small></span>
        {canManageMembers ? <form className="nickname-form" onSubmit={(event) => void saveNickname(event)}><input name="nickname" defaultValue={membership.nickname} placeholder="Server nickname" maxLength={80} aria-label={`Nickname for ${user.displayName}`} /><button type="submit" disabled={busy}>Save nickname</button></form> : null}
        {canManageRoles && assignments.isSuccess ? (
          <form className="member-role-form" onSubmit={(event) => void saveRoles(event)}>
            <fieldset><legend>Roles</legend>{roles.filter((role) => !role.managed).map((role) => <label key={role.id}><input name="roleIds" type="checkbox" value={role.id} defaultChecked={assignments.data.some((item) => item.role === role.id)} /><i style={{ background: role.color }} /><span>{role.name}</span></label>)}</fieldset>
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save roles'}</button>
          </form>
        ) : null}
        {canManageMembers && user.id !== currentUser.id && user.id !== community.owner ? <div className="member-admin-actions">{membership.timeoutUntil && new Date(membership.timeoutUntil).getTime() > mountedAt ? <button type="button" disabled={busy} onClick={() => setModerationAction('untimeout')}>Remove timeout</button> : <button type="button" disabled={busy} onClick={() => setModerationAction('timeout')}>Timeout</button>}<button type="button" disabled={busy} onClick={() => setModerationAction('kick')}>Kick</button><button type="button" disabled={busy} onClick={() => setModerationAction('ban')}>Ban</button></div> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </article>
      {moderationAction ? <ModerationDialog action={moderationAction} memberName={membership.nickname || user.displayName} busy={busy} onClose={() => setModerationAction(null)} onConfirm={(reason, duration) => moderate(moderationAction, reason, duration)} /> : null}
    </>
  )
}

function ModerationDialog({ action, memberName, busy, onClose, onConfirm }: {
  readonly action: 'kick' | 'ban' | 'timeout' | 'untimeout'
  readonly memberName: string
  readonly busy: boolean
  readonly onClose: () => void
  readonly onConfirm: (reason: string, durationMinutes?: number) => Promise<void>
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const duration = action === 'timeout' ? Math.max(1, Math.min(40320, Number(data.get('durationMinutes') || 10))) : undefined
    void onConfirm(String(data.get('reason') || '').trim(), duration)
  }
  return (
    <ModalFrame title={`${action === 'untimeout' ? 'Remove timeout from' : `${action[0].toUpperCase()}${action.slice(1)}`} ${memberName}`} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <p>This action takes effect immediately after confirmation.</p>
        {action === 'timeout' ? <label><span>Duration in minutes</span><input name="durationMinutes" type="number" min="1" max="40320" defaultValue="10" required /></label> : null}
        <label><span>Reason (optional)</span><textarea name="reason" maxLength={1000} rows={3} /></label>
        <div className="confirmation-actions"><button className="secondary-action" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="danger-action" type="submit" disabled={busy}>{busy ? 'Working…' : `Confirm ${action}`}</button></div>
      </form>
    </ModalFrame>
  )
}

function ProfileDialog({ user, onClose, onLogout }: {
  readonly user: User
  readonly onClose: () => void
  readonly onLogout: () => void
}) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [verificationBusy, setVerificationBusy] = useState(false)
  const avatarUrl = user.avatar ? client.files.getURL(user as unknown as RecordModel, user.avatar, { thumb: '256x256' }) : ''
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setSaved(false)
    const data = new FormData(event.currentTarget)
    try {
      const avatar = data.get('avatar')
      const newPassword = String(data.get('newPassword') || '')
      const newPasswordConfirm = String(data.get('newPasswordConfirm') || '')
      if (newPassword && newPassword !== newPasswordConfirm) throw new Error('New passwords do not match.')
      const record = await client.collection('users').update(user.id, {
        displayName: data.get('displayName'),
        handle: data.get('handle'),
        bio: data.get('bio'),
        status: data.get('status'),
        customStatus: data.get('customStatus'),
        preferences: {
          ...(user.preferences ?? {}),
          theme: data.get('theme'),
          compactMode: data.get('compactMode') === 'on',
          reduceMotion: data.get('reduceMotion') === 'on',
          notificationSound: data.get('notificationSound') === 'on',
        },
        ...(data.get('avatarRemove') === '1' ? { avatar: null } : avatar instanceof File && avatar.size > 0 ? { avatar } : {}),
        ...(newPassword ? {
          oldPassword: data.get('currentPassword'),
          password: newPassword,
          passwordConfirm: newPasswordConfirm,
        } : {}),
      })
      client.authStore.save(client.authStore.token, record)
      setSaved(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const resendVerification = async () => {
    if (!user.email || verificationBusy) return
    setVerificationBusy(true)
    setError('')
    try {
      await client.collection('users').requestVerification(user.email)
      setVerificationSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setVerificationBusy(false)
    }
  }
  const deleteAccount = async () => {
    if (busy) return
    if (!window.confirm('Permanently delete your account and all associated memberships and messages?')) return
    setBusy(true)
    setError('')
    try {
      await client.send('/api/thiscord/account', { method: 'DELETE' })
      onLogout()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="User settings" onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>Display name</span><input name="displayName" defaultValue={user.displayName} required maxLength={80} /></label>
        <label><span>Handle</span><input name="handle" defaultValue={user.handle} required maxLength={32} pattern="[a-zA-Z0-9._-]+" /></label>
        <label><span>Bio</span><textarea name="bio" defaultValue={user.bio} maxLength={500} rows={3} /></label>
        <label><span>Custom status</span><input name="customStatus" defaultValue={user.customStatus} maxLength={120} /></label>
        <label><span>Presence</span><select name="status" defaultValue={user.status}><option value="online">Online</option><option value="idle">Idle</option><option value="dnd">Do not disturb</option><option value="offline">Invisible</option></select></label>
        <ImageFileField name="avatar" label="Avatar" currentUrl={avatarUrl} />
        <fieldset className="preference-fields">
          <legend>Appearance and notifications</legend>
          <label><span>Theme</span><select name="theme" defaultValue={user.preferences?.theme ?? 'dark'}><option value="dark">Dark</option><option value="light">Light</option><option value="system">Use system setting</option></select></label>
          <label className="checkbox-line"><input name="compactMode" type="checkbox" defaultChecked={user.preferences?.compactMode} /><span>Compact message spacing</span></label>
          <label className="checkbox-line"><input name="reduceMotion" type="checkbox" defaultChecked={user.preferences?.reduceMotion} /><span>Reduce motion</span></label>
          <label className="checkbox-line"><input name="notificationSound" type="checkbox" defaultChecked={user.preferences?.notificationSound !== false} /><span>Notification sounds</span></label>
        </fieldset>
        <details className="settings-details">
          <summary>Change password</summary>
          <label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" /></label>
          <label><span>New password</span><input name="newPassword" type="password" minLength={8} autoComplete="new-password" /></label>
          <label><span>Confirm new password</span><input name="newPasswordConfirm" type="password" minLength={8} autoComplete="new-password" /></label>
        </details>
        {error ? <p className="form-error">{error}</p> : null}
        {saved ? <p className="form-notice">Saved.</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      {user.verified === false && user.email ? (
        <div className="verification-actions">
          <span><strong>Email not verified</strong><small>{verificationSent ? 'Verification email sent.' : user.email}</small></span>
          <button className="secondary-action compact-action" type="button" disabled={verificationBusy} onClick={() => void resendVerification()}>{verificationBusy ? 'Sending…' : 'Resend'}</button>
        </div>
      ) : null}
      {window.desktop ? <DesktopUpdatePanel /> : null}
      {config.supportUrl || config.updateUrl ? <div className="external-settings-links">
        {config.supportUrl ? <a className="support-link secondary-action" href={config.supportUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />Support</a> : null}
        {config.updateUrl ? <a className="support-link secondary-action" href={config.updateUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />Updates</a> : null}
      </div> : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={onLogout}><LogOut size={16} />Sign out</button>
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => void deleteAccount()}>{busy ? 'Working…' : 'Delete account'}</button>
    </ModalFrame>
  )
}

function MemberProfileDialog({ user, onClose, onMessage }: {
  readonly user: User
  readonly onClose: () => void
  readonly onMessage?: () => void
}) {
  return (
    <ModalFrame title={user.displayName} onClose={onClose}>
      <section className="member-profile-card">
        <Avatar user={user} size="hero" />
        <div><h3>{user.displayName}</h3><p>@{user.handle}</p></div>
        {user.customStatus ? <blockquote>{user.customStatus}</blockquote> : null}
        {user.bio ? <p className="member-profile-bio">{user.bio}</p> : <p className="member-profile-bio muted-copy">No bio.</p>}
        {onMessage ? <button className="primary-action" type="button" onClick={onMessage}><MessageSquareText size={16} />Message</button> : null}
      </section>
    </ModalFrame>
  )
}

function DesktopUpdatePanel() {
  const desktop = window.desktop!
  const [state, setState] = useState<UpdateState | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    void desktop.getUpdateState().then((value) => {
      if (active) setState(value)
    })
    return () => {
      active = false
    }
  }, [desktop])
  const run = async (operation: () => Promise<UpdateState>) => {
    setBusy(true)
    try {
      setState(await operation())
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="desktop-updates">
      <span><strong>Desktop updates</strong><small>{state ? state.status.replace(/-/g, ' ') : 'Loading…'}</small></span>
      {state?.status === 'available' ? <button type="button" onClick={() => void run(desktop.downloadUpdate)}>Download {state.availableVersion}</button> : null}
      {state?.status === 'downloaded' ? <button type="button" onClick={() => void desktop.installUpdate()}>Restart and install</button> : null}
      {!state || ['idle', 'not-available', 'error'].includes(state.status) ? <button type="button" disabled={busy} onClick={() => void run(desktop.checkForUpdates)}>{busy ? 'Checking…' : 'Check for updates'}</button> : null}
      {state?.status === 'downloading' ? <progress value={state.percent} max="100" /> : null}
      {state?.status === 'error' ? <p>{state.message}</p> : null}
    </section>
  )
}

function GroupSettingsDialog({ conversation, members, currentUser, onClose, onChanged }: {
  readonly conversation: Conversation
  readonly members: ConversationMember[]
  readonly currentUser: User
  readonly onClose: () => void
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const { navigate } = useAppRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isOwner = conversation.owner === currentUser.id
  const rename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await client.send(`/api/thiscord/conversations/${conversation.id}`, {
        method: 'PATCH',
        body: { name: data.get('name') },
      })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      const handle = String(data.get('handle') || '').replace(/^@/, '').trim().toLowerCase()
      const user = await client.collection('users').getFirstListItem<User>(client.filter('handle = {:handle}', { handle }))
      await client.send(`/api/thiscord/conversations/${conversation.id}/members`, {
        method: 'POST',
        body: { userId: user.id },
      })
      event.currentTarget.reset()
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const removeMember = async (userId: string) => {
    if (busy) return
    const target = members.find((member) => member.user === userId)?.expand?.user
    const label = userId === currentUser.id ? 'Leave this group?' : `Remove ${target?.displayName ?? 'this member'} from the group?`
    if (!window.confirm(label)) return
    setBusy(true)
    setError('')
    try {
      await client.send(`/api/thiscord/conversations/${conversation.id}/members/${userId}`, { method: 'DELETE' })
      await onChanged()
      if (userId === currentUser.id) {
        onClose()
        navigate('/channels/@me', { replace: true })
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="Group settings" onClose={onClose}>
      {isOwner ? (
        <>
          <form className="modal-form compact-form" onSubmit={(event) => void rename(event)}>
            <label><span>Group name</span><input name="name" defaultValue={conversation.name} required maxLength={100} /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Rename group'}</button>
          </form>
          <form className="modal-form compact-form" onSubmit={(event) => void addMember(event)}>
            <label><span>Add member by handle</span><input name="handle" placeholder="@handle" required /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add member'}</button>
          </form>
        </>
      ) : null}
      <div className="settings-list group-member-list">
        {members.map((member) => {
          const user = member.expand?.user
          if (!user) return null
          return <article key={member.id}><Avatar user={user} size="small" /><span><strong>{user.displayName}</strong><small>@{user.handle}{conversation.owner === user.id ? ' · owner' : ''}</small></span>{isOwner && user.id !== currentUser.id ? <button type="button" disabled={busy} onClick={() => void removeMember(user.id)}>Remove</button> : null}</article>
        })}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => void removeMember(currentUser.id)}>{busy ? 'Working…' : 'Leave group'}</button>
    </ModalFrame>
  )
}

function DirectDialog({ onClose, onCreated }: {
  readonly onClose: () => void
  readonly onCreated: (conversation: Conversation) => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const handles = Array.from(new Set(String(data.get('handles') || '')
        .split(',')
        .map((handle) => handle.trim().replace(/^@/, '').toLowerCase())
        .filter(Boolean)))
      const users = await Promise.all(handles.map((handle) => (
        client.collection('users').getFirstListItem<User>(client.filter('handle = {:handle}', { handle }))
      )))
      const conversation = await client.send<Conversation>('/api/thiscord/conversations', {
        method: 'POST',
        body: { userIds: users.map((user) => user.id), name: data.get('name') },
      })
      await onCreated(conversation)
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="New direct message" onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>Handles</span><input name="handles" placeholder="@handle, @another" required autoFocus /></label>
        <label><span>Group name</span><input name="name" placeholder="Optional for two-person messages" maxLength={100} /></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start conversation'}</button>
      </form>
    </ModalFrame>
  )
}
