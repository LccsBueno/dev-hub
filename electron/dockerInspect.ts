import { spawn } from 'child_process'
import type { DockerContainerInfo, DockerMount, DockerState } from '../src/types'

const KNOWN_STATES = new Set<DockerState>([
  'running',
  'exited',
  'created',
  'paused',
  'restarting',
  'dead'
])

function toState(raw: string): DockerState {
  return KNOWN_STATES.has(raw as DockerState) ? (raw as DockerState) : 'unknown'
}

function parseLabels(raw: string): Record<string, string> {
  if (!raw) return {}
  const result: Record<string, string> = {}
  for (const pair of raw.split(',')) {
    const eq = pair.indexOf('=')
    if (eq !== -1) result[pair.slice(0, eq).trim()] = pair.slice(eq + 1)
  }
  return result
}

export function parseContainerList(output: string): DockerContainerInfo[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const raw = JSON.parse(line)
      const labels = parseLabels(raw.Labels ?? '')
      const composeProject = labels['com.docker.compose.project']
      const composeService = labels['com.docker.compose.service']
      return {
        id: raw.ID,
        name: raw.Names,
        image: raw.Image,
        status: raw.Status,
        state: toState(raw.State),
        ports: raw.Ports ?? '',
        startedAt: null,
        ...(composeProject && { composeProject }),
        ...(composeService && { composeService })
      }
    })
}

export function parseMounts(output: string): DockerMount[] {
  try {
    const parsed = JSON.parse(output)
    const mounts = parsed?.[0]?.Mounts
    if (!Array.isArray(mounts)) return []
    return mounts.map((m: { Source: string; Destination: string; Mode: string }) => ({
      source: m.Source,
      destination: m.Destination,
      mode: m.Mode
    }))
  } catch {
    return []
  }
}

function runDocker(args: string[]): Promise<{ stdout: string; error: string | null }> {
  return new Promise((resolve) => {
    const child = spawn('docker', args)
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => (stdout += d.toString()))
    child.stderr?.on('data', (d: Buffer) => (stderr += d.toString()))
    child.on('error', (err) => resolve({ stdout: '', error: err.message }))
    child.on('exit', (code) => {
      if (code !== 0) resolve({ stdout: '', error: stderr.trim() || `docker exited with code ${code}` })
      else resolve({ stdout, error: null })
    })
  })
}

export async function listContainers(): Promise<{
  containers: DockerContainerInfo[]
  error: string | null
}> {
  const { stdout, error } = await runDocker(['ps', '-a', '--format', '{{json .}}'])
  if (error) return { containers: [], error: 'Docker não encontrado ou não está rodando.' }
  try {
    return { containers: parseContainerList(stdout), error: null }
  } catch {
    return { containers: [], error: 'Falha ao interpretar a lista de containers do Docker.' }
  }
}

export async function getContainerMounts(id: string): Promise<DockerMount[]> {
  const { stdout, error } = await runDocker(['inspect', id])
  if (error) return []
  return parseMounts(stdout)
}

export function startContainer(id: string): void {
  spawn('docker', ['start', id]).on('error', () => {
    // caller polls docker:list afterwards; a failed start simply won't show as running
  })
}

export function restartContainer(id: string): void {
  spawn('docker', ['restart', id]).on('error', () => {
    // same as startContainer — surfaced via the next poll, not an exception
  })
}
