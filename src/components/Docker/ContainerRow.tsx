import { Play, RotateCw, Square, HardDrive } from 'lucide-react'
import type { DockerContainerInfo } from '../../types'
import { usePressAnimation } from '../../lib/motion'

export const COL_TEMPLATE = '20px 10px minmax(0,1fr) 160px 90px 150px 136px'

interface Props {
  container: DockerContainerInfo
  indent?: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onShowMounts: () => void
}

export function stateColor(state: DockerContainerInfo['state']): string {
  if (state === 'running') return 'bg-accent'
  if (state === 'restarting') return 'bg-amber-400'
  return 'bg-neutral-600'
}

export function stateLabel(state: DockerContainerInfo['state']): string {
  if (state === 'running') return 'Running'
  if (state === 'exited') return 'Exited'
  if (state === 'created') return 'Created'
  if (state === 'paused') return 'Paused'
  if (state === 'restarting') return 'Restarting'
  if (state === 'dead') return 'Dead'
  return 'Unknown'
}

export default function ContainerRow({ container, indent = false, onStart, onStop, onRestart, onShowMounts }: Props) {
  const startBtn = usePressAnimation<HTMLButtonElement>()
  const stopBtn = usePressAnimation<HTMLButtonElement>()
  const restartBtn = usePressAnimation<HTMLButtonElement>()
  const mountsBtn = usePressAnimation<HTMLButtonElement>()
  const running = container.state === 'running'
  const displayName = container.composeService ?? container.name

  return (
    <div
      className="grid items-center gap-x-2 rounded-md px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
      style={{ gridTemplateColumns: COL_TEMPLATE }}
    >
      {/* chevron slot — indent spacer for children */}
      <div className={indent ? 'flex justify-center' : ''}>
        {indent && <div className="h-full w-px bg-border" />}
      </div>

      {/* status dot */}
      <span className={`h-2 w-2 rounded-full shrink-0 ${stateColor(container.state)}`} />

      {/* name */}
      <div className="min-w-0">
        <p className="truncate text-sm">{displayName}</p>
        {indent && container.name !== displayName && (
          <p className="truncate text-[11px] text-muted">{container.name}</p>
        )}
      </div>

      {/* image */}
      <p className="truncate text-xs text-muted">{container.image}</p>

      {/* state */}
      <span className={`text-xs ${running ? 'text-accent' : 'text-muted'}`}>
        {stateLabel(container.state)}
      </span>

      {/* ports */}
      <p className="truncate text-xs text-muted">{container.ports || '—'}</p>

      {/* actions */}
      <div className="flex items-center justify-end gap-1">
        <button
          ref={mountsBtn.ref}
          onPointerDown={mountsBtn.onPointerDown}
          onPointerUp={mountsBtn.onPointerUp}
          onPointerLeave={mountsBtn.onPointerLeave}
          onClick={onShowMounts}
          title="Ver mounts"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none"
        >
          <HardDrive size={12} />
        </button>
        <button
          ref={startBtn.ref}
          onPointerDown={startBtn.onPointerDown}
          onPointerUp={startBtn.onPointerUp}
          onPointerLeave={startBtn.onPointerLeave}
          onClick={onStart}
          disabled={running}
          title="Start"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent/15 text-accent transition-colors hover:bg-accent/25 focus-visible:outline-none disabled:opacity-30"
        >
          <Play size={12} />
        </button>
        <button
          ref={stopBtn.ref}
          onPointerDown={stopBtn.onPointerDown}
          onPointerUp={stopBtn.onPointerUp}
          onPointerLeave={stopBtn.onPointerLeave}
          onClick={onStop}
          disabled={!running}
          title="Stop"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-500/15 text-red-400 transition-colors hover:bg-red-500/25 focus-visible:outline-none disabled:opacity-30"
        >
          <Square size={12} />
        </button>
        <button
          ref={restartBtn.ref}
          onPointerDown={restartBtn.onPointerDown}
          onPointerUp={restartBtn.onPointerUp}
          onPointerLeave={restartBtn.onPointerLeave}
          onClick={onRestart}
          title="Restart"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none"
        >
          <RotateCw size={12} />
        </button>
      </div>
    </div>
  )
}
