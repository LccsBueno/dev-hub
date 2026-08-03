import { spawn, type ChildProcess } from 'child_process'
import type { LogLine, ProcessStatus } from '../src/types'

export type LogListener = (id: string, chunk: string, stream: 'stdout' | 'stderr') => void
export type StatusListener = (id: string, status: ProcessStatus) => void
export type ErrorListener = (id: string, message: string) => void

const MAX_LOG_LINES = 1000

export class ProcessManager {
  private procs = new Map<string, ChildProcess>()
  private buffers = new Map<string, LogLine[]>()
  private stoppingIds = new Set<string>()
  private logListeners: LogListener[] = []
  private statusListeners: StatusListener[] = []
  private errorListeners: ErrorListener[] = []

  onLog(listener: LogListener): void {
    this.logListeners.push(listener)
  }

  onStatus(listener: StatusListener): void {
    this.statusListeners.push(listener)
  }

  onError(listener: ErrorListener): void {
    this.errorListeners.push(listener)
  }

  isRunning(id: string): boolean {
    return this.procs.has(id)
  }

  runningIds(): string[] {
    return [...this.procs.keys()]
  }

  logBuffer(id: string): LogLine[] {
    return this.buffers.get(id) ?? []
  }

  clearBuffer(id: string): void {
    this.buffers.set(id, [])
  }

  private emitLog(id: string, chunk: string, stream: 'stdout' | 'stderr'): void {
    const buffer = this.buffers.get(id) ?? []
    for (const text of chunk.split(/\r?\n/)) {
      if (text.length === 0) continue
      buffer.push({ text, stream })
    }
    if (buffer.length > MAX_LOG_LINES) buffer.splice(0, buffer.length - MAX_LOG_LINES)
    this.buffers.set(id, buffer)
    for (const listener of this.logListeners) listener(id, chunk, stream)
  }

  private emitStatus(id: string, status: ProcessStatus): void {
    for (const listener of this.statusListeners) listener(id, status)
  }

  private emitError(id: string, message: string): void {
    for (const listener of this.errorListeners) listener(id, message)
  }

  run(id: string, command: string, cwd: string): void {
    if (this.procs.has(id)) return
    const utf8Env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    const child = spawn(command, { shell: true, cwd, env: utf8Env })
    this.procs.set(id, child)
    this.emitStatus(id, 'running')

    const finalize = (logText: string): void => {
      if (!this.procs.has(id)) return
      this.procs.delete(id)
      this.emitLog(id, logText, 'stdout')
      this.emitStatus(id, 'stopped')
    }

    child.stdout?.on('data', (d: Buffer) => this.emitLog(id, d.toString(), 'stdout'))
    child.stderr?.on('data', (d: Buffer) => this.emitLog(id, d.toString(), 'stderr'))
    child.on('error', (err) => {
      this.emitLog(id, `[erro ao iniciar processo] ${err.message}`, 'stderr')
      this.emitError(id, `Falha ao iniciar o processo: ${err.message}`)
      finalize('[processo não iniciou]')
    })
    child.on('exit', (code) => {
      const userStopped = this.stoppingIds.has(id)
      this.stoppingIds.delete(id)
      if (!userStopped && code !== 0 && code !== null) {
        this.emitError(id, `Processo encerrou com erro (código ${code})`)
      }
      finalize(`[processo encerrado, código ${code ?? 'desconhecido'}]`)
    })
  }

  stop(id: string): void {
    const child = this.procs.get(id)
    if (!child || child.pid === undefined) return
    this.stoppingIds.add(id)
    if (process.platform === 'win32') {
      // shell:true wraps the command in cmd.exe — kill the whole tree
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'])
      killer.on('error', (err) => {
        this.emitLog(id, `[falha ao encerrar processo] ${err.message}`, 'stderr')
      })
    } else {
      child.kill('SIGTERM')
    }
  }

  stopAll(): void {
    for (const id of this.runningIds()) this.stop(id)
  }
}
