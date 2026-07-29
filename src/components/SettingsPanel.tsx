import { useEffect, useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import type { ProjectConfig } from '../types'

interface Props {
  editorCommand: string
  onUpdateEditor: (command: string) => Promise<void>
  projects: Record<string, ProjectConfig>
  tagColors: Record<string, string>
  onSetTagColor: (tag: string, color: string) => Promise<void>
  onDeleteTagColor: (tag: string) => Promise<void>
}

const DEFAULT_TAG_COLOR = '#8f8f8f'

export default function SettingsPanel({
  editorCommand,
  onUpdateEditor,
  projects,
  tagColors,
  onSetTagColor,
  onDeleteTagColor
}: Props) {
  const [editor, setEditor] = useState(editorCommand)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#78c091')

  useEffect(() => setEditor(editorCommand), [editorCommand])

  const saveEditor = async (): Promise<void> => {
    if (editor.trim() && editor !== editorCommand) {
      await onUpdateEditor(editor.trim())
    }
  }

  const usedTags = new Set(Object.values(projects).flatMap((p) => p.tags))
  const allTags = Array.from(new Set([...usedTags, ...Object.keys(tagColors)])).sort((a, b) =>
    a.localeCompare(b)
  )

  const addTag = async (): Promise<void> => {
    const name = newTagName.trim()
    if (!name) return
    await onSetTagColor(name, newTagColor)
    setNewTagName('')
  }

  return (
    <div className="max-w-md">
      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold">Editor</h2>
        <p className="mb-4 text-xs text-muted">
          Comando usado pelo botão "abrir no editor" (ex.: code, cursor).
        </p>
        <input
          value={editor}
          onChange={(e) => setEditor(e.target.value)}
          onBlur={saveEditor}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="w-64 rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
        />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Tags</h2>
        <p className="mb-4 text-xs text-muted">
          Defina uma cor para cada tag — facilita achar e filtrar projetos na grade.
        </p>

        {allTags.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {allTags.map((tag) => {
              const color = tagColors[tag] ?? DEFAULT_TAG_COLOR
              const hasCustomColor = tag in tagColors
              return (
                <div
                  key={tag}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onSetTagColor(tag, e.target.value)}
                    title="Escolher cor"
                    className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
                  />
                  <span className="flex-1 truncate text-sm">{tag}</span>
                  {hasCustomColor && (
                    <button
                      onClick={() => onDeleteTagColor(tag)}
                      title="Remover cor personalizada"
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            title="Cor da nova tag"
            className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
          />
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Nova tag…"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          <button
            onClick={addTag}
            type="button"
            title="Adicionar tag"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}
