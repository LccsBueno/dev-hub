import React, { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Archive, Code2, Folder, Play, Square, Star, X } from 'lucide-react'
import type { ProjectConfig, RunMode } from '../../types'
import { stackColors, stackTechs } from '../../lib/stackColors'
import {
  animateDetailPanelEnter,
  animateDetailPanelExit,
  animateTabContent,
  animateTabIndicator,
  usePressAnimation
} from '../../lib/motion'
import InfoTab from './InfoTab'
import NotesTab from './NotesTab'
import GitTab from './GitTab'
import LogsTab from './LogsTab'

const ArchitectureTab = React.lazy(() => import('./ArchitectureTab'))

type TabId = 'info' | 'notes' | 'git' | 'logs' | 'arch'

const tabs: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'notes', label: 'Notas' },
  { id: 'git', label: 'Git' },
  { id: 'logs', label: 'Logs' },
  { id: 'arch', label: 'Arq.' }
]

interface Props {
  projectId: string | null
  projects: Record<string, ProjectConfig>
  running: Record<string, number>
  tagColors: Record<string, string>
  allTags: string[]
  onClose: () => void
  onCommandChange: (id: string, command: string) => void
  onTagsChange: (id: string, tags: string[]) => void
  onNotesChange: (id: string, notes: string) => void
  onRunModeChange: (id: string, runMode: RunMode) => void
  onTogglePinned: (id: string, pinned: boolean) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}

function TabContent({ tabId, scrollable = true, children }: { tabId: TabId; scrollable?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) animateTabContent(ref.current)
  }, [tabId])

  return (
    <div ref={ref} className={`flex-1 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {children}
    </div>
  )
}

export default function ProjectDetailPanel({
  projectId,
  projects,
  running,
  tagColors,
  allTags,
  onClose,
  onCommandChange,
  onTagsChange,
  onNotesChange,
  onRunModeChange,
  onTogglePinned,
  onToggleHidden
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [mountedId, setMountedId] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(336)
  const asideRef = useRef<HTMLElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabIndicatorRef = useRef<HTMLSpanElement>(null)
  const closeBtn = usePressAnimation<HTMLButtonElement>()
  const starBtn = usePressAnimation<HTMLButtonElement>()
  const archiveBtn = usePressAnimation<HTMLButtonElement>()
  const runBtn = usePressAnimation<HTMLButtonElement>()
  const folderBtn = usePressAnimation<HTMLButtonElement>()
  const editorBtn = usePressAnimation<HTMLButtonElement>()

  useEffect(() => {
    setActiveTab('info')
  }, [projectId])

  useEffect(() => {
    if (!tabBarRef.current || !tabIndicatorRef.current) return
    const target = tabBarRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`)
    if (target) animateTabIndicator(tabIndicatorRef.current, target)
  }, [activeTab, mountedId])

  useEffect(() => {
    if (projectId && !projects[projectId]) onClose()
  }, [projectId, projects, onClose])

  useEffect(() => {
    if (!projectId) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      const active = document.activeElement as HTMLElement | null
      const withinPanel = active ? asideRef.current?.contains(active) : false
      if (withinPanel) {
        active?.blur()
        onClose()
        return
      }
      const isEditable = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable
      if (isEditable) return
      onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [projectId, onClose])

  const shouldShow = !!projectId && !!projects[projectId]

  useEffect(() => {
    if (shouldShow && projectId) setMountedId(projectId)
  }, [shouldShow, projectId])

  useEffect(() => {
    if (!asideRef.current) return
    if (shouldShow) {
      animateDetailPanelEnter(asideRef.current)
    } else if (mountedId) {
      animateDetailPanelExit(asideRef.current, () => setMountedId(null))
    }
  }, [shouldShow])

  const project = mountedId ? projects[mountedId] : null

  if (!project || !mountedId) return null

  const isRunning = running[mountedId] !== undefined

  const startDrag = (e: React.MouseEvent): void => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = panelWidth
    const onMove = (ev: MouseEvent): void => {
      const next = Math.max(260, Math.min(640, startWidth + (startX - ev.clientX)))
      setPanelWidth(next)
    }
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <aside
      ref={asideRef}
      aria-label="Detalhes do projeto"
      style={{ width: panelWidth }}
      className="relative flex shrink-0 flex-col border-l border-border bg-bg"
    >
      <div
        className="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-accent/20 active:bg-accent/40"
        onMouseDown={startDrag}
      />
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] text-muted">{project.path}</p>
            <h2 className="truncate text-lg font-medium">{project.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              ref={starBtn.ref}
              onPointerDown={starBtn.onPointerDown}
              onPointerUp={starBtn.onPointerUp}
              onPointerLeave={starBtn.onPointerLeave}
              onClick={() => onTogglePinned(mountedId, !project.pinned)}
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
              onClick={() => onToggleHidden(mountedId, !project.hidden)}
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

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {project.missing ? (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-400">
              <AlertTriangle size={11} />
              pasta não encontrada
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'animate-pulse bg-accent' : 'bg-neutral-600'}`}
              />
              {isRunning ? 'rodando' : 'parado'}
            </span>
          )}
          {(stackTechs[project.stack] ?? [{ label: project.stack, color: stackColors[project.stack] ?? '#94a3b8' }]).map((tech) => (
            <span
              key={tech.label}
              style={{
                backgroundColor: `color-mix(in srgb, ${tech.color} 18%, transparent)`,
                color: tech.color,
                borderColor: `color-mix(in srgb, ${tech.color} 45%, transparent)`
              }}
              className="rounded-full border px-2 py-0.5 text-xs"
            >
              {tech.label}
            </span>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-border p-2">
          <div className="grid grid-cols-3 gap-2">
          <button
            ref={runBtn.ref}
            onPointerDown={runBtn.onPointerDown}
            onPointerUp={runBtn.onPointerUp}
            onPointerLeave={runBtn.onPointerLeave}
            onClick={() => (isRunning ? window.api.stopProject(mountedId) : window.api.runProject(mountedId))}
            disabled={project.missing}
            type="button"
            className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-30 ${
              isRunning
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'bg-accent/15 text-accent hover:bg-accent/25'
            }`}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
            {isRunning ? 'Parar' : 'Rodar'}
          </button>
          <button
            ref={folderBtn.ref}
            onPointerDown={folderBtn.onPointerDown}
            onPointerUp={folderBtn.onPointerUp}
            onPointerLeave={folderBtn.onPointerLeave}
            onClick={() => window.api.openFolder(project.path)}
            disabled={project.missing}
            type="button"
            className="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-30"
          >
            <Folder size={16} />
            Explorador
          </button>
          <button
            ref={editorBtn.ref}
            onPointerDown={editorBtn.onPointerDown}
            onPointerUp={editorBtn.onPointerUp}
            onPointerLeave={editorBtn.onPointerLeave}
            onClick={() => window.api.openInEditor(project.path)}
            disabled={project.missing}
            type="button"
            className="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-30"
          >
            <Code2 size={16} />
            Editor
          </button>
          </div>
        </div>
      </div>

      <div ref={tabBarRef} className="relative flex border-b border-border px-5">
        <span ref={tabIndicatorRef} className="absolute bottom-0 h-0.5 bg-accent" style={{ left: 0, width: 0 }} />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              activeTab === tab.id ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent key={`${mountedId}:${activeTab}`} tabId={activeTab} scrollable={activeTab !== 'arch'}>
        {activeTab === 'info' && (
          <InfoTab
            projectId={mountedId}
            project={project}
            allTags={allTags}
            tagColors={tagColors}
            onCommandChange={onCommandChange}
            onTagsChange={onTagsChange}
            onRunModeChange={onRunModeChange}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab projectPath={project.path} projectName={project.name} />
        )}
        {activeTab === 'git' && <GitTab projectPath={project.path} />}
        {activeTab === 'logs' && <LogsTab projectId={mountedId} projectPath={project.path} />}
        {activeTab === 'arch' && (
          <React.Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-muted">Carregando…</div>}>
            <ArchitectureTab projectId={mountedId} />
          </React.Suspense>
        )}
      </TabContent>
    </aside>
  )
}
