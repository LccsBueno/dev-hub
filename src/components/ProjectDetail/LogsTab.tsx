import { useEffect, useRef, useState } from 'react'
import { ArrowDown, SquareTerminal, Trash2 } from 'lucide-react'
import type { LogLine } from '../../types'

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b(?:\[[\d;?]*[A-Za-z]|[^[])/g

function cleanLine(text: string): string {
  return text
    .replace(ANSI_RE, '')
    .replace(/\\U([0-9a-fA-F]{8})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
}

const MAX_CLIENT_LINES = 2000

interface Props {
  projectId: string
  projectPath: string
}

export default function LogsTab({ projectId, projectPath }: Props) {
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
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-end gap-1 border-b border-border px-5 py-2">
        <button
          onClick={() => window.api.openInTerminal(projectPath)}
          title="Abrir em terminal externo"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <SquareTerminal size={14} />
        </button>
        <button
          onClick={clear}
          title="Limpar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-3 font-mono text-xs leading-5"
      >
        {lines.length === 0 ? (
          <p className="text-muted">Sem logs. Rode o projeto pra ver a saída aqui.</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={line.stream === 'stderr' ? 'text-red-400' : 'text-neutral-300'}>
              {cleanLine(line.text)}
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
          className="absolute right-5 bottom-5 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          title="Ir para o fim"
        >
          <ArrowDown size={14} />
        </button>
      )}
    </div>
  )
}
