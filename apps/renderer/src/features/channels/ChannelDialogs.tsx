import { t } from '../../lib/i18n'
import type {
  Channel,
  ChannelPermission,
  Community,
  Permission,
  Role,
} from '@thiscord/shared'
import {
  channelCapabilities,
  channelKinds,
  permissionDefinitions,
  permissionGroups,
  permissions,
  policyLimits,
} from '@thiscord/shared'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ModalFrame } from '../../components/WorkspacePrimitives'
import { useConfirmation } from '../../hooks/useConfirmation'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import {
  permissionGroupLabel,
  permissionLabel,
} from '../../lib/permissionTranslations'
import { memberApi } from '../members/api'
import { channelApi } from './api'
import { channelKeys } from './queryKeys'

const channelKindKeys = {
  text: 'channels.dialogs.kinds.text',
  announcement: 'channels.dialogs.kinds.announcement',
  voice: 'channels.dialogs.kinds.voice',
  category: 'channels.dialogs.kinds.category',
} as const satisfies Record<(typeof channelKinds)[number], string>

export function ChannelDialog({ community, parent, onClose, onCreated }: {
  readonly community: Community
  readonly parent: string
  readonly onClose: () => void
  readonly onCreated: (channel: Channel) => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const kind = String(data.get('kind') || 'text') as keyof typeof channelCapabilities
      const capabilities = channelCapabilities[kind]
      const input: {
        name: FormDataEntryValue | null
        kind: string
        topic?: FormDataEntryValue | null
        parent?: string
      } = {
        name: data.get('name'),
        kind,
      }
      if (capabilities?.topics) input.topic = data.get('topic')
      if (!capabilities?.container) input.parent = parent
      await onCreated(await channelApi.create(client, community.id, input))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={t("channels.dialogs.createChannel")} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>{t("channels.dialogs.type")}</span>
          <select name="kind" defaultValue="text">
            {channelKinds.map((kind) => (
              <option value={kind} key={kind}>{t(channelKindKeys[kind])}</option>
            ))}
          </select>
        </label>
        <label><span>{t("channels.dialogs.name")}</span><input name="name" required maxLength={policyLimits.channel.nameMax} /></label>
        <label><span>{t("channels.dialogs.topic")}</span><textarea name="topic" maxLength={policyLimits.channel.topicMax} rows={3} /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? t("channels.dialogs.creating") : t("channels.dialogs.createChannel")}
        </button>
      </form>
    </ModalFrame>
  )
}

export function ChannelSettingsDialog({
  community,
  channel,
  categories,
  roles,
  canReorder,
  permissions: effectivePermissions,
  onClose,
  onUpdated,
  onDeleted,
}: {
  readonly community: Community
  readonly channel: Channel
  readonly categories: Channel[]
  readonly roles: Role[]
  readonly canReorder: boolean
  readonly permissions: ReadonlySet<Permission>
  readonly onClose: () => void
  readonly onUpdated: () => Promise<void>
  readonly onDeleted: () => Promise<void>
}) {
  const client = usePocketBase()
  const settingsFields: readonly string[] = channelCapabilities[channel.kind].settingsFields
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { confirm, confirmation } = useConfirmation()
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const patch: Record<string, unknown> = {
        name: data.get('name'),
      }
      if (settingsFields.includes('topic')) patch.topic = data.get('topic')
      if (settingsFields.includes('parent')) patch.parent = data.get('parent')
      if (settingsFields.includes('slowmodeSeconds')) {
        patch.slowmodeSeconds = Number(data.get('slowmodeSeconds') || 0)
      }
      if (settingsFields.includes('nsfw')) patch.nsfw = data.get('nsfw') === 'on'
      await channelApi.update(client, channel.id, patch)
      await onUpdated()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    const prompt = channel.kind === 'category'
      ? t("channels.dialogs.deleteCategoryDescription", {
        name: channel.name,
      })
      : t("channels.dialogs.deleteNameThisCannotBeUndone", { name: channel.name })
    if (!await confirm({
      title: channel.kind === 'category' ? t("channels.dialogs.deleteCategoryTitle") : t("channels.dialogs.deleteChannelTitle"),
      description: prompt,
      confirmLabel: channel.kind === 'category' ? t("channels.dialogs.deleteCategoryAction") : t("channels.dialogs.deleteChannelAction"),
    })) return
    setBusy(true)
    setError('')
    try {
      await channelApi.remove(client, channel.id)
      await onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const move = async (direction: -1 | 1) => {
    setBusy(true)
    setError('')
    try {
      await channelApi.move(client, channel.id, direction)
      await onUpdated()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame
      title={t("channels.dialogs.settingsTitle", {
        kind: channel.kind === 'category'
          ? t("channels.dialogs.category")
          : t("channels.dialogs.channel"),
        communityName: community.name,
      })}
      onClose={onClose}
    >
      {canReorder ? (
        <div className="ordering-actions">
          <span>{t("channels.dialogs.channelPosition")}</span>
          <button
            className="secondary-action compact-action"
            type="button"
            disabled={busy}
            onClick={() => void move(-1)}
          ><ChevronUp size={15} />{t("channels.dialogs.moveUp")}</button>
          <button
            className="secondary-action compact-action"
            type="button"
            disabled={busy}
            onClick={() => void move(1)}
          ><ChevronDown size={15} />{t("channels.dialogs.moveDown")}</button>
        </div>
      ) : null}
      {effectivePermissions.has('manage_channels') ? (
        <form className="modal-form" onSubmit={(event) => void submit(event)}>
          <label><span>{t("channels.dialogs.name")}</span><input name="name" defaultValue={channel.name} required maxLength={policyLimits.channel.nameMax} /></label>
          {settingsFields.includes('topic') ? <label><span>{t("channels.dialogs.topic")}</span><textarea name="topic" defaultValue={channel.topic} maxLength={policyLimits.channel.topicMax} rows={3} /></label> : null}
          {settingsFields.includes('parent') ? (
            <label>
              <span>{t("channels.dialogs.category")}</span>
              <select name="parent" defaultValue={channel.parent}>
                <option value="">{t("channels.dialogs.noCategory")}</option>
                {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : null}
          {settingsFields.includes('slowmodeSeconds') ? <label><span>{t("channels.dialogs.slowModeSeconds")}</span><input name="slowmodeSeconds" type="number" min="0" max={policyLimits.channel.slowmodeSecondsMax} defaultValue={channel.slowmodeSeconds} /></label> : null}
          {settingsFields.includes('nsfw') ? <label className="checkbox-line"><input name="nsfw" type="checkbox" defaultChecked={channel.nsfw} /><span>{t("channels.dialogs.ageRestrictedChannel")}</span></label> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? t("channels.dialogs.saving") : t("channels.dialogs.saveKind", {
              kind: channel.kind === 'category'
                ? t("channels.dialogs.categoryLower")
                : t("channels.dialogs.channelLower"),
            })}
          </button>
        </form>
      ) : null}
      {effectivePermissions.has('manage_roles') ? (
        <ChannelPermissionsEditor
          channel={channel}
          roles={roles}
          effectivePermissions={effectivePermissions}
        />
      ) : null}
      {effectivePermissions.has('manage_channels') ? (
        <button className="danger-action modal-logout" type="button" onClick={() => void remove()} disabled={busy}>

          {channel.kind === 'category'
            ? t("channels.dialogs.deleteCategoryAction")
            : t("channels.dialogs.deleteChannelAction")}
        </button>
      ) : null}
      {confirmation}
    </ModalFrame>
  )
}

function ChannelPermissionsEditor({
  channel,
  roles,
  effectivePermissions,
}: {
  readonly channel: Channel
  readonly roles: Role[]
  readonly effectivePermissions: ReadonlySet<Permission>
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const [memberSearch, setMemberSearch] = useState('')
  const memberPages = useInfiniteQuery({
    queryKey: ['channel-permission-members', channel.community, memberSearch.trim()],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => memberApi.list(client, channel.community, {
      page: pageParam,
      query: memberSearch.trim(),
    }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  const memberships = useMemo(
    () => memberPages.data?.pages.flatMap((page) => page.items) ?? [],
    [memberPages.data],
  )
  const targets = useMemo(() => [
    ...roles.map((role) => ({
      key: `role:${role.id}`,
      type: 'role' as const,
      id: role.id,
      label: t("channels.dialogs.roleTarget", { roleName: role.name }),
    })),
    ...memberships.flatMap((membership) => {
      const user = membership.expand?.user
      return user ? [{
        key: `member:${membership.id}`,
        type: 'member' as const,
        id: membership.id,
        label: t("channels.dialogs.memberTarget", { memberName: user.displayName }),
      }] : []
    }),
  ], [memberships, roles])
  const [targetKey, setTargetKey] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState('')
  const effectiveTargetKey = targets.some((target) => target.key === targetKey)
    ? targetKey
    : targets[0]?.key ?? ''
  const overwrites = useQuery({
    queryKey: channelKeys.permissions(channel.id),
    queryFn: async () => (await channelApi.permissions(client, channel.id)).items as ChannelPermission[],
  })
  const selectedTarget = targets.find((target) => target.key === effectiveTargetKey)
  const selectedOverwrite = selectedTarget
    ? (overwrites.data ?? []).find((overwrite) => (
        overwrite.targetType === selectedTarget.type && overwrite.targetId === selectedTarget.id
      ))
    : undefined
  const supportedPermissionGroups = new Set(
    channelCapabilities[channel.kind].permissionGroups as readonly string[],
  )
  const allowedPermissions = new Set(selectedOverwrite?.allow ?? [])
  const deniedPermissions = new Set(selectedOverwrite?.deny ?? [])
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTarget || busy) return
    setBusy(true)
    setError('')
    setSaved(false)
    const data = new FormData(event.currentTarget)
    const editedPermissions = permissions.filter((permission) => data.has(permission))
    try {
      await channelApi.setPermissions(client, channel.id, {
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
        allow: editedPermissions.filter((permission) => data.get(permission) === 'allow'),
        deny: editedPermissions.filter((permission) => data.get(permission) === 'deny'),
        editedPermissions,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: channelKeys.permissions(channel.id) }),
        queryClient.invalidateQueries({ queryKey: channelKeys.all }),
        queryClient.invalidateQueries({ queryKey: channelKeys.effectivePermissionsAll }),
      ])
      setSaved(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="channel-permissions">
      <h3>{t("channels.dialogs.permissionOverrides")}</h3>
      <p>{t("channels.dialogs.permissionOverrideDescription")}</p>
      {targets.length ? (
        <>
          <label>
            <span>{t("channels.dialogs.findMemberTarget")}</span>
            <input
              type="search"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={t("channels.dialogs.searchMembers")}
            />
          </label>
          <label>
            <span>{t("channels.dialogs.roleOrMember")}</span>
            <select value={effectiveTargetKey} onChange={(event) => {
              setTargetKey(event.target.value)
              setSaved(false)
            }}>
              {targets.map((target) => <option value={target.key} key={target.key}>{target.label}</option>)}
            </select>
          </label>
          {memberPages.hasNextPage ? (
            <button
              className="secondary-action"
              type="button"
              disabled={memberPages.isFetchingNextPage}
              onClick={() => void memberPages.fetchNextPage()}
            >
              {memberPages.isFetchingNextPage ? t("channels.dialogs.loadingMembers") : t("channels.dialogs.loadMoreMembers")}
            </button>
          ) : null}
          {memberPages.isError ? <p className="form-error" role="alert">{t("channels.dialogs.couldNotLoadMemberTargets")}</p> : null}
          <label><span>{t("channels.dialogs.findPermission")}</span><input type="search" value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} placeholder={t("channels.dialogs.searchPermissions")} /></label>
          {selectedTarget ? (
            <form
              onSubmit={(event) => void save(event)}
              key={`${selectedTarget.key}:${selectedOverwrite?.id ?? ''}:${selectedOverwrite?.allow.join(',') ?? ''}:${selectedOverwrite?.deny.join(',') ?? ''}`}
            >
              {permissionGroups.flatMap((group) => {
                if (!supportedPermissionGroups.has(group.id)) {
                  return []
                }
                const visible = permissionDefinitions.filter((permission) => (
                  permission.group === group.id
                  && permission.channelOverride
                  && permission.id.includes(permissionSearch.toLowerCase().replace(/\s+/g, '_'))
                  && (effectivePermissions.has('administrator') || effectivePermissions.has(permission.id))
                ))
                return visible.length ? [
                  (
                    <fieldset className="permission-section" key={group.id}>
                      <legend>{permissionGroupLabel(group.id)}</legend>
                      <div className="permission-overwrite-grid">
                        {visible.map((permission) => (
                          <label key={permission.id}>
                            <span>{permissionLabel(permission.id)}</span>
                            <select
                              name={permission.id}
                              defaultValue={allowedPermissions.has(permission.id)
                                ? 'allow'
                                : deniedPermissions.has(permission.id) ? 'deny' : 'inherit'}
                            >
                              <option value="inherit">{t("channels.dialogs.inherit")}</option>
                              <option value="allow">{t("channels.dialogs.allow")}</option>
                              <option value="deny">{t("channels.dialogs.deny")}</option>
                            </select>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ),
                ] : []
              })}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {saved ? <p className="form-notice" role="status">{t("channels.dialogs.permissionOverridesSaved")}</p> : null}
              <div className="role-actions">
                <button className="primary-action" type="submit" disabled={busy}>
                  {busy ? t("channels.dialogs.saving") : t("channels.dialogs.savePermissionOverrides")}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={busy || !selectedOverwrite}
                  onClick={() => {
                    if (!selectedTarget || busy) return
                    setBusy(true)
                    setError('')
                    setSaved(false)
                    void channelApi.setPermissions(client, channel.id, {
                      targetType: selectedTarget.type,
                      targetId: selectedTarget.id,
                      allow: [],
                      deny: [],
                    }).then(async () => {
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: channelKeys.permissions(channel.id) }),
                        queryClient.invalidateQueries({ queryKey: channelKeys.all }),
                        queryClient.invalidateQueries({ queryKey: channelKeys.effectivePermissionsAll }),
                      ])
                      setSaved(true)
                    }).catch((caught) => {
                      setError(errorMessage(caught))
                    }).finally(() => {
                      setBusy(false)
                    })
                  }}
                >{t("channels.dialogs.resetOverride")}</button>
              </div>
            </form>
          ) : null}
        </>
      ) : <p>{t("channels.dialogs.noRolesOrMembersAreAvailable")}</p>}
    </section>
  )
}
