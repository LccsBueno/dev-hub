import { useEffect, useState } from 'react'
import { GitBranch, GitCommit, RefreshCw } from 'lucide-react'
import { emptyGitInfo, type GitInfo } from '../../types'

interface Props {
  projectPath: string
}

export default function GitTab({ projectPath }: Props) {
  const [info, setInfo] = useState<GitInfo>(emptyGitInfo)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api.getGitInfo(projectPath).then((result) => {
      if (!cancelled) {
        setInfo(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [projectPath, reloadKey])

  if (loading) {
    return <p className="p-5 text-sm text-muted">Carregando…</p>
  }

  if (!info.isRepo) {
    return (
      <p className="p-5 text-sm text-muted">
        Não é um repositório git (ou o git não foi encontrado no PATH).
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <GitBranch size={14} className="text-accent" />
          <span className="font-medium">{info.currentBranch}</span>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          title="Atualizar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <RefreshCw size={13} />
        </button>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Branches ({info.branches.length})</h3>
        <div className="flex flex-col gap-1">
          {info.branches.map((branch) => (
            <div
              key={branch}
              className={`rounded-md px-2 py-1.5 text-xs ${
                branch === info.currentBranch ? 'bg-accent/15 text-accent' : 'text-neutral-300'
              }`}
            >
              {branch}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium text-muted">Commits recentes</h3>
        <div className="flex flex-col gap-2">
          {info.commits.length === 0 ? (
            <p className="text-xs text-muted">Nenhum commit ainda.</p>
          ) : (
            info.commits.map((commit) => (
              <div key={commit.hash} className="flex items-start gap-2 rounded-md border border-border p-2">
                <GitCommit size={13} className="mt-0.5 shrink-0 text-accent-2" />
                <div className="min-w-0">
                  <p className="truncate text-xs text-neutral-200">{commit.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {commit.hash} · {commit.author} · {commit.relativeDate}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
