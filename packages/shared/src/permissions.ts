export const permissions = [
  "administrator",
  "manage_community",
  "manage_channels",
  "manage_roles",
  "manage_messages",
  "manage_members",
  "view_audit_log",
  "create_invites",
  "view_channels",
  "send_messages",
  "read_history",
  "add_reactions",
  "attach_files",
  "embed_links",
  "mention_everyone",
  "connect_voice",
  "speak",
  "stream_video",
  "mute_members",
] as const;

export type Permission = (typeof permissions)[number];

export const defaultMemberPermissions: readonly Permission[] = [
  "create_invites",
  "view_channels",
  "send_messages",
  "read_history",
  "add_reactions",
  "attach_files",
  "embed_links",
  "connect_voice",
  "speak",
  "stream_video",
];

export function hasPermission(granted: readonly Permission[], permission: Permission): boolean {
  return granted.includes("administrator") || granted.includes(permission);
}

export function resolvePermissions(
  roles: readonly Pick<RolePermissionSource, "permissions" | "position">[],
  overwrites: readonly PermissionOverwrite[] = [],
): Permission[] {
  const resolved = new Set<Permission>();
  const sortedRoles = [...roles].sort((left, right) => left.position - right.position);

  for (const role of sortedRoles) {
    for (const permission of role.permissions) resolved.add(permission);
  }

  for (const overwrite of overwrites) {
    for (const permission of overwrite.deny) resolved.delete(permission);
    for (const permission of overwrite.allow) resolved.add(permission);
  }

  return [...resolved];
}

export interface RolePermissionSource {
  readonly permissions: readonly Permission[];
  readonly position: number;
}

export interface PermissionOverwrite {
  readonly allow: readonly Permission[];
  readonly deny: readonly Permission[];
}
