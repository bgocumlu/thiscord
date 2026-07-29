import assert from 'node:assert/strict'
import test from 'node:test'
import { contextDialogTabTarget } from '../src/components/contextMenuKeyboard.ts'

test('context dialogs tab through mixed controls before closing', () => {
  assert.equal(contextDialogTabTarget(0, 3, false), 1)
  assert.equal(contextDialogTabTarget(1, 3, false), 2)
  assert.equal(contextDialogTabTarget(2, 3, false), null)
  assert.equal(contextDialogTabTarget(2, 3, true), 1)
  assert.equal(contextDialogTabTarget(0, 3, true), null)
})
