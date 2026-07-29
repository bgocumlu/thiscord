import type { Channel } from '@thiscord/shared'

export function channelSelectionClosesNavigation(kind: Channel['kind']) {
  return kind !== 'voice'
}
