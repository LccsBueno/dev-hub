import { describe, it, expect } from 'vitest'
import { filterProjects } from '../src/lib/filterProjects'
import type { ProjectConfig } from '../src/types'

function makeProject(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    name: 'demo',
    path: 'C:\\dev\\projetos\\demo',
    stack: 'node',
    runCommand: 'npm run dev',
    pinned: false,
    hidden: false,
    tags: [],
    notes: '',
    hasDockerfile: false,
    runMode: 'native',
    ...overrides
  }
}

describe('filterProjects', () => {
  it('excludes hidden projects from every nav except archived', () => {
    // b is pinned and running so it independently satisfies the 'running' and
    // 'favorites' nav filters too — isolating hidden-exclusion as the only
    // variable under test across all three navs.
    const projects = {
      a: makeProject({ hidden: true }),
      b: makeProject({ name: 'visible', pinned: true })
    }
    for (const nav of ['all', 'running', 'favorites'] as const) {
      const result = filterProjects(projects, {
        nav,
        selectedRoot: null,
        search: '',
        stack: 'all',
        runningIds: ['b']
      })
      expect(Object.keys(result)).toEqual(['b'])
    }
  })

  it('archived nav shows only hidden projects', () => {
    const projects = { a: makeProject({ hidden: true }), b: makeProject({ name: 'visible' }) }
    const result = filterProjects(projects, {
      nav: 'archived',
      selectedRoot: null,
      search: '',
      stack: 'all',
      runningIds: []
    })
    expect(Object.keys(result)).toEqual(['a'])
  })

  it('running nav shows only projects with a running id', () => {
    const projects = { a: makeProject(), b: makeProject({ name: 'other' }) }
    const result = filterProjects(projects, {
      nav: 'running',
      selectedRoot: null,
      search: '',
      stack: 'all',
      runningIds: ['a']
    })
    expect(Object.keys(result)).toEqual(['a'])
  })

  it('favorites nav shows only pinned projects', () => {
    const projects = { a: makeProject({ pinned: true }), b: makeProject({ name: 'other' }) }
    const result = filterProjects(projects, {
      nav: 'favorites',
      selectedRoot: null,
      search: '',
      stack: 'all',
      runningIds: []
    })
    expect(Object.keys(result)).toEqual(['a'])
  })

  it('scopes to a selected root folder by exact path-segment prefix, not a loose string match', () => {
    const projects = {
      a: makeProject({ path: 'C:\\dev\\projetos\\demo' }),
      b: makeProject({ name: 'other', path: 'C:\\dev\\projetos2\\demo' })
    }
    const result = filterProjects(projects, {
      nav: 'all',
      selectedRoot: 'C:\\dev\\projetos',
      search: '',
      stack: 'all',
      runningIds: []
    })
    expect(Object.keys(result)).toEqual(['a'])
  })

  it('combines search and stack filters with the active nav', () => {
    const projects = {
      a: makeProject({ name: 'api-financas', stack: 'node' }),
      b: makeProject({ name: 'api-python', stack: 'python' }),
      c: makeProject({ name: 'other-node', stack: 'node' })
    }
    const result = filterProjects(projects, {
      nav: 'all',
      selectedRoot: null,
      search: 'api',
      stack: 'node',
      runningIds: []
    })
    expect(Object.keys(result)).toEqual(['a'])
  })
})

describe('countProjectsUnderRoot', () => {
  it('counts non-hidden projects whose path starts with the root, by path segment', async () => {
    const { countProjectsUnderRoot } = await import('../src/lib/filterProjects')
    const projects = {
      a: makeProject({ path: 'C:\\dev\\projetos\\demo' }),
      b: makeProject({ name: 'archived', path: 'C:\\dev\\projetos\\other', hidden: true }),
      c: makeProject({ name: 'unrelated', path: 'C:\\dev\\projetos2\\demo' })
    }
    expect(countProjectsUnderRoot(projects, 'C:\\dev\\projetos')).toBe(1)
  })
})
