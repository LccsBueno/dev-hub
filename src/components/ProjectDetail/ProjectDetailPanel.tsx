import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Archive, Star, X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { animateTabContent, usePressAnimation } from '../../lib/motion'
import InfoTab from './InfoTab'
import NotesTab from './NotesTab'
import GitTab from './GitTab'
import LogsTab from './LogsTab'

type TabId = 'info' | 'notes' | 'git' | 'logs'

const tabs: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'notes', label: 'Notas' },
  { id: 'git', label: 'Git' },
  { id: 'logs', label: 'Logs' }
]

interface Props {
  projectId: string | null
  projects: Record<string, ProjectConfig>
  onClose: () => void
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
  onNotesChange: (id: string, notes: string) => void
  onRunModeChange: (id: string, runMode: RunMode) => void
  onTogglePinned: (id: string, pinned: boolean) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}

function TabContent({ tabId, children }: { tabId: TabId; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) animateTabContent(ref.current)
  }, [tabId])

  return (
    <div ref={ref} className="flex-1 overflow-y-auto">
      {children}
    </div>
  )
}

export default function ProjectDetailPanel({
  projectId,
  projects,
  onClose,
  onCommandChange,
  onTagsChange,
  onNotesChange,
  onRunModeChange,
  onTogglePinned,
  onToggleHidden
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const closeBtn = usePressAnimation<HTMLButtonElement>()
  const starBtn = usePressAnimation<HTMLButtonElement>()
  const archiveBtn = usePressAnimation<HTMLButtonElement>()

  useEffect(() => {
    setActiveTab('info')
  }, [projectId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement | null)?.blur()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const project = projectId ? projects[projectId] : null

  if (!project || !projectId) {
    return (
      <aside className="flex w-[336px] shrink-0 flex-col items-center justify-center border-l border-border bg-bg px-6 text-center">
        <p className="text-sm text-muted">Selecione um projeto para ver detalhes</p>
      </aside>
    )
  }

  return (
    <aside className="flex w-[336px] shrink-0 flex-col border-l border-border bg-bg">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="truncate text-lg font-medium">{project.name}</h2>
        <div className="flex items-center gap-1">
          <button
            ref={starBtn.ref}
            onPointerDown={starBtn.onPointerDown}
            onPointerUp={starBtn.onPointerUp}
            onPointerLeave={starBtn.onPointerLeave}
            onClick={() => onTogglePinned(projectId, !project.pinned)}
            title={project.pinned ? 'Remover dos favoritos' : 'Favoritar'}
            aria-pressed={project.pinned}
            type="button"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              project.pinned ? 'text-accent' : 'text-muted hover:bg-border hover:text-white'
            }`}
          >
            <Star size={16} fill={project.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            ref={archiveBtn.ref}
            onPointerDown={archiveBtn.onPointerDown}
            onPointerUp={archiveBtn.onPointerUp}
            onPointerLeave={archiveBtn.onPointerLeave}
            onClick={() => onToggleHidden(projectId, !project.hidden)}
            title={project.hidden ? 'Desarquivar' : 'Arquivar'}
            aria-pressed={project.hidden}
            type="button"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              project.hidden ? 'text-accent' : 'text-muted hover:bg-border hover:text-white'
            }`}
          >
            <Archive size={16} />
          </button>
          <button
            ref={closeBtn.ref}
            onPointerDown={closeBtn.onPointerDown}
            onPointerUp={closeBtn.onPointerUp}
            onPointerLeave={closeBtn.onPointerLeave}
            onClick={onClose}
            title="Fechar"
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-border px-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              activeTab === tab.id ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      <TabContent key={activeTab} tabId={activeTab}>
        {activeTab === 'info' && (
          <InfoTab
            projectId={projectId}
            project={project}
            onCommandChange={onCommandChange}
            onTagsChange={onTagsChange}
            onRunModeChange={onRunModeChange}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab projectId={projectId} project={project} onNotesChange={onNotesChange} />
        )}
        {activeTab === 'git' && <GitTab projectPath={project.path} />}
        {activeTab === 'logs' && <LogsTab projectId={projectId} projectPath={project.path} />}
      </TabContent>
    </aside>
  )
}
