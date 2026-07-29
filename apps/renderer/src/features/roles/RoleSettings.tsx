import type { Community, Permission, Role } from '@thiscord/shared'
import { permissionDefinitions, policyLimits } from '@thiscord/shared'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { roleApi } from './api'
import { manageableRoles } from './hierarchy'

export function RoleSettings({
  community,
  roles,
  permissions,
  highestRolePosition,
  owner,
  onChanged,
}: {
  readonly community: Community
  readonly roles: Role[]
  readonly permissions: ReadonlySet<Permission>
  readonly highestRolePosition: number
  readonly owner: boolean
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editable = useMemo(
    () => manageableRoles(roles, highestRolePosition, owner),
    [highestRolePosition, owner, roles],
  )
  const effectiveSelectedId = editable.some((role) => role.id === selectedId)
    ? selectedId
    : editable[0]?.id ?? ''
  const selected = editable.find((role) => role.id === effectiveSelectedId)
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    setBusy(true)
    setError('')
    const data = new FormData(form)
    try {
      const role = await roleApi.create(client, community.id, {
        name: data.get('name'),
        color: data.get('color'),
        permissions: [],
      })
      await onChanged()
      setSelectedId(role.id)
      form.reset()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const move = async (role: Role, direction: -1 | 1) => {
    const ordered = editable.toSorted((left, right) => right.position - left.position)
    const index = ordered.findIndex((item) => item.id === role.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBusy(true)
    setError('')
    try {
      await roleApi.order(client, community.id, next.map((item) => item.id))
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="roles-settings">
      <form className="role-create" onSubmit={(event) => void create(event)}>
        <label><span>Role name</span><input name="name" required maxLength={policyLimits.role.nameMax} /></label>
        <input name="color" type="color" defaultValue="#aeb4c0" aria-label="Role color" />
        <button className="primary-action" type="submit" disabled={busy}>
          <Plus size={15} />{busy ? 'Working…' : 'Create'}
        </button>
      </form>
      <div className="role-layout">
        <nav aria-label="Community roles">
          {roles.map((role) => {
            const ordered = editable.toSorted((left, right) => right.position - left.position)
            const index = ordered.findIndex((item) => item.id === role.id)
            return (
              <div className="role-nav-row" key={role.id}>
                <button
                  className={effectiveSelectedId === role.id ? 'active' : ''}
                  type="button"
                  aria-pressed={effectiveSelectedId === role.id}
                  disabled={role.managed || index < 0}
                  onClick={() => {
                    setSelectedId(role.id)
                    setError('')
                  }}
                >
                  <i style={{ background: role.color }} />{role.name}
                  {role.managed ? <small>managed</small> : null}
                </button>
                {!role.managed ? (
                  <span>
                    <button type="button" aria-label={`Move ${role.name} up`} disabled={busy || index <= 0} onClick={() => void move(role, -1)}><ChevronUp size={13} /></button>
                    <button type="button" aria-label={`Move ${role.name} down`} disabled={busy || index < 0 || index >= ordered.length - 1} onClick={() => void move(role, 1)}><ChevronDown size={13} /></button>
                  </span>
                ) : null}
              </div>
            )
          })}
        </nav>
        {selected ? (
          <RoleEditor role={selected} permissions={permissions} onChanged={onChanged} key={selected.id} />
        ) : <p>Select an editable role.</p>}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  )
}

function RoleEditor({
  role,
  permissions,
  onChanged,
}: {
  readonly role: Role
  readonly permissions: ReadonlySet<Permission>
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editablePermissionDefinitions = permissionDefinitions.filter(
    (permission) => permissions.has('administrator') || permissions.has(permission.id),
  )
  const assignedPermissions = new Set(role.permissions)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await roleApi.update(client, role.id, {
        name: data.get('name'),
        color: data.get('color'),
        hoist: data.get('hoist') === 'on',
        mentionable: data.get('mentionable') === 'on',
        permissions: data.getAll('permissions'),
        editedPermissions: editablePermissionDefinitions.map((permission) => permission.id),
      })
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (busy || !window.confirm(`Delete the ${role.name} role?`)) return
    setBusy(true)
    try {
      await roleApi.remove(client, role.id)
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="role-editor" onSubmit={(event) => void submit(event)}>
      <div className="role-fields">
        <input name="name" aria-label="Role name" defaultValue={role.name} required maxLength={policyLimits.role.nameMax} />
        <input name="color" type="color" defaultValue={role.color || '#aeb4c0'} aria-label="Role color" />
      </div>
      <div className="permission-grid">
        {editablePermissionDefinitions
          .map((permission) => (
            <label key={permission.id}>
              <input name="permissions" type="checkbox" value={permission.id} defaultChecked={assignedPermissions.has(permission.id)} />
              <span>{permission.label}</span>
            </label>
          ))}
      </div>
      <label className="checkbox-line"><input name="hoist" type="checkbox" defaultChecked={role.hoist} /><span>Show separately in the member list</span></label>
      <label className="checkbox-line"><input name="mentionable" type="checkbox" defaultChecked={role.mentionable} /><span>Allow members to mention this role</span></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="role-actions">
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save role'}</button>
        <button className="danger-action" type="button" disabled={busy} onClick={() => void remove()}>Delete role</button>
      </div>
    </form>
  )
}
