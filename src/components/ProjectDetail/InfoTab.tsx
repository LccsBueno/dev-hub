import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { dockerRunCommand } from '../../lib/dockerCommand'

interface Props {
  projectId: string
  project: ProjectConfig
  tagColors: Record<string, string>
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
  onRunModeChange: (id: string, runMode: RunMode) => void
}

export default function InfoTab({
  projectId,
  project,
  tagColors,
  onCommandChange,
  onTagsChange,
  onRunModeChange
}: Props) {
  const [command, setCommand] = useState(project.runCommand)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => setCommand(project.runCommand), [project.runCommand])

  const saveCommand = (): void => {
    if (command !== project.runCommand) onCommandChange(projectId, command)
  }

  const addTag = (): void => {
    const value = tagInput.trim()
    if (value && !project.tags.includes(value)) {
      onTagsChange(projectId, [...project.tags, value])
    }
    setTagInput('')
  }

  const removeTag = (tag: string): void => {
    onTagsChange(
      projectId,
      project.tags.filter((t) => t !== tag)
    )
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Stack</h3>
        <span className="inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {project.stack}
        </span>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Pasta</h3>
        <p className="text-xs break-all text-neutral-300">{project.path}</p>
      </section>

      {project.hasDockerfile && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">Modo de execução</h3>
          <div className="flex gap-1 rounded-lg border border-border bg-bg p-1">
            <button
              onClick={() => onRunModeChange(projectId, 'native')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                project.runMode === 'native' ? 'bg-card text-white' : 'text-muted hover:text-white'
              }`}
            >
              Nativo
            </button>
            <button
              onClick={() => onRunModeChange(projectId, 'docker')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                project.runMode === 'docker' ? 'bg-card text-white' : 'text-muted hover:text-white'
              }`}
            >
              Docker
            </button>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Comando de run</h3>
        {project.runMode === 'docker' ? (
          <p className="rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs break-all text-muted">
            {dockerRunCommand(project.path, projectId)}
          </p>
        ) : (
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onBlur={saveCommand}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            placeholder="comando de run…"
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent focus:text-white"
          />
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Tags</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => {
            const color = tagColors[tag]
            return (
              <span
                key={tag}
                style={
                  color
                    ? { backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }
                    : undefined
                }
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                  color ? '' : 'bg-bg text-neutral-300'
                }`}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  title={`Remover ${tag}`}
                  className="rounded-full text-current opacity-70 hover:opacity-100 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="Adicionar tag…"
          className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-xs outline-none focus:border-accent"
        />
      </section>
    </div>
  )
}
