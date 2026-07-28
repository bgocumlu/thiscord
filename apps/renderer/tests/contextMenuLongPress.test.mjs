import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTEXT_MENU_LONG_PRESS_MS,
  contextMenuLongPressMoved,
} from '../src/components/contextMenuLongPress.ts'

test('touch context menus use a deliberate half-second long press', () => {
  assert.equal(CONTEXT_MENU_LONG_PRESS_MS, 500)
})

test('touch context menus tolerate a small hold but cancel when scrolling', () => {
  const start = { x: 40, y: 80 }
  assert.equal(contextMenuLongPressMoved(start, { x: 50, y: 70 }), false)
  assert.equal(contextMenuLongPressMoved(start, { x: 51, y: 80 }), true)
  assert.equal(contextMenuLongPressMoved(start, { x: 40, y: 91 }), true)
})
