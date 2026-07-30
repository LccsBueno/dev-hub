import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Play, Square } from 'lucide-react'
import type { DockerContainerInfo, DockerGroup, DockerMount } from '../../types'
import ContainerRow, { COL_TEMPLATE, stateColor } from './ContainerRow'
import MountsModal from './MountsModal'
import GroupList from './GroupList'
import GroupModal from './GroupModal'

const POLL_MS = 4000

interface ComposeGroup {
  project: string
  containers: DockerContainerInfo[]
}

function groupContainers(containers: DockerContainerInfo[]): {
  groups: ComposeGroup[]
  standalone: DockerContainerInfo[]
} {
  const map = new Map<string, DockerContainerInfo[]>()
  const standalone: DockerContainerInfo[] = []
  for (const c of containers) {
    if (c.composeProject) {
      const arr = map.get(c.composeProject) ?? []
      arr.push(c)
      map.set(c.composeProject, arr)
    } else {
      standalone.push(c)
    }
  }
  return {
    groups: Array.from(map.entries()).map(([project, containers]) => ({ project, containers })),
    standalone
  }
}

function TableHeader() {
  return (
    <div
      className="grid items-center gap-x-2 border-b border-border px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted"
      style={{ gridTemplateColumns: COL_TEMPLATE }}
    >
      <div />
      <div />
      <span>Name</span>
      <span>Image</span>
      <span>Status</span>
      <span>Ports</span>
      <span className="text-right">Actions</span>
    </div>
  )
}

interface ProjectRowProps {
  group: ComposeGroup
  collapsed: boolean
  onToggle: () => void
  onStartAll: () => void
  onStopAll: () => void
}

function ProjectRow({ group, collapsed, onToggle, onStartAll, onStopAll }: ProjectRowProps) {
  const running = group.containers.filter((c) => c.state === 'running').length
  const total = group.containers.length

  return (
    <div
      className="grid cursor-pointer select-none items-center gap-x-2 rounded-md px-2 py-2 hover:bg-white/[0.04] transition-colors"
      style={{ gridTemplateColumns: COL_TEMPLATE }}
      onClick={onToggle}
    >
      <span className="flex items-center justify-center text-muted">
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
      </span>
      <span className={`h-2 w-2 rounded-full shrink-0 ${running > 0 ? 'bg-accent' : 'bg-neutral-600'}`} />
      <span className="truncate text-sm font-medium">{group.project}</span>
      <span className="text-xs text-muted">{total} container{total !== 1 ? 's' : ''}</span>
      <span className="text-xs text-muted">
        <span className={running > 0 ? 'text-accent' : ''}>{running}</span>/{total} rodando
      </span>
      <span />
      <div
        className="flex items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onStartAll}
          disabled={running === total}
          title="Start all"
          className="flex h-6 w-6 items-center justify-center rounded bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-30 focus-visible:outline-none"
        >
          <Play size={12} />
        </button>
        <button
          onClick={onStopAll}
          disabled={running === 0}
          title="Stop all"
          className="flex h-6 w-6 items-center justify-center rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-30 focus-visible:outline-none"
        >
          <Square size={12} />
        </button>
      </div>
    </div>
  )
}

export default function DockerView() {
  const [containers, setContainers] = useState<DockerContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mountsFor, setMountsFor] = useState<DockerContainerInfo | null>(null)
  const [mounts, setMounts] = useState<DockerMount[]>([])
  const [groups, setGroups] = useState<DockerGroup[]>([])
  const [editingGroup, setEditingGroup] = useState<DockerGroup | null>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    const result = await window.api.dockerList()
    setContainers(result.containers)
    setError(result.error)
    setLoaded(true)
  }, [])

  const showMounts = useCallback(async (container: DockerContainerInfo) => {
    setMountsFor(container)
    setMounts(await window.api.dockerMounts(container.id))
  }, [])

  const loadGroups = useCallback(async () => {
    const cfg = await window.api.getConfig()
    setGroups(cfg.dockerGroups)
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => { loadGroups() }, [loadGroups])

  const toggleCollapse = (project: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(project)) next.delete(project)
      else next.add(project)
      return next
    })
  }

  const saveGroup = async (group: DockerGroup): Promise<void> => {
    const next = editingGroup
      ? groups.map((g) => (g.id === group.id ? group : g))
      : [...groups, group]
    await window.api.updateDockerGroups(next)
    setGroups(next)
    setEditingGroup(null)
    setCreatingGroup(false)
  }

  const deleteGroup = async (groupId: string): Promise<void> => {
    const next = groups.filter((g) => g.id !== groupId)
    await window.api.updateDockerGroups(next)
    setGroups(next)
  }

  const runGroup = async (groupId: string, action: 'start' | 'stop' | 'restart'): Promise<void> => {
    await window.api.dockerRunGroup(groupId, action)
    refresh()
  }

  const { groups: composeGroups, standalone } = groupContainers(containers)

  const containerRow = (c: DockerContainerInfo, indent = false) => (
    <ContainerRow
      key={c.id}
      container={c}
      indent={indent}
      onStart={() => window.api.dockerStart(c.id).then(refresh)}
      onStop={() => window.api.dockerStop(c.id).then(refresh)}
      onRestart={() => window.api.dockerRestart(c.id).then(refresh)}
      onShowMounts={() => showMounts(c)}
    />
  )

  return (
    <div className="flex h-full flex-col p-7">
      <h1 className="mb-5 text-2xl font-medium">Docker</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
          {error}
        </div>
      )}

      <section className="mb-8">
        <div className="rounded-lg border border-border">
          <div className="p-3">
            <TableHeader />
          </div>

          {loaded && containers.length === 0 && !error && (
            <p className="px-5 pb-4 text-sm text-muted">Nenhum container encontrado.</p>
          )}

          <div className="px-3 pb-3">
            {composeGroups.map((group) => (
              <div key={group.project}>
                <ProjectRow
                  group={group}
                  collapsed={collapsed.has(group.project)}
                  onToggle={() => toggleCollapse(group.project)}
                  onStartAll={() => {
                    group.containers.forEach((c) => {
                      if (c.state !== 'running') window.api.dockerStart(c.id)
                    })
                    setTimeout(refresh, 600)
                  }}
                  onStopAll={() => {
                    group.containers.forEach((c) => {
                      if (c.state === 'running') window.api.dockerStop(c.id)
                    })
                    setTimeout(refresh, 600)
                  }}
                />
                {!collapsed.has(group.project) && (
                  <div className="ml-5 border-l border-border/50 pl-1">
                    {group.containers.map((c) => containerRow(c, true))}
                  </div>
                )}
              </div>
            ))}

            {standalone.map((c) => containerRow(c, false))}
          </div>
        </div>
      </section>

      <GroupList
        groups={groups}
        onRun={runGroup}
        onEdit={setEditingGroup}
        onDelete={deleteGroup}
        onCreate={() => setCreatingGroup(true)}
      />

      {mountsFor && (
        <MountsModal
          containerName={mountsFor.name}
          mounts={mounts}
          onClose={() => setMountsFor(null)}
        />
      )}

      {(editingGroup || creatingGroup) && (
        <GroupModal
          group={editingGroup}
          availableContainers={containers}
          onSave={saveGroup}
          onClose={() => {
            setEditingGroup(null)
            setCreatingGroup(false)
          }}
        />
      )}
    </div>
  )
}
