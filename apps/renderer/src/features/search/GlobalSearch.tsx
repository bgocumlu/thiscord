import type { User } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { MessageSquareText, Search, X } from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
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
  const inputRef = useRef<HTMLInputElement>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const query = useGlobalSearch(deferredSearch)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
        inputRef.current?.select()
      } else if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearch('')
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const close = () => {
    setSearch('')
    setOpen(false)
  }

  return (
    <>
      <button
        className="mobile-search-button"
        type="button"
        aria-label="Open search"
        onClick={() => {
          setOpen(true)
          window.setTimeout(() => inputRef.current?.focus())
        }}
      ><Search size={18} /></button>
      <div className={`global-search-wrap ${open ? 'mobile-open' : ''}`}>
        <search className="global-search">
          <Search size={15} />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search messages, channels, or people"
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
        {search.trim() ? (
          <div className="global-search-results" role="listbox" aria-label="Search results">
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
          </div>
        ) : null}
      </div>
    </>
  )
}
