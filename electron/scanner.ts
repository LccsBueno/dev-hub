import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { basename, join } from 'path'
import { createHash } from 'crypto'
import type { ScannedProject, Stack } from '../src/types'

export interface Detection {
  stack: Stack
  suggestedCommand: string
}

export function projectId(absPath: string): string {
  return createHash('sha1').update(absPath.toLowerCase()).digest('hex').slice(0, 12)
}

function detectNodeCommand(dir: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
    const scripts: Record<string, string> = pkg.scripts ?? {}
    if (scripts['dev']) return 'npm run dev'
    const devScript = Object.keys(scripts).find(
      (name) => name.includes('dev') && !name.startsWith('pre') && !name.startsWith('post')
    )
    if (devScript) return `npm run ${devScript}`
  } catch {
    // unreadable package.json — fall through to default
  }
  return 'npm start'
}

export function detectStack(dir: string): Detection | null {
  const has = (file: string): boolean => existsSync(join(dir, file))

  if (has('package.json')) return { stack: 'node', suggestedCommand: detectNodeCommand(dir) }
  if (has('pom.xml')) return { stack: 'maven', suggestedCommand: 'mvn spring-boot:run' }
  if (has('build.gradle') || has('build.gradle.kts'))
    return { stack: 'gradle', suggestedCommand: 'gradle bootRun' }
  if (has('docker-compose.yml') || has('compose.yml'))
    return { stack: 'compose', suggestedCommand: 'docker compose up' }
  if (has('Cargo.toml')) return { stack: 'rust', suggestedCommand: 'cargo run' }
  if (has('go.mod')) return { stack: 'go', suggestedCommand: 'go run .' }
  if (has('pyproject.toml') || has('requirements.txt'))
    return { stack: 'python', suggestedCommand: 'python main.py' }
  if (has('.git')) return { stack: 'unknown', suggestedCommand: '' }
  return null
}

export function scanRoots(roots: string[]): ScannedProject[] {
  const results: ScannedProject[] = []
  for (const rootFolder of roots) {
    let entries: string[]
    try {
      entries = readdirSync(rootFolder)
    } catch {
      continue
    }
    for (const entry of entries) {
      const dir = join(rootFolder, entry)
      try {
        if (!statSync(dir).isDirectory()) continue
      } catch {
        continue
      }
      const detection = detectStack(dir)
      if (!detection) continue
      results.push({
        id: projectId(dir),
        name: basename(dir),
        path: dir,
        stack: detection.stack,
        suggestedCommand: detection.suggestedCommand
      })
    }
  }
  return results
}
