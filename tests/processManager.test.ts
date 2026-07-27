import { describe, it, expect } from 'vitest'
import { ProcessManager } from '../electron/processManager'

function waitForStatus(
  pm: ProcessManager,
  wantId: string,
  wantStatus: 'running' | 'stopped'
): Promise<void> {
  return new Promise((resolve) => {
    pm.onStatus((id, status) => {
      if (id === wantId && status === wantStatus) resolve()
    })
  })
}

describe('ProcessManager', () => {
  it('runs a command, captures stdout and emits stopped on exit', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p1', 'stopped')
    pm.run('p1', 'node -e "console.log(\'hello-log\')"', process.cwd())
    expect(pm.isRunning('p1')).toBe(true)
    await stopped
    expect(pm.isRunning('p1')).toBe(false)
    const text = pm.logBuffer('p1').map((l) => l.text).join('\n')
    expect(text).toContain('hello-log')
  }, 15000)

  it('captures stderr with the stderr stream tag', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p2', 'stopped')
    pm.run('p2', 'node -e "console.error(\'boom\')"', process.cwd())
    await stopped
    const errLines = pm.logBuffer('p2').filter((l) => l.stream === 'stderr')
    expect(errLines.map((l) => l.text).join('\n')).toContain('boom')
  }, 15000)

  it('stop() kills a long-running process', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p3', 'stopped')
    pm.run('p3', 'node -e "setInterval(() => {}, 1000)"', process.cwd())
    expect(pm.isRunning('p3')).toBe(true)
    pm.stop('p3')
    await stopped
    expect(pm.isRunning('p3')).toBe(false)
  }, 15000)

  it('run() is a no-op if the project is already running', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p4', 'stopped')
    pm.run('p4', 'node -e "setInterval(() => {}, 1000)"', process.cwd())
    pm.run('p4', 'node -e "console.log(\'second\')"', process.cwd())
    pm.stop('p4')
    await stopped
    const text = pm.logBuffer('p4').map((l) => l.text).join('\n')
    expect(text).not.toContain('second')
  }, 15000)

  it('clearBuffer empties the log buffer', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p5', 'stopped')
    pm.run('p5', 'node -e "console.log(\'x\')"', process.cwd())
    await stopped
    expect(pm.logBuffer('p5').length).toBeGreaterThan(0)
    pm.clearBuffer('p5')
    expect(pm.logBuffer('p5')).toEqual([])
  }, 15000)

  it('emits stopped and untracks when spawn errors without exit (bad cwd)', async () => {
    const pm = new ProcessManager()
    const stopped = waitForStatus(pm, 'p6', 'stopped')
    pm.run('p6', 'node -e "console.log(\'x\')"', 'C:\\nonexistent\\path\\pm-test')
    await stopped
    expect(pm.isRunning('p6')).toBe(false)
    const text = pm.logBuffer('p6').map((l) => l.text).join('\n')
    expect(text).toContain('[erro ao iniciar processo]')
  }, 15000)
})
