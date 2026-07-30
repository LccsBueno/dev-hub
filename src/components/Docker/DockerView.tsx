import { useCallback, useEffect, useState } from 'react'
import type { DockerContainerInfo } from '../../types'
import ContainerRow from './ContainerRow'

const POLL_MS = 4000

export default function DockerView() {
  const [containers, setContainers] = useState<DockerContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const result = await window.api.dockerList()
    setContainers(result.containers)
    setError(result.error)
    setLoaded(true)
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

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
              onShowMounts={() => {}}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
