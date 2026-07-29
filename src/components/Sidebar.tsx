import { useEffect, useState } from 'react'
import { AlertTriangle, Archive, LayoutGrid, Plus, Settings, Star, Trash2 } from 'lucide-react'
import { usePressAnimation } from '../lib/motion'
import { countProjectsUnderRoot, filterProjects, type NavFilter } from '../lib/filterProjects'
import type { ProjectConfig, RootFolderStatus } from '../types'

export type View = 'projects' | 'settings'

interface Props {
  view: View
  onViewChange: (view: View) => void
  nav: NavFilter
  onNavChange: (nav: NavFilter) => void
  selectedRoot: string | null
  onSelectRoot: (root: string | null) => void
  projects: Record<string, ProjectConfig>
  rootFolders: string[]
  runningIds: string[]
  onAddFolder: () => void
  onRemoveFolder: (folder: string) => void
}

function NavButton({
  active,
  label,
  icon: Icon,
  dot,
  count,
  onClick
}: {
  active: boolean
  label: string
  icon?: typeof LayoutGrid
  dot?: boolean
  count?: number
  onClick: () => void
}) {
  const press = usePressAnimation<HTMLButtonElement>()

  return (
    <button
      ref={press.ref}
      onPointerDown={press.onPointerDown}
      onPointerUp={press.onPointerUp}
      onPointerLeave={press.onPointerLeave}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none ${
        active ? 'bg-accent/15 text-accent' : 'text-neutral-300 hover:bg-card-hover hover:text-white'
      }`}
    >
      {dot ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] text-muted">{count}</span>
      )}
    </button>
  )
}

function DirectoryRow({
  folder,
  count,
  active,
  missing,
  onSelect,
  onRemove
}: {
  folder: string
  count: number
  active: boolean
  missing: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const selectPress = usePressAnimation<HTMLButtonElement>()

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-card-hover text-white' : 'text-neutral-300 hover:bg-card-hover hover:text-white'
      }`}
    >
      <button
        ref={selectPress.ref}
        onPointerDown={selectPress.onPointerDown}
        onPointerUp={selectPress.onPointerUp}
        onPointerLeave={selectPress.onPointerLeave}
        onClick={onSelect}
        className="flex-1 truncate text-left focus-visible:outline-none"
      >
        {folder.split(/[\\/]/).filter(Boolean).pop() ?? folder}
        {missing && (
          <AlertTriangle
            size={12}
            className="ml-1 inline-block shrink-0 text-amber-400"
            aria-label="Pasta não encontrada no disco"
          />
        )}
      </button>
      <span className="text-xs text-muted">{count}</span>
      <button
        onClick={onRemove}
        title="Remover diretório"
        className="hidden h-5 w-5 items-center justify-center rounded text-muted hover:text-red-400 focus-visible:outline-none group-hover:flex group-focus-within:flex"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function Sidebar({
  view,
  onViewChange,
  nav,
  onNavChange,
  selectedRoot,
  onSelectRoot,
  projects,
  rootFolders,
  runningIds,
  onAddFolder,
  onRemoveFolder
}: Props) {
  const [rootStatus, setRootStatus] = useState<RootFolderStatus[]>([])
  const addFolderPress = usePressAnimation<HTMLButtonElement>()
  const settingsPress = usePressAnimation<HTMLButtonElement>()

  useEffect(() => {
    window.api.checkRootFolders().then(setRootStatus)
  }, [rootFolders.join('|')])

  const runningCount = Object.keys(
    filterProjects(projects, {
      nav: 'running',
      selectedRoot: null,
      search: '',
      stack: 'all',
      tag: null,
      runningIds
    })
  ).length
  const favoritesCount = Object.keys(
    filterProjects(projects, {
      nav: 'favorites',
      selectedRoot: null,
      search: '',
      stack: 'all',
      tag: null,
      runningIds
    })
  ).length
  const archivedCount = Object.keys(
    filterProjects(projects, {
      nav: 'archived',
      selectedRoot: null,
      search: '',
      stack: 'all',
      tag: null,
      runningIds
    })
  ).length

  const selectNav = (next: NavFilter): void => {
    onSelectRoot(null)
    onNavChange(next)
    onViewChange('projects')
  }

  const selectRoot = (folder: string): void => {
    onSelectRoot(folder)
    onViewChange('projects')
  }

  return (
    <aside className="flex w-[214px] shrink-0 flex-col border-r border-border bg-bg px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-bg">
          P
        </div>
        <span className="text-base font-medium">Projetos</span>
      </div>

      <nav className="mb-6 flex flex-col gap-1">
        <NavButton
          active={view === 'projects' && nav === 'all' && !selectedRoot}
          label="Todos os projetos"
          icon={LayoutGrid}
          onClick={() => selectNav('all')}
        />
        <NavButton
          active={view === 'projects' && nav === 'running' && !selectedRoot}
          label="Rodando agora"
          dot
          count={runningCount}
          onClick={() => selectNav('running')}
        />
        <NavButton
          active={view === 'projects' && nav === 'favorites' && !selectedRoot}
          label="Favoritos"
          icon={Star}
          count={favoritesCount}
          onClick={() => selectNav('favorites')}
        />
        <NavButton
          active={view === 'projects' && nav === 'archived' && !selectedRoot}
          label="Arquivados"
          icon={Archive}
          count={archivedCount}
          onClick={() => selectNav('archived')}
        />
      </nav>

      <div className="mb-2 px-2 text-[11px] font-medium tracking-wide text-muted uppercase">
        Diretórios
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {rootFolders.map((folder) => (
          <DirectoryRow
            key={folder}
            folder={folder}
            count={countProjectsUnderRoot(projects, folder)}
            active={view === 'projects' && selectedRoot === folder}
            missing={rootStatus.find((s) => s.path === folder)?.exists === false}
            onSelect={() => selectRoot(folder)}
            onRemove={() => onRemoveFolder(folder)}
          />
        ))}
      </div>

      <button
        ref={addFolderPress.ref}
        onPointerDown={addFolderPress.onPointerDown}
        onPointerUp={addFolderPress.onPointerUp}
        onPointerLeave={addFolderPress.onPointerLeave}
        onClick={onAddFolder}
        className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
      >
        <Plus size={14} />
        Adicionar diretório
      </button>

      <button
        ref={settingsPress.ref}
        onPointerDown={settingsPress.onPointerDown}
        onPointerUp={settingsPress.onPointerUp}
        onPointerLeave={settingsPress.onPointerLeave}
        onClick={() => onViewChange('settings')}
        title="Configurações"
        className={`mt-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none ${
          view === 'settings' ? 'bg-card-hover text-white' : 'text-muted hover:bg-card-hover hover:text-white'
        }`}
      >
        <Settings size={16} />
      </button>
    </aside>
  )
}
