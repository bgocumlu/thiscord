export const memberKeys = {
  directories: ['community_members'] as const,
  directory: (communityId: string) => [...memberKeys.directories, communityId] as const,
  presenceAll: ['presence'] as const,
  presence: (communityId: string) => [...memberKeys.presenceAll, communityId] as const,
  fileToken: (userId: string) => ['file-token', userId] as const,
} as const
