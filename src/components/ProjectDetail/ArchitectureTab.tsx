import { useEffect, useRef, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'

interface Props {
  projectId: string
}

export default function ArchitectureTab({ projectId }: Props) {
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null | undefined>(
    undefined
  )
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingElements = useRef<readonly unknown[] | null>(null)
  const currentProjectId = useRef(projectId)

  useEffect(() => {
    currentProjectId.current = projectId
    pendingElements.current = null
    setInitialData(undefined)
    window.api.loadArchitecture(projectId).then((data) => {
      setInitialData(
        data
          ? { elements: data.elements as ExcalidrawInitialDataState['elements'] }
          : { elements: [] }
      )
    })
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (pendingElements.current) {
        void window.api.saveArchitecture(currentProjectId.current, {
          elements: pendingElements.current as unknown[]
        })
        pendingElements.current = null
      }
    }
  }, [projectId])

  if (initialData === undefined) {
    return <div className="flex h-full items-center justify-center text-xs text-muted">Carregando…</div>
  }

  return (
    <div className="h-full">
      <Excalidraw
        key={projectId}
        initialData={initialData}
        theme="dark"
        onChange={(elements) => {
          pendingElements.current = elements as unknown[]
          if (saveTimer.current) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => {
            pendingElements.current = null
            void window.api.saveArchitecture(projectId, {
              elements: elements as unknown as { elements: unknown[] }['elements']
            })
          }, 800)
        }}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: false,
            toggleTheme: false
          }
        }}
      />
    </div>
  )
}
