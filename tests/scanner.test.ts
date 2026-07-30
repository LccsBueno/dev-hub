import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { scanRoots, detectStack, detectFramework, projectId } from '../electron/scanner'

let root: string

function makeProject(name: string, files: Record<string, string>): string {
  const dir = join(root, name)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    const full = join(dir, file)
    mkdirSync(join(full, '..'), { recursive: true })
    if (file.endsWith('/')) {
      mkdirSync(full, { recursive: true })
    } else {
      writeFileSync(full, content, 'utf-8')
    }
  }
  return dir
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pm-scan-'))
})

describe('detectStack', () => {
  it('detects node and prefers a dev script', () => {
    const dir = makeProject('web', {
      'package.json': JSON.stringify({ scripts: { 'dev:web': 'vite', start: 'node .' } })
    })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'node', suggestedCommand: 'npm run dev:web' }))
  })

  it('falls back to npm start when node project has start but no dev script', () => {
    const dir = makeProject('api', {
      'package.json': JSON.stringify({ scripts: { start: 'node server.js' } })
    })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'node', suggestedCommand: 'npm start' }))
  })

  it('prefers the exact dev script over other dev-ish scripts', () => {
    const dir = makeProject('exact', {
      'package.json': JSON.stringify({ scripts: { 'build:dev': 'x', dev: 'vite' } })
    })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'node', suggestedCommand: 'npm run dev' }))
  })

  it('ignores pre/post hook scripts when picking a dev script', () => {
    const dir = makeProject('hooks', {
      'package.json': JSON.stringify({ scripts: { predev: 'x', start: 'node .' } })
    })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'node', suggestedCommand: 'npm start' }))
  })

  it('detects maven', () => {
    const dir = makeProject('spring', { 'pom.xml': '<project/>' })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'maven', suggestedCommand: 'mvn spring-boot:run' }))
  })

  it('detects gradle (kts too)', () => {
    const dir = makeProject('kt', { 'build.gradle.kts': '' })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'gradle', suggestedCommand: 'gradle bootRun' }))
  })

  it('detects docker compose', () => {
    const dir = makeProject('infra', { 'docker-compose.yml': '' })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'compose', suggestedCommand: 'docker compose up' }))
  })

  it('detects rust, go and python', () => {
    expect(detectStack(makeProject('r', { 'Cargo.toml': '' }))).toEqual(expect.objectContaining({
      stack: 'rust',
      suggestedCommand: 'cargo run'
    }))
    expect(detectStack(makeProject('g', { 'go.mod': '' }))).toEqual(expect.objectContaining({
      stack: 'go',
      suggestedCommand: 'go run .'
    }))
    expect(detectStack(makeProject('p', { 'requirements.txt': '' }))).toEqual(expect.objectContaining({
      stack: 'python',
      suggestedCommand: 'python main.py'
    }))
  })

  it('treats git-only folders as unknown-stack projects with empty command', () => {
    const dir = makeProject('gitonly', { '.git/': '' })
    expect(detectStack(dir)).toEqual(expect.objectContaining({ stack: 'unknown', suggestedCommand: '' }))
  })

  it('returns null for folders with no marker and no .git', () => {
    const dir = makeProject('random', { 'notes.txt': 'hi' })
    expect(detectStack(dir)).toBeNull()
  })

  it('node marker wins over compose marker (priority order)', () => {
    const dir = makeProject('both', {
      'package.json': JSON.stringify({ scripts: { dev: 'vite' } }),
      'docker-compose.yml': ''
    })
    expect(detectStack(dir)!.stack).toBe('node')
  })
})

describe('scanRoots', () => {
  it('scans direct subdirectories of each root, skipping non-projects', () => {
    makeProject('web', { 'package.json': '{}' })
    makeProject('notes', { 'a.txt': '' })
    const projects = scanRoots([root])
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('web')
    expect(projects[0].path).toBe(join(root, 'web'))
  })

  it('ignores roots that do not exist', () => {
    expect(scanRoots(['Z:\\nope\\missing'])).toEqual([])
  })

  it('generates stable ids from the path', () => {
    const dir = makeProject('web', { 'package.json': '{}' })
    const [p] = scanRoots([root])
    expect(p.id).toBe(projectId(dir))
    expect(p.id).toMatch(/^[a-f0-9]{12}$/)
  })

  it('discovers projects nested one level inside a marker-less container folder', () => {
    const containerDir = join(root, 'bot')
    mkdirSync(containerDir, { recursive: true })
    const child1 = join(containerDir, 'insta-bot')
    mkdirSync(child1, { recursive: true })
    writeFileSync(join(child1, 'package.json'), '{}', 'utf-8')
    const child2 = join(containerDir, 'no-marker-here')
    mkdirSync(child2, { recursive: true })

    const projects = scanRoots([root])
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('insta-bot')
    expect(projects[0].path).toBe(child1)
  })

  it('does not scan into the children of a directory that is itself a project', () => {
    const projectDir = makeProject('monorepo', { 'package.json': '{}' })
    mkdirSync(join(projectDir, 'packages', 'internal-lib'), { recursive: true })
    writeFileSync(join(projectDir, 'packages', 'internal-lib', 'package.json'), '{}', 'utf-8')

    const projects = scanRoots([root])
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('monorepo')
  })

  it('flags hasDockerfile true when a Dockerfile is present', () => {
    makeProject('containerized', { 'package.json': '{}', Dockerfile: 'FROM node' })
    const [p] = scanRoots([root])
    expect(p.hasDockerfile).toBe(true)
  })

  it('flags hasDockerfile false when no Dockerfile is present', () => {
    makeProject('plain', { 'package.json': '{}' })
    const [p] = scanRoots([root])
    expect(p.hasDockerfile).toBe(false)
  })
})

describe('detectFramework', () => {
  it('detects NestJS from @nestjs/core in dependencies', () => {
    const dir = makeProject('nest', {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0', express: '4.0.0' } })
    })
    const result = detectFramework(dir, 'node')
    expect(result).toEqual({ framework: 'nestjs', inferredPort: 3000 })
  })

  it('detects Next.js from next in dependencies (no NestJS)', () => {
    const dir = makeProject('next', {
      'package.json': JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } })
    })
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'nextjs', inferredPort: 3000 })
  })

  it('detects fastify', () => {
    const dir = makeProject('fast', {
      'package.json': JSON.stringify({ dependencies: { fastify: '4.0.0' } })
    })
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'fastify', inferredPort: 3000 })
  })

  it('detects express', () => {
    const dir = makeProject('exp', {
      'package.json': JSON.stringify({ dependencies: { express: '4.0.0' } })
    })
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'express', inferredPort: 3000 })
  })

  it('detects vite-react from vite + @vitejs/plugin-react (no server framework)', () => {
    const dir = makeProject('vr', {
      'package.json': JSON.stringify({
        devDependencies: { vite: '5.0.0', '@vitejs/plugin-react': '4.0.0' }
      })
    })
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'vite-react', inferredPort: 5173 })
  })

  it('NestJS takes priority over express when both present', () => {
    const dir = makeProject('nest2', {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0', express: '4.0.0' } })
    })
    expect(detectFramework(dir, 'node').framework).toBe('nestjs')
  })

  it('falls back to node when no known framework found in package.json', () => {
    const dir = makeProject('plain', {
      'package.json': JSON.stringify({ dependencies: { lodash: '4.0.0' } })
    })
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'node', inferredPort: 3000 })
  })

  it('detects FastAPI from requirements.txt', () => {
    const dir = makeProject('fapi', { 'requirements.txt': 'fastapi==0.110.0\nuvicorn' })
    expect(detectFramework(dir, 'python')).toEqual({ framework: 'fastapi', inferredPort: 8000 })
  })

  it('detects Django from requirements.txt (case-insensitive)', () => {
    const dir = makeProject('dj', { 'requirements.txt': 'Django==4.2\npsycopg2' })
    expect(detectFramework(dir, 'python')).toEqual({ framework: 'django', inferredPort: 8000 })
  })

  it('detects Flask from requirements.txt', () => {
    const dir = makeProject('fl', { 'requirements.txt': 'flask==3.0.0' })
    expect(detectFramework(dir, 'python')).toEqual({ framework: 'flask', inferredPort: 5000 })
  })

  it('detects Spring Boot from pom.xml', () => {
    const dir = makeProject('sb', { 'pom.xml': '<parent><artifactId>spring-boot-starter-parent</artifactId></parent>' })
    expect(detectFramework(dir, 'maven')).toEqual({ framework: 'spring-boot', inferredPort: 8080 })
  })

  it('falls back to maven when pom.xml has no spring-boot reference', () => {
    const dir = makeProject('plain-maven', { 'pom.xml': '<project><groupId>com.example</groupId></project>' })
    expect(detectFramework(dir, 'maven')).toEqual({ framework: 'maven', inferredPort: 8080 })
  })

  it('detects Spring Boot from build.gradle', () => {
    const dir = makeProject('sbg', {
      'build.gradle': "plugins { id 'org.springframework.boot' version '3.2.0' }"
    })
    expect(detectFramework(dir, 'gradle')).toEqual({ framework: 'spring-boot', inferredPort: 8080 })
  })

  it('falls back to gradle when no spring-boot plugin found', () => {
    const dir = makeProject('plain-gradle', { 'build.gradle': "plugins { id 'java' }" })
    expect(detectFramework(dir, 'gradle')).toEqual({ framework: 'gradle', inferredPort: 8080 })
  })

  it('returns go/rust/compose/unknown with their fixed ports', () => {
    const tmp = makeProject('g', {})
    expect(detectFramework(tmp, 'go')).toEqual({ framework: 'go', inferredPort: 8080 })
    expect(detectFramework(tmp, 'rust')).toEqual({ framework: 'rust', inferredPort: 8080 })
    expect(detectFramework(tmp, 'compose')).toEqual({ framework: 'compose', inferredPort: 0 })
    expect(detectFramework(tmp, 'unknown')).toEqual({ framework: 'unknown', inferredPort: 0 })
  })

  it('does not throw when package.json is missing or corrupt', () => {
    const dir = makeProject('corrupt', { 'package.json': '{not json' })
    expect(() => detectFramework(dir, 'node')).not.toThrow()
    expect(detectFramework(dir, 'node')).toEqual({ framework: 'node', inferredPort: 3000 })
  })
})
