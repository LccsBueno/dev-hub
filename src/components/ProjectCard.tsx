import { useEffect, useState } from 'react'
import { Code2, Container, Folder, Play, Square, Star } from 'lucide-react'
import type { ProjectConfig } from '../types'
import { usePressAnimation } from '../lib/motion'

interface Props {
  id: string
  project: ProjectConfig
  runningSince?: number
  selected?: boolean
  onSelect: (id: string) => void
  onCommandChange: (id: string, command: string) => void
  onTogglePinned: (id: string, pinned: boolean) => void
}

function elapsedLabel(since: number, now: number): string {
  const minutes = Math.floor((now - since) / 60000)
  if (minutes < 1) return 'rodando agora'
  if (minutes < 60) return `rodando há ${minutes}m`
  return `rodando há ${Math.floor(minutes / 60)}h${minutes % 60}m`
}

export default function ProjectCard({
  id,
  project,
  runningSince,
  selected,
  onSelect,
  onCommandChange,
  onTogglePinned
}: Props) {
  const running = runningSince !== undefined
  const [command, setCommand] = useState(project.runCommand)
  const [now, setNow] = useState(Date.now())
  const runBtn = usePressAnimation<HTMLButtonElement>()
  const folderBtn = usePressAnimation<HTMLButtonElement>()
  const editorBtn = usePressAnimation<HTMLButtonElement>()
  const starBtn = usePressAnimation<HTMLButtonElement>()

  useEffect(() => setCommand(project.runCommand), [project.runCommand])

  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [running])

  const saveCommand = (): void => {
    if (command !== project.runCommand) onCommandChange(id, command)
  }

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative cursor-pointer rounded-2xl border p-5 transition-[background-color,box-shadow] ${
        running
          ? 'border-accent bg-accent/10 hover:bg-accent/15'
          : 'border-border bg-card hover:bg-card-hover hover:shadow-card-hover'
      } ${project.missing ? 'opacity-40' : ''} ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}
    >
      <button
        ref={starBtn.ref}
        onPointerDown={starBtn.onPointerDown}
        onPointerUp={starBtn.onPointerUp}
        onPointerLeave={starBtn.onPointerLeave}
        onClick={(e) => {
          e.stopPropagation()
          onTogglePinned(id, !project.pinned)
        }}
        title={project.pinned ? 'Remover dos favoritos' : 'Favoritar'}
        aria-pressed={project.pinned}
        type="button"
        className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
          project.pinned ? 'text-accent opacity-100' : 'text-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        }`}
      >
        <Star size={14} fill={project.pinned ? 'currentColor' : 'none'} />
      </button>

      <div className="mb-2 flex items-center gap-2 pr-7">
        <h3 className="truncate font-medium">{project.name}</h3>
        {project.runMode === 'docker' && (
          <span title="Modo Docker" className="shrink-0 rounded-full bg-blue-500/15 p-1 text-blue-400">
            <Container size={12} />
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {project.stack}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse bg-accent' : 'bg-neutral-600'}`}
        />
        {project.missing ? 'pasta não encontrada' : running ? elapsedLabel(runningSince, now) : 'parado'}
      </div>

      {project.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-neutral-400">
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="text-[11px] text-muted">+{project.tags.length - 3}</span>
          )}
        </div>
      )}

      {project.runMode === 'docker' ? (
        <p className="mb-4 truncate rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs text-muted">
          docker build && run
        </p>
      ) : (
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onBlur={saveCommand}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          onClick={(e) => e.stopPropagation()}
          placeholder="comando de run…"
          className="mb-4 w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent focus:text-white focus-visible:ring-2 focus-visible:ring-accent/50"
        />
      )}

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          ref={runBtn.ref}
          onPointerDown={runBtn.onPointerDown}
          onPointerUp={runBtn.onPointerUp}
          onPointerLeave={runBtn.onPointerLeave}
          onClick={() => (running ? window.api.stopProject(id) : window.api.runProject(id))}
          disabled={project.missing}
          title={running ? 'Parar' : 'Rodar'}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-30 ${
            running
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              : 'bg-accent/15 text-accent hover:bg-accent/25'
          }`}
        >
          {running ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button
          ref={folderBtn.ref}
          onPointerDown={folderBtn.onPointerDown}
          onPointerUp={folderBtn.onPointerUp}
          onPointerLeave={folderBtn.onPointerLeave}
          onClick={() => window.api.openFolder(project.path)}
          disabled={project.missing}
          title="Abrir pasta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-30"
        >
          <Folder size={14} />
        </button>
        <button
          ref={editorBtn.ref}
          onPointerDown={editorBtn.onPointerDown}
          onPointerUp={editorBtn.onPointerUp}
          onPointerLeave={editorBtn.onPointerLeave}
          onClick={() => window.api.openInEditor(project.path)}
          disabled={project.missing}
          title="Abrir no editor"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-30"
        >
          <Code2 size={14} />
        </button>
      </div>
    </div>
  )
}
