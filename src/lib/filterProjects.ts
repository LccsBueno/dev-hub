import type { ProjectConfig, Stack } from '../types'

export type NavFilter = 'all' | 'running' | 'favorites' | 'archived'

export interface FilterCriteria {
  nav: NavFilter
  selectedRoot: string | null
  search: string
  stack: Stack | 'all'
  runningIds: string[]
}

function isUnderRoot(path: string, root: string): boolean {
  const prefix = root.endsWith('\\') ? root : `${root}\\`
  return path.startsWith(prefix)
}

export function filterProjects(
  projects: Record<string, ProjectConfig>,
  criteria: FilterCriteria
): Record<string, ProjectConfig> {
  const runningSet = new Set(criteria.runningIds)
  const search = criteria.search.trim().toLowerCase()

  return Object.fromEntries(
    Object.entries(projects).filter(([id, p]) => {
      if (criteria.nav === 'archived') {
        if (!p.hidden) return false
      } else if (p.hidden) {
        return false
      }

      if (criteria.nav === 'running' && !runningSet.has(id)) return false
      if (criteria.nav === 'favorites' && !p.pinned) return false

      if (criteria.selectedRoot && !isUnderRoot(p.path, criteria.selectedRoot)) return false

      if (search && !p.name.toLowerCase().includes(search)) return false
      if (criteria.stack !== 'all' && p.stack !== criteria.stack) return false

      return true
    })
  )
}

export function countProjectsUnderRoot(projects: Record<string, ProjectConfig>, root: string): number {
  return Object.values(projects).filter((p) => !p.hidden && isUnderRoot(p.path, root)).length
}
