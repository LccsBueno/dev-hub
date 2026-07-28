import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { scanRoots, detectStack, projectId } from '../electron/scanner'

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
    expect(detectStack(dir)).toEqual({ stack: 'node', suggestedCommand: 'npm run dev:web' })
  })

  it('falls back to npm start when node project has start but no dev script', () => {
    const dir = makeProject('api', {
      'package.json': JSON.stringify({ scripts: { start: 'node server.js' } })
    })
    expect(detectStack(dir)).toEqual({ stack: 'node', suggestedCommand: 'npm start' })
  })

  it('prefers the exact dev script over other dev-ish scripts', () => {
    const dir = makeProject('exact', {
      'package.json': JSON.stringify({ scripts: { 'build:dev': 'x', dev: 'vite' } })
    })
    expect(detectStack(dir)).toEqual({ stack: 'node', suggestedCommand: 'npm run dev' })
  })

  it('ignores pre/post hook scripts when picking a dev script', () => {
    const dir = makeProject('hooks', {
      'package.json': JSON.stringify({ scripts: { predev: 'x', start: 'node .' } })
    })
    expect(detectStack(dir)).toEqual({ stack: 'node', suggestedCommand: 'npm start' })
  })

  it('detects maven', () => {
    const dir = makeProject('spring', { 'pom.xml': '<project/>' })
    expect(detectStack(dir)).toEqual({ stack: 'maven', suggestedCommand: 'mvn spring-boot:run' })
  })

  it('detects gradle (kts too)', () => {
    const dir = makeProject('kt', { 'build.gradle.kts': '' })
    expect(detectStack(dir)).toEqual({ stack: 'gradle', suggestedCommand: 'gradle bootRun' })
  })

  it('detects docker compose', () => {
    const dir = makeProject('infra', { 'docker-compose.yml': '' })
    expect(detectStack(dir)).toEqual({ stack: 'compose', suggestedCommand: 'docker compose up' })
  })

  it('detects rust, go and python', () => {
    expect(detectStack(makeProject('r', { 'Cargo.toml': '' }))).toEqual({
      stack: 'rust',
      suggestedCommand: 'cargo run'
    })
    expect(detectStack(makeProject('g', { 'go.mod': '' }))).toEqual({
      stack: 'go',
      suggestedCommand: 'go run .'
    })
    expect(detectStack(makeProject('p', { 'requirements.txt': '' }))).toEqual({
      stack: 'python',
      suggestedCommand: 'python main.py'
    })
  })

  it('treats git-only folders as unknown-stack projects with empty command', () => {
    const dir = makeProject('gitonly', { '.git/': '' })
    expect(detectStack(dir)).toEqual({ stack: 'unknown', suggestedCommand: '' })
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
})
