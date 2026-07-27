import { useEffect, useState } from 'react'
import { Code2, Folder, Play, Square } from 'lucide-react'
import type { ProjectConfig, Stack } from '../types'

const stackColors: Record<Stack, string> = {
  node: 'bg-green-500/15 text-green-400',
  maven: 'bg-orange-500/15 text-orange-400',
  gradle: 'bg-cyan-500/15 text-cyan-400',
  compose: 'bg-blue-500/15 text-blue-400',
  rust: 'bg-amber-500/15 text-amber-400',
  go: 'bg-sky-500/15 text-sky-400',
  python: 'bg-yellow-500/15 text-yellow-400',
  unknown: 'bg-neutral-500/15 text-neutral-400'
}

interface Props {
  id: string
  project: ProjectConfig
  runningSince?: number
  onSelect: (id: string) => void
  onCommandChange: (id: string, command: string) => void
}

function elapsedLabel(since: number, now: number): string {
  const minutes = Math.floor((now - since) / 60000)
  if (minutes < 1) return 'rodando agora'
  if (minutes < 60) return `rodando há ${minutes}m`
  return `rodando há ${Math.floor(minutes / 60)}h${minutes % 60}m`
}

export default function ProjectCard({ id, project, runningSince, onSelect, onCommandChange }: Props) {
  const running = runningSince !== undefined
  const [command, setCommand] = useState(project.runCommand)
  const [now, setNow] = useState(Date.now())

  useEffect(() => setCommand(project.runCommand), [project.runCommand])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [running])

  const saveCommand = (): void => {
    if (command !== project.runCommand) onCommandChange(id, command)
  }

  return (
    <div
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover ${
        project.missing ? 'opacity-40' : ''
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="truncate font-medium">{project.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${stackColors[project.stack]}`}>
          {project.stack}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-muted">
        <span
          className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-green-400' : 'bg-neutral-600'}`}
        />
        {project.missing ? 'pasta não encontrada' : running ? elapsedLabel(runningSince, now) : 'parado'}
      </div>

      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onBlur={saveCommand}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        onClick={(e) => e.stopPropagation()}
        placeholder="comando de run…"
        className="mb-4 w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent focus:text-white"
      />

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => (running ? window.api.stopProject(id) : window.api.runProject(id))}
          disabled={project.missing}
          title={running ? 'Parar' : 'Rodar'}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
            running
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              : 'bg-accent/15 text-accent hover:bg-accent/25'
          }`}
        >
          {running ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => window.api.openFolder(project.path)}
          disabled={project.missing}
          title="Abrir pasta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white disabled:opacity-30"
        >
          <Folder size={14} />
        </button>
        <button
          onClick={() => window.api.openInEditor(project.path)}
          disabled={project.missing}
          title="Abrir no editor"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white disabled:opacity-30"
        >
          <Code2 size={14} />
        </button>
      </div>
    </div>
  )
}
