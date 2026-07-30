import type { Config, DockerContainerInfo, DockerGroup, DockerMount, GitInfo, LogLine, RootFolderStatus } from './types'

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
      updateDockerGroups(groups: DockerGroup[]): Promise<void>
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
      getDirTree(path: string): Promise<{ name: string; isDir: boolean }[]>
      getReadme(path: string): Promise<string | null>
      createReadme(path: string, projectName: string): Promise<boolean>
      loadArchitecture(id: string): Promise<{ elements: unknown[] } | null>
      saveArchitecture(id: string, data: { elements: unknown[] }): Promise<void>
      dockerList(): Promise<{ containers: DockerContainerInfo[]; error: string | null }>
      dockerMounts(id: string): Promise<DockerMount[]>
      dockerStart(id: string): Promise<void>
      dockerStop(id: string): Promise<void>
      dockerRestart(id: string): Promise<void>
      dockerRunGroup(groupId: string, action: 'start' | 'stop' | 'restart'): Promise<void>
      readDockerCompose(projectPath: string): Promise<string | null>
      writeDockerCompose(projectPath: string, content: string): Promise<void>
      onError(cb: (message: string) => void): () => void
    }
  }
}

export {}
