import { Pencil, Play, RotateCw, Square, Trash2 } from 'lucide-react'
import type { DockerGroup } from '../../types'

interface Props {
  groups: DockerGroup[]
  onRun: (groupId: string, action: 'start' | 'stop' | 'restart') => void
  onEdit: (group: DockerGroup) => void
  onDelete: (groupId: string) => void
  onCreate: () => void
}

export default function GroupList({ groups, onRun, onEdit, onDelete, onCreate }: Props) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted">Grupos</h2>
        <button
          onClick={onCreate}
          className="text-xs text-accent transition-opacity hover:opacity-80 focus-visible:outline-none"
        >
          + Novo grupo
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">Nenhum grupo salvo ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="truncate text-xs text-muted">{g.containerNames.join(' → ')}</p>
              </div>
              <button
                onClick={() => onRun(g.id, 'start')}
                title="Start grupo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent hover:bg-accent/25 focus-visible:outline-none"
              >
                <Play size={13} />
              </button>
              <button
                onClick={() => onRun(g.id, 'stop')}
                title="Stop grupo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 focus-visible:outline-none"
              >
                <Square size={13} />
              </button>
              <button
                onClick={() => onRun(g.id, 'restart')}
                title="Restart grupo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-white focus-visible:outline-none"
              >
                <RotateCw size={13} />
              </button>
              <button
                onClick={() => onEdit(g)}
                title="Editar grupo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-white focus-visible:outline-none"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(g.id)}
                title="Excluir grupo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-400 focus-visible:outline-none"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
