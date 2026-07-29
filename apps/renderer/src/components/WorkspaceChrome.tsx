import type { Channel } from '@thiscord/shared'
import {
  Bell,
  BellOff,
  Menu,
  Settings,
  Users,
} from 'lucide-react'
import {
  type ReactNode,
  type RefObject,
} from 'react'
import { ChannelIcon } from '../features/channels/ChannelSidebar'

export function WorkspaceTitlebar({
  name,
  search,
  inbox,
  inert = false,
}: {
  readonly name: string
  readonly search: ReactNode
  readonly inbox: ReactNode
  readonly inert?: boolean
}) {
  return (
    <header className="app-titlebar" inert={inert ? true : undefined}>
      <div className="wordmark">
        <span className="wordmark-mark"><i /><i /></span>
        <strong>{name}</strong>
      </div>
      {search}
      {inbox}
    </header>
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
          onClick={onToggleMute}
        >{muted ? <BellOff size={18} /> : <Bell size={18} />}</button>
        {canManage ? (
          <button type="button" title="Channel settings" onClick={onOpenSettings}>
            <Settings size={18} />
          </button>
        ) : null}
        <button
          className={membersOpen ? 'active' : ''}
          type="button"
          title="Member list"
          aria-expanded={membersOpen}
          aria-controls="member-list-panel"
          onClick={onToggleMembers}
        ><Users size={19} /></button>
      </div>
    </header>
  )
}
