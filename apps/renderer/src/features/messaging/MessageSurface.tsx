import { policyLimits } from '@thiscord/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  FileText,
  MessageSquareText,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  SmilePlus,
  X,
} from 'lucide-react'
import { isTokenExpired, type RecordModel } from 'pocketbase'
import {
  lazy,
  memo,
  startTransition,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { DataFailure, LoadingState } from '../../components/WorkspacePrimitives'
import { formatTime } from '../../components/workspaceUtils'
import { useFileToken } from '../../hooks/useFileToken'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { Avatar } from '../members/Avatar'
import type {
  MessageSurfaceAdapter,
  SurfaceMessage,
  SurfaceReaction,
} from './messageSurfaceContract'
import {
  mergeFocusedMessage,
  shouldShowEmptyMessageState,
} from './messagePresentation'
import { createReadReceiptCoordinator } from './readState'
import { useMessageWindow } from './useMessageWindow'

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

const RichMessage = lazy(() => import('./RichMessage'))

function EmojiPicker({
  id,
  onSelect,
}: {
  readonly id?: string
  readonly onSelect: (emoji: string) => void
}) {
  return (
    <div id={id} className="reaction-picker" role="group" aria-label="Choose emoji">
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
              <img
                src={openUrl}
                alt={displayName}
                width="520"
                height="293"
                loading="lazy"
                decoding="async"
              />
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

function MessageRowComponent<TMessage extends SurfaceMessage,>({
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
  readonly onReply: (message: TMessage) => void
  readonly onEdit: (message: TMessage) => void
}) {
  const [reactionOpen, setReactionOpen] = useState(false)
  const reactionPickerId = useId()
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
    <article className={`message-row ${deleted ? 'message-deleted' : ''}`}>
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
          : (
              <Suspense fallback={<p>{message.content}</p>}>
                <RichMessage content={message.content} embedsEnabled={message.embedsEnabled} />
              </Suspense>
            )}
        {!deleted && message.attachments.length
          ? <MessageAttachments message={message} userId={currentUser.id} />
          : null}
        {grouped.size ? (
          <div className="reactions">
            {[...grouped.entries()].map(([emoji, items]) => {
              const reacted = items.some((item) => item.user === currentUser.id)
              const reactionCount = `${items.length} reaction${items.length === 1 ? '' : 's'}`
              return (
                <button
                  className={reacted ? 'mine' : ''}
                  type="button"
                  aria-label={`${reacted ? 'Remove' : 'Add'} ${emoji} reaction, ${reactionCount}`}
                  aria-pressed={reacted}
                  onClick={() => void run(() => adapter.react(message, emoji))}
                  key={emoji}
                >
                  <span aria-hidden="true">{emoji}</span>{items.length}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
      {!deleted ? (
        <div className="message-actions">
          <button
            type="button"
            title="Add reaction"
            aria-expanded={reactionOpen}
            aria-controls={reactionPickerId}
            onClick={() => setReactionOpen((value) => !value)}
          >
            <SmilePlus size={15} />
          </button>
          {adapter.policy.canPin(message, currentUser) ? (
            <button
              type="button"
              title={message.pinned ? 'Unpin' : 'Pin'}
              aria-label={message.pinned ? 'Unpin message' : 'Pin message'}
              onClick={() => void run(() => adapter.pin(message))}
            >
              {message.pinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
          ) : null}
          <button type="button" title="Reply" onClick={() => onReply(message)}><MessageSquareText size={15} /></button>
          {adapter.policy.canEdit(message, currentUser)
            ? <button type="button" title="Edit" onClick={() => onEdit(message)}><FileText size={15} /></button>
            : null}
          {adapter.policy.canDelete(message, currentUser) ? (
            <button type="button" title="Delete" onClick={() => void run(() => adapter.remove(message))}>
              <X size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
      {reactionOpen ? (
        <EmojiPicker id={reactionPickerId} onSelect={(emoji) => {
          void run(() => adapter.react(message, emoji))
          setReactionOpen(false)
        }} />
      ) : null}
      {actionError ? <div className="message-action-error" role="alert">{actionError}</div> : null}
    </article>
  )
}

const MessageRow = memo(MessageRowComponent) as typeof MessageRowComponent

function MessageLog<TMessage extends SurfaceMessage,>({
  messages,
  highlightedMessageId,
  messageElementPrefix,
  reactionsByMessageId,
  currentUser,
  adapter,
  onReply,
  onEdit,
}: {
  readonly messages: readonly TMessage[]
  readonly highlightedMessageId: string
  readonly messageElementPrefix: string
  readonly reactionsByMessageId: ReadonlyMap<string, readonly SurfaceReaction[]>
  readonly currentUser: MessageSurfaceProps<TMessage>['currentUser']
  readonly adapter: MessageSurfaceAdapter<TMessage>
  readonly onReply: (message: TMessage) => void
  readonly onEdit: (message: TMessage) => void
}) {
  return (
    <div
      className="message-list"
      role="log"
      aria-label="Messages"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {messages.map((message) => (
        <div
          id={`${messageElementPrefix}${message.id}`}
          className={`message-list-item ${highlightedMessageId === message.id ? 'message-highlight' : ''}`.trim()}
          data-message-id={message.id}
          key={message.id}
        >
          <MessageRow
            message={message}
            reactions={reactionsByMessageId.get(message.id) ?? []}
            currentUser={currentUser}
            adapter={adapter}
            onReply={onReply}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  )
}

function MessageComposer<TMessage extends SurfaceMessage,>({
  placeholder,
  reply,
  editing,
  onCancelContext,
  onSend,
  disabledReason,
}: {
  readonly placeholder: string
  readonly reply: TMessage | null
  readonly editing: TMessage | null
  readonly onCancelContext: () => void
  readonly onSend: (content: string, files: readonly File[]) => Promise<void>
  readonly disabledReason?: string
}) {
  const [draft, setDraft] = useState(editing?.content ?? '')
  const [files, setFiles] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiPickerId = useId()

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
          <button type="button" aria-label="Cancel reply or edit" onClick={onCancelContext}><X size={14} /></button>
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
          aria-label={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={disabledReason || placeholder}
          maxLength={policyLimits.message.contentMax}
        />
        <button
          type="button"
          disabled={Boolean(disabledReason) || busy}
          title="Add emoji"
          aria-expanded={emojiOpen}
          aria-controls={emojiPickerId}
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
          <EmojiPicker id={emojiPickerId} onSelect={(emoji) => {
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
  const beginReply = useCallback((message: TMessage) => {
    setReply(message)
    setEditing(null)
  }, [])
  const beginEdit = useCallback((message: TMessage) => {
    setEditing(message)
    setReply(null)
  }, [])
  const deferredSearch = useDeferredValue(search.trim())
  const readCoordinator = useRef<ReturnType<typeof createReadReceiptCoordinator>>(null!)
  if (readCoordinator.current === null) readCoordinator.current = createReadReceiptCoordinator()
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
  const messageWindow = useMessageWindow(visibleMessages, highlightedMessageId)
  const { renderedMessages, renderedMessageIds } = messageWindow
  const [viewportMessageIds, setViewportMessageIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const reactionMessageIds = useMemo(() => {
    if (!viewportMessageIds.size) return renderedMessageIds.slice(-40)
    return renderedMessageIds.filter((id) => viewportMessageIds.has(id))
  }, [viewportMessageIds, renderedMessageIds])
  const visibleReactions = useQuery({
    queryKey: [...adapter.reactionsKey, reactionMessageIds.join(',')],
    enabled: reactionMessageIds.length > 0,
    queryFn: () => adapter.loadReactions(reactionMessageIds),
  })
  const reactionsByMessageId = useMemo(() => {
    const indexed = new Map<string, SurfaceReaction[]>()
    for (const reaction of visibleReactions.data ?? []) {
      const reactions = indexed.get(reaction.message)
      if (reactions) reactions.push(reaction)
      else indexed.set(reaction.message, [reaction])
    }
    return indexed
  }, [visibleReactions.data])
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
    const messageElements = [
      ...list.querySelectorAll<HTMLElement>('[data-message-id]'),
    ]
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      startTransition(() => {
        setViewportMessageIds((current) => {
          const next = new Set(current)
          let changed = false
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.messageId
            if (!id) continue
            if (entry.isIntersecting && !next.has(id)) {
              next.add(id)
              changed = true
            } else if (!entry.isIntersecting && next.delete(id)) {
              changed = true
            }
          }
          return changed ? next : current
        })
      })
    }, { root: list, rootMargin: '600px 0px' })
    for (const element of messageElements) observer.observe(element)
    return () => observer.disconnect()
  }, [renderedMessageIds])

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
  }, [highlightedMessageId, messageElementPrefix, renderedMessages.length])

  useEffect(() => {
    const coordinator = readCoordinator.current
    if (!coordinator.begin(lastMessageId, adapter.persistedReadMessage)) return
    void adapter.markRead(lastMessageId).catch(() => coordinator.failed(lastMessageId))
  }, [adapter, lastMessageId])

  const send = async (content: string, files: readonly File[]) => {
    await adapter.save({ content, files, reply, editing })
    setReply(null)
    setEditing(null)
  }

  return (
    <div className={`message-surface ${className}`.trim()}>
      <search className="chat-inline-search">
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
      </search>
      <div
        className="message-scroll"
        ref={listRef}
        aria-busy={history.isLoading || (searchActive && filteredMessages.isLoading)}
        onScroll={(event) => {
          const element = event.currentTarget
          wasNearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120
        }}
      >
        {intro}
        {history.isLoading ? <LoadingState>Loading messages…</LoadingState> : null}
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
        {messageWindow.hasOlderLoaded ? (
          <button
            className="load-older"
            type="button"
            onClick={() => {
              priorHeight.current = listRef.current?.scrollHeight ?? 0
              messageWindow.showOlder()
            }}
          >
            Show older loaded messages
          </button>
        ) : !searchActive && history.hasNextPage ? (
          <button
            className="load-older"
            type="button"
            disabled={history.isFetchingNextPage}
            onClick={() => {
              priorHeight.current = listRef.current?.scrollHeight ?? 0
              messageWindow.expectOlderMessages()
              void history.fetchNextPage()
            }}
          >{history.isFetchingNextPage ? 'Loading…' : 'Load older messages'}</button>
        ) : null}
        {searchActive && filteredMessages.isLoading
          ? <LoadingState>Searching messages…</LoadingState>
          : null}
        {searchActive && filteredMessages.isError ? (
          <DataFailure
            error={filteredMessages.error}
            onRetry={() => void filteredMessages.refetch()}
            label={searchErrorLabel}
          />
        ) : null}
        {visibleMessages.length ? (
          <MessageLog
            messages={renderedMessages}
            highlightedMessageId={highlightedMessageId}
            messageElementPrefix={messageElementPrefix}
            reactionsByMessageId={reactionsByMessageId}
            currentUser={currentUser}
            adapter={adapter}
            onReply={beginReply}
            onEdit={beginEdit}
          />
        ) : showEmptyState ? (
          <div className="empty-channel">
            <h2>{searchActive ? 'No matching messages' : emptyTitle}</h2>
            {searchActive
              ? <p>Try a different search or clear the pinned filter.</p>
              : emptyDescription ? <p>{emptyDescription}</p> : null}
          </div>
        ) : null}
        {messageWindow.hasNewer ? (
          <button
            className="load-older"
            type="button"
            onClick={() => {
              messageWindow.showNewer()
              window.requestAnimationFrame(() => {
                const list = listRef.current
                if (list) list.scrollTop = Math.max(0, list.scrollHeight - list.clientHeight)
              })
            }}
          >
            Show newer messages
          </button>
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
        disabledReason={adapter.policy.disabledReason}
      />
    </div>
  )
}
