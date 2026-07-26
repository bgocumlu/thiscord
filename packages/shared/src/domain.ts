import type { Permission } from "./permissions.js";

export type Id = string;
export type IsoDate = string;

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";
export type MembershipState = "active" | "pending" | "banned" | "left";
export type ChannelKind = "category" | "text" | "announcement" | "voice";

export interface User {
  readonly id: Id;
  readonly email?: string;
  readonly verified?: boolean;
  readonly handle: string;
  readonly displayName: string;
  readonly avatar: string;
  readonly bio: string;
  readonly status: PresenceStatus;
  readonly customStatus: string;
  readonly lastSeenAt: IsoDate;
  readonly preferences?: {
    readonly theme?: string;
    readonly compactMode?: boolean;
    readonly reduceMotion?: boolean;
    readonly notificationSound?: boolean;
    readonly mutedChannels?: readonly Id[];
  };
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface Community {
  readonly id: Id;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly icon: string;
  readonly banner: string;
  readonly owner: Id;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface Membership {
  readonly id: Id;
  readonly community: Id;
  readonly user: Id;
  readonly nickname: string;
  readonly state: MembershipState;
  readonly joinedAt: IsoDate;
  readonly timeoutUntil: IsoDate;
  readonly created: IsoDate;
  readonly updated: IsoDate;
  readonly expand?: {
    readonly user?: User;
    readonly community?: Community;
  };
}

export interface Role {
  readonly id: Id;
  readonly community: Id;
  readonly name: string;
  readonly color: string;
  readonly position: number;
  readonly permissions: Permission[];
  readonly hoist: boolean;
  readonly mentionable: boolean;
  readonly managed: boolean;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface MemberRole {
  readonly id: Id;
  readonly membership: Id;
  readonly role: Id;
}

export interface EffectivePermissions {
  readonly membershipId: Id;
  readonly roleIds: Id[];
  readonly permissions: Permission[];
  readonly highestRolePosition: number;
  readonly owner: boolean;
}

export interface Channel {
  readonly id: Id;
  readonly community: Id;
  readonly parent: Id;
  readonly name: string;
  readonly topic: string;
  readonly kind: ChannelKind;
  readonly position: number;
  readonly nsfw: boolean;
  readonly slowmodeSeconds: number;
  readonly jitsiRoom: string;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface ChannelPermission {
  readonly id: Id;
  readonly channel: Id;
  readonly targetType: "role" | "member";
  readonly targetId: Id;
  readonly allow: Permission[];
  readonly deny: Permission[];
}

export interface Attachment {
  readonly name: string;
  readonly url: string;
  readonly size?: number;
  readonly type?: string;
}

export interface Message {
  readonly id: Id;
  readonly channel: Id;
  readonly author: Id;
  readonly content: string;
  readonly attachments: string[];
  readonly replyTo: Id;
  readonly editedAt: IsoDate;
  readonly deletedAt: IsoDate;
  readonly pinned: boolean;
  readonly embedsEnabled: boolean;
  readonly created: IsoDate;
  readonly updated: IsoDate;
  readonly expand?: {
    readonly author?: User;
    readonly replyTo?: Message;
  };
}

export interface Reaction {
  readonly id: Id;
  readonly message: Id;
  readonly user: Id;
  readonly emoji: string;
  readonly created: IsoDate;
}

export interface ReadState {
  readonly id: Id;
  readonly user: Id;
  readonly channel: Id;
  readonly lastMessage: Id;
  readonly lastReadAt: IsoDate;
}

export interface Invite {
  readonly id: Id;
  readonly community: Id;
  readonly creator: Id;
  readonly code: string;
  readonly expiresAt: IsoDate;
  readonly maxUses: number;
  readonly uses: number;
  readonly revoked: boolean;
}

export interface InvitePreview {
  readonly code: string;
  readonly community: {
    readonly id: Id;
    readonly name: string;
    readonly description: string;
  };
  readonly memberCount: number;
  readonly expiresAt: IsoDate;
}

export interface Conversation {
  readonly id: Id;
  readonly kind: "direct" | "group";
  readonly name: string;
  readonly owner: Id;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface ConversationMember {
  readonly id: Id;
  readonly conversation: Id;
  readonly user: Id;
  readonly nickname: string;
  readonly joinedAt: IsoDate;
  readonly lastReadAt: IsoDate;
  readonly lastMessage: Id;
  readonly expand?: {
    readonly user?: User;
    readonly conversation?: Conversation;
  };
}

export interface DirectReaction {
  readonly id: Id;
  readonly message: Id;
  readonly user: Id;
  readonly emoji: string;
  readonly created: IsoDate;
}

export interface DirectMessage {
  readonly id: Id;
  readonly conversation: Id;
  readonly author: Id;
  readonly content: string;
  readonly attachments: string[];
  readonly replyTo: Id;
  readonly editedAt: IsoDate;
  readonly deletedAt: IsoDate;
  readonly embedsEnabled: boolean;
  readonly pinned: boolean;
  readonly created: IsoDate;
  readonly updated: IsoDate;
  readonly expand?: {
    readonly author?: User;
    readonly replyTo?: DirectMessage;
  };
}

export interface JitsiJoin {
  readonly domain: string;
  readonly url: string;
  readonly roomName: string;
  readonly jwt: string;
  readonly displayName: string;
  readonly avatarUrl: string;
  readonly moderator: boolean;
  readonly canSpeak: boolean;
  readonly canStreamVideo: boolean;
  readonly canMuteMembers: boolean;
  readonly canRemoveMembers: boolean;
  readonly expiresAt: IsoDate;
}

export interface CallSessionRecord {
  readonly id: Id;
  readonly channel: Id;
  readonly startedBy: Id;
  readonly roomName: string;
  readonly endedAt: IsoDate;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface CallParticipantRecord {
  readonly id: Id;
  readonly call: Id;
  readonly user: Id;
  readonly joinedAt: IsoDate;
  readonly leftAt: IsoDate;
  readonly expiresAt: IsoDate;
  readonly muted: boolean;
  readonly deafened: boolean;
  readonly camera: boolean;
  readonly sharing: boolean;
  readonly created: IsoDate;
  readonly updated: IsoDate;
  readonly expand?: {
    readonly user?: User;
    readonly call?: CallSessionRecord;
  };
}

export interface DistributionConfig {
  readonly id: string;
  readonly name: string;
  readonly appId: string;
  readonly webUrl: string;
  readonly pocketBaseUrl: string;
  readonly jitsiDomain: string;
  readonly supportUrl: string;
  readonly updateUrl: string;
  readonly accent: string;
}
