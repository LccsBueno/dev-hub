import { useState } from 'react'
import Sidebar, { type View } from './components/Sidebar'
import SearchBar from './components/SearchBar'
import ProjectGrid from './components/ProjectGrid'
import LogDrawer from './components/LogDrawer'
import { ToastProvider } from './components/Toast'
import { useProjects } from './hooks/useProjects'
import { useProcessStatus } from './hooks/useProcessStatus'
import type { Stack } from './types'

export default function App() {
  const [view, setView] = useState<View>('projects')
  const [search, setSearch] = useState('')
  const [stackFilter, setStackFilter] = useState<Stack | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { config, rescan, updateProjectCommand, updateRootFolders, updateEditorCommand } =
    useProjects()
  const running = useProcessStatus()

  const filtered = Object.fromEntries(
    Object.entries(config?.projects ?? {}).filter(
      ([, p]) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        (stackFilter === 'all' || p.stack === stackFilter)
    )
  )

  return (
    <ToastProvider>
      <div className="flex h-screen bg-bg text-white">
        <Sidebar view={view} onChange={setView} />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            {view === 'projects' ? (
              <>
                <h1 className="mb-6 text-2xl font-semibold">Projetos</h1>
                <SearchBar
                  search={search}
                  onSearch={setSearch}
                  stackFilter={stackFilter}
                  onStackFilter={setStackFilter}
                />
                <ProjectGrid
                  projects={filtered}
                  running={running}
                  onSelect={setSelectedId}
                  onCommandChange={updateProjectCommand}
                />
              </>
            ) : (
              <h1 className="text-2xl font-semibold">Configurações</h1>
            )}
          </main>
          {selectedId && config?.projects[selectedId] && (
            <LogDrawer
              projectId={selectedId}
              projectName={config.projects[selectedId].name}
              projectPath={config.projects[selectedId].path}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </ToastProvider>
  )
}
