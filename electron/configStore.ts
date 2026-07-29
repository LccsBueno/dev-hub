import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { Config, ProjectConfig, ScannedProject } from '../src/types'

export function defaultConfig(): Config {
  return { rootFolders: [], editorCommand: 'code', projects: {}, tagColors: {} }
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
          : {},
      tagColors:
        typeof parsed.tagColors === 'object' && parsed.tagColors !== null
          ? parsed.tagColors
          : {}
    }
  } catch (err) {
    console.error('[configStore] failed to load config, using defaults:', err)
    return defaultConfig()
  }
}

export function saveConfig(filePath: string, config: Config): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')
}

export function mergeProjects(
  existing: Record<string, ProjectConfig>,
  scanned: ScannedProject[]
): Record<string, ProjectConfig> {
  const merged: Record<string, ProjectConfig> = {}
  const scannedIds = new Set(scanned.map((s) => s.id))

  for (const s of scanned) {
    const prev = existing[s.id]
    if (prev) {
      merged[s.id] = {
        ...prev,
        name: s.name,
        path: s.path,
        stack: s.stack,
        missing: false,
        tags: prev.tags ?? [],
        notes: prev.notes ?? '',
        hasDockerfile: s.hasDockerfile,
        runMode: s.hasDockerfile ? (prev.runMode ?? 'native') : 'native'
      }
    } else {
      merged[s.id] = {
        name: s.name,
        path: s.path,
        stack: s.stack,
        runCommand: s.suggestedCommand,
        pinned: false,
        hidden: false,
        missing: false,
        tags: [],
        notes: '',
        hasDockerfile: s.hasDockerfile,
        runMode: 'native'
      }
    }
  }

  for (const [id, p] of Object.entries(existing)) {
    if (!scannedIds.has(id)) {
      merged[id] = {
        ...p,
        missing: true,
        tags: p.tags ?? [],
        notes: p.notes ?? '',
        hasDockerfile: p.hasDockerfile ?? false,
        runMode: p.hasDockerfile ? (p.runMode ?? 'native') : 'native'
      }
    }
  }

  return merged
}
