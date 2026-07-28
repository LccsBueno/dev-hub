import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ProjectConfig } from '../../types'
import { animatePanelClose, animatePanelOpen, animateTabContent } from '../../lib/motion'
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
  onNotesChange
}: Props) {
  const [displayId, setDisplayId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const open = projectId !== null

  useEffect(() => {
    if (projectId) {
      setDisplayId(projectId)
      setActiveTab('info')
    }
  }, [projectId])

  useEffect(() => {
    if (!panelRef.current || !backdropRef.current) return
    if (open) {
      animatePanelOpen(panelRef.current, backdropRef.current)
    } else {
      animatePanelClose(panelRef.current, backdropRef.current)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement | null)?.blur()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open && displayId && !projects[displayId]) onClose()
  }, [open, displayId, projects, onClose])

  const project = displayId ? projects[displayId] : null

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        inert={!open}
        className={`fixed inset-0 z-40 bg-black/60 opacity-0 ${open ? '' : 'pointer-events-none'}`}
      />
      <div
        ref={panelRef}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[480px] translate-x-full flex-col border-l border-border bg-card opacity-0 shadow-panel ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        {project && displayId && (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="truncate font-serif text-lg font-medium">{project.name}</h2>
              <button
                onClick={onClose}
                title="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b border-border px-5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
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
                  projectId={displayId}
                  project={project}
                  onCommandChange={onCommandChange}
                  onTagsChange={onTagsChange}
                />
              )}
              {activeTab === 'notes' && (
                <NotesTab projectId={displayId} project={project} onNotesChange={onNotesChange} />
              )}
              {activeTab === 'git' && <GitTab projectPath={project.path} />}
              {activeTab === 'logs' && <LogsTab projectId={displayId} projectPath={project.path} />}
            </TabContent>
          </>
        )}
      </div>
    </>
  )
}
