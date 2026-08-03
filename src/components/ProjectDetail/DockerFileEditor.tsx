import React, { useCallback, useEffect, useState } from 'react'
import type { ProjectConfig } from '../../types'

const MonacoEditor = React.lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.default }))
)

interface Props {
  projectId: string
  project: ProjectConfig
  fileLabel: string
  language: string
  emptyMessage: string
  read: (projectPath: string) => Promise<string | null>
  write: (projectPath: string, content: string) => Promise<void>
  generate: (project: ProjectConfig) => string
}

export default function DockerFileEditor({
  projectId,
  project,
  fileLabel,
  language,
  emptyMessage,
  read,
  write,
  generate
}: Props) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [fileExists, setFileExists] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dirty = content !== savedContent

  const load = useCallback(async (signal: { cancelled: boolean }) => {
    const existing = await read(project.path)
    if (signal.cancelled) return
    if (existing !== null) {
      setContent(existing)
      setSavedContent(existing)
      setFileExists(true)
    } else {
      setContent('')
      setSavedContent('')
      setFileExists(false)
    }
    setConfirmRegenerate(false)
  }, [project.path, read])

  useEffect(() => {
    const signal = { cancelled: false }
    load(signal)
    return () => { signal.cancelled = true }
  }, [load, projectId])

  const handleGenerate = (): void => {
    setContent(generate(project))
    setConfirmRegenerate(false)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setSaveError(null)
    try {
      await write(project.path, content)
      setSavedContent(content)
      setFileExists(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const showGenerateButton = !fileExists && content === ''
  const showRegenerateButton = fileExists || content !== ''

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{fileLabel}</span>
          {dirty && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-400">
              editado
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-30 focus-visible:outline-none"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      {saveError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[11px] text-red-400">
          Erro ao salvar: {saveError}
        </div>
      )}

      {/* editor */}
      <div className="min-h-0 flex-1">
        <React.Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Carregando editor…
            </div>
          }
        >
          {content === '' && !fileExists ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted">{emptyMessage}</p>
            </div>
          ) : (
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={content}
              onChange={(v) => setContent(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8, bottom: 8 }
              }}
            />
          )}
        </React.Suspense>
      </div>

      {/* footer */}
      <div className="border-t border-border px-4 py-2.5">
        {showGenerateButton && (
          <button
            onClick={handleGenerate}
            className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none"
          >
            Gerar template
          </button>
        )}
        {showRegenerateButton && !confirmRegenerate && (
          <button
            onClick={() => setConfirmRegenerate(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-white hover:text-white focus-visible:outline-none"
          >
            Regenerar template
          </button>
        )}
        {confirmRegenerate && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">O conteúdo atual será perdido. Confirmar?</span>
            <button
              onClick={handleGenerate}
              className="rounded px-2 py-1 text-xs text-accent hover:underline focus-visible:outline-none"
            >
              Sim
            </button>
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="rounded px-2 py-1 text-xs text-muted hover:text-white focus-visible:outline-none"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
