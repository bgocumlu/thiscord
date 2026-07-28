import {
  defaultMemberPermissions,
  permissionImplications,
  permissionDefinitions,
  permissions,
} from "./policies.generated.js";

export {
  channelCapabilities,
  channelKinds,
  defaultMemberPermissions,
  permissionDefinitions,
  permissionGroups,
  permissionImplications,
  permissionRestrictions,
  permissions,
  policyLimits,
  policyManifest,
  transientTimings,
} from "./policies.generated.js";

export type Permission = (typeof permissionDefinitions)[number]["id"];

export function hasPermission(granted: readonly Permission[], permission: Permission): boolean {
  return (
    permissionImplications.administrator === "*"
    && granted.includes("administrator")
  ) || granted.includes(permission);
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
