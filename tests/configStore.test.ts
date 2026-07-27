import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { loadConfig, saveConfig, defaultConfig } from '../electron/configStore'
import type { Config } from '../src/types'

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
