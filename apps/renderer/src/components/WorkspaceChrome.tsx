import type { Channel } from '@thiscord/shared'
import {
  Bell,
  BellOff,
  CircleHelp,
  ExternalLink,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { ChannelIcon } from '../features/channels/ChannelSidebar'

export function WorkspaceTitlebar({
  name,
  search,
  inbox,
  help,
  inert = false,
}: {
  readonly name: string
  readonly search: ReactNode
  readonly inbox: ReactNode
  readonly help?: ReactNode
  readonly inert?: boolean
}) {
  return (
    <header className="app-titlebar" inert={inert ? true : undefined}>
      <div className="wordmark">
        <span className="wordmark-mark"><i /><i /></span>
        <strong>{name}</strong>
      </div>
      {search}
      <div className="titlebar-cluster">
        {help}
        {inbox}
      </div>
    </header>
  )
}

export function WorkspaceHelp({ supportUrl }: {
  readonly supportUrl?: string
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !panelRef.current?.contains(target)
        && !triggerRef.current?.contains(target)
      ) setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('pointerdown', closeOnPointerDown)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('pointerdown', closeOnPointerDown)
    }
  }, [open])

  return (
    <>
      <div className="titlebar-actions">
        <button
          ref={triggerRef}
          className={open ? 'active' : ''}
          type="button"
          title="Help and tips"
          aria-label="Help and tips"
          aria-expanded={open}
          aria-controls="workspace-help"
          onClick={() => setOpen((value) => !value)}
        >
          <CircleHelp size={17} />
        </button>
      </div>
      {open ? (
        <div
          ref={panelRef}
          id="workspace-help"
          className="workspace-help-popover"
          role="region"
          aria-label="Help and tips"
        >
          <header>
            <span>
              <strong>Help</strong>
              <small className="desktop-help-content">Keyboard shortcuts</small>
              <small className="mobile-help-content">Mobile tips</small>
            </span>
            <button
              className="workspace-help-close"
              type="button"
              aria-label="Close help"
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
            ><X size={16} /></button>
          </header>
          <dl className="desktop-help-content">
            <div><dt>Search everywhere</dt><dd><kbd>Ctrl</kbd><kbd>K</kbd></dd></div>
            <div><dt>Search this conversation</dt><dd><kbd>Ctrl</kbd><kbd>F</kbd></dd></div>
            <div><dt>Focus the message box</dt><dd><kbd>/</kbd></dd></div>
            <div><dt>Open item actions</dt><dd><kbd>Shift</kbd><kbd>F10</kbd></dd></div>
            <div><dt>Close menus and dialogs</dt><dd><kbd>Esc</kbd></dd></div>
          </dl>
          <ul className="mobile-help-content">
            <li><strong>Navigate</strong><span>Tap the menu button to switch channels or conversations.</span></li>
            <li><strong>Find things</strong><span>Tap search in the top bar to find messages, channels, or people.</span></li>
            <li><strong>Message actions</strong><span>Press and hold a message to react, reply, or open more actions.</span></li>
            <li><strong>View profiles</strong><span>Tap a member or message avatar to open their profile.</span></li>
          </ul>
          {supportUrl ? (
            <a href={supportUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />Open support
            </a>
          ) : (
            <p>For account or access help, contact a community administrator.</p>
          )}
        </div>
      ) : null}
    </>
  )
}

export function ChannelToolbar({
  channel,
  navigationOpen,
  navigationTriggerRef,
  muted,
  canManage,
  membersOpen,
  onToggleNavigation,
  onToggleMute,
  onOpenSettings,
  onToggleMembers,
}: {
  readonly channel: Channel
  readonly navigationOpen: boolean
  readonly navigationTriggerRef?: RefObject<HTMLButtonElement | null>
  readonly muted: boolean
  readonly canManage: boolean
  readonly membersOpen: boolean
  readonly onToggleNavigation: () => void
  readonly onToggleMute: () => void
  readonly onOpenSettings: () => void
  readonly onToggleMembers: () => void
}) {
  return (
    <header className="channel-toolbar">
      <button
        ref={navigationTriggerRef}
        className="mobile-nav-button"
        type="button"
        aria-label="Open community navigation"
        aria-expanded={navigationOpen}
        aria-controls="community-navigation"
        onClick={onToggleNavigation}
      ><Menu size={18} /></button>
      <div className="channel-toolbar-title">
        <ChannelIcon kind={channel.kind} />
        <strong>{channel.name}</strong>
        {channel.topic ? <><span /><p>{channel.topic}</p></> : null}
      </div>
      <div className="channel-toolbar-actions">
        <button
          type="button"
          title={muted ? 'Unmute channel notifications' : 'Mute channel notifications'}
          aria-label={muted ? 'Unmute channel notifications' : 'Mute channel notifications'}
          onClick={onToggleMute}
        >{muted ? <BellOff size={18} /> : <Bell size={18} />}</button>
        {canManage ? (
          <button type="button" title="Channel settings" aria-label="Channel settings" onClick={onOpenSettings}>
            <Settings size={18} />
          </button>
        ) : null}
        <button
          className={membersOpen ? 'active' : ''}
          type="button"
          title="Member list"
          aria-label="Member list"
          aria-expanded={membersOpen}
          aria-controls="member-list-panel"
          onClick={onToggleMembers}
        ><Users size={19} /></button>
      </div>
    </header>
  )
}
