import type {
  Membership,
  User,
} from '@thiscord/shared'

export type CommunityModerationAction = 'kick' | 'ban' | 'timeout' | 'untimeout'

export interface MemberInteractions {
  readonly currentUserId: string
  readonly memberships?: readonly Membership[]
  readonly canManageMembers?: boolean
  readonly canModerateUser?: (userId: string) => boolean
  readonly onOpenProfile: (user: User) => void
  readonly onMessage: (user: User) => void
  readonly onModerate?: (
    membership: Membership,
    action: CommunityModerationAction,
  ) => void
}
