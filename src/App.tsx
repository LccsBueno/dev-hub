import { useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Sidebar, { type View } from './components/Sidebar'
import SearchBar from './components/SearchBar'
import ProjectGrid from './components/ProjectGrid'
import ProjectDetailPanel from './components/ProjectDetail/ProjectDetailPanel'
import SettingsPanel from './components/SettingsPanel'
import { ToastProvider } from './components/Toast'
import { useProjects } from './hooks/useProjects'
import { useProcessStatus } from './hooks/useProcessStatus'
import { usePressAnimation } from './lib/motion'
import { filterProjects, type NavFilter } from './lib/filterProjects'
import type { Stack } from './types'

const navTitles: Record<NavFilter, string> = {
  all: 'Todos os projetos',
  running: 'Rodando agora',
  favorites: 'Favoritos',
  archived: 'Arquivados'
}

export default function App() {
  const [view, setView] = useState<View>('projects')
  const [nav, setNav] = useState<NavFilter>('all')
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stackFilter, setStackFilter] = useState<Stack | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    config,
    scanning,
    rescan,
    updateProjectCommand,
    updateRootFolders,
    updateEditorCommand,
    updateTags,
    updateNotes,
    updateRunMode,
    updatePinned,
    updateHidden
  } = useProjects()
  const running = useProcessStatus()
  const closePanel = useCallback(() => setSelectedId(null), [])
  const rescanPress = usePressAnimation<HTMLButtonElement>()

  const filtered = filterProjects(config?.projects ?? {}, {
    nav: selectedRoot ? 'all' : nav,
    selectedRoot,
    search,
    stack: stackFilter,
    runningIds: Object.keys(running)
  })

  const addFolder = async (): Promise<void> => {
    const picked = await window.api.pickFolder()
    const current = config?.rootFolders ?? []
    if (picked && !current.some((f) => f.toLowerCase() === picked.toLowerCase())) {
      await updateRootFolders([...current, picked])
    }
  }

  const removeFolder = async (folder: string): Promise<void> => {
    if (!window.confirm(`Remover "${folder}" da lista de diretórios? Os projetos já escaneados continuarão aparecendo como "não encontrados" até serem arquivados manualmente.`)) {
      return
    }
    if (selectedRoot === folder) setSelectedRoot(null)
    await updateRootFolders((config?.rootFolders ?? []).filter((f) => f !== folder))
  }

  const title = selectedRoot
    ? (selectedRoot.split(/[\\/]/).filter(Boolean).pop() ?? selectedRoot)
    : navTitles[nav]

  return (
    <ToastProvider>
      <div className="flex h-screen flex-col bg-bg text-white">
        <div className="drag-region h-8 shrink-0" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            view={view}
            onViewChange={setView}
            nav={nav}
            onNavChange={setNav}
            selectedRoot={selectedRoot}
            onSelectRoot={setSelectedRoot}
            projects={config?.projects ?? {}}
            rootFolders={config?.rootFolders ?? []}
            runningIds={Object.keys(running)}
            onAddFolder={addFolder}
            onRemoveFolder={removeFolder}
          />
          <main className="flex-1 overflow-y-auto p-8">
            {view === 'projects' ? (
              <>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h1 className="text-2xl font-medium">{title}</h1>
                  <button
                    ref={rescanPress.ref}
                    onPointerDown={rescanPress.onPointerDown}
                    onPointerUp={rescanPress.onPointerUp}
                    onPointerLeave={rescanPress.onPointerLeave}
                    onClick={rescan}
                    disabled={scanning || (config?.rootFolders.length ?? 0) === 0}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
                    {scanning ? 'Reescaneando…' : 'Reescanear projetos'}
                  </button>
                </div>
                {(config?.rootFolders.length ?? 0) === 0 ? (
                  <div className="mt-12 flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted">Nenhum diretório configurado ainda.</p>
                    <button
                      onClick={addFolder}
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                    >
                      Adicionar diretório
                    </button>
                  </div>
                ) : (
                  <>
                    <SearchBar
                      search={search}
                      onSearch={setSearch}
                      stackFilter={stackFilter}
                      onStackFilter={setStackFilter}
                    />
                    <ProjectGrid
                      projects={filtered}
                      running={running}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onCommandChange={updateProjectCommand}
                      onTogglePinned={updatePinned}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <h1 className="mb-6 text-2xl font-medium">Configurações</h1>
                {config && (
                  <SettingsPanel
                    editorCommand={config.editorCommand}
                    onUpdateEditor={updateEditorCommand}
                  />
                )}
              </>
            )}
          </main>
          <ProjectDetailPanel
            projectId={selectedId}
            projects={config?.projects ?? {}}
            onClose={closePanel}
            onCommandChange={updateProjectCommand}
            onTagsChange={updateTags}
            onNotesChange={updateNotes}
            onRunModeChange={updateRunMode}
            onTogglePinned={updatePinned}
            onToggleHidden={updateHidden}
          />
        </div>
      </div>
    </ToastProvider>
  )
}
