import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { Config } from '../src/types'

export function defaultConfig(): Config {
  return { rootFolders: [], editorCommand: 'code', projects: {} }
}

export function loadConfig(filePath: string): Config {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    return {
      rootFolders: Array.isArray(parsed.rootFolders) ? parsed.rootFolders : [],
      editorCommand:
        typeof parsed.editorCommand === 'string' && parsed.editorCommand.length > 0
          ? parsed.editorCommand
          : 'code',
      projects:
        typeof parsed.projects === 'object' && parsed.projects !== null
          ? parsed.projects
          : {}
    }
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(filePath: string, config: Config): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')
}
