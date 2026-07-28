export const channelKeys = {
  all: ['channels'] as const,
  list: (communityId: string) => [...channelKeys.all, communityId] as const,
  target: (channelId: string) => [...channelKeys.all, 'target', channelId] as const,
  effectivePermissionsAll: ['effective_permissions'] as const,
  effectivePermissions: (communityId: string, channelId = '') => (
    [...channelKeys.effectivePermissionsAll, communityId, channelId] as const
  ),
  permissionsAll: ['channel_permissions'] as const,
  permissions: (channelId: string) => [...channelKeys.permissionsAll, channelId] as const,
} as const
