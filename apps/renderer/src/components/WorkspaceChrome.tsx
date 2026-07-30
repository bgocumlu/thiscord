import { t } from '../lib/i18n'
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
          title={t("workspace.chrome.helpAndTips")}
          aria-label={t("workspace.chrome.helpAndTips")}
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
          aria-label={t("workspace.chrome.helpAndTips")}
        >
          <header>
            <span>
              <strong>{t("workspace.chrome.help")}</strong>
              <small className="desktop-help-content">{t("workspace.chrome.keyboardShortcuts")}</small>
              <small className="mobile-help-content">{t("workspace.chrome.mobileTips")}</small>
            </span>
            <button
              className="workspace-help-close"
              type="button"
              aria-label={t("workspace.chrome.closeHelp")}
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
            ><X size={16} /></button>
          </header>
          <dl className="desktop-help-content">
            <div><dt>{t("workspace.chrome.searchEverywhere")}</dt><dd><kbd>{t("workspace.chrome.ctrl")}</kbd><kbd>{t("workspace.chrome.k")}</kbd></dd></div>
            <div><dt>{t("workspace.chrome.searchThisConversation")}</dt><dd><kbd>{t("workspace.chrome.ctrl")}</kbd><kbd>{t("workspace.chrome.f")}</kbd></dd></div>
            <div><dt>{t("workspace.chrome.focusTheMessageBox")}</dt><dd><kbd>/</kbd></dd></div>
            <div><dt>{t("workspace.chrome.newLineInAMessage")}</dt><dd><kbd>{t("workspace.chrome.shift")}</kbd><kbd>{t("workspace.chrome.enter")}</kbd></dd></div>
            <div><dt>{t("workspace.chrome.openItemActions")}</dt><dd><kbd>{t("workspace.chrome.shift")}</kbd><kbd>{t("workspace.chrome.f10")}</kbd></dd></div>
            <div><dt>{t("workspace.chrome.closeMenusAndDialogs")}</dt><dd><kbd>{t("workspace.chrome.esc")}</kbd></dd></div>
          </dl>
          <ul className="mobile-help-content">
            <li><strong>{t("workspace.chrome.navigate")}</strong><span>{t("workspace.chrome.tapTheMenuButtonToSwitchChannelsOrConversations")}</span></li>
            <li><strong>{t("workspace.chrome.findThings")}</strong><span>{t("workspace.chrome.tapSearchInTheTopBarToFindMessagesChannelsOrPeople")}</span></li>
            <li><strong>{t("workspace.chrome.messageActions")}</strong><span>{t("workspace.chrome.pressAndHoldAMessageToReactReplyOrOpenMoreActions")}</span></li>
            <li><strong>{t("workspace.chrome.viewProfiles")}</strong><span>{t("workspace.chrome.tapAMemberOrMessageAvatarToOpenTheirProfile")}</span></li>
          </ul>
          {supportUrl ? (
            <a href={supportUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />{t("workspace.chrome.openSupport")}
            </a>
          ) : (
            <p>{t("workspace.chrome.forAccountOrAccessHelpContactACommunityAdministrator")}</p>
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
        aria-label={t("workspace.chrome.openCommunityNavigation")}
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
          title={muted ? t("workspace.chrome.unmuteChannelNotifications") : t("workspace.chrome.muteChannelNotifications")}
          aria-label={muted ? t("workspace.chrome.unmuteChannelNotifications") : t("workspace.chrome.muteChannelNotifications")}
          onClick={onToggleMute}
        >{muted ? <BellOff size={18} /> : <Bell size={18} />}</button>
        {canManage ? (
          <button type="button" title={t("workspace.chrome.channelSettings")} aria-label={t("workspace.chrome.channelSettings")} onClick={onOpenSettings}>
            <Settings size={18} />
          </button>
        ) : null}
        <button
          className={membersOpen ? 'active' : ''}
          type="button"
          title={t("workspace.chrome.memberList")}
          aria-label={t("workspace.chrome.memberList")}
          aria-expanded={membersOpen}
          aria-controls="member-list-panel"
          onClick={onToggleMembers}
        ><Users size={19} /></button>
      </div>
    </header>
  )
}
