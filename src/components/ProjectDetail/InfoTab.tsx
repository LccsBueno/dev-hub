import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Copy, ExternalLink, FileText, Folder, Plus, X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { dockerRunCommand } from '../../lib/dockerCommand'
import { parseComposeHostPort } from '../../lib/composeTemplate'
import { primaryTech, techList } from '../../lib/stackColors'
import { animateInfoGridEnter } from '../../lib/motion'

interface DirEntry {
  name: string
  isDir: boolean
}

interface Props {
  projectId: string
  project: ProjectConfig
  isRunning: boolean
  allTags: string[]
  tagColors: Record<string, string>
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
  onRunModeChange: (id: string, runMode: RunMode) => void
}

function InfoCard({
  title,
  color,
  full = true,
  children
}: {
  title: string
  color: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-border bg-card p-3 pl-4 ${full ? 'col-span-2' : 'col-span-1'}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] transition-shadow duration-200 group-hover:shadow-[0_0_8px_currentColor]"
        style={{ backgroundColor: color, color }}
      />
      <h3 className="mb-2 text-[10px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </div>
  )
}

export default function InfoTab({
  projectId,
  project,
  isRunning,
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
  const [composeHostPort, setComposeHostPort] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => setCommand(project.runCommand), [project.runCommand])
  useEffect(() => setShowTagPicker(false), [projectId])
  useEffect(() => {
    window.api.getDirTree(project.path).then(setDirEntries)
  }, [project.path])

  useEffect(() => {
    if (project.runMode !== 'docker' || !project.hasDockerCompose) {
      setComposeHostPort(null)
      return
    }
    let cancelled = false
    window.api.readDockerCompose(project.path).then((content) => {
      if (cancelled) return
      setComposeHostPort(content ? parseComposeHostPort(content) : null)
    })
    return () => {
      cancelled = true
    }
  }, [project.path, project.runMode, project.hasDockerCompose])

  useEffect(() => {
    if (gridRef.current) animateInfoGridEnter(gridRef.current)
  }, [])

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
  const stackTech = primaryTech(project.framework, project.stack)
  const usingCompose = project.runMode === 'docker' && project.hasDockerCompose
  const displayPort = usingCompose && composeHostPort !== null ? composeHostPort : project.inferredPort

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-2.5 p-5">
      {isRunning && displayPort > 0 && (
        <InfoCard title="Porta" color="var(--color-accent)">
          <button
            onClick={() => window.api.openUrl(`http://localhost:${displayPort}`)}
            className="flex items-center gap-2 text-xs font-medium text-accent transition-opacity hover:opacity-80 focus-visible:outline-none"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            localhost:{displayPort}
            <ExternalLink size={11} className="opacity-60" />
          </button>
        </InfoCard>
      )}

      <InfoCard title="Stack" color={stackTech.color} full={false}>
        <div className="flex flex-wrap gap-1.5">
          {techList(project.framework, project.stack).map((tech) => (
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
      </InfoCard>

      {(project.hasDockerfile || project.hasDockerCompose) && (
        <InfoCard title="Modo de execução" color="#4da3ff" full={false}>
          <div className="flex gap-1 rounded-lg bg-bg p-1">
            <button
              onClick={() => onRunModeChange(projectId, 'native')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                project.runMode === 'native' ? 'bg-neutral-600/40 text-white' : 'text-muted hover:text-white'
              }`}
            >
              Nativo
            </button>
            <button
              onClick={() => onRunModeChange(projectId, 'docker')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                project.runMode === 'docker' ? 'bg-neutral-600/40 text-white' : 'text-muted hover:text-white'
              }`}
            >
              Docker
            </button>
          </div>
          {project.runMode === 'docker' && (
            <p className="mt-2 text-[11px] text-muted/70">
              {project.hasDockerCompose ? 'usa docker-compose.yml · play → up · stop → down' : 'build + run via Dockerfile'}
            </p>
          )}
        </InfoCard>
      )}

      <InfoCard title="Pasta" color="var(--color-muted)">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-xs break-all text-neutral-300 flex items-center gap-1.5">
            <Folder size={12} className="shrink-0 text-muted" />
            {project.path}
          </p>
          <button
            onClick={copyPath}
            title="Copiar caminho"
            className="mt-0.5 shrink-0 text-muted transition-colors hover:text-white focus-visible:outline-none"
          >
            {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
          </button>
        </div>
      </InfoCard>

      {dirEntries.length > 0 && (
        <InfoCard title="Arquivos" color="var(--color-muted)">
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
        </InfoCard>
      )}

      <InfoCard title="Comando de run" color="#a78bfa">
        {project.runMode === 'docker' ? (
          <p className="font-mono text-xs break-all text-muted">
            {usingCompose ? 'docker compose up' : dockerRunCommand(project, projectId)}
          </p>
        ) : (
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onBlur={saveCommand}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            placeholder="comando de run…"
            className="w-full rounded-md bg-bg px-2 py-1.5 font-mono text-xs text-muted outline-none focus:text-white"
          />
        )}
      </InfoCard>

      <InfoCard title="Tags" color="var(--color-accent)">
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
                  color ? '' : 'bg-bg text-neutral-300'
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
                {allTags.length === 0 ? 'Crie tags em Configurações.' : 'Todas as tags já adicionadas.'}
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
      </InfoCard>
    </div>
  )
}
