import type { CallTarget } from '@thiscord/shared'
import { callAccessWasRevoked } from './api'
import {
  isStaleJitsiModule,
  reloadForFreshJitsiModule,
} from './jitsiEngine'

export async function recoverJoinFailure(
  caught: unknown,
  target: CallTarget,
  leave: () => Promise<void>,
) {
  if (callAccessWasRevoked(caught)) {
    await leave()
    return true
  }
  return isStaleJitsiModule(caught) && await reloadForFreshJitsiModule(target)
}
