import { X } from 'lucide-react'
import type { DockerMount } from '../../types'

interface Props {
  containerName: string
  mounts: DockerMount[]
  onClose: () => void
}

export default function MountsModal({ containerName, mounts, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-96 max-w-[90vw] rounded-lg border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Mounts — {containerName}</h3>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-white focus-visible:outline-none"
          >
            <X size={16} />
          </button>
        </div>
        {mounts.length === 0 ? (
          <p className="text-xs text-muted">Nenhum mount configurado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {mounts.map((m, i) => (
              <div key={i} className="rounded-md border border-border bg-bg p-2 text-xs">
                <p className="mb-1 break-all text-neutral-300">{m.source}</p>
                <p className="break-all text-muted">→ {m.destination} ({m.mode})</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
