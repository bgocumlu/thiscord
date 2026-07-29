import assert from 'node:assert/strict'
import test from 'node:test'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

globalThis.React = React

const {
  ChannelToolbar,
  WorkspaceTitlebar,
} = await import('../src/components/WorkspaceChrome.tsx')

test('production workspace chrome keeps compact actions in semantic markup', () => {
  const titlebar = renderToStaticMarkup(createElement(WorkspaceTitlebar, {
    name: 'Thiscord',
    search: createElement('search', null, 'Search'),
    inbox: createElement('button', { type: 'button', 'aria-label': 'Inbox' }),
  }))
  assert.match(titlebar, /class="app-titlebar"/)
  assert.match(titlebar, /aria-label="Inbox"/)

  const toolbar = renderToStaticMarkup(createElement(ChannelToolbar, {
    channel: { kind: 'text', name: 'general', topic: 'Long-form project updates' },
    navigationOpen: false,
    muted: false,
    canManage: true,
    membersOpen: false,
    onToggleNavigation: () => undefined,
    onToggleMute: () => undefined,
    onOpenSettings: () => undefined,
    onToggleMembers: () => undefined,
  }))
  assert.match(toolbar, /class="channel-toolbar"/)
  assert.match(toolbar, /title="Mute channel notifications"/)
  assert.match(toolbar, /title="Channel settings"/)
  assert.match(toolbar, /title="Member list"/)
  assert.match(toolbar, /aria-controls="member-list-panel"/)
})
