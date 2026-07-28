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
    expect(cfg).toEqual({ rootFolders: [], editorCommand: 'code', projects: {} })
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
          notes: 'test notes'
        }
      }
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
    suggestedCommand: 'npm run dev'
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
      notes: ''
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
        notes: 'important'
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
        notes: ''
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
        notes: ''
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
        notes: 'remember to update the .env file'
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
})
