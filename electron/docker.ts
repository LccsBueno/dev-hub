import { spawn } from 'child_process'

export function stopContainer(containerName: string): void {
  const killer = spawn('docker', ['stop', containerName])
  killer.on('error', () => {
    // docker not installed / daemon not reachable — the timed taskkill
    // fallback in main.ts's process:stop handler covers this case
  })
}

const fallbackTimers = new Map<string, NodeJS.Timeout>()

export function clearStopFallback(id: string): void {
  const timer = fallbackTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    fallbackTimers.delete(id)
  }
}

export function armStopFallback(id: string, onFallback: () => void, delayMs = 15000): void {
  clearStopFallback(id)
  const timer = setTimeout(() => {
    fallbackTimers.delete(id)
    onFallback()
  }, delayMs)
  fallbackTimers.set(id, timer)
}
