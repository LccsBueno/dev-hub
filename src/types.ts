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
  tags: string[]
  notes: string
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

export interface GitCommit {
  hash: string
  message: string
  author: string
  relativeDate: string
}

export interface GitInfo {
  isRepo: boolean
  currentBranch: string | null
  branches: string[]
  commits: GitCommit[]
}

export const emptyGitInfo: GitInfo = { isRepo: false, currentBranch: null, branches: [], commits: [] }
