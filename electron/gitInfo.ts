import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { emptyGitInfo, type GitInfo } from '../src/types'

function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => (stdout += d.toString()))
    child.stderr?.on('data', (d: Buffer) => (stderr += d.toString()))
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `git exited with code ${code}`))
    })
  })
}

export { emptyGitInfo }

export interface GetGitInfoOpts {
  skip?: number
  limit?: number
}

export async function getGitInfo(path: string, opts: GetGitInfoOpts = {}): Promise<GitInfo> {
  if (!existsSync(join(path, '.git'))) return emptyGitInfo

  const skip = opts.skip ?? 0
  const limit = opts.limit ?? 100

  try {
    const [branchOut, headOut, branchListOut, logOut] = await Promise.all([
      runGit(['rev-parse', '--abbrev-ref', 'HEAD'], path),
      runGit(['rev-parse', 'HEAD'], path),
      runGit(['branch', '--format=%(refname:short)'], path),
      runGit(
        [
          'log',
          '--branches',
          `--skip=${skip}`,
          '-n',
          String(limit + 1),
          '--format=%H%x1f%h%x1f%P%x1f%s%x1f%an%x1f%ar%x1f%D',
          '--no-color'
        ],
        path
      )
    ])

    const currentBranch = branchOut.trim() || null
    const headFullHash = headOut.trim() || null
    const branches = branchListOut
      .split(/\r?\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
    const branchSet = new Set(branches)

    const rawLines = logOut.split(/\r?\n/).filter((line) => line.length > 0)
    const hasMore = rawLines.length > limit
    const commits = rawLines.slice(0, limit).map((line) => {
      const [fullHash, hash, parentsRaw, message, author, relativeDate, decorations] = line.split('\x1f')
      const parents = parentsRaw ? parentsRaw.split(' ').filter((p) => p.length > 0) : []
      const refs = (decorations ?? '')
        .split(',')
        .map((d) => d.trim().replace(/^HEAD -> /, ''))
        .filter((d) => branchSet.has(d))
      return { hash, fullHash, parents, refs, message, author, relativeDate }
    })

    return { isRepo: true, currentBranch, headFullHash, branches, commits, hasMore }
  } catch {
    return emptyGitInfo
  }
}

export async function getGitHead(
  path: string
): Promise<{ currentBranch: string | null; headFullHash: string | null }> {
  if (!existsSync(join(path, '.git'))) return { currentBranch: null, headFullHash: null }
  try {
    const [branchOut, headOut] = await Promise.all([
      runGit(['rev-parse', '--abbrev-ref', 'HEAD'], path),
      runGit(['rev-parse', 'HEAD'], path)
    ])
    return { currentBranch: branchOut.trim() || null, headFullHash: headOut.trim() || null }
  } catch {
    return { currentBranch: null, headFullHash: null }
  }
}

export async function checkoutRef(path: string, target: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await runGit(['checkout', target], path)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
