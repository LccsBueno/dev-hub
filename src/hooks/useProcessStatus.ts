import { useEffect, useState } from 'react'

/** Map of projectId -> timestamp (ms) when it started running. */
export function useProcessStatus(): Record<string, number> {
  const [running, setRunning] = useState<Record<string, number>>({})

  useEffect(() => {
    const eventSeen = new Set<string>()
    const off = window.api.onStatusChange((id, status) => {
      eventSeen.add(id)
      setRunning((prev) => {
        const next = { ...prev }
        if (status === 'running') next[id] = Date.now()
        else delete next[id]
        return next
      })
    })
    window.api.getRunningIds().then((ids) => {
      setRunning((prev) => {
        const next = { ...prev }
        for (const id of ids) if (!(id in next) && !eventSeen.has(id)) next[id] = Date.now()
        return next
      })
    })
    return off
  }, [])

  return running
}
