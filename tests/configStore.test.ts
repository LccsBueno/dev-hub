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
          hidden: false
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

  it('adds new projects with the suggested command', () => {
    const merged = mergeProjects({}, [scannedDemo])
    expect(merged['id1']).toEqual({
      name: 'demo',
      path: 'C:\\dev\\demo',
      stack: 'node',
      runCommand: 'npm run dev',
      pinned: false,
      hidden: false,
      missing: false
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
        hidden: false
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
        missing: true
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
        hidden: true
      }
    }
    const merged = mergeProjects(existing, [scannedDemo])
    expect(merged['gone']).toEqual({ ...existing['gone'], missing: true })
    expect(merged['id1']).toBeDefined()
  })
})
