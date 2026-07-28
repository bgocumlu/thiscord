export const communityKeys = {
  memberships: ['memberships'] as const,
  membershipsForUser: (userId: string) => [...communityKeys.memberships, userId] as const,
  invites: (communityId: string) => ['invites', communityId] as const,
  audit: (communityId: string) => ['audit_events', communityId] as const,
  bans: (communityId: string) => ['bans', communityId] as const,
} as const
