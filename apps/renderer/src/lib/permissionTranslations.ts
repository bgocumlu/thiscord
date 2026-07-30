import type { Permission } from '@thiscord/shared'
import { t } from './i18n'

const permissionKeys = {
  administrator: 'permissions.labels.administrator',
  manage_community: 'permissions.labels.manageCommunity',
  manage_channels: 'permissions.labels.manageChannels',
  manage_roles: 'permissions.labels.manageRoles',
  manage_messages: 'permissions.labels.manageMessages',
  manage_members: 'permissions.labels.manageMembers',
  view_audit_log: 'permissions.labels.viewAuditLog',
  create_invites: 'permissions.labels.createInvites',
  view_channels: 'permissions.labels.viewChannels',
  send_messages: 'permissions.labels.sendMessages',
  read_history: 'permissions.labels.readMessageHistory',
  add_reactions: 'permissions.labels.addReactions',
  attach_files: 'permissions.labels.attachFiles',
  embed_links: 'permissions.labels.embedLinks',
  mention_everyone: 'permissions.labels.mentionEveryone',
  connect_voice: 'permissions.labels.connectToVoice',
  speak: 'permissions.labels.speak',
  stream_video: 'permissions.labels.streamVideo',
  mute_members: 'permissions.labels.muteMembers',
} as const satisfies Record<Permission, string>

const permissionGroupKeys = {
  administration: 'permissions.groups.administration',
  text: 'permissions.groups.text',
  voice: 'permissions.groups.voice',
} as const

export function permissionLabel(permission: Permission) {
  return t(permissionKeys[permission])
}

export function permissionGroupLabel(group: keyof typeof permissionGroupKeys) {
  return t(permissionGroupKeys[group])
}
