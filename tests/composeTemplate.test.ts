import { describe, it, expect } from 'vitest'
import { generateComposeTemplate, parseComposeHostPort } from '../src/lib/composeTemplate'
import type { ProjectConfig } from '../src/types'

function makeProject(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    name: 'my-api',
    path: 'C:\\dev\\my-api',
    stack: 'node',
    framework: 'nestjs',
    inferredPort: 3000,
    runCommand: 'npm run dev',
    pinned: false,
    hidden: false,
    tags: [],
    notes: '',
    hasDockerfile: false,
    hasDockerCompose: false,
    runMode: 'native',
    ...overrides
  }
}

describe('generateComposeTemplate', () => {
  it('includes the project name as container_name (spaces replaced with hyphens)', () => {
    const result = generateComposeTemplate(makeProject({ name: 'My Cool API' }))
    expect(result).toContain('container_name: my-cool-api')
  })

  it('NestJS: NODE_ENV=production and port 3000', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'nestjs', inferredPort: 3000 }))
    expect(result).toContain('- "3000:3000"')
    expect(result).toContain('NODE_ENV=production')
  })

  it('Next.js: includes NEXT_TELEMETRY_DISABLED', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'nextjs', inferredPort: 3000 }))
    expect(result).toContain('NEXT_TELEMETRY_DISABLED')
  })

  it('Express: port 3000, NODE_ENV', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'express', inferredPort: 3000 }))
    expect(result).toContain('- "3000:3000"')
    expect(result).toContain('NODE_ENV=production')
  })

  it('FastAPI: uvicorn command and port 8000', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'fastapi', inferredPort: 8000, stack: 'python' }))
    expect(result).toContain('uvicorn')
    expect(result).toContain('- "8000:8000"')
  })

  it('Django: DJANGO_SETTINGS_MODULE and port 8000', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'django', inferredPort: 8000, stack: 'python' }))
    expect(result).toContain('DJANGO_SETTINGS_MODULE')
    expect(result).toContain('- "8000:8000"')
  })

  it('Flask: FLASK_ENV=production and port 5000', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'flask', inferredPort: 5000, stack: 'python' }))
    expect(result).toContain('FLASK_ENV=production')
    expect(result).toContain('- "5000:5000"')
  })

  it('Spring Boot: SPRING_PROFILES_ACTIVE=prod and port 8080', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'spring-boot', inferredPort: 8080, stack: 'maven' }))
    expect(result).toContain('SPRING_PROFILES_ACTIVE=prod')
    expect(result).toContain('- "8080:8080"')
  })

  it('FastAPI port 0: uses fallback port 8000 in both ports binding and uvicorn command', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'fastapi', inferredPort: 0, stack: 'python' }))
    expect(result).toContain('- "8000:8000"')
    expect(result).toContain('--port 8000')
  })

  it('unknown framework with port 0: no ports section', () => {
    const result = generateComposeTemplate(makeProject({ framework: 'unknown', inferredPort: 0, stack: 'unknown' }))
    expect(result).not.toContain('ports:')
  })

  it('always includes build: . and restart: unless-stopped', () => {
    const result = generateComposeTemplate(makeProject())
    expect(result).toContain('build: .')
    expect(result).toContain('restart: unless-stopped')
  })
})

describe('parseComposeHostPort', () => {
  it('extracts host port from quoted mapping', () => {
    const content = generateComposeTemplate(makeProject({ framework: 'nestjs', inferredPort: 3000 }))
    expect(parseComposeHostPort(content)).toBe(3000)
  })

  it('picks up an edited host port', () => {
    const content = 'services:\n  app:\n    build: .\n    ports:\n      - "9090:3000"\n    restart: unless-stopped\n'
    expect(parseComposeHostPort(content)).toBe(9090)
  })

  it('handles unquoted port mapping', () => {
    const content = 'services:\n  app:\n    ports:\n      - 8081:80\n'
    expect(parseComposeHostPort(content)).toBe(8081)
  })

  it('returns null when there is no ports section', () => {
    const content = 'services:\n  app:\n    build: .\n    restart: unless-stopped\n'
    expect(parseComposeHostPort(content)).toBeNull()
  })

  it('returns null for empty content', () => {
    expect(parseComposeHostPort('')).toBeNull()
  })
})
