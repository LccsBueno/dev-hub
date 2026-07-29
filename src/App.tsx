import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import Sidebar, { type View } from './components/Sidebar'
import FilterBar from './components/FilterBar'
import ProjectGrid from './components/ProjectGrid'
import ProjectDetailPanel from './components/ProjectDetail/ProjectDetailPanel'
import SettingsPanel from './components/SettingsPanel'
import { ToastProvider } from './components/Toast'
import { useProjects } from './hooks/useProjects'
import { useProcessStatus } from './hooks/useProcessStatus'
import { animateViewSwitch, usePressAnimation } from './lib/motion'
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
  const [tagFilter, setTagFilter] = useState<string | null>(null)
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
    updateHidden,
    setTagColor,
    deleteTagColor
  } = useProjects()
  const running = useProcessStatus()
  const closePanel = useCallback(() => setSelectedId(null), [])
  const rescanPress = usePressAnimation<HTMLButtonElement>()
  const viewContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewContentRef.current) animateViewSwitch(viewContentRef.current)
  }, [view])

  const filtered = filterProjects(config?.projects ?? {}, {
    nav: selectedRoot ? 'all' : nav,
    selectedRoot,
    search,
    stack: stackFilter,
    tag: tagFilter,
    runningIds: Object.keys(running)
  })

  const allTags = Array.from(
    new Set([
      ...Object.values(config?.projects ?? {}).flatMap((p) => p.tags),
      ...Object.keys(config?.tagColors ?? {})
    ])
  ).sort((a, b) => a.localeCompare(b))

  const availableStacks = Array.from(
    new Set(Object.values(config?.projects ?? {}).map((p) => p.stack))
  )

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

  const breadcrumb = selectedRoot
    ? (selectedRoot.split(/[\\/]/).filter(Boolean).pop() ?? selectedRoot)
    : 'Todos os diretórios'
  const title = selectedRoot ? navTitles.all : navTitles[nav]
  const hasRoots = (config?.rootFolders.length ?? 0) > 0

  return (
    <ToastProvider>
      <div className="flex h-screen flex-col bg-bg">
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
          <main className="@container flex flex-1 flex-col overflow-hidden">
            <div key={view} ref={viewContentRef} className="flex flex-1 flex-col overflow-hidden">
              {view === 'projects' ? (
                <>
                  <div className="flex items-start justify-between gap-4 border-b border-border px-7 py-[22px]">
                    <div>
                      <p className="mb-0.5 text-xs text-muted">
                        {breadcrumb} · {Object.keys(filtered).length} projetos
                      </p>
                      <h1 className="text-2xl font-medium">{title}</h1>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="relative flex items-center">
                        <Search size={14} className="pointer-events-none absolute left-2.5 text-muted" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar projeto…"
                          className="w-48 rounded-lg border border-border bg-card py-2 pr-3 pl-8 text-sm outline-none placeholder:text-muted focus:border-accent"
                        />
                      </div>
                      <button
                        ref={rescanPress.ref}
                        onPointerDown={rescanPress.onPointerDown}
                        onPointerUp={rescanPress.onPointerUp}
                        onPointerLeave={rescanPress.onPointerLeave}
                        onClick={rescan}
                        disabled={scanning || (config !== null && !hasRoots)}
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-50"
                      >
                        <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
                        {scanning ? 'Reescaneando…' : 'Reescanear projetos'}
                      </button>
                    </div>
                  </div>

                  {config !== null && !hasRoots && Object.keys(config.projects).length === 0 ? (
                    <div className="mt-12 flex flex-col items-center gap-3 px-7 text-center">
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
                      <div className="border-b border-border px-7 py-3.5">
                        <FilterBar
                          availableStacks={availableStacks}
                          stackFilter={stackFilter}
                          onStackFilter={setStackFilter}
                          tags={allTags}
                          tagColors={config?.tagColors ?? {}}
                          tagFilter={tagFilter}
                          onTagFilter={setTagFilter}
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto p-7">
                        <ProjectGrid
                          projects={filtered}
                          running={running}
                          selectedId={selectedId}
                          tagColors={config?.tagColors ?? {}}
                          onSelect={setSelectedId}
                          onCommandChange={updateProjectCommand}
                          onTogglePinned={updatePinned}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="overflow-y-auto p-7">
                  <h1 className="mb-6 text-2xl font-medium">Configurações</h1>
                  {config && (
                    <SettingsPanel
                      editorCommand={config.editorCommand}
                      onUpdateEditor={updateEditorCommand}
                      projects={config.projects}
                      tagColors={config.tagColors}
                      onSetTagColor={setTagColor}
                      onDeleteTagColor={deleteTagColor}
                    />
                  )}
                </div>
              )}
            </div>
          </main>
          <ProjectDetailPanel
            projectId={selectedId}
            projects={config?.projects ?? {}}
            running={running}
            tagColors={config?.tagColors ?? {}}
            allTags={allTags}
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
