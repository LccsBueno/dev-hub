import { useEffect, useState } from 'react'
import { AlertTriangle, FolderPlus, RefreshCw, Trash2 } from 'lucide-react'
import type { Config, RootFolderStatus } from '../types'
import { usePressAnimation } from '../lib/motion'

interface Props {
  config: Config
  scanning: boolean
  onUpdateRoots: (folders: string[]) => Promise<void>
  onUpdateEditor: (command: string) => Promise<void>
  onRescan: () => Promise<void>
}

function RemoveFolderButton({ onRemove }: { onRemove: () => void }) {
  const press = usePressAnimation<HTMLButtonElement>()
  return (
    <button
      ref={press.ref}
      onPointerDown={press.onPointerDown}
      onPointerUp={press.onPointerUp}
      onPointerLeave={press.onPointerLeave}
      onClick={onRemove}
      title="Remover"
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-red-400 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
    >
      <Trash2 size={14} />
    </button>
  )
}

export default function SettingsPanel({
  config,
  scanning,
  onUpdateRoots,
  onUpdateEditor,
  onRescan
}: Props) {
  const [rootStatus, setRootStatus] = useState<RootFolderStatus[]>([])
  const [editor, setEditor] = useState(config.editorCommand)
  const addFolderPress = usePressAnimation<HTMLButtonElement>()
  const rescanPress = usePressAnimation<HTMLButtonElement>()

  useEffect(() => setEditor(config.editorCommand), [config.editorCommand])

  useEffect(() => {
    window.api.checkRootFolders().then(setRootStatus)
  }, [config.rootFolders])

  const addFolder = async (): Promise<void> => {
    const picked = await window.api.pickFolder()
    if (picked && !config.rootFolders.includes(picked)) {
      await onUpdateRoots([...config.rootFolders, picked])
    }
  }

  const removeFolder = async (path: string): Promise<void> => {
    await onUpdateRoots(config.rootFolders.filter((f) => f !== path))
  }

  const saveEditor = async (): Promise<void> => {
    if (editor.trim() && editor !== config.editorCommand) {
      await onUpdateEditor(editor.trim())
    }
  }

  return (
    <div className="max-w-2xl">
      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold">Pastas-raiz</h2>
        <p className="mb-4 text-xs text-muted">
          O scan procura projetos nas subpastas diretas de cada pasta-raiz.
        </p>
        <div className="flex flex-col gap-2">
          {config.rootFolders.map((folder) => {
            const status = rootStatus.find((s) => s.path === folder)
            const missing = status !== undefined && !status.exists
            return (
              <div
                key={folder}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="flex items-center gap-2 font-mono text-xs">
                  {missing && (
                    <span title="Pasta não encontrada no disco">
                      <AlertTriangle size={14} className="text-amber-400" />
                    </span>
                  )}
                  {folder}
                </span>
                <RemoveFolderButton onRemove={() => removeFolder(folder)} />
              </div>
            )
          })}
        </div>
        <button
          ref={addFolderPress.ref}
          onPointerDown={addFolderPress.onPointerDown}
          onPointerUp={addFolderPress.onPointerUp}
          onPointerLeave={addFolderPress.onPointerLeave}
          onClick={addFolder}
          className="mt-3 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
        >
          <FolderPlus size={16} />
          Adicionar pasta
        </button>
      </section>

      <section className="mb-10">
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
        <h2 className="mb-4 text-sm font-semibold">Scan</h2>
        <button
          ref={rescanPress.ref}
          onPointerDown={rescanPress.onPointerDown}
          onPointerUp={rescanPress.onPointerUp}
          onPointerLeave={rescanPress.onPointerLeave}
          onClick={onRescan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-50"
        >
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Escaneando…' : 'Escanear agora'}
        </button>
      </section>
    </div>
  )
}
