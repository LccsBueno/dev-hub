import type { Framework, ProjectConfig } from '../types'

export function dockerContainerName(projectName: string): string {
  return projectName.toLowerCase().replace(/\s+/g, '-')
}

function resolvePorts(framework: Framework, inferredPort: number): { host: number; container: number } | null {
  if (framework === 'vite-react') return { host: inferredPort || 80, container: 80 }
  if (framework === 'fastapi') {
    const port = inferredPort || 8000
    return { host: port, container: port }
  }
  if (!inferredPort) return null
  return { host: inferredPort, container: inferredPort }
}

export function dockerRunCommand(
  project: Pick<ProjectConfig, 'name' | 'path' | 'framework' | 'inferredPort'>,
  id: string
): string {
  const name = dockerContainerName(project.name)
  const image = `pm-${id}`
  const ports = resolvePorts(project.framework, project.inferredPort)
  const publish = ports ? ` -p ${ports.host}:${ports.container}` : ''
  return `docker build -t ${image} "${project.path}" && docker run --rm --name ${name}${publish} ${image}`
}
