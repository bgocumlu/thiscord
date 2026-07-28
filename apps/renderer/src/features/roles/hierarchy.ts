import type { Role } from '@thiscord/shared'

export function manageableRoles(
  roles: readonly Role[],
  highestRolePosition: number,
  owner: boolean,
) {
  return roles.filter((role) => (
    !role.managed && (owner || role.position < highestRolePosition)
  ))
}
