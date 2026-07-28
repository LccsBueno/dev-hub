import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { getGitInfo } from '../electron/gitInfo'

let dir: string

function git(args: string[], cwd: string): void {
  execFileSync('git', args, { cwd })
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pm-git-'))
})

describe('getGitInfo', () => {
  it('returns isRepo:false for a non-git directory', async () => {
    const info = await getGitInfo(dir)
    expect(info).toEqual({ isRepo: false, currentBranch: null, branches: [], commits: [] })
  })

  it('reads branch and commit info from a real repo', async () => {
    git(['init'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    writeFileSync(join(dir, 'file.txt'), 'hello', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'initial commit'], dir)

    const info = await getGitInfo(dir)

    expect(info.isRepo).toBe(true)
    expect(typeof info.currentBranch).toBe('string')
    expect(info.branches).toContain(info.currentBranch)
    expect(info.commits).toHaveLength(1)
    expect(info.commits[0].message).toBe('initial commit')
    expect(info.commits[0].author).toBe('Test User')
    expect(info.commits[0].hash).toMatch(/^[a-f0-9]{7,}$/)
  })

  it('caps commits at 20', async () => {
    git(['init'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    for (let i = 0; i < 25; i++) {
      writeFileSync(join(dir, 'file.txt'), `content ${i}`, 'utf-8')
      git(['add', '.'], dir)
      git(['commit', '-m', `commit ${i}`], dir)
    }

    const info = await getGitInfo(dir)
    expect(info.commits).toHaveLength(20)
    expect(info.commits[0].message).toBe('commit 24')
  })
})
