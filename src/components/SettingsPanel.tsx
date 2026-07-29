import { useEffect, useState } from 'react'

interface Props {
  editorCommand: string
  onUpdateEditor: (command: string) => Promise<void>
}

export default function SettingsPanel({ editorCommand, onUpdateEditor }: Props) {
  const [editor, setEditor] = useState(editorCommand)

  useEffect(() => setEditor(editorCommand), [editorCommand])

  const saveEditor = async (): Promise<void> => {
    if (editor.trim() && editor !== editorCommand) {
      await onUpdateEditor(editor.trim())
    }
  }

  return (
    <div className="max-w-md">
      <section>
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
    </div>
  )
}
