import ProjectCard from './ProjectCard'
import type { ProjectConfig } from '../types'

interface Props {
  projects: Record<string, ProjectConfig>
  running: Record<string, number>
  onSelect: (id: string) => void
  onCommandChange: (id: string, command: string) => void
  onTogglePinned: (id: string, pinned: boolean) => void
}

export default function ProjectGrid({
  projects,
  running,
  onSelect,
  onCommandChange,
  onTogglePinned
}: Props) {
  const entries = Object.entries(projects).sort(([, a], [, b]) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  if (entries.length === 0) {
    return <p className="mt-12 text-center text-sm text-muted">Nenhum projeto encontrado por aqui.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {entries.map(([id, project]) => (
        <ProjectCard
          key={id}
          id={id}
          project={project}
          runningSince={running[id]}
          onSelect={onSelect}
          onCommandChange={onCommandChange}
          onTogglePinned={onTogglePinned}
        />
      ))}
    </div>
  )
}
