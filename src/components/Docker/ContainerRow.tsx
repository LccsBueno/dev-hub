import { Play, RotateCw, Square, HardDrive } from 'lucide-react'
import type { DockerContainerInfo } from '../../types'
import { usePressAnimation } from '../../lib/motion'

interface Props {
  container: DockerContainerInfo
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onShowMounts: () => void
}

function stateColor(state: DockerContainerInfo['state']): string {
  if (state === 'running') return 'bg-accent'
  if (state === 'restarting') return 'bg-amber-400'
  return 'bg-neutral-600'
}

function startedLabel(startedAt: string | null): string {
  if (!startedAt) return '—'
  const diff = Date.now() - new Date(startedAt).getTime()
  if (Number.isNaN(diff)) return '—'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}

export default function ContainerRow({ container, onStart, onStop, onRestart, onShowMounts }: Props) {
  const startBtn = usePressAnimation<HTMLButtonElement>()
  const stopBtn = usePressAnimation<HTMLButtonElement>()
  const restartBtn = usePressAnimation<HTMLButtonElement>()
  const mountsBtn = usePressAnimation<HTMLButtonElement>()
  const running = container.state === 'running'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${stateColor(container.state)}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{container.name}</p>
        <p className="truncate text-xs text-muted">{container.image}</p>
      </div>
      <div className="hidden shrink-0 text-xs text-muted @md:block">{container.ports || '—'}</div>
      <div className="hidden shrink-0 text-xs text-muted @md:block">{startedLabel(container.startedAt)}</div>
      <button
        ref={mountsBtn.ref}
        onPointerDown={mountsBtn.onPointerDown}
        onPointerUp={mountsBtn.onPointerUp}
        onPointerLeave={mountsBtn.onPointerLeave}
        onClick={onShowMounts}
        title="Ver mounts"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <HardDrive size={13} />
      </button>
      <button
        ref={startBtn.ref}
        onPointerDown={startBtn.onPointerDown}
        onPointerUp={startBtn.onPointerUp}
        onPointerLeave={startBtn.onPointerLeave}
        onClick={onStart}
        disabled={running}
        title="Start"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-30"
      >
        <Play size={13} />
      </button>
      <button
        ref={stopBtn.ref}
        onPointerDown={stopBtn.onPointerDown}
        onPointerUp={stopBtn.onPointerUp}
        onPointerLeave={stopBtn.onPointerLeave}
        onClick={onStop}
        disabled={!running}
        title="Stop"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 transition-colors hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-30"
      >
        <Square size={13} />
      </button>
      <button
        ref={restartBtn.ref}
        onPointerDown={restartBtn.onPointerDown}
        onPointerUp={restartBtn.onPointerUp}
        onPointerLeave={restartBtn.onPointerLeave}
        onClick={onRestart}
        title="Restart"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <RotateCw size={13} />
      </button>
    </div>
  )
}
