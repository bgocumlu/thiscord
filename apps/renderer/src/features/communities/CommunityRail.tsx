import type { Community } from '@thiscord/shared'
import { MessageSquareText, Plus } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { usePocketBase } from '../../lib/contexts'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function CommunityRail({
  communities,
  activeId,
  directActive,
  onOpenDirect,
  onSelect,
  onAdd,
}: {
  readonly communities: Community[]
  readonly activeId: string
  readonly directActive: boolean
  readonly onOpenDirect: () => void
  readonly onSelect: (community: Community) => void
  readonly onAdd: () => void
}) {
  const client = usePocketBase()
  return (
    <nav className="server-rail" aria-label="Communities">
      <button className={`server-button direct-button ${directActive ? 'active' : ''}`} type="button" title="Direct messages" aria-current={directActive ? 'page' : undefined} onClick={onOpenDirect}>
        <MessageSquareText size={22} strokeWidth={1.9} />
      </button>
      <span className="rail-divider" />
      {communities.map((community) => {
        const icon = community.icon
          ? client.files.getURL(community as unknown as RecordModel, community.icon, { thumb: '128x128' })
          : ''
        return (
          <button
            className={`server-button ${community.id === activeId ? 'active' : ''}`}
            type="button"
            key={community.id}
            title={community.name}
            aria-current={community.id === activeId ? 'page' : undefined}
            onClick={() => onSelect(community)}
          >
            {icon ? (
              <img src={icon} alt="" width="128" height="128" decoding="async" />
            ) : <span>{initials(community.name)}</span>}
          </button>
        )
      })}
      <button className="server-button utility-button" type="button" title="Add a community" onClick={onAdd}>
        <Plus size={21} />
      </button>
    </nav>
  )
}
