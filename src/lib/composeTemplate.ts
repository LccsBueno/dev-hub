import type { ProjectConfig } from '../types'

function containerName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function portsSection(port: number): string {
  if (!port) return ''
  return `    ports:\n      - "${port}:${port}"\n`
}

export function parseComposeHostPort(content: string): number | null {
  const lines = content.split('\n')
  const portsIndex = lines.findIndex((line) => /^\s*ports:\s*$/.test(line))
  if (portsIndex === -1) return null

  for (let i = portsIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*-\s*['"]?\d+:\d+/.test(line)) {
      const match = line.match(/(\d+):\d+/)
      if (match) return Number(match[1])
    } else if (/^\s*\S/.test(line) && !/^\s*-/.test(line)) {
      break
    }
  }
  return null
}

export function generateComposeTemplate(project: ProjectConfig): string {
  const name = containerName(project.name)
  const port = project.inferredPort
  const ports = portsSection(port)

  const nodeBase = (extra = ''): string =>
    `services:\n  app:\n    build: .\n    container_name: ${name}\n${ports}    environment:\n      - NODE_ENV=production\n${extra}    restart: unless-stopped\n`

  switch (project.framework) {
    case 'nestjs':
    case 'express':
    case 'fastify':
    case 'node':
      return nodeBase()

    case 'nextjs':
      return nodeBase('      - NEXT_TELEMETRY_DISABLED=1\n')

    case 'vite-react': {
      const hostPort = port || 80
      const staticPorts = `    ports:\n      - "${hostPort}:80"\n`
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${staticPorts}    restart: unless-stopped\n`
    }

    case 'fastapi': {
      const fastapiPort = port || 8000
      const fastapiPorts = portsSection(fastapiPort)
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${fastapiPorts}    command: uvicorn main:app --host 0.0.0.0 --port ${fastapiPort}\n    restart: unless-stopped\n`
    }

    case 'django':
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${ports}    environment:\n      - DJANGO_SETTINGS_MODULE=config.settings\n    restart: unless-stopped\n`

    case 'flask':
    case 'python':
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${ports}    environment:\n      - FLASK_ENV=production\n    restart: unless-stopped\n`

    case 'spring-boot':
    case 'maven':
    case 'gradle':
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${ports}    environment:\n      - SPRING_PROFILES_ACTIVE=prod\n    restart: unless-stopped\n`

    default:
      return `services:\n  app:\n    build: .\n    container_name: ${name}\n${ports}    restart: unless-stopped\n`
  }
}
