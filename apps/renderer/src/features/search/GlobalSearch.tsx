import type { User } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { MessageSquareText, Search, X } from 'lucide-react'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { formatTime } from '../../components/workspaceUtils'
import { errorMessage } from '../../lib/pocketbase'
import { useAppRouter } from '../../lib/router'
import { ChannelIcon } from '../channels/ChannelSidebar'
import { Avatar } from '../members/Avatar'
import { appRoutes } from '../navigation/routes'
import { useGlobalSearch } from './queries'

export function GlobalSearch({
  onOpenMember,
}: {
  readonly onOpenMember: (user: User) => void
}) {
  const { navigate } = useAppRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 640px)').matches,
  )
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const desktopPanelRef = useRef<HTMLDivElement>(null)
  const mobileDialogRef = useRef<HTMLDialogElement>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const query = useGlobalSearch(deferredSearch)

  const close = useCallback(() => {
    setSearch('')
    setOpen(false)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const dialog = mobileDialogRef.current
    if (!dialog || !mobile || !open) return
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const desktopInput = desktopInputRef.current
    const mobileTrigger = mobileTriggerRef.current
    if (!dialog.open) dialog.showModal()
    window.requestAnimationFrame(() => {
      mobileInputRef.current?.focus()
      mobileInputRef.current?.select()
    })
    return () => {
      if (dialog.open) dialog.close()
      const returnFocus = previousFocus === desktopInput
        ? mobileTrigger
        : previousFocus
      returnFocus?.focus()
    }
  }, [mobile, open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        const input = mobile ? mobileInputRef.current : desktopInputRef.current
        window.requestAnimationFrame(() => {
          input?.focus()
          input?.select()
        })
      } else if (
        event.key === 'Escape'
        && !mobile
        && open
        && desktopPanelRef.current?.contains(document.activeElement)
      ) {
        close()
        desktopInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, mobile, open])

  const searchStatus = deferredSearch.length < policyLimits.search.queryMin
    ? 'Type at least two characters.'
    : query.isLoading
      ? 'Searching.'
      : query.isError
        ? 'Search failed.'
        : query.isSuccess
          ? `${query.data?.length ?? 0} search result${query.data?.length === 1 ? '' : 's'}.`
          : ''

  const renderSearchSurface = (
    inputRef: RefObject<HTMLInputElement | null>,
    surfaceId: string,
  ) => (
    <>
      <search className="global-search">
        <Search size={15} />
        <input
          ref={inputRef}
          type="search"
          aria-label="Search messages, channels, or people"
          aria-controls={`${surfaceId}-results`}
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search messages, channels, or people"
        />
        <kbd>Ctrl K</kbd>
        <button className="search-close" type="button" aria-label="Close search" onClick={close}>
          <X size={15} />
        </button>
      </search>
      <span className="visually-hidden" role="status" aria-live="polite">
        {searchStatus}
      </span>
      {search.trim() ? (
        <section
          id={`${surfaceId}-results`}
          className="global-search-results"
          aria-label="Search results"
        >
          {deferredSearch.length < policyLimits.search.queryMin
            ? <p>Type at least two characters.</p>
            : null}
          {query.isLoading ? <p>Searching…</p> : null}
          {query.isError ? (
            <div className="search-state-error">
              <span>{errorMessage(query.error)}</span>
              <button type="button" onClick={() => void query.refetch()}>Retry</button>
            </div>
          ) : null}
          {query.data?.map((target) => {
            if (target.kind === 'channel') {
              const channel = target.channel
              return (
                <button
                  type="button"
                  onClick={() => {
                    navigate(appRoutes.channel(channel.community, channel.id))
                    close()
                  }}
                  key={`channel-${channel.id}`}
                >
                  <ChannelIcon kind={channel.kind} />
                  <span>
                    {channel.name}
                    <small>{channel.expand?.community?.name ?? 'Community'} · channel</small>
                  </span>
                </button>
              )
            }
            if (target.kind === 'user') {
              const user = target.user
              return (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMember(user)
                    close()
                  }}
                  key={`member-${user.id}`}
                >
                  <Avatar user={user} size="small" />
                  <span>{user.displayName}<small>@{user.handle} · member</small></span>
                </button>
              )
            }
            if (target.kind === 'message') {
              const message = target.message
              return (
                <button
                  type="button"
                  onClick={() => {
                    const channel = message.expand?.channel
                    if (channel) {
                      navigate(appRoutes.channel(channel.community, channel.id, message.id))
                    }
                    close()
                  }}
                  key={`message-${message.id}`}
                >
                  <MessageSquareText size={17} />
                  <span>
                    {message.content}
                    <small>
                      #{message.expand?.channel?.name ?? 'channel'} · {formatTime(message.created)}
                    </small>
                  </span>
                </button>
              )
            }
            const message = target.message
            return (
              <button
                type="button"
                onClick={() => {
                  navigate(appRoutes.conversations(message.conversation, message.id))
                  close()
                }}
                key={`direct-message-${message.id}`}
              >
                <MessageSquareText size={17} />
                <span>
                  {message.content}
                  <small>{message.expand?.conversation?.name || 'Direct message'} · {formatTime(message.created)}</small>
                </span>
              </button>
            )
          })}
          {query.isSuccess && !query.data?.length ? <p>No results found.</p> : null}
        </section>
      ) : null}
    </>
  )

  return (
    <>
      <button
        ref={mobileTriggerRef}
        className="mobile-search-button"
        type="button"
        aria-label="Open search"
        aria-expanded={open}
        aria-controls="global-search-dialog"
        onClick={() => {
          setOpen(true)
        }}
      ><Search size={18} /></button>
      <div ref={desktopPanelRef} id="global-search-panel" className="global-search-wrap">
        {renderSearchSurface(desktopInputRef, 'global-search-desktop')}
      </div>
      <dialog
        ref={mobileDialogRef}
        id="global-search-dialog"
        className="mobile-search-dialog"
        aria-label="Search messages, channels, or people"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        {renderSearchSurface(mobileInputRef, 'global-search-mobile')}
      </dialog>
    </>
  )
}
