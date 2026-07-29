import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { loadConfig, saveConfig, defaultConfig, mergeProjects } from '../electron/configStore'
import type { Config, ScannedProject, ProjectConfig } from '../src/types'

let dir: string
let file: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pm-config-'))
  file = join(dir, 'config.json')
})

describe('loadConfig', () => {
  it('returns defaults when file does not exist', () => {
    const cfg = loadConfig(file)
    expect(cfg).toEqual({ rootFolders: [], editorCommand: 'code', projects: {}, tagColors: {} })
  })

  it('returns defaults when file is corrupt JSON', () => {
    writeFileSync(file, '{not json!!', 'utf-8')
    const cfg = loadConfig(file)
    expect(cfg).toEqual(defaultConfig())
  })

  it('fills missing fields with defaults', () => {
    writeFileSync(file, JSON.stringify({ rootFolders: ['C:\\dev'] }), 'utf-8')
    const cfg = loadConfig(file)
    expect(cfg.rootFolders).toEqual(['C:\\dev'])
    expect(cfg.editorCommand).toBe('code')
    expect(cfg.projects).toEqual({})
  })

  it('round-trips through saveConfig', () => {
    const cfg: Config = {
      rootFolders: ['C:\\dev\\projetos'],
      editorCommand: 'cursor',
      projects: {
        abc123: {
          name: 'demo',
          path: 'C:\\dev\\projetos\\demo',
          stack: 'node',
          runCommand: 'npm run dev',
          pinned: true,
          hidden: false,
          tags: ['tooling'],
          notes: 'test notes',
          hasDockerfile: true,
          runMode: 'docker'
        }
      },
      tagColors: { tooling: '#78c091' }
    }
    saveConfig(file, cfg)
    expect(loadConfig(file)).toEqual(cfg)
    // saved file is pretty-printed JSON
    expect(readFileSync(file, 'utf-8')).toContain('\n')
  })
})

describe('mergeProjects', () => {
  const scannedDemo: ScannedProject = {
    id: 'id1',
    name: 'demo',
    path: 'C:\\dev\\demo',
    stack: 'node',
    suggestedCommand: 'npm run dev',
    hasDockerfile: false
  }

  it('adds new projects with the suggested command and empty tags/notes', () => {
    const merged = mergeProjects({}, [scannedDemo])
    expect(merged['id1']).toEqual({
      name: 'demo',
      path: 'C:\\dev\\demo',
      stack: 'node',
      runCommand: 'npm run dev',
      pinned: false,
      hidden: false,
      missing: false,
      tags: [],
      notes: '',
      hasDockerfile: false,
      runMode: 'native'
    })
  })

  it('never overwrites a user-edited runCommand on rescan', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'demo',
        path: 'C:\\dev\\demo',
        stack: 'node',
        runCommand: 'npm run start:custom',
        pinned: true,
        hidden: false,
        tags: ['client-x'],
        notes: 'important',
        hasDockerfile: false,
        runMode: 'native'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['id1'].runCommand).toBe('npm run start:custom')
    expect(merged['id1'].pinned).toBe(true)
  })

  it('refreshes name and stack from scan for existing projects', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'old-name',
        path: 'C:\\dev\\demo',
        stack: 'unknown',
        runCommand: 'x',
        pinned: false,
        hidden: false,
        missing: true,
        tags: [],
        notes: '',
        hasDockerfile: false,
        runMode: 'native'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['id1'].name).toBe('demo')
    expect(merged['id1'].stack).toBe('node')
    expect(merged['id1'].missing).toBe(false)
  })

  it('flags projects not found on disk as missing instead of deleting them', () => {
    const existing: Record<string, ProjectConfig> = {
      gone: {
        name: 'gone',
        path: 'D:\\gone',
        stack: 'python',
        runCommand: 'python main.py',
        pinned: false,
        hidden: true,
        tags: [],
        notes: '',
        hasDockerfile: false,
        runMode: 'native'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['gone']).toEqual({ ...existing['gone'], missing: true })
    expect(merged['id1']).toBeDefined()
  })

  it('preserves tags and notes across rescans', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'demo',
        path: 'C:\\dev\\demo',
        stack: 'node',
        runCommand: 'npm run dev',
        pinned: false,
        hidden: false,
        tags: ['scraper', 'client-x'],
        notes: 'remember to update the .env file',
        hasDockerfile: false,
        runMode: 'native'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['id1'].tags).toEqual(['scraper', 'client-x'])
    expect(merged['id1'].notes).toBe('remember to update the .env file')
  })

  it('backfills tags and notes for pre-existing entries that lack them', () => {
    const legacyEntry = {
      name: 'demo',
      path: 'C:\\dev\\demo',
      stack: 'node',
      runCommand: 'npm run dev',
      pinned: false,
      hidden: false
    } as ProjectConfig
    const merged = mergeProjects({ id1: legacyEntry }, [scannedDemo])
    expect(merged['id1'].tags).toEqual([])
    expect(merged['id1'].notes).toBe('')
  })

  it('backfills tags and notes for legacy entries that go missing on rescan', () => {
    const legacyGone = {
      name: 'gone',
      path: 'D:\\gone',
      stack: 'python',
      runCommand: 'python main.py',
      pinned: false,
      hidden: true
    } as ProjectConfig
    const merged = mergeProjects({ gone: legacyGone }, [scannedDemo])
    expect(merged['gone'].tags).toEqual([])
    expect(merged['gone'].notes).toBe('')
    expect(merged['gone'].missing).toBe(true)
  })

  it('carries hasDockerfile from the scan and defaults runMode to native for new projects', () => {
    const scannedWithDocker: ScannedProject = { ...scannedDemo, hasDockerfile: true }
    const merged = mergeProjects({}, [scannedWithDocker])
    expect(merged['id1'].hasDockerfile).toBe(true)
    expect(merged['id1'].runMode).toBe('native')
  })

  it('preserves a docker runMode across rescans while the Dockerfile is still present', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'demo',
        path: 'C:\\dev\\demo',
        stack: 'node',
        runCommand: 'npm run dev',
        pinned: false,
        hidden: false,
        tags: [],
        notes: '',
        hasDockerfile: true,
        runMode: 'docker'
      }
    }
    const scannedWithDocker: ScannedProject = { ...scannedDemo, hasDockerfile: true }
    const merged = mergeProjects(existing, [scannedWithDocker])
    expect(merged['id1'].runMode).toBe('docker')
  })

  it('forces runMode back to native when the Dockerfile disappears on rescan', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'demo',
        path: 'C:\\dev\\demo',
        stack: 'node',
        runCommand: 'npm run dev',
        pinned: false,
        hidden: false,
        tags: [],
        notes: '',
        hasDockerfile: true,
        runMode: 'docker'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['id1'].hasDockerfile).toBe(false)
    expect(merged['id1'].runMode).toBe('native')
  })

  it('forces runMode back to native for a docker-mode project that goes missing and lacks a Dockerfile', () => {
    const existing: Record<string, ProjectConfig> = {
      gone: {
        name: 'gone',
        path: 'D:\\gone',
        stack: 'python',
        runCommand: 'python main.py',
        pinned: false,
        hidden: true,
        tags: [],
        notes: '',
        hasDockerfile: false,
        runMode: 'docker'
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['gone'].runMode).toBe('native')
    expect(merged['gone'].missing).toBe(true)
  })

  it('backfills hasDockerfile and runMode for legacy entries lacking them', () => {
    const legacyEntry = {
      name: 'demo',
      path: 'C:\\dev\\demo',
      stack: 'node',
      runCommand: 'npm run dev',
      pinned: false,
      hidden: false
    } as ProjectConfig
    const merged = mergeProjects({ id1: legacyEntry }, [scannedDemo])
    expect(merged['id1'].hasDockerfile).toBe(false)
    expect(merged['id1'].runMode).toBe('native')
  })

  it('never auto-switches a project into docker mode just because a Dockerfile is present', () => {
    const existing: Record<string, ProjectConfig> = {
      id1: {
        name: 'demo',
        path: 'C:\\dev\\demo',
        stack: 'node',
        runCommand: 'npm run dev',
        pinned: false,
        hidden: false,
        tags: [],
        notes: '',
        hasDockerfile: false,
        runMode: 'native'
      }
    }
    const scannedWithDocker: ScannedProject = { ...scannedDemo, hasDockerfile: true }
    const merged = mergeProjects(existing, [scannedWithDocker])
    expect(merged['id1'].hasDockerfile).toBe(true)
    expect(merged['id1'].runMode).toBe('native')
  })

  it('backfills hasDockerfile and runMode for legacy entries that go missing on rescan', () => {
    const legacyGone = {
      name: 'gone',
      path: 'D:\\gone',
      stack: 'python',
      runCommand: 'python main.py',
      pinned: false,
      hidden: true
    } as ProjectConfig
    const merged = mergeProjects({ gone: legacyGone }, [scannedDemo])
    expect(merged['gone'].hasDockerfile).toBe(false)
    expect(merged['gone'].runMode).toBe('native')
  })
})
