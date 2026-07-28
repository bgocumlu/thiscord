import assert from 'node:assert/strict'
import test from 'node:test'

import { manageableRoles } from '../src/features/roles/hierarchy.ts'

const role = (id, position, managed = false) => ({ id, position, managed })

test('non-owner role ordering excludes managed and equal-or-higher roles', () => {
  const roles = [
    role('higher', 4),
    role('own-highest', 3),
    role('lower', 2),
    role('managed', 0, true),
  ]

  assert.deepEqual(
    manageableRoles(roles, 3, false).map((item) => item.id),
    ['lower'],
  )
  assert.deepEqual(
    manageableRoles(roles, 3, true).map((item) => item.id),
    ['higher', 'own-highest', 'lower'],
  )
})
