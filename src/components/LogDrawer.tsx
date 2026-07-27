import { useEffect, useRef, useState } from 'react'
import { ArrowDown, SquareTerminal, Trash2, X } from 'lucide-react'
import type { LogLine } from '../types'

const MAX_CLIENT_LINES = 2000

interface Props {
  projectId: string
  projectName: string
  projectPath: string
  onClose: () => void
}

export default function LogDrawer({ projectId, projectName, projectPath, onClose }: Props) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [atBottom, setAtBottom] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLines([])
    window.api.getLogBuffer(projectId).then((buffer) => {
      if (!cancelled) setLines(buffer)
    })
    const off = window.api.onLog((id, chunk, stream) => {
      if (id !== projectId) return
      const newLines: LogLine[] = chunk
        .split(/\r?\n/)
        .filter((text) => text.length > 0)
        .map((text) => ({ text, stream }))
      setLines((current) => [...current, ...newLines].slice(-MAX_CLIENT_LINES))
    })
    return () => {
      cancelled = true
      off()
    }
  }, [projectId])

  useEffect(() => {
    if (atBottom) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines, atBottom])

  const handleScroll = (): void => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  const clear = (): void => {
    window.api.clearLogBuffer(projectId)
    setLines([])
  }

  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-border bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted">{projectName} — logs</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.api.openInTerminal(projectPath)}
            title="Abrir em terminal externo"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-border hover:text-white"
          >
            <SquareTerminal size={14} />
          </button>
          <button
            onClick={clear}
            title="Limpar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-border hover:text-white"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            title="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-border hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-5"
      >
        {lines.length === 0 ? (
          <p className="text-muted">Sem logs. Rode o projeto pra ver a saída aqui.</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={line.stream === 'stderr' ? 'text-red-400' : 'text-neutral-300'}>
              {line.text}
            </div>
          ))
        )}
      </div>

      {!atBottom && (
        <button
          onClick={() => {
            setAtBottom(true)
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
          }}
          className="absolute right-6 bottom-6 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lg"
          title="Ir para o fim"
        >
          <ArrowDown size={14} />
        </button>
      )}
    </div>
  )
}
