import { Search } from 'lucide-react'
import type { Stack } from '../types'

const stacks: (Stack | 'all')[] = [
  'all',
  'node',
  'maven',
  'gradle',
  'compose',
  'rust',
  'go',
  'python',
  'unknown'
]

const stackLabels: Record<Stack | 'all', string> = {
  all: 'Todos',
  node: 'Node',
  maven: 'Maven',
  gradle: 'Gradle',
  compose: 'Compose',
  rust: 'Rust',
  go: 'Go',
  python: 'Python',
  unknown: 'Outro'
}

interface Props {
  search: string
  onSearch: (value: string) => void
  stackFilter: Stack | 'all'
  onStackFilter: (value: Stack | 'all') => void
}

export default function SearchBar({ search, onSearch, stackFilter, onStackFilter }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 focus-within:border-accent">
        <Search size={16} className="text-muted" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar projeto…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>
      <div role="group" aria-label="Filtrar por stack" className="flex flex-wrap gap-2">
        {stacks.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStackFilter(s)}
            aria-pressed={stackFilter === s}
            className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              stackFilter === s
                ? 'bg-accent/15 text-accent'
                : 'border border-border text-muted hover:text-white'
            }`}
          >
            {stackLabels[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
