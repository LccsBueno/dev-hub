import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { basename, join } from 'path'
import { createHash } from 'crypto'
import type { ScannedProject, Stack, Framework } from '../src/types'

export interface Detection {
  stack: Stack
  framework: Framework
  inferredPort: number
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

function tryRead(path: string): string {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

export function detectFramework(dir: string, stack: Stack): { framework: Framework; inferredPort: number } {
  if (stack === 'node') {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
      const deps: Record<string, string> = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
      if (deps['@nestjs/core']) return { framework: 'nestjs', inferredPort: 3000 }
      if (deps['next']) return { framework: 'nextjs', inferredPort: 3000 }
      if (deps['fastify']) return { framework: 'fastify', inferredPort: 3000 }
      if (deps['express']) return { framework: 'express', inferredPort: 3000 }
      if (deps['vite'] && deps['@vitejs/plugin-react']) return { framework: 'vite-react', inferredPort: 5173 }
    } catch { /* ignore */ }
    return { framework: 'node', inferredPort: 3000 }
  }
  if (stack === 'python') {
    try {
      const content = (
        tryRead(join(dir, 'requirements.txt')) + '\n' + tryRead(join(dir, 'pyproject.toml'))
      ).toLowerCase()
      if (content.includes('fastapi')) return { framework: 'fastapi', inferredPort: 8000 }
      if (content.includes('django')) return { framework: 'django', inferredPort: 8000 }
      if (content.includes('flask')) return { framework: 'flask', inferredPort: 5000 }
    } catch { /* ignore */ }
    return { framework: 'python', inferredPort: 8000 }
  }
  if (stack === 'maven') {
    try {
      const content = tryRead(join(dir, 'pom.xml')).toLowerCase()
      if (content.includes('spring-boot')) return { framework: 'spring-boot', inferredPort: 8080 }
    } catch { /* ignore */ }
    return { framework: 'maven', inferredPort: 8080 }
  }
  if (stack === 'gradle') {
    try {
      const content = (
        tryRead(join(dir, 'build.gradle')) + '\n' + tryRead(join(dir, 'build.gradle.kts'))
      ).toLowerCase()
      if (content.includes('spring-boot') || content.includes('springframework')) return { framework: 'spring-boot', inferredPort: 8080 }
    } catch { /* ignore */ }
    return { framework: 'gradle', inferredPort: 8080 }
  }
  if (stack === 'go') return { framework: 'go', inferredPort: 8080 }
  if (stack === 'rust') return { framework: 'rust', inferredPort: 8080 }
  if (stack === 'compose') return { framework: 'compose', inferredPort: 0 }
  return { framework: 'unknown', inferredPort: 0 }
}

export function detectStack(dir: string): Detection | null {
  const has = (file: string): boolean => existsSync(join(dir, file))

  let stack: Stack
  let suggestedCommand: string

  if (has('package.json')) { stack = 'node'; suggestedCommand = detectNodeCommand(dir) }
  else if (has('pom.xml')) { stack = 'maven'; suggestedCommand = 'mvn spring-boot:run' }
  else if (has('build.gradle') || has('build.gradle.kts')) { stack = 'gradle'; suggestedCommand = 'gradle bootRun' }
  else if (has('docker-compose.yml') || has('compose.yml')) { stack = 'compose'; suggestedCommand = 'docker compose up' }
  else if (has('Cargo.toml')) { stack = 'rust'; suggestedCommand = 'cargo run' }
  else if (has('go.mod')) { stack = 'go'; suggestedCommand = 'go run .' }
  else if (has('pyproject.toml') || has('requirements.txt')) { stack = 'python'; suggestedCommand = 'python main.py' }
  else if (has('.git')) { stack = 'unknown'; suggestedCommand = '' }
  else return null

  const { framework, inferredPort } = detectFramework(dir, stack)
  return { stack, framework, inferredPort, suggestedCommand }
}

function scanEntry(dir: string): ScannedProject | null {
  const detection = detectStack(dir)
  if (!detection) return null
  let lastModifiedAt = 0
  try {
    lastModifiedAt = statSync(dir).mtimeMs
  } catch {
    // ignore
  }
  return {
    id: projectId(dir),
    name: basename(dir),
    path: dir,
    stack: detection.stack,
    framework: detection.framework,
    inferredPort: detection.inferredPort,
    suggestedCommand: detection.suggestedCommand,
    hasDockerfile: existsSync(join(dir, 'Dockerfile')),
    lastModifiedAt
  }
}

function listSubdirs(parent: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(parent)
  } catch {
    return []
  }
  return entries
    .map((entry) => join(parent, entry))
    .filter((dir) => {
      try {
        return statSync(dir).isDirectory()
      } catch {
        return false
      }
    })
}

export function scanRoots(roots: string[]): ScannedProject[] {
  const results: ScannedProject[] = []
  for (const rootFolder of roots) {
    for (const dir of listSubdirs(rootFolder)) {
      const project = scanEntry(dir)
      if (project) {
        results.push(project)
        continue
      }
      for (const nested of listSubdirs(dir)) {
        const nestedProject = scanEntry(nested)
        if (nestedProject) results.push(nestedProject)
      }
    }
  }
  return results
}
