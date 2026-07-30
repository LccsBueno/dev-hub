export type Stack =
  | 'node'
  | 'maven'
  | 'gradle'
  | 'compose'
  | 'rust'
  | 'go'
  | 'python'
  | 'unknown'

export type Framework =
  | 'nestjs'
  | 'nextjs'
  | 'express'
  | 'fastify'
  | 'vite-react'
  | 'node'
  | 'fastapi'
  | 'django'
  | 'flask'
  | 'python'
  | 'spring-boot'
  | 'maven'
  | 'gradle'
  | 'go'
  | 'rust'
  | 'compose'
  | 'unknown'

export type RunMode = 'native' | 'docker'

export interface ProjectConfig {
  name: string
  path: string
  stack: Stack
  framework: Framework
  inferredPort: number
  runCommand: string
  pinned: boolean
  hidden: boolean
  missing?: boolean
  lastRunAt?: string
  lastModifiedAt?: number
  tags: string[]
  notes: string
  hasDockerfile: boolean
  runMode: RunMode
}

export interface Config {
  rootFolders: string[]
  editorCommand: string
  projects: Record<string, ProjectConfig>
  tagColors: Record<string, string>
  dockerGroups: DockerGroup[]
}

export interface ScannedProject {
  id: string
  name: string
  path: string
  stack: Stack
  framework: Framework
  inferredPort: number
  suggestedCommand: string
  hasDockerfile: boolean
  lastModifiedAt: number
}

export type DockerState =
  | 'running'
  | 'exited'
  | 'created'
  | 'paused'
  | 'restarting'
  | 'dead'
  | 'unknown'

export interface DockerContainerInfo {
  id: string
  name: string
  image: string
  status: string
  state: DockerState
  ports: string
  startedAt: string | null
  composeProject?: string
  composeService?: string
}

export interface DockerMount {
  source: string
  destination: string
  mode: string
}

export interface DockerGroup {
  id: string
  name: string
  containerNames: string[]
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
