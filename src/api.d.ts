import type { Config, GitInfo, LogLine, RootFolderStatus } from './types'

declare global {
  interface Window {
    api: {
      scanProjects(): Promise<Config>
      getConfig(): Promise<Config>
      updateRootFolders(folders: string[]): Promise<void>
      updateEditorCommand(command: string): Promise<void>
      updateProjectCommand(id: string, command: string): Promise<void>
      updateTags(id: string, tags: string[]): Promise<void>
      updateNotes(id: string, notes: string): Promise<void>
      updateRunMode(id: string, runMode: 'native' | 'docker'): Promise<void>
      updatePinned(id: string, pinned: boolean): Promise<void>
      updateHidden(id: string, hidden: boolean): Promise<void>
      setTagColor(tag: string, color: string): Promise<void>
      deleteTagColor(tag: string): Promise<void>
      getGitInfo(path: string): Promise<GitInfo>
      checkRootFolders(): Promise<RootFolderStatus[]>
      pickFolder(): Promise<string | null>
      getLogBuffer(id: string): Promise<LogLine[]>
      clearLogBuffer(id: string): Promise<void>
      getRunningIds(): Promise<string[]>
      runProject(id: string): void
      stopProject(id: string): void
      openFolder(path: string): void
      openInEditor(path: string): void
      openInTerminal(path: string): void
      onLog(cb: (id: string, chunk: string, stream: 'stdout' | 'stderr') => void): () => void
      onStatusChange(cb: (id: string, status: 'running' | 'stopped') => void): () => void
      onError(cb: (message: string) => void): () => void
    }
  }
}

export {}
