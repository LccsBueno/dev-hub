import { useCallback, useEffect, useState } from 'react'
import type { Config } from '../types'

export function useProjects() {
  const [config, setConfig] = useState<Config | null>(null)
  const [scanning, setScanning] = useState(false)

  const rescan = useCallback(async () => {
    setScanning(true)
    try {
      setConfig(await window.api.scanProjects())
    } finally {
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    rescan()
  }, [rescan])

  const updateProjectCommand = useCallback(async (id: string, command: string) => {
    await window.api.updateProjectCommand(id, command)
    setConfig(await window.api.getConfig())
  }, [])

  const updateTags = useCallback(async (id: string, tags: string[]) => {
    await window.api.updateTags(id, tags)
    setConfig(await window.api.getConfig())
  }, [])

  const updateNotes = useCallback(async (id: string, notes: string) => {
    await window.api.updateNotes(id, notes)
    setConfig(await window.api.getConfig())
  }, [])

  const updateRunMode = useCallback(async (id: string, runMode: 'native' | 'docker') => {
    await window.api.updateRunMode(id, runMode)
    setConfig(await window.api.getConfig())
  }, [])

  const updatePinned = useCallback(async (id: string, pinned: boolean) => {
    await window.api.updatePinned(id, pinned)
    setConfig(await window.api.getConfig())
  }, [])

  const updateHidden = useCallback(async (id: string, hidden: boolean) => {
    await window.api.updateHidden(id, hidden)
    setConfig(await window.api.getConfig())
  }, [])

  const updateRootFolders = useCallback(
    async (folders: string[]) => {
      await window.api.updateRootFolders(folders)
      await rescan()
    },
    [rescan]
  )

  const updateEditorCommand = useCallback(async (command: string) => {
    await window.api.updateEditorCommand(command)
    setConfig(await window.api.getConfig())
  }, [])

  return {
    config,
    scanning,
    rescan,
    updateProjectCommand,
    updateTags,
    updateNotes,
    updateRunMode,
    updatePinned,
    updateHidden,
    updateRootFolders,
    updateEditorCommand
  }
}
