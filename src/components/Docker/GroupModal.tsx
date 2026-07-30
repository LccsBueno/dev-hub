import { useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import type { DockerContainerInfo, DockerGroup } from '../../types'
import { addContainerToGroup, removeContainerFromGroup, reorderGroup } from '../../lib/dockerGroups'

interface Props {
  group: DockerGroup | null
  availableContainers: DockerContainerInfo[]
  onSave: (group: DockerGroup) => void
  onClose: () => void
}

function emptyGroup(): DockerGroup {
  return { id: crypto.randomUUID(), name: '', containerNames: [] }
}

export default function GroupModal({ group, availableContainers, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<DockerGroup>(group ?? emptyGroup())

  const toggle = (name: string): void => {
    setDraft(
      draft.containerNames.includes(name)
        ? removeContainerFromGroup(draft, name)
        : addContainerToGroup(draft, name)
    )
  }

  const move = (index: number, dir: -1 | 1): void => {
    setDraft(reorderGroup(draft, index, index + dir))
  }

  const canSave = draft.name.trim().length > 0 && draft.containerNames.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[28rem] max-w-[90vw] rounded-lg border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">{group ? 'Editar grupo' : 'Novo grupo'}</h3>
          <button onClick={onClose} className="text-muted transition-colors hover:text-white focus-visible:outline-none">
            <X size={16} />
          </button>
        </div>

        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome do grupo"
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <p className="mb-2 text-xs font-medium text-muted">Containers disponíveis</p>
        <div className="mb-4 flex max-h-40 flex-col gap-1 overflow-y-auto">
          {availableContainers.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-border">
              <input
                type="checkbox"
                checked={draft.containerNames.includes(c.name)}
                onChange={() => toggle(c.name)}
              />
              {c.name}
            </label>
          ))}
        </div>

        {draft.containerNames.length > 0 && (
          <>
            <p className="mb-2 text-xs font-medium text-muted">Ordem de execução</p>
            <div className="mb-4 flex flex-col gap-1">
              {draft.containerNames.map((name, i) => (
                <div key={name} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <span className="flex-1">{i + 1}. {name}</span>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-muted hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === draft.containerNames.length - 1}
                    className="text-muted hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => onSave(draft)}
          disabled={!canSave}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Salvar grupo
        </button>
      </div>
    </div>
  )
}
