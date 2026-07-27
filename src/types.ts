export type Stack =
  | 'node'
  | 'maven'
  | 'gradle'
  | 'compose'
  | 'rust'
  | 'go'
  | 'python'
  | 'unknown'

export interface ProjectConfig {
  name: string
  path: string
  stack: Stack
  runCommand: string
  pinned: boolean
  hidden: boolean
  missing?: boolean
  lastRunAt?: string
}

export interface Config {
  rootFolders: string[]
  editorCommand: string
  projects: Record<string, ProjectConfig>
}

export interface ScannedProject {
  id: string
  name: string
  path: string
  stack: Stack
  suggestedCommand: string
}

export type ProcessStatus = 'running' | 'stopped'

export interface LogLine {
  text: string
  stream: 'stdout' | 'stderr'
}

export interface RootFolderStatus {
  path: string
  exists: boolean
}
