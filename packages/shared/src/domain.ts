import type { Permission } from "./permissions.js";
import type { channelCapabilities } from "./policies.generated.js";

export type Id = string;
export type IsoDate = string;

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";
export type MembershipState = "active" | "pending" | "banned" | "left";
export type ChannelKind = keyof typeof channelCapabilities;
export type ConversationKind = "direct" | "group";

export type ThemePreference =
  | { readonly theme: "dark" }
  | { readonly theme: "light" }
  | { readonly theme: "system" };

export type UserPreferences = ThemePreference & {
  readonly compactMode: boolean;
  readonly reduceMotion: boolean;
  readonly notificationSound: boolean;
  readonly presenceStatus?: PresenceStatus;
  readonly mutedChannels?: readonly Id[];
  readonly mutedConversations?: readonly Id[];
};

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
  readonly preferences?: UserPreferences;
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

interface ConversationBase {
  readonly id: Id;
  readonly name: string;
  readonly owner: Id;
  readonly lastMessageAt: IsoDate;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface DirectConversation extends ConversationBase {
  readonly kind: "direct";
}

export interface GroupConversation extends ConversationBase {
  readonly kind: "group";
}

export type Conversation = DirectConversation | GroupConversation;

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

export type SearchTarget =
  | {
      readonly kind: "channel";
      readonly channel: Channel & { readonly expand?: { readonly community?: Community } };
    }
  | {
      readonly kind: "message";
      readonly message: Omit<Message, "expand"> & {
        readonly expand?: {
          readonly author?: User;
          readonly channel?: Channel & { readonly expand?: { readonly community?: Community } };
        };
      };
    }
  | {
      readonly kind: "conversation_message";
      readonly message: Omit<DirectMessage, "expand"> & {
        readonly expand?: {
          readonly author?: User;
          readonly conversation?: Conversation;
        };
      };
    }
  | { readonly kind: "user"; readonly user: User };

interface NotificationBase {
  readonly id: Id;
  readonly user: Id;
  readonly actor: Id;
  readonly readAt: IsoDate;
  readonly created: IsoDate;
  readonly expand?: {
    readonly actor?: User;
  };
}

export interface CommunityNotification extends NotificationBase {
  readonly type: "reply" | "mention" | "mention_everyone" | "role_mention";
  readonly community: Id;
  readonly channel: Id;
  readonly message: Id;
  readonly data?: Record<string, never>;
}

export interface ConversationNotification extends NotificationBase {
  readonly type: "direct_message";
  readonly community: "";
  readonly channel: "";
  readonly message: "";
  readonly data: {
    readonly conversation: Id;
    readonly directMessage: Id;
  };
}

export interface ConversationCallNotification extends NotificationBase {
  readonly type: "conversation_call";
  readonly community: "";
  readonly channel: "";
  readonly message: "";
  readonly data: {
    readonly conversation: Id;
    readonly call: Id;
  };
}

export type Notification =
  | CommunityNotification
  | ConversationNotification
  | ConversationCallNotification;

export type CallTarget =
  | { readonly kind: "channel"; readonly id: Id }
  | { readonly kind: "conversation"; readonly id: Id };

export interface CallTargetDescriptor {
  readonly target: CallTarget;
  readonly name: string;
  readonly href: string;
}

export interface CallJoin {
  readonly domain: string;
  readonly url: string;
  readonly roomName: string;
  readonly jwt: string;
  readonly displayName: string;
  readonly avatarUrl: string;
  readonly canSpeak: boolean;
  readonly canStreamVideo: boolean;
  readonly canMuteMembers: boolean;
  readonly canRemoveMembers: boolean;
  readonly expiresAt: IsoDate;
}

export interface CallRoomRecord {
  readonly id: Id;
  readonly channel: Id;
  readonly conversation: Id;
  readonly created: IsoDate;
  readonly updated: IsoDate;
}

export interface CallSessionRecord {
  readonly id: Id;
  readonly room: Id;
  readonly startedBy: Id;
  readonly endedAt: IsoDate;
  readonly created: IsoDate;
  readonly updated: IsoDate;
  readonly expand?: {
    readonly room?: CallRoomRecord;
  };
}

export interface CallParticipantRecord {
  readonly id: Id;
  readonly call: Id;
  readonly user: Id;
  readonly joinedAt: IsoDate;
  readonly leftAt: IsoDate;
  readonly expiresAt: IsoDate;
  readonly muted: boolean;
  readonly serverMuted: boolean;
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
