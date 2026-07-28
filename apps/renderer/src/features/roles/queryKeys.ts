export const roleKeys = {
  all: ['roles'] as const,
  list: (communityId: string) => [...roleKeys.all, communityId] as const,
  assignments: ['member_roles'] as const,
  assignmentsForMember: (membershipId: string) => (
    [...roleKeys.assignments, 'member', membershipId] as const
  ),
} as const
