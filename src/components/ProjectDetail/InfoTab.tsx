import { useEffect, useState } from 'react'
import { Check, Copy, FileText, Folder, Plus, X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { dockerRunCommand } from '../../lib/dockerCommand'
import { stackColors, stackTechs } from '../../lib/stackColors'

interface DirEntry {
  name: string
  isDir: boolean
}

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
  const [dirEntries, setDirEntries] = useState<DirEntry[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => setCommand(project.runCommand), [project.runCommand])
  useEffect(() => setShowTagPicker(false), [projectId])
  useEffect(() => {
    window.api.getDirTree(project.path).then(setDirEntries)
  }, [project.path])

  const saveCommand = (): void => {
    if (command !== project.runCommand) onCommandChange(projectId, command)
  }

  const copyPath = (): void => {
    navigator.clipboard.writeText(project.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
        <div className="flex flex-wrap gap-1.5">
          {(stackTechs[project.stack] ?? [{ label: project.stack, color: stackColors[project.stack] ?? '#94a3b8' }]).map((tech) => (
            <span
              key={tech.label}
              style={{
                backgroundColor: `color-mix(in srgb, ${tech.color} 18%, transparent)`,
                color: tech.color,
                borderColor: `color-mix(in srgb, ${tech.color} 45%, transparent)`
              }}
              className="inline-block rounded-full border px-2 py-0.5 text-xs"
            >
              {tech.label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Pasta</h3>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-xs break-all text-neutral-300">{project.path}</p>
          <button
            onClick={copyPath}
            title="Copiar caminho"
            className="mt-0.5 shrink-0 text-muted transition-colors hover:text-white focus-visible:outline-none"
          >
            {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
          </button>
        </div>
      </section>

      {dirEntries.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">Arquivos</h3>
          <div className="rounded-lg border border-border p-2.5">
            <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {dirEntries.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 rounded px-1 py-0.5">
                  {entry.isDir ? (
                    <Folder size={12} className="shrink-0 text-accent/70" />
                  ) : (
                    <FileText size={12} className="shrink-0 text-muted" />
                  )}
                  <span className={`truncate text-xs ${entry.isDir ? 'text-neutral-300' : 'text-muted'}`}>
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
