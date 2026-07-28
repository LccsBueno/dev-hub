import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { ProjectConfig, Stack } from '../../types'

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
  projectId: string
  project: ProjectConfig
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
}

export default function InfoTab({ projectId, project, onCommandChange, onTagsChange }: Props) {
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
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${stackColors[project.stack]}`}>
          {project.stack}
        </span>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Pasta</h3>
        <p className="text-xs break-all text-neutral-300">{project.path}</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Comando de run</h3>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onBlur={saveCommand}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="comando de run…"
          className="w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent focus:text-white"
        />
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Tags</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-xs text-neutral-300"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                title={`Remover ${tag}`}
                className="text-muted hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-full"
              >
                <X size={10} />
              </button>
            </span>
          ))}
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
