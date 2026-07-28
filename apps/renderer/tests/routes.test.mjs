import assert from 'node:assert/strict'
import test from 'node:test'

import { appRoutes, parseAppRoute } from '../src/features/navigation/routes.ts'
import { includeRouteTarget } from '../src/features/navigation/routeTargets.ts'

test('application route builders encode identifiers and focused records', () => {
  assert.equal(appRoutes.channel('community one', 'channel/two', 'message three'), '/channels/community%20one/channel%2Ftwo?message=message%20three')
  assert.equal(appRoutes.conversations('direct/one', 'message two'), '/channels/@me/direct%2Fone?directMessage=message%20two')
  assert.equal(appRoutes.invite('join/us'), '/invite/join%2Fus')
})

test('application route parser keeps channel and conversation routes distinct', () => {
  assert.deepEqual(parseAppRoute('/channels/community%20one/channel%2Ftwo'), {
    kind: 'channel',
    communityId: 'community one',
    channelId: 'channel/two',
  })
  assert.deepEqual(parseAppRoute('/channels/@me/direct%2Fone'), {
    kind: 'conversations',
    conversationId: 'direct/one',
  })
  assert.deepEqual(parseAppRoute('/auth/verify'), { kind: 'auth', action: 'verify' })
})

test('application route parser treats malformed percent escapes as unknown routes', () => {
  assert.deepEqual(parseAppRoute('/channels/%E0%A4%A/channel'), { kind: 'unknown' })
  assert.deepEqual(parseAppRoute('/channels/@me/%ZZ'), { kind: 'unknown' })
  assert.deepEqual(parseAppRoute('/invite/%'), { kind: 'unknown' })
})

test('application route parser rejects trailing route segments', () => {
  assert.deepEqual(parseAppRoute('/channels/community/channel/extra'), { kind: 'unknown' })
  assert.deepEqual(parseAppRoute('/channels/@me/conversation/extra'), { kind: 'unknown' })
  assert.deepEqual(parseAppRoute('/invite/code/extra'), { kind: 'unknown' })
  assert.deepEqual(parseAppRoute('/auth/verify/extra'), { kind: 'unknown' })
})

test('a route target beyond the loaded navigation page remains addressable', () => {
  const firstPage = Array.from({ length: 50 }, (_, index) => ({ id: `item-${index}` }))
  const deepLinked = { id: 'item-75' }
  const merged = includeRouteTarget(firstPage, deepLinked)

  assert.equal(merged.length, 51)
  assert.equal(merged.at(-1), deepLinked)
  assert.equal(includeRouteTarget(merged, deepLinked).length, 51)
})
