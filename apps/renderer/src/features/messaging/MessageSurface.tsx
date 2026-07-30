import { t, useLocale } from '../../lib/i18n'
import { policyLimits, type User } from '@thiscord/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  Copy,
  Ellipsis,
  FileText,
  MessageSquareText,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Search,
  Send,
  SmilePlus,
  Trash2,
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
import {
  ConfirmDialog,
  DataFailure,
  LoadingState,
} from '../../components/WorkspacePrimitives'
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  type ContextMenuPoint,
} from '../../components/ContextMenu'
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
import { shouldSubmitMessageComposer } from './messageComposerBehavior'
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
  readonly onOpenProfile: (user: User) => void
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

const frequentEmoji = ['👍', '❤️', '😂', '🎉', '✅', '👀', '🔥', '🙏']
const moreEmoji = [
  '😀', '😄', '😊', '😍', '🤔', '😮', '😢', '😡',
  '👎', '👏', '🙌', '💜', '❌', '💯', '🚀', '✨',
]

const RichMessage = lazy(() => import('./RichMessage'))

function EmojiPicker({
  id,
  onSelect,
}: {
  readonly id?: string
  readonly onSelect: (emoji: string) => void
}) {
  const emojiButtons = (items: readonly string[]) => items.map((emoji) => (
    <button
      type="button"
      aria-label={t("messaging.messageSurface.insertEmoji", { emoji })}
      onClick={() => onSelect(emoji)}
      key={emoji}
    >{emoji}</button>
  ))
  return (
    <div id={id} className="reaction-picker" role="group" aria-label={t("messaging.messageSurface.chooseEmoji")}>
      <span className="reaction-picker-label">{t("messaging.messageSurface.frequent")}</span>
      <div className="reaction-picker-grid">{emojiButtons(frequentEmoji)}</div>
      <details>
        <summary>{t("messaging.messageSurface.moreEmoji")}</summary>
        <div className="reaction-picker-grid">{emojiButtons(moreEmoji)}</div>
      </details>
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
        <span>{fileToken.error ? t("messaging.messageSurface.attachmentsCouldNotBeAuthorized") : t("messaging.messageSurface.authorizingAttachments")}</span>
        {fileToken.error ? <button type="button" onClick={() => void fileToken.refetch()}>{t("messaging.messageSurface.retry")}</button> : null}
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
            <figcaption><span>{displayName}</span><a href={downloadUrl}>{t("messaging.messageSurface.download")}</a></figcaption>
          </figure>
        ) : (
          <a className="attachment-card" href={downloadUrl} key={filename}>
            <span><FileText size={21} /></span>
            <span><strong title={displayName}>{displayName}</strong><small>{t("messaging.messageSurface.downloadAttachment")}</small></span>
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
  onOpenProfile,
}: {
  readonly message: TMessage
  readonly reactions: readonly SurfaceReaction[]
  readonly currentUser: MessageSurfaceProps<TMessage>['currentUser']
  readonly adapter: MessageSurfaceAdapter<TMessage>
  readonly onReply: (message: TMessage) => void
  readonly onEdit: (message: TMessage) => void
  readonly onOpenProfile: MessageSurfaceProps<TMessage>['onOpenProfile']
}) {
  useLocale()
  const [reactionOpen, setReactionOpen] = useState(false)
  const [menuPoint, setMenuPoint] = useState<ContextMenuPoint | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const reactionPickerId = useId()
  const [actionError, setActionError] = useState('')
  const [actionNotice, setActionNotice] = useState('')
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
  const copyText = async () => {
    setActionError('')
    setActionNotice('')
    try {
      await navigator.clipboard.writeText(message.content)
      setActionNotice(t("messaging.messageSurface.messageTextCopied"))
    } catch {
      setActionError(t("messaging.messageSurface.copyTextFailed"))
    }
  }
  return (
    <article className={`message-row ${deleted ? 'message-deleted' : ''}`}>
      <button
        className="message-avatar-button"
        type="button"
        aria-label={t("messaging.messageSurface.viewAuthorProfile", {
          authorName: author.displayName,
        })}
        onClick={() => onOpenProfile(author)}
      >
        <Avatar user={author} />
      </button>
      <div className="message-body">
        {message.expand?.replyTo ? (
          <div className="reply-context">
            <span className="reply-line" />
            <strong>{message.expand.replyTo.expand?.author?.displayName ?? t("messaging.messageSurface.unknown")}</strong>
            <span>{message.expand.replyTo.content || t("messaging.messageSurface.messageUnavailable")}</span>
          </div>
        ) : null}
        <div className="message-meta">
          <strong>{author.displayName}</strong>
          <time dateTime={message.created}>{formatTime(message.created)}</time>
          {message.editedAt ? <small className="edited">{t("messaging.messageSurface.edited")}</small> : null}
        </div>
        {deleted
          ? <p>{t("messaging.messageSurface.messageDeleted")}</p>
          : (
              <Suspense fallback={<p className="message-content-fallback">{message.content}</p>}>
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
              const reactionCount = items.length
              return (
                <button
                  className={reacted ? 'mine' : ''}
                  type="button"
                  aria-label={reacted
                    ? t("messaging.messageSurface.removeReaction", {
                        emoji,
                        count: reactionCount,
                      })
                    : t("messaging.messageSurface.addReactionWithCount", {
                        emoji,
                        count: reactionCount,
                      })}
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
            className="message-action-quick"
            type="button"
            title={t("messaging.messageSurface.addReaction")}
            aria-label={t("messaging.messageSurface.addReaction")}
            aria-expanded={reactionOpen}
            aria-controls={reactionPickerId}
            onClick={() => setReactionOpen((value) => !value)}
          >
            <SmilePlus size={15} />
          </button>
          <button
            className="message-action-quick"
            type="button"
            title={t("messaging.messageSurface.reply")}
            aria-label={t("messaging.messageSurface.replyToMessage")}
            onClick={() => onReply(message)}
          ><MessageSquareText size={15} /></button>
          <button
            type="button"
            title={t("messaging.messageSurface.moreActions")}
            aria-label={t("messaging.messageSurface.moreActionsForAuthorMessage", {
              authorName: author.displayName,
            })}
            aria-expanded={Boolean(menuPoint)}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              setMenuPoint({ x: bounds.right, y: bounds.bottom })
            }}
          ><Ellipsis size={16} /></button>
        </div>
      ) : null}
      {menuPoint ? (
        <ContextMenu
          point={menuPoint}
          label={t("messaging.messageSurface.actionsForAuthorMessage", {
            authorName: author.displayName,
          })}
          onClose={() => setMenuPoint(null)}
        >
          <ContextMenuItem icon={<SmilePlus size={15} />} onSelect={() => setReactionOpen(true)}>

            {t("messaging.messageSurface.addReaction")}
          </ContextMenuItem>
          <ContextMenuItem icon={<MessageSquareText size={15} />} onSelect={() => onReply(message)}>

            {t("messaging.messageSurface.reply")}
          </ContextMenuItem>
          {message.content ? (
            <ContextMenuItem icon={<Copy size={15} />} onSelect={copyText}>

              {t("messaging.messageSurface.copyText")}
            </ContextMenuItem>
          ) : null}
          {adapter.policy.canPin(message, currentUser) ? (
            <ContextMenuItem
              icon={message.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              onSelect={() => run(() => adapter.pin(message))}
            >
              {message.pinned ? t("messaging.messageSurface.unpinMessage") : t("messaging.messageSurface.pinMessage")}
            </ContextMenuItem>
          ) : null}
          {adapter.policy.canEdit(message, currentUser) ? (
            <ContextMenuItem icon={<Pencil size={15} />} onSelect={() => onEdit(message)}>

              {t("messaging.messageSurface.editMessage")}
            </ContextMenuItem>
          ) : null}
          {adapter.policy.canDelete(message, currentUser) ? (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                icon={<Trash2 size={15} />}
                danger
                onSelect={() => setDeleteOpen(true)}
              >

                {t("messaging.messageSurface.deleteMessage")}
              </ContextMenuItem>
            </>
          ) : null}
        </ContextMenu>
      ) : null}
      {reactionOpen ? (
        <EmojiPicker id={reactionPickerId} onSelect={(emoji) => {
          void run(() => adapter.react(message, emoji))
          setReactionOpen(false)
        }} />
      ) : null}
      {deleteOpen ? (
        <ConfirmDialog
          title={t("messaging.messageSurface.deleteMessageTitle")}
          description={t("messaging.messageSurface.deleteMessageDescription")}
          confirmLabel={t("messaging.messageSurface.deleteMessage")}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            await run(() => adapter.remove(message))
            setDeleteOpen(false)
          }}
        />
      ) : null}
      {actionError ? <div className="message-action-error" role="alert">{actionError}</div> : null}
      {actionNotice
        ? <span className="visually-hidden" role="status">{actionNotice}</span>
        : null}
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
  onOpenProfile,
}: {
  readonly messages: readonly TMessage[]
  readonly highlightedMessageId: string
  readonly messageElementPrefix: string
  readonly reactionsByMessageId: ReadonlyMap<string, readonly SurfaceReaction[]>
  readonly currentUser: MessageSurfaceProps<TMessage>['currentUser']
  readonly adapter: MessageSurfaceAdapter<TMessage>
  readonly onReply: (message: TMessage) => void
  readonly onEdit: (message: TMessage) => void
  readonly onOpenProfile: MessageSurfaceProps<TMessage>['onOpenProfile']
}) {
  return (
    <div
      className="message-list"
      role="log"
      aria-label={t("messaging.messageSurface.messages")}
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
            onOpenProfile={onOpenProfile}
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
  const composerInput = useRef<HTMLTextAreaElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiPickerId = useId()

  useEffect(() => {
    const focusComposer = (event: KeyboardEvent) => {
      if (
        event.key !== '/'
        || event.ctrlKey
        || event.metaKey
        || event.altKey
        || event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement
        || event.target instanceof HTMLSelectElement
        || (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) return
      event.preventDefault()
      composerInput.current?.focus()
    }
    window.addEventListener('keydown', focusComposer)
    return () => window.removeEventListener('keydown', focusComposer)
  }, [])

  const addFiles = (selected: readonly File[]) => {
    setError('')
    const combined = [...files, ...selected]
    if (combined.length > policyLimits.message.attachmentsMax) {
      setError(t("messaging.messageSurface.youCanAttachUpToCountFiles", {
        count: policyLimits.message.attachmentsMax,
      }))
      return
    }
    const tooLarge = combined.find((file) => file.size > policyLimits.message.attachmentBytesMax)
    if (tooLarge) {
      setError(t("messaging.messageSurface.nameIsLargerThanSizeMB", {
        name: tooLarge.name,
        size: policyLimits.message.attachmentBytesMax / 1024 / 1024,
      }))
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
          <span>{editing
            ? t("messaging.messageSurface.editingMessage")
            : t("messaging.messageSurface.replyingToAuthor", {
                authorName: reply?.expand?.author?.displayName
                  ?? t("messaging.messageSurface.message"),
              })}</span>
          <button type="button" aria-label={t("messaging.messageSurface.cancelReplyOrEdit")} onClick={onCancelContext}><X size={14} /></button>
        </div>
      ) : null}
      {files.length ? (
        <div className="composer-files">
          {files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}>
              {file.name}<small>{Math.max(1, Math.round(file.size / 1024))}  {t("messaging.messageSurface.kb")}</small>
              <button
                type="button"
                aria-label={t("messaging.messageSurface.removeFile", {
                  fileName: file.name,
                })}
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
              ><X size={12} /></button>
            </span>
          ))}
        </div>
      ) : null}
      {busy && files.length ? (
        <div className="upload-progress" role="status">
          <span />{t("messaging.messageSurface.uploadingAttachments", {
            count: files.length,
          })}
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
          title={editing ? t("messaging.messageSurface.attachmentsCannotBeChangedWhileEditing") : t("messaging.messageSurface.addAttachment")}
          onClick={() => fileInput.current?.click()}
        ><Paperclip size={18} /></button>
        <textarea
          ref={composerInput}
          rows={1}
          value={draft}
          disabled={Boolean(disabledReason) || busy}
          aria-label={placeholder}
          aria-keyshortcuts="/"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            const multilineEnter = window.matchMedia(
              '(max-width: 640px), (pointer: coarse)',
            ).matches
            if (!shouldSubmitMessageComposer({
              key: event.key,
              shiftKey: event.shiftKey,
              isComposing: event.nativeEvent.isComposing,
              multilineEnter,
            })) return
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }}
          placeholder={disabledReason || placeholder}
          maxLength={policyLimits.message.contentMax}
        />
        <button
          type="button"
          disabled={Boolean(disabledReason) || busy}
          title={t("messaging.messageSurface.addEmoji")}
          aria-expanded={emojiOpen}
          aria-controls={emojiPickerId}
          onClick={() => setEmojiOpen((value) => !value)}
        ><SmilePlus size={18} /></button>
        <button
          className="send-button"
          type="submit"
          title={t("messaging.messageSurface.sendMessage")}
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

function ConversationSearch({
  searchLabel,
  search,
  pinnedOnly,
  onSearchChange,
  onPinnedOnlyChange,
}: {
  readonly searchLabel: string
  readonly search: string
  readonly pinnedOnly: boolean
  readonly onSearchChange: (value: string) => void
  readonly onPinnedOnlyChange: (value: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focusInlineSearch = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'f') return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', focusInlineSearch)
    return () => window.removeEventListener('keydown', focusInlineSearch)
  }, [])

  return (
    <search className="chat-inline-search">
      <Search size={14} />
      <input
        ref={inputRef}
        type="search"
        aria-label={searchLabel}
        aria-keyshortcuts="Control+f Meta+f"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchLabel}
      />
      <button
        className={pinnedOnly ? 'active' : ''}
        type="button"
        aria-pressed={pinnedOnly}
        title={pinnedOnly ? t("messaging.messageSurface.showAllMessages") : t("messaging.messageSurface.showPinnedMessagesOnly")}
        onClick={() => onPinnedOnlyChange(!pinnedOnly)}
      >
        <Pin size={13} />{pinnedOnly ? t("messaging.messageSurface.pinnedOnly") : t("messaging.messageSurface.pinnedMessages")}
      </button>
    </search>
  )
}

export function MessageSurface<TMessage extends SurfaceMessage,>({
  adapter,
  history,
  currentUser,
  onOpenProfile,
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
      <ConversationSearch
        searchLabel={searchLabel}
        search={search}
        pinnedOnly={pinnedOnly}
        onSearchChange={setSearch}
        onPinnedOnlyChange={setPinnedOnly}
      />
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
        {history.isLoading ? <LoadingState>{t("messaging.messageSurface.loadingMessages")}</LoadingState> : null}
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
            label={t("messaging.messageSurface.couldNotLoadTheLinkedMessage")}
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

            {t("messaging.messageSurface.showOlderLoadedMessages")}
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
          >{history.isFetchingNextPage ? t("messaging.messageSurface.loading") : t("messaging.messageSurface.loadOlderMessages")}</button>
        ) : null}
        {searchActive && filteredMessages.isLoading
          ? <LoadingState>{t("messaging.messageSurface.searchingMessages")}</LoadingState>
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
            onOpenProfile={onOpenProfile}
          />
        ) : showEmptyState ? (
          <div className="empty-channel">
            <span aria-hidden="true"><MessageSquareText size={22} /></span>
            <h2>{searchActive ? t("messaging.messageSurface.noMatchingMessages") : emptyTitle}</h2>
            {searchActive
              ? <p>{t("messaging.messageSurface.tryADifferentSearchOrClearThePinnedFilter")}</p>
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

            {t("messaging.messageSurface.showNewerMessages")}
          </button>
        ) : null}
        {searchActive && filteredMessages.hasNextPage ? (
          <button
            className="load-older"
            type="button"
            disabled={filteredMessages.isFetchingNextPage}
            onClick={() => void filteredMessages.fetchNextPage()}
          >{filteredMessages.isFetchingNextPage ? t("messaging.messageSurface.loading") : t("messaging.messageSurface.moreResults")}</button>
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
