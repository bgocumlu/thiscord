import { t } from '../lib/i18n'
import type {
  Channel,
  Message,
  Reaction,
  User,
} from '@thiscord/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Inbox as InboxIcon } from 'lucide-react'
import type PocketBase from 'pocketbase'
import { useEffect, useRef, useState } from 'react'
import {
  ContextMenu,
  ContextMenuItem,
} from '../components/ContextMenu'
import {
  ChannelToolbar,
  WorkspaceHelp,
  WorkspaceTitlebar,
} from '../components/WorkspaceChrome'
import { MessageSurface } from '../features/messaging/MessageSurface'
import type { MessageSurfaceAdapter } from '../features/messaging/messageSurfaceContract'
import { PocketBaseContext } from '../lib/contexts'

const now = '2026-07-29T00:00:00.000Z'

const currentUser: User = {
  id: 'user-current',
  handle: 'berkay',
  displayName: 'Berkay',
  avatar: '',
  bio: '',
  status: 'online',
  customStatus: '',
  lastSeenAt: now,
  created: now,
  updated: now,
}

const message: Message = {
  id: 'message-one',
  channel: 'channel-general',
  author: currentUser.id,
  content: 'A retained production message row',
  attachments: [],
  replyTo: '',
  editedAt: '',
  deletedAt: '',
  pinned: false,
  embedsEnabled: true,
  created: now,
  updated: now,
  expand: { author: currentUser },
}

const reaction: Reaction = {
  id: 'reaction-one',
  message: message.id,
  user: currentUser.id,
  emoji: '👍',
  created: now,
}

const channel: Channel = {
  id: 'channel-general',
  community: 'community-one',
  parent: '',
  name: 'general',
  topic: 'A production toolbar fixture',
  kind: 'text',
  position: 0,
  nsfw: false,
  slowmodeSeconds: 0,
  created: now,
  updated: now,
}

const adapter: MessageSurfaceAdapter<Message> = {
  kind: 'channel',
  targetId: channel.id,
  messageKey: ['renderer-test', 'messages'],
  reactionsKey: ['renderer-test', 'reactions'],
  searchRoot: ['renderer-test', 'search'],
  searchKey: (query, pinned) => ['renderer-test', 'search', query, pinned],
  reverseSearchResults: false,
  persistedReadMessage: '',
  policy: {
    canEdit: () => true,
    canDelete: () => true,
    canPin: () => true,
  },
  search: async () => ({ page: 1, hasMore: false, items: [] }),
  load: async () => message,
  loadReactions: async () => [reaction],
  save: async () => undefined,
  remove: async () => undefined,
  react: async () => undefined,
  pin: async () => undefined,
  markRead: async () => undefined,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
})

function MembersContextDialogHarness({
  onClose,
}: {
  readonly onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [menuPoint, setMenuPoint] = useState<{
    readonly x: number
    readonly y: number
  } | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog?.open) dialog?.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="members-panel-dialog"
      aria-label={t("testing.harness.memberListContextTest")}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <aside className="members-panel">
        <button
          type="button"
          aria-label={t("testing.harness.moreActionsForTestMember")}
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            setMenuPoint({ x: bounds.right, y: bounds.bottom })
          }}
        >

          {t("testing.harness.moreActionsForTestMember")}
        </button>
        {menuPoint ? (
          <ContextMenu
            point={menuPoint}
            label={t("testing.harness.actionsForTestMember")}
            onClose={() => setMenuPoint(null)}
          >
            <ContextMenuItem onSelect={() => undefined}>{t("testing.harness.message")}</ContextMenuItem>
          </ContextMenu>
        ) : null}
      </aside>
    </dialog>
  )
}

export function RendererTestHarness() {
  const [contextOpen, setContextOpen] = useState(false)
  const [membersContextOpen, setMembersContextOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const contextTrigger = useRef<HTMLButtonElement>(null)
  return (
    <QueryClientProvider client={queryClient}>
      <PocketBaseContext.Provider value={{} as PocketBase}>
        <div className="app-shell" data-renderer-test-ready="true">
          <WorkspaceTitlebar
            name="Thiscord"
            search={<search className="global-search"><input aria-label={t("testing.harness.search")} /></search>}
            help={<WorkspaceHelp />}
            inbox={(
              <div className="titlebar-actions">
                <button type="button" aria-label={t("testing.harness.inbox")}>
                  <InboxIcon size={17} /><span className="action-badge">8</span>
                </button>
              </div>
            )}
          />
          <div className="app-grid members-hidden">
            <nav className="server-rail" aria-label={t("testing.harness.communities")} />
            <aside className="channel-sidebar" aria-label={t("testing.harness.channels")} />
            <main className="content-panel">
              <ChannelToolbar
                channel={channel}
                navigationOpen={false}
                muted={false}
                canManage
                membersOpen={false}
                onToggleNavigation={() => undefined}
                onToggleMute={() => undefined}
                onOpenSettings={() => undefined}
                onToggleMembers={() => undefined}
              />
              <MessageSurface
                adapter={adapter}
                history={{
                  data: [message],
                  isLoading: false,
                  isError: false,
                  error: null,
                  hasNextPage: false,
                  isFetchingNextPage: false,
                  fetchNextPage: async () => undefined,
                  refetch: async () => undefined,
                }}
                currentUser={currentUser}
                onOpenProfile={(user) => setProfileName(user.displayName)}
                intro={null}
                placeholder={t("testing.harness.messageGeneral")}
                searchLabel={t("testing.harness.searchGeneral")}
                highlightedMessageId=""
                messageElementPrefix="renderer-test-message-"
                emptyTitle={t("testing.harness.noMessages")}
                searchErrorLabel={t("testing.harness.couldNotSearchMessages")}
                historyErrorLabel={t("testing.harness.couldNotLoadMessages")}
              />
              {profileName ? <output aria-label={t("testing.harness.openedProfile")}>{profileName}</output> : null}
              <div className="voice-controls">
                <button className="control-button screen-share-action" type="button">

                  {t("testing.harness.shareScreen")}
                </button>
              </div>
              <button
                ref={contextTrigger}
                type="button"
                onClick={() => setContextOpen(true)}
              >

                {t("testing.harness.openContextActions")}
              </button>
              {contextOpen ? (
                <ContextMenu
                  point={{ x: 24, y: 24 }}
                  label={t("testing.harness.testContextActions")}
                  onClose={() => setContextOpen(false)}
                >
                  <ContextMenuItem onSelect={() => undefined}>{t("testing.harness.mute")}</ContextMenuItem>
                </ContextMenu>
              ) : null}
              <button
                type="button"
                onClick={() => setMembersContextOpen(true)}
              >

                {t("testing.harness.openMembersContextTest")}
              </button>
              {membersContextOpen ? (
                <MembersContextDialogHarness
                  onClose={() => setMembersContextOpen(false)}
                />
              ) : null}
            </main>
          </div>
        </div>
      </PocketBaseContext.Provider>
    </QueryClientProvider>
  )
}
