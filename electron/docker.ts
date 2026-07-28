import { spawn } from 'child_process'

export function stopContainer(containerName: string): void {
  const killer = spawn('docker', ['stop', containerName])
  killer.on('error', () => {
    // docker not installed / daemon not reachable — the timed taskkill
    // fallback in main.ts's process:stop handler covers this case
  })
}
