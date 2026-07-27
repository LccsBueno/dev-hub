import { LayoutGrid, Settings } from 'lucide-react'

export type View = 'projects' | 'settings'

interface Props {
  view: View
  onChange: (view: View) => void
}

const items: { view: View; label: string; icon: typeof LayoutGrid }[] = [
  { view: 'projects', label: 'Projetos', icon: LayoutGrid },
  { view: 'settings', label: 'Configurações', icon: Settings }
]

export default function Sidebar({ view, onChange }: Props) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-bg px-3 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold">
          P
        </div>
        <span className="text-sm font-semibold">Project Manager</span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              view === v
                ? 'bg-card text-white'
                : 'text-muted hover:bg-card-hover hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
