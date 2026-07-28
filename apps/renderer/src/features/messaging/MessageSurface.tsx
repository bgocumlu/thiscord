import { policyLimits, transientTimings } from '@thiscord/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  FileText,
  MessageSquareText,
  Paperclip,
  Pin,
  Search,
  Send,
  SmilePlus,
  X,
} from 'lucide-react'
import { isTokenExpired, type RecordModel } from 'pocketbase'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DataFailure, formatTime } from '../../components/WorkspacePrimitives'
import { useFileToken } from '../../hooks/useFileToken'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { Avatar } from '../members/Avatar'
import type {
  MessageSurfaceAdapter,
  SurfaceMessage,
  SurfaceReaction,
} from './messageSurfaceContract'
import { mergeFocusedMessage, shouldShowEmptyMessageState } from './messagePresentation'
import { createReadReceiptCoordinator } from './readState'

export interface MessageHistory<TMessage extends SurfaceMessage> {
  readonly data: readonly TMessage[] | undefined
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: unknown
  readonly hasNextPage: boolean
  readonly isFetchingNextPage: boolean
  readonly fetchNextPage: () => Promise<unknown>
  readonly refetch: () => Promise<unknown>
}

export interface MessageSurfaceProps<TMessage extends SurfaceMessage> {
  readonly adapter: MessageSurfaceAdapter<TMessage>
  readonly history: MessageHistory<TMessage>
  readonly currentUser: Parameters<MessageSurfaceAdapter<TMessage>['policy']['canEdit']>[1]
  readonly typingUsers: readonly string[]
  readonly intro: ReactNode
  readonly placeholder: string
  readonly searchLabel: string
  readonly highlightedMessageId: string
  readonly messageElementPrefix: string
  readonly emptyTitle: string
  readonly emptyDescription?: string
  readonly searchErrorLabel: string
  readonly historyErrorLabel: string
  readonly className?: string
}

const commonEmoji = [
  '😀', '😄', '😂', '😊', '😍', '🤔', '😮', '😢', '😡', '👍', '👎', '👏',
  '🙌', '🙏', '❤️', '💜', '🔥', '🎉', '✅', '❌', '👀', '💯', '🚀', '✨',
]

function EmojiPicker({ onSelect }: { readonly onSelect: (emoji: string) => void }) {
  return (
    <div className="reaction-picker" role="group" aria-label="Choose emoji">
      {commonEmoji.map((emoji) => (
        <button
          type="button"
          aria-label={`Insert ${emoji}`}
          onClick={() => onSelect(emoji)}
          key={emoji}
        >{emoji}</button>
      ))}
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
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="nofollow noopener noreferrer">
              {children}<ExternalLink size={12} />
            </a>
          ),
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
            return (
              <a href={url} target="_blank" rel="nofollow noopener noreferrer" key={url}>
                <ExternalLink size={15} />
                <span><strong>{label}</strong><small>{url}</small></span>
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function MessageAttachments({ message, userId }: {
  readonly message: SurfaceMessage
  readonly userId: string
}) {
  const client = usePocketBase()
  const fileToken = useFileToken(userId, message.attachments.length > 0)
  const token = fileToken.data && !isTokenExpired(fileToken.data) ? fileToken.data : ''
  if (!token) {
    return (
      <div className="attachment-status" role={fileToken.error ? 'alert' : 'status'}>
        <span>{fileToken.error ? 'Attachments could not be authorized.' : 'Authorizing attachments…'}</span>
        {fileToken.error ? <button type="button" onClick={() => void fileToken.refetch()}>Retry</button> : null}
      </div>
    )
  }
  return (
    <div className="message-attachments">
      {message.attachments.map((filename) => {
        const record = message as unknown as RecordModel
        const openUrl = client.files.getURL(record, filename, { token })
        const downloadUrl = client.files.getURL(record, filename, { download: true, token })
        const displayName = filename.replace(
          /_[a-zA-Z0-9]+\.[^.]+$/,
          (suffix) => suffix.slice(suffix.lastIndexOf('.')),
        )
        const image = /\.(?:avif|gif|jpe?g|png|webp)$/i.test(filename)
        return image ? (
          <figure className="attachment-image" key={filename}>
            <a href={openUrl} target="_blank" rel="noreferrer">
              <img src={openUrl} alt={displayName} loading="lazy" />
            </a>
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

function MessageRow<TMessage extends SurfaceMessage,>({
  message,
  reactions,
  currentUser,
  adapter,
  onReply,
  onEdit,
}: {
  readonly message: TMessage
  readonly reactions: readonly SurfaceReaction[]
  readonly currentUser: MessageSurfaceProps<TMessage>['currentUser']
  readonly adapter: MessageSurfaceAdapter<TMessage>
  readonly onReply: () => void
  readonly onEdit: () => void
}) {
  const [reactionOpen, setReactionOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const author = message.expand?.author
  if (!author) return null
  const deleted = Boolean(message.deletedAt)
  const grouped = reactions.reduce<Map<string, SurfaceReaction[]>>((map, reaction) => {
    map.set(reaction.emoji, [...(map.get(reaction.emoji) ?? []), reaction])
    return map
  }, new Map())
  const run = async (action: () => Promise<void>) => {
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
        {deleted
          ? <p>Message deleted</p>
          : <RichMessage content={message.content} embedsEnabled={message.embedsEnabled} />}
        {!deleted && message.attachments.length
          ? <MessageAttachments message={message} userId={currentUser.id} />
          : null}
        {grouped.size ? (
          <div className="reactions">
            {[...grouped.entries()].map(([emoji, items]) => (
              <button
                className={items.some((item) => item.user === currentUser.id) ? 'mine' : ''}
                type="button"
                onClick={() => void run(() => adapter.react(message, emoji))}
                key={emoji}
              >
                <span>{emoji}</span>{items.length}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {!deleted ? (
        <div className="message-actions">
          <button type="button" title="Add reaction" onClick={() => setReactionOpen((value) => !value)}>
            <SmilePlus size={15} />
          </button>
          {adapter.policy.canPin(message, currentUser) ? (
            <button type="button" title={message.pinned ? 'Unpin' : 'Pin'} onClick={() => void run(() => adapter.pin(message))}>
              <Pin size={15} />
            </button>
          ) : null}
          <button type="button" title="Reply" onClick={onReply}><MessageSquareText size={15} /></button>
          {adapter.policy.canEdit(message, currentUser)
            ? <button type="button" title="Edit" onClick={onEdit}><FileText size={15} /></button>
            : null}
          {adapter.policy.canDelete(message, currentUser) ? (
            <button type="button" title="Delete" onClick={() => void run(() => adapter.remove(message))}>
              <X size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
      {reactionOpen ? (
        <EmojiPicker onSelect={(emoji) => {
          void run(() => adapter.react(message, emoji))
          setReactionOpen(false)
        }} />
      ) : null}
      {actionError ? <div className="message-action-error" role="alert">{actionError}</div> : null}
    </article>
  )
}

function MessageComposer<TMessage extends SurfaceMessage,>({
  placeholder,
  reply,
  editing,
  onCancelContext,
  onSend,
  onTyping,
  disabledReason,
}: {
  readonly placeholder: string
  readonly reply: TMessage | null
  readonly editing: TMessage | null
  readonly onCancelContext: () => void
  readonly onSend: (content: string, files: readonly File[]) => Promise<void>
  readonly onTyping: () => void
  readonly disabledReason?: string
}) {
  const [draft, setDraft] = useState(editing?.content ?? '')
  const [files, setFiles] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)

  const addFiles = (selected: readonly File[]) => {
    setError('')
    const combined = [...files, ...selected]
    if (combined.length > policyLimits.message.attachmentsMax) {
      setError(`You can attach up to ${policyLimits.message.attachmentsMax} files.`)
      return
    }
    const tooLarge = combined.find((file) => file.size > policyLimits.message.attachmentBytesMax)
    if (tooLarge) {
      setError(`${tooLarge.name} is larger than ${policyLimits.message.attachmentBytesMax / 1024 / 1024} MB.`)
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
          {files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}>
              {file.name}<small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
              ><X size={12} /></button>
            </span>
          ))}
        </div>
      ) : null}
      {busy && files.length ? (
        <div className="upload-progress" role="status">
          <span />Uploading {files.length} attachment{files.length === 1 ? '' : 's'}…
        </div>
      ) : null}
      {error ? <p className="composer-error" role="alert">{error}</p> : null}
      <form className="composer" onSubmit={(event) => void submit(event)}>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={Boolean(disabledReason) || busy || Boolean(editing)}
          className="composer-add"
          title={editing ? 'Attachments cannot be changed while editing' : 'Add attachment'}
          onClick={() => fileInput.current?.click()}
        ><Paperclip size={18} /></button>
        <input
          value={draft}
          disabled={Boolean(disabledReason) || busy}
          onChange={(event) => {
            setDraft(event.target.value)
            onTyping()
          }}
          placeholder={disabledReason || placeholder}
          maxLength={policyLimits.message.contentMax}
        />
        <button
          type="button"
          disabled={Boolean(disabledReason) || busy}
          title="Add emoji"
          aria-expanded={emojiOpen}
          onClick={() => setEmojiOpen((value) => !value)}
        ><SmilePlus size={18} /></button>
        <button
          className="send-button"
          type="submit"
          title="Send message"
          disabled={Boolean(disabledReason) || busy || (!draft.trim() && !files.length)}
        ><Send size={17} /></button>
      </form>
      {emojiOpen ? (
        <div className="composer-emoji-picker">
          <EmojiPicker onSelect={(emoji) => {
            setDraft((value) => `${value}${value && !value.endsWith(' ') ? ' ' : ''}${emoji}`)
            setEmojiOpen(false)
          }} />
        </div>
      ) : null}
    </div>
  )
}

export function MessageSurface<TMessage extends SurfaceMessage,>({
  adapter,
  history,
  currentUser,
  typingUsers,
  intro,
  placeholder,
  searchLabel,
  highlightedMessageId,
  messageElementPrefix,
  emptyTitle,
  emptyDescription,
  searchErrorLabel,
  historyErrorLabel,
  className = '',
}: MessageSurfaceProps<TMessage>) {
  const [reply, setReply] = useState<TMessage | null>(null)
  const [editing, setEditing] = useState<TMessage | null>(null)
  const [search, setSearch] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const deferredSearch = useDeferredValue(search.trim())
  const typingTimer = useRef<number | undefined>(undefined)
  const readCoordinator = useRef(createReadReceiptCoordinator())
  const listRef = useRef<HTMLDivElement>(null)
  const priorHeight = useRef(0)
  const wasNearBottom = useRef(true)
  const lastMessageId = history.data?.at(-1)?.id ?? ''
  const highlightedMessageLoaded = Boolean(
    highlightedMessageId
    && history.data?.some((message) => message.id === highlightedMessageId),
  )
  const focusedMessage = useQuery({
    queryKey: [...adapter.messageKey, 'focused', highlightedMessageId],
    enabled: Boolean(highlightedMessageId) && !highlightedMessageLoaded,
    queryFn: () => adapter.load(highlightedMessageId),
    retry: false,
  })
  const searchActive = deferredSearch.length >= policyLimits.search.queryMin || pinnedOnly
  const filteredMessages = useInfiniteQuery({
    queryKey: adapter.searchKey(deferredSearch, pinnedOnly),
    enabled: searchActive,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adapter.search(deferredSearch, pinnedOnly, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  const searchResults = useMemo(
    () => {
      const items = filteredMessages.data?.pages.flatMap((page) => page.items) ?? []
      return adapter.reverseSearchResults ? [...items].reverse() : items
    },
    [adapter.reverseSearchResults, filteredMessages.data],
  )
  const historyMessages = useMemo(
    () => mergeFocusedMessage(history.data ?? [], focusedMessage.data),
    [focusedMessage.data, history.data],
  )
  const visibleMessages = searchActive ? searchResults : historyMessages
  const visibleMessageIds = useMemo(
    () => visibleMessages.map((message) => message.id),
    [visibleMessages],
  )
  const visibleReactions = useQuery({
    queryKey: [...adapter.reactionsKey, visibleMessageIds.join(',')],
    enabled: visibleMessageIds.length > 0,
    queryFn: () => adapter.loadReactions(visibleMessageIds),
  })
  const showEmptyState = shouldShowEmptyMessageState(visibleMessages.length, [
    history.isLoading,
    history.isError,
    filteredMessages.isLoading,
    filteredMessages.isError,
    focusedMessage.isLoading,
    focusedMessage.isError,
  ])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (priorHeight.current) {
      list.scrollTop += list.scrollHeight - priorHeight.current
      priorHeight.current = 0
      return
    }
    const target = highlightedMessageId
      ? document.getElementById(`${messageElementPrefix}${highlightedMessageId}`)
      : null
    if (target) {
      target.scrollIntoView({ block: 'center' })
      return
    }
    if (wasNearBottom.current) list.scrollTo({ top: list.scrollHeight })
  }, [highlightedMessageId, messageElementPrefix, visibleMessages.length])

  useEffect(() => {
    const coordinator = readCoordinator.current
    if (!coordinator.begin(lastMessageId, adapter.persistedReadMessage)) return
    void adapter.markRead(lastMessageId).catch(() => coordinator.failed(lastMessageId))
  }, [adapter, lastMessageId])

  useEffect(() => () => {
    if (typingTimer.current !== undefined) window.clearTimeout(typingTimer.current)
  }, [])

  const reportTyping = () => {
    if (typingTimer.current !== undefined) return
    void adapter.reportTyping().catch(() => undefined)
    typingTimer.current = window.setTimeout(() => {
      typingTimer.current = undefined
    }, transientTimings.typingRefreshMs)
  }
  const send = async (content: string, files: readonly File[]) => {
    await adapter.save({ content, files, reply, editing })
    setReply(null)
    setEditing(null)
  }

  return (
    <div className={`message-surface ${className}`.trim()}>
      <div className="chat-inline-search" role="search">
        <Search size={14} />
        <input
          type="search"
          aria-label={searchLabel}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchLabel}
        />
        <button
          className={pinnedOnly ? 'active' : ''}
          type="button"
          aria-pressed={pinnedOnly}
          title={pinnedOnly ? 'Show all messages' : 'Show pinned messages only'}
          onClick={() => setPinnedOnly((value) => !value)}
        ><Pin size={13} />{pinnedOnly ? 'Pinned only' : 'Pinned messages'}</button>
      </div>
      <div
        className="message-scroll"
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget
          wasNearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120
        }}
      >
        {intro}
        {history.isLoading ? <div className="loading-state">Loading messages…</div> : null}
        {history.isError ? (
          <DataFailure
            error={history.error}
            onRetry={() => void history.refetch()}
            label={historyErrorLabel}
          />
        ) : null}
        {focusedMessage.isError ? (
          <DataFailure
            error={focusedMessage.error}
            onRetry={() => void focusedMessage.refetch()}
            label="Could not load the linked message."
          />
        ) : null}
        {!searchActive && history.hasNextPage ? (
          <button
            className="load-older"
            type="button"
            disabled={history.isFetchingNextPage}
            onClick={() => {
              priorHeight.current = listRef.current?.scrollHeight ?? 0
              void history.fetchNextPage()
            }}
          >{history.isFetchingNextPage ? 'Loading…' : 'Load older messages'}</button>
        ) : null}
        {searchActive && filteredMessages.isLoading
          ? <div className="loading-state">Searching messages…</div>
          : null}
        {searchActive && filteredMessages.isError ? (
          <DataFailure
            error={filteredMessages.error}
            onRetry={() => void filteredMessages.refetch()}
            label={searchErrorLabel}
          />
        ) : null}
        {visibleMessages.length ? (
          <div className="message-list">
            {visibleMessages.map((message) => (
              <div
                id={`${messageElementPrefix}${message.id}`}
                className={highlightedMessageId === message.id ? 'message-highlight' : ''}
                key={message.id}
              >
                <MessageRow
                  message={message}
                  reactions={(visibleReactions.data ?? []).filter(
                    (reaction) => reaction.message === message.id,
                  )}
                  currentUser={currentUser}
                  adapter={adapter}
                  onReply={() => {
                    setReply(message)
                    setEditing(null)
                  }}
                  onEdit={() => {
                    setEditing(message)
                    setReply(null)
                  }}
                />
              </div>
            ))}
          </div>
        ) : showEmptyState ? (
          <div className="empty-channel">
            <h2>{searchActive ? 'No matching messages' : emptyTitle}</h2>
            {searchActive
              ? <p>Try a different search or clear the pinned filter.</p>
              : emptyDescription ? <p>{emptyDescription}</p> : null}
          </div>
        ) : null}
        {searchActive && filteredMessages.hasNextPage ? (
          <button
            className="load-older"
            type="button"
            disabled={filteredMessages.isFetchingNextPage}
            onClick={() => void filteredMessages.fetchNextPage()}
          >{filteredMessages.isFetchingNextPage ? 'Loading…' : 'More results'}</button>
        ) : null}
      </div>
      <MessageComposer
        key={`${editing?.id ?? ''}:${reply?.id ?? ''}`}
        placeholder={placeholder}
        reply={reply}
        editing={editing}
        onCancelContext={() => {
          setReply(null)
          setEditing(null)
        }}
        onSend={send}
        onTyping={reportTyping}
        disabledReason={adapter.policy.disabledReason}
      />
      <div className="typing-line">
        {typingUsers.length ? (
          <><strong>{typingUsers.join(', ')}</strong> {typingUsers.length === 1 ? 'is' : 'are'} typing…</>
        ) : null}
      </div>
    </div>
  )
}
