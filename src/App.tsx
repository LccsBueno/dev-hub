import { useState } from 'react'
import Sidebar, { type View } from './components/Sidebar'
import { ToastProvider } from './components/Toast'
import { useProjects } from './hooks/useProjects'
import { useProcessStatus } from './hooks/useProcessStatus'

export default function App() {
  const [view, setView] = useState<View>('projects')
  const projects = useProjects()
  const running = useProcessStatus()

  return (
    <ToastProvider>
      <div className="flex h-screen bg-bg text-white">
        <Sidebar view={view} onChange={setView} />
        <main className="flex-1 overflow-y-auto p-8">
          {view === 'projects' ? (
            <div>
              <h1 className="text-2xl font-semibold">Projetos</h1>
              <p className="mt-2 text-sm text-muted">
                {projects.config
                  ? `${Object.keys(projects.config.projects).length} projetos, ${Object.keys(running).length} rodando`
                  : 'Carregando…'}
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold">Configurações</h1>
          )}
        </main>
      </div>
    </ToastProvider>
  )
}
