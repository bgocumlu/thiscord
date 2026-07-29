import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = async (path) => readFile(new URL(path, import.meta.url), 'utf8')
const rendererStyles = async () => Promise.all([
  source('../src/App.css'),
  source('../src/styles/workspace-core.css'),
  source('../src/styles/application-surfaces.css'),
  source('../src/styles/feature-polish.css'),
  source('../src/styles/theme-responsive.css'),
]).then((styles) => styles.join('\n'))

test('workspace complementary landmarks have explicit accessible names', async () => {
  const [channels, conversations, members, workspace] = await Promise.all([
    source('../src/features/channels/ChannelSidebar.tsx'),
    source('../src/features/conversations/DirectSidebar.tsx'),
    source('../src/features/members/MembersPanel.tsx'),
    source('../src/components/WorkspaceApp.tsx'),
  ])

  assert.match(channels, /<aside[\s\S]*?aria-label=\{`\$\{community\.name\} channels`\}/)
  assert.match(conversations, /<aside[\s\S]*?aria-label="Direct messages navigation"/)
  assert.match(members, /aria-labelledby="members-panel-title"/)
  assert.match(members, /<h2 id="members-panel-title">Members<\/h2>/)
  assert.match(workspace, /className="members-panel-dialog" aria-label="Member list"/)
  assert.match(workspace, /onClose=\{compactMembersViewport \? \(\) => setShowMembers\(false\)/)
})

test('unread navigation and notification states are programmatically exposed', async () => {
  const [channels, conversations, notifications] = await Promise.all([
    source('../src/features/channels/ChannelSidebar.tsx'),
    source('../src/features/conversations/DirectSidebar.tsx'),
    source('../src/features/notifications/Inbox.tsx'),
  ])

  assert.match(channels, /\{unread \? <span className="visually-hidden">Unread<\/span> : null\}/)
  assert.match(conversations, /\{unread \? <span className="visually-hidden">Unread<\/span> : null\}/)
  assert.match(conversations, /className="direct-avatar" aria-hidden="true"/)
  assert.match(notifications, /<span className="visually-hidden">Unread<\/span>/)
  assert.match(notifications, /<i aria-hidden="true" \/>/)
})

test('direct conversations render recipient avatars with initial fallbacks', async () => {
  const [sidebar, conversation] = await Promise.all([
    source('../src/features/conversations/DirectSidebar.tsx'),
    source('../src/features/conversations/ConversationView.tsx'),
  ])
  assert.match(sidebar, /\{recipient \? <Avatar user=\{recipient\} \/> : initials\(name\)\}/)
  assert.match(conversation, /\? <Avatar user=\{recipient\} \/>[\s\S]*?: <span className="conversation-header-avatar">/)
})

test('avatars leave adjacent user names to visible text while preserving presence labels', async () => {
  const avatar = await source('../src/features/members/Avatar.tsx')
  assert.doesNotMatch(avatar, /aria-label=\{user\.displayName\}/)
  assert.match(avatar, /aria-hidden=\{status \? undefined : true\}/)
  assert.match(avatar, /<span aria-hidden="true">\{initials/)
  assert.match(avatar, /aria-label=\{presenceLabels\[status\] \?\? status\}/)
})

test('profile identity fields declare autofill intent and omit custom status', async () => {
  const [profile, members] = await Promise.all([
    source('../src/features/members/ProfileDialogs.tsx'),
    source('../src/features/members/MembersPanel.tsx'),
  ])
  assert.match(profile, /name="displayName" autoComplete="name"/)
  assert.match(profile, /name="handle" autoComplete="username"/)
  assert.doesNotMatch(profile, /customStatus/)
  assert.doesNotMatch(members, /customStatus/)
})

test('member rows open profiles instead of navigating directly to messages', async () => {
  const members = await source('../src/features/members/MembersPanel.tsx')
  assert.match(members, /className=\{`member-row[\s\S]*?onClick=\{\(\) => interactions\.onOpenProfile\(user\)\}/)
  assert.doesNotMatch(members, /if \(user\.id === interactions\.currentUserId\)/)
})

test('runtime branding leaves browser chrome color under appearance control', async () => {
  const runtimeConfig = await source('../src/lib/runtimeConfig.ts')
  assert.doesNotMatch(runtimeConfig, /meta\[name="theme-color"\]/)
})

test('settings sections use labeled navigation with current-page state', async () => {
  const [settings, roles] = await Promise.all([
    source('../src/features/communities/CommunitySettingsDialog.tsx'),
    source('../src/features/roles/RoleSettings.tsx'),
  ])
  assert.match(settings, /<nav className="settings-navigation" aria-label=/)
  assert.match(settings, /aria-current=\{tab === item \? 'page' : undefined\}/)
  assert.match(roles, /<nav aria-label="Community roles">/)
})

test('age-restricted channel action names its destination', async () => {
  const workspace = await source('../src/components/WorkspaceApp.tsx')
  assert.match(workspace, />Enter age-restricted channel<\/button>/)
  assert.doesNotMatch(workspace, />Continue<\/button>/)
})

test('context actions expose mixed controls as a keyboard-reachable dialog', async () => {
  const contextMenu = await source('../src/components/ContextMenu.tsx')
  assert.match(contextMenu, /'button:not\(\[disabled\]\), input:not\(\[disabled\]\)'/)
  assert.match(contextMenu, /role="dialog"/)
  assert.match(contextMenu, /event\.target\.type === 'range'/)
  assert.match(contextMenu, /CloseMenuContext\.Provider value=\{closeAndRestoreFocus\}/)
  assert.doesNotMatch(contextMenu, /role="menu"/)
})

test('message reactions and realtime additions expose programmatic state', async () => {
  const messages = await source('../src/features/messaging/MessageSurface.tsx')
  assert.match(messages, /aria-pressed=\{reacted\}/)
  assert.match(messages, /aria-label=\{`\$\{reacted \? 'Remove' : 'Add'\}/)
  assert.match(messages, /role="log"/)
  assert.match(messages, /aria-relevant="additions text"/)
})

test('high-stakes actions use the shared accessible confirmation pattern', async () => {
  const [primitives, confirmationHook, ...consumers] = await Promise.all([
    source('../src/components/WorkspacePrimitives.tsx'),
    source('../src/hooks/useConfirmation.tsx'),
    source('../src/features/channels/ChannelDialogs.tsx'),
    source('../src/features/channels/ChannelSidebar.tsx'),
    source('../src/features/communities/CommunitySettingsDialog.tsx'),
    source('../src/features/conversations/ConversationDialogs.tsx'),
    source('../src/features/calls/CallSurface.tsx'),
    source('../src/features/members/ProfileDialogs.tsx'),
    source('../src/features/messaging/MessageSurface.tsx'),
    source('../src/features/roles/RoleSettings.tsx'),
  ])

  assert.match(primitives, /export function ConfirmDialog/)
  assert.match(confirmationHook, /new Promise<boolean>/)
  for (const consumer of consumers) {
    assert.doesNotMatch(consumer, /window\.confirm/)
  }
})

test('message discovery exposes touch and keyboard accelerators', async () => {
  const [messages, chrome] = await Promise.all([
    source('../src/features/messaging/MessageSurface.tsx'),
    source('../src/components/WorkspaceChrome.tsx'),
  ])

  assert.match(messages, /More actions for message from/)
  assert.match(messages, /aria-keyshortcuts="\/"/)
  assert.match(messages, /aria-keyshortcuts="Control\+f Meta\+f"/)
  assert.match(chrome, /Help and tips/)
  assert.match(chrome, /Focus the message box/)
  assert.match(chrome, /Press and hold a message/)
  assert.match(chrome, /aria-label="Close help"/)
})

test('message errors remain inside contained rows and use semantic error copy', async () => {
  const styles = await rendererStyles()
  assert.match(styles, /\.message-action-error\s*\{[\s\S]*?position:\s*static;/)
  assert.match(styles, /\.message-action-error\s*\{[\s\S]*?grid-column:\s*2;/)
  assert.match(styles, /\.composer-error,[\s\S]*?color:\s*var\(--danger-text\);/)
  assert.doesNotMatch(styles, /color:\s*#ef8a91;/)
})

test('message images reserve layout space before decoding', async () => {
  const [messages, styles] = await Promise.all([
    source('../src/features/messaging/MessageSurface.tsx'),
    rendererStyles(),
  ])
  assert.match(messages, /width="520"[\s\S]*?height="293"[\s\S]*?loading="lazy"/)
  assert.match(styles, /\.attachment-image > a\s*\{[\s\S]*?aspect-ratio:\s*16 \/ 9;/)
  assert.match(styles, /\.attachment-image img\s*\{[\s\S]*?height:\s*100%;/)
})

test('attachment cards stay compact and truncate long filenames', async () => {
  const [messages, styles] = await Promise.all([
    source('../src/features/messaging/MessageSurface.tsx'),
    rendererStyles(),
  ])
  assert.match(messages, /<strong title=\{displayName\}>\{displayName\}<\/strong>/)
  assert.match(styles, /\.attachment-card\s*\{[\s\S]*?width:\s*fit-content;/)
  assert.match(styles, /\.attachment-card strong\s*\{[\s\S]*?text-overflow:\s*ellipsis;/)
  assert.match(styles, /\.message-attachments \.attachment-card\s*\{[\s\S]*?margin-top:\s*0;/)
})

test('component styles consume theme tokens instead of embedding raw colors', async () => {
  const styles = await rendererStyles()
  assert.doesNotMatch(styles, /#[\da-f]{3,8}\b/i)
  assert.doesNotMatch(styles, /\brgba?\(/i)
})

test('asynchronous loading states use the shared polite live region', async () => {
  const [primitives, app, workspace, messages, conversation] = await Promise.all([
    source('../src/components/WorkspacePrimitives.tsx'),
    source('../src/App.tsx'),
    source('../src/components/WorkspaceApp.tsx'),
    source('../src/features/messaging/MessageSurface.tsx'),
    source('../src/features/conversations/ConversationView.tsx'),
  ])

  assert.match(primitives, /<main className="loading-state fullscreen">/)
  assert.match(primitives, /<div className="loading-state" \{\.\.\.loadingStatusProps\}>/)
  assert.match(primitives, /role: 'status'/)
  assert.match(primitives, /'aria-live': 'polite'/)
  assert.match(primitives, /'aria-atomic': true/)
  assert.match(workspace, /return <LoadingState fullscreen>Loading your communities…<\/LoadingState>/)
  assert.match(workspace, /\? communityData\.channels\.isLoading[\s\S]*: conversationsData\.conversations\.isLoading \|\| conversationsData\.members\.isLoading/)
  assert.match(workspace, /<LoadingState>Loading conversations…<\/LoadingState>/)
  assert.match(messages, /aria-busy=\{history\.isLoading \|\| \(searchActive && filteredMessages\.isLoading\)\}/)
  for (const consumer of [app, workspace, messages, conversation]) {
    assert.match(consumer, /<LoadingState/)
    assert.doesNotMatch(consumer, /className="loading-state/)
  }
})

test('call payload prefetch responds to pointer and keyboard intent', async () => {
  const [channels, conversation] = await Promise.all([
    source('../src/features/channels/ChannelSidebar.tsx'),
    source('../src/features/conversations/ConversationView.tsx'),
  ])
  for (const component of [channels, conversation]) {
    assert.match(component, /onPointerEnter=.*loadJitsiEngine/)
    assert.match(component, /onPointerDown=.*loadJitsiEngine/)
    assert.match(component, /onFocus=.*loadJitsiEngine/)
  }
})
