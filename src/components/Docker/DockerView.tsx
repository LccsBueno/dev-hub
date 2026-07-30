import { useCallback, useEffect, useState } from 'react'
import type { DockerContainerInfo, DockerGroup, DockerMount } from '../../types'
import ContainerRow from './ContainerRow'
import MountsModal from './MountsModal'
import GroupList from './GroupList'
import GroupModal from './GroupModal'

const POLL_MS = 4000

export default function DockerView() {
  const [containers, setContainers] = useState<DockerContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mountsFor, setMountsFor] = useState<DockerContainerInfo | null>(null)
  const [mounts, setMounts] = useState<DockerMount[]>([])
  const [groups, setGroups] = useState<DockerGroup[]>([])
  const [editingGroup, setEditingGroup] = useState<DockerGroup | null>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)

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

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

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

  return (
    <div className="p-7">
      <h1 className="mb-6 text-2xl font-medium">Docker</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
          {error}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-xs font-medium text-muted">Containers</h2>
        {loaded && containers.length === 0 && !error && (
          <p className="text-sm text-muted">Nenhum container encontrado.</p>
        )}
        <div className="flex flex-col gap-2">
          {containers.map((c) => (
            <ContainerRow
              key={c.id}
              container={c}
              onStart={() => window.api.dockerStart(c.id).then(refresh)}
              onStop={() => window.api.dockerStop(c.id).then(refresh)}
              onRestart={() => window.api.dockerRestart(c.id).then(refresh)}
              onShowMounts={() => showMounts(c)}
            />
          ))}
        </div>
      </section>

      {mountsFor && (
        <MountsModal
          containerName={mountsFor.name}
          mounts={mounts}
          onClose={() => setMountsFor(null)}
        />
      )}

      <GroupList
        groups={groups}
        onRun={runGroup}
        onEdit={setEditingGroup}
        onDelete={deleteGroup}
        onCreate={() => setCreatingGroup(true)}
      />

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
