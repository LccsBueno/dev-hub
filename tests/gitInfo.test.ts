import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { getGitInfo, getGitHead, checkoutRef } from '../electron/gitInfo'

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
    expect(info).toEqual({
      isRepo: false,
      currentBranch: null,
      headFullHash: null,
      branches: [],
      commits: [],
      hasMore: false
    })
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
    expect(info.commits[0].fullHash).toMatch(/^[a-f0-9]{40}$/)
    expect(info.commits[0].parents).toEqual([])
    expect(info.commits[0].refs).toEqual([info.currentBranch])
    expect(info.hasMore).toBe(false)
    expect(info.headFullHash).toBe(info.commits[0].fullHash)
  })

  it('defaults to the first 100 commits and reports hasMore', async () => {
    git(['init'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    for (let i = 0; i < 25; i++) {
      writeFileSync(join(dir, 'file.txt'), `content ${i}`, 'utf-8')
      git(['add', '.'], dir)
      git(['commit', '-m', `commit ${i}`], dir)
    }

    const info = await getGitInfo(dir)
    expect(info.commits).toHaveLength(25)
    expect(info.commits[0].message).toBe('commit 24')
    expect(info.hasMore).toBe(false)
  }, 30000)

  it('paginates with skip/limit and sets hasMore', async () => {
    git(['init'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(dir, 'file.txt'), `content ${i}`, 'utf-8')
      git(['add', '.'], dir)
      git(['commit', '-m', `commit ${i}`], dir)
    }

    const firstPage = await getGitInfo(dir, { limit: 3 })
    expect(firstPage.commits).toHaveLength(3)
    expect(firstPage.commits[0].message).toBe('commit 4')
    expect(firstPage.hasMore).toBe(true)

    const secondPage = await getGitInfo(dir, { skip: 3, limit: 3 })
    expect(secondPage.commits).toHaveLength(2)
    expect(secondPage.commits[0].message).toBe('commit 1')
    expect(secondPage.hasMore).toBe(false)
  }, 30000)

  it('captures parent hashes for a merge commit', async () => {
    git(['init', '-b', 'main'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    writeFileSync(join(dir, 'file.txt'), 'base', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'base'], dir)

    git(['checkout', '-b', 'feature'], dir)
    writeFileSync(join(dir, 'feature.txt'), 'feature', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'feature work'], dir)

    git(['checkout', 'main'], dir)
    git(['merge', '--no-ff', '-m', 'merge feature', 'feature'], dir)

    const info = await getGitInfo(dir)
    const merge = info.commits.find((c) => c.message === 'merge feature')
    expect(merge?.parents).toHaveLength(2)
    expect(info.branches.sort()).toEqual(['feature', 'main'])
  }, 30000)
})

describe('getGitHead / checkoutRef', () => {
  it('checkout of a branch name updates currentBranch', async () => {
    git(['init', '-b', 'main'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    writeFileSync(join(dir, 'file.txt'), 'base', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'base'], dir)
    git(['checkout', '-b', 'feature'], dir)

    const before = await getGitHead(dir)
    expect(before.currentBranch).toBe('feature')

    const result = await checkoutRef(dir, 'main')
    expect(result.ok).toBe(true)

    const after = await getGitHead(dir)
    expect(after.currentBranch).toBe('main')
  }, 30000)

  it('checkout of a raw commit hash results in detached HEAD', async () => {
    git(['init', '-b', 'main'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    writeFileSync(join(dir, 'file.txt'), 'v1', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'first'], dir)
    const firstHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir }).toString().trim()
    writeFileSync(join(dir, 'file.txt'), 'v2', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'second'], dir)

    const result = await checkoutRef(dir, firstHash)
    expect(result.ok).toBe(true)

    const after = await getGitHead(dir)
    expect(after.currentBranch).toBe('HEAD')
    expect(after.headFullHash).toBe(firstHash)
  }, 30000)

  it('blocks checkout when it would overwrite uncommitted changes', async () => {
    git(['init', '-b', 'main'], dir)
    git(['config', 'user.email', 'test@example.com'], dir)
    git(['config', 'user.name', 'Test User'], dir)
    writeFileSync(join(dir, 'file.txt'), 'v1', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'first'], dir)
    git(['checkout', '-b', 'other'], dir)
    writeFileSync(join(dir, 'file.txt'), 'v2', 'utf-8')
    git(['add', '.'], dir)
    git(['commit', '-m', 'second'], dir)
    git(['checkout', 'main'], dir)
    writeFileSync(join(dir, 'file.txt'), 'uncommitted local edit', 'utf-8')

    const result = await checkoutRef(dir, 'other')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()

    const after = await getGitHead(dir)
    expect(after.currentBranch).toBe('main')
  }, 30000)
})
