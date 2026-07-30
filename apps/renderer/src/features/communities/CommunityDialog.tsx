import { t } from '../../lib/i18n'
import type { Community } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { useState, type FormEvent } from 'react'
import { ModalFrame } from '../../components/WorkspacePrimitives'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { communityApi } from './api'

export function CommunityDialog({ onClose, onCreated }: {
  readonly onClose: () => void
  readonly onCreated: (community: Community) => Promise<void>
}) {
  const client = usePocketBase()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      if (mode === 'create') {
        await onCreated(await communityApi.create(client, {
          name: data.get('name'),
          description: data.get('description'),
        }))
      } else {
        const code = String(data.get('code') || '').trim().replace(/^.*\//, '')
        const membership = await communityApi.acceptInvite(client, code)
        await onCreated(await client.collection('communities').getOne<Community>(membership.community))
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={mode === 'create' ? t("communities.dialog.createACommunity") : t("communities.dialog.joinACommunity")} onClose={onClose}>
      <div className="modal-tabs">
        <button className={mode === 'create' ? 'active' : ''} type="button" onClick={() => setMode('create')}>{t("communities.dialog.create")}</button>
        <button className={mode === 'join' ? 'active' : ''} type="button" onClick={() => setMode('join')}>{t("communities.dialog.join")}</button>
      </div>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        {mode === 'create' ? (
          <>
            <label><span>{t("communities.dialog.name")}</span><input name="name" required maxLength={policyLimits.community.nameMax} autoFocus /></label>
            <label><span>{t("communities.dialog.description")}</span><textarea name="description" maxLength={policyLimits.community.descriptionMax} rows={3} /></label>
          </>
        ) : <label><span>{t("communities.dialog.inviteCodeOrLink")}</span><input name="code" required autoFocus /></label>}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? t("communities.dialog.working") : mode === 'create' ? t("communities.dialog.createCommunity") : t("communities.dialog.joinCommunity")}
        </button>
      </form>
    </ModalFrame>
  )
}
