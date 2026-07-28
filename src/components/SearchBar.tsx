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

interface Props {
  search: string
  onSearch: (value: string) => void
  stackFilter: Stack | 'all'
  onStackFilter: (value: Stack | 'all') => void
}

export default function SearchBar({ search, onSearch, stackFilter, onStackFilter }: Props) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 focus-within:border-accent">
        <Search size={16} className="text-muted" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar projeto…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>
      <select
        value={stackFilter}
        onChange={(e) => onStackFilter(e.target.value as Stack | 'all')}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {stacks.map((s) => (
          <option key={s} value={s}>
            {s === 'all' ? 'Todas as stacks' : s}
          </option>
        ))}
      </select>
    </div>
  )
}
