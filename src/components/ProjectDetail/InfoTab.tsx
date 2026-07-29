import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { dockerRunCommand } from '../../lib/dockerCommand'
import { stackColors } from '../../lib/stackColors'

interface Props {
  projectId: string
  project: ProjectConfig
  allTags: string[]
  tagColors: Record<string, string>
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
  onRunModeChange: (id: string, runMode: RunMode) => void
}

export default function InfoTab({
  projectId,
  project,
  allTags,
  tagColors,
  onCommandChange,
  onTagsChange,
  onRunModeChange
}: Props) {
  const [command, setCommand] = useState(project.runCommand)
  const [showTagPicker, setShowTagPicker] = useState(false)

  useEffect(() => setCommand(project.runCommand), [project.runCommand])
  useEffect(() => setShowTagPicker(false), [projectId])

  const saveCommand = (): void => {
    if (command !== project.runCommand) onCommandChange(projectId, command)
  }

  const addTag = (tag: string): void => {
    if (!project.tags.includes(tag)) {
      onTagsChange(projectId, [...project.tags, tag])
    }
  }

  const removeTag = (tag: string): void => {
    onTagsChange(projectId, project.tags.filter((t) => t !== tag))
  }

  const availableTags = allTags.filter((t) => !project.tags.includes(t))

  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Stack</h3>
        {(() => {
          const color = stackColors[project.stack]
          return (
            <span
              style={
                color
                  ? {
                      backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
                      color,
                      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`
                    }
                  : undefined
              }
              className={`inline-block rounded-full border px-2 py-0.5 text-xs ${color ? '' : 'border-border text-muted'}`}
            >
              {project.stack}
            </span>
          )
        })()}
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
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    color ? '' : 'bg-card text-neutral-300'
                  }`}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    title={`Remover ${tag}`}
                    className="rounded-full text-current opacity-60 hover:opacity-100 hover:text-red-400 focus-visible:outline-none"
                  >
                    <X size={10} />
                  </button>
                </span>
              )
            })}
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              title="Adicionar tag"
              className={`flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                showTagPicker
                  ? 'border-accent text-accent'
                  : 'border-muted text-muted hover:border-white hover:text-white'
              }`}
            >
              <Plus size={10} />
            </button>
          </div>

          {showTagPicker && (
            <div className="mt-3 border-t border-border pt-3">
              {availableTags.length === 0 ? (
                <p className="text-[11px] text-muted">
                  {allTags.length === 0
                    ? 'Crie tags em Configurações.'
                    : 'Todas as tags já adicionadas.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const color = tagColors[tag] ?? '#8f8f8f'
                    return (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        style={{ borderColor: color, color }}
                        className="rounded-full border border-dashed px-2 py-0.5 text-xs transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
