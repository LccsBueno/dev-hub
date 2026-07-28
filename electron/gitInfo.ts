import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { GitInfo } from '../src/types'

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

const emptyGitInfo: GitInfo = { isRepo: false, currentBranch: null, branches: [], commits: [] }

export async function getGitInfo(path: string): Promise<GitInfo> {
  if (!existsSync(join(path, '.git'))) return emptyGitInfo

  try {
    const [branchOut, branchListOut, logOut] = await Promise.all([
      runGit(['rev-parse', '--abbrev-ref', 'HEAD'], path),
      runGit(['branch', '--format=%(refname:short)'], path),
      runGit(['log', '-n', '20', '--format=%h%x1f%s%x1f%an%x1f%ar', '--no-color'], path)
    ])

    const currentBranch = branchOut.trim() || null
    const branches = branchListOut
      .split(/\r?\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
    const commits = logOut
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map((line) => {
        const [hash, message, author, relativeDate] = line.split('\x1f')
        return { hash, message, author, relativeDate }
      })

    return { isRepo: true, currentBranch, branches, commits }
  } catch {
    return emptyGitInfo
  }
}
