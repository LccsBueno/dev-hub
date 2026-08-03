import { useEffect, useState } from 'react'
import { GitBranch, GitCommit as GitCommitIcon, RefreshCw } from 'lucide-react'
import type { GitCommit } from '../../types'
import { computeGraphLayout, laneColor, type LayoutedCommit } from '../../lib/gitGraph'

interface Props {
  projectPath: string
}

const ROW_HEIGHT = 34
const LANE_WIDTH = 18
const NODE_R = 4.5
const HEAD_RING_R = 7.5
const GRAPH_PAD_LEFT = 10
const GRAPH_PAD_RIGHT = 10
const PAGE_SIZE = 100
const HEAD_COLOR = 'var(--color-accent)'

function laneX(lane: number): number {
  return GRAPH_PAD_LEFT + lane * LANE_WIDTH
}

function GraphRowSvg({ commit, index, isHead }: { commit: LayoutedCommit; index: number; isHead: boolean }) {
  const top = index * ROW_HEIGHT
  const center = top + ROW_HEIGHT / 2
  const bottom = top + ROW_HEIGHT

  const passthrough = commit.columnsBefore.filter(
    (l) => l !== commit.lane && !commit.convergingLanes.includes(l) && commit.columnsAfter.includes(l)
  )
  const hasIncoming = commit.columnsBefore.includes(commit.lane)
  const hasOutgoing = commit.parents.length > 0
  const spawns = commit.parentEdges.filter((e) => e.lane !== commit.lane)

  return (
    <g>
      {passthrough.map((l) => (
        <line key={`pt-${l}`} x1={laneX(l)} y1={top} x2={laneX(l)} y2={bottom} stroke={laneColor(l)} strokeWidth={2} />
      ))}
      {hasIncoming && (
        <line x1={laneX(commit.lane)} y1={top} x2={laneX(commit.lane)} y2={center} stroke={commit.color} strokeWidth={2} />
      )}
      {hasOutgoing && (
        <line x1={laneX(commit.lane)} y1={center} x2={laneX(commit.lane)} y2={bottom} stroke={commit.color} strokeWidth={2} />
      )}
      {commit.convergingLanes.map((l) => (
        <path
          key={`conv-${l}`}
          d={`M${laneX(l)},${top} C${laneX(l)},${top + ROW_HEIGHT * 0.35} ${laneX(commit.lane)},${center - ROW_HEIGHT * 0.15} ${laneX(commit.lane)},${center}`}
          fill="none"
          stroke={laneColor(l)}
          strokeWidth={2}
        />
      ))}
      {spawns.map((e) => (
        <path
          key={`spawn-${e.lane}`}
          d={`M${laneX(commit.lane)},${center} C${laneX(commit.lane)},${center + ROW_HEIGHT * 0.35} ${laneX(e.lane)},${bottom - ROW_HEIGHT * 0.35} ${laneX(e.lane)},${bottom}`}
          fill="none"
          stroke={laneColor(e.lane)}
          strokeWidth={2}
        />
      ))}
      {isHead && (
        <circle cx={laneX(commit.lane)} cy={center} r={HEAD_RING_R} fill="none" stroke={HEAD_COLOR} strokeWidth={2} />
      )}
      <circle cx={laneX(commit.lane)} cy={center} r={NODE_R} fill={commit.color} />
    </g>
  )
}

export default function GitTab({ projectPath }: Props) {
  const [isRepo, setIsRepo] = useState(true)
  const [currentBranch, setCurrentBranch] = useState<string | null>(null)
  const [headFullHash, setHeadFullHash] = useState<string | null>(null)
  const [rawCommits, setRawCommits] = useState<GitCommit[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api.getGitInfo(projectPath, { limit: PAGE_SIZE }).then((info) => {
      if (cancelled) return
      setIsRepo(info.isRepo)
      setCurrentBranch(info.currentBranch)
      setHeadFullHash(info.headFullHash)
      setRawCommits(info.commits)
      setHasMore(info.hasMore)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [projectPath, reloadKey])

  const loadMore = async (): Promise<void> => {
    setLoadingMore(true)
    const info = await window.api.getGitInfo(projectPath, { skip: rawCommits.length, limit: PAGE_SIZE })
    setRawCommits((current) => [...current, ...info.commits])
    setHasMore(info.hasMore)
    setLoadingMore(false)
  }

  const handleCheckout = async (commit: LayoutedCommit): Promise<void> => {
    if (checkingOut || commit.fullHash === headFullHash) return
    const target = commit.refs[0] ?? commit.fullHash
    const label = commit.refs[0] ? `a branch "${commit.refs[0]}"` : `o commit ${commit.hash}`
    const detachWarning = commit.refs[0] ? '' : '\n\nIsso deixa o repositório em detached HEAD.'
    if (!window.confirm(`Fazer checkout de ${label}?${detachWarning}`)) return

    setCheckingOut(true)
    const result = await window.api.checkoutGitRef(projectPath, target)
    if (result.ok) {
      const head = await window.api.getGitHead(projectPath)
      setCurrentBranch(head.currentBranch)
      setHeadFullHash(head.headFullHash)
    }
    setCheckingOut(false)
  }

  if (loading) {
    return <p className="p-5 text-sm text-muted">Carregando…</p>
  }

  if (!isRepo) {
    return (
      <p className="p-5 text-sm text-muted">
        Não é um repositório git (ou o git não foi encontrado no PATH).
      </p>
    )
  }

  const laid = computeGraphLayout(rawCommits)
  const maxLane = laid.reduce((max, c) => Math.max(max, c.lane, ...c.columnsBefore, ...c.columnsAfter), 0)
  const graphWidth = GRAPH_PAD_LEFT + (maxLane + 1) * LANE_WIDTH + GRAPH_PAD_RIGHT
  const graphHeight = laid.length * ROW_HEIGHT
  const isDetached = currentBranch === 'HEAD'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          {isDetached ? (
            <GitCommitIcon size={14} className="text-accent" />
          ) : (
            <GitBranch size={14} className="text-accent" />
          )}
          <span className="font-medium">
            {isDetached ? `detached em ${headFullHash?.slice(0, 7)}` : currentBranch}
          </span>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          title="Atualizar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {laid.length === 0 ? (
          <p className="p-5 text-xs text-muted">Nenhum commit ainda.</p>
        ) : (
          <div className="relative py-2">
            <svg className="pointer-events-none absolute top-2 left-3" width={graphWidth} height={graphHeight}>
              {laid.map((commit, i) => (
                <GraphRowSvg key={commit.fullHash} commit={commit} index={i} isHead={commit.fullHash === headFullHash} />
              ))}
            </svg>
            <div>
              {laid.map((commit) => {
                const isHead = commit.fullHash === headFullHash
                return (
                  <button
                    key={commit.fullHash}
                    type="button"
                    onClick={() => handleCheckout(commit)}
                    disabled={checkingOut}
                    title={isHead ? 'HEAD atual' : `Checkout de ${commit.refs[0] ?? commit.hash}`}
                    className="flex w-full items-center gap-2 pr-3 text-left hover:bg-white/[0.03] focus-visible:outline-none focus-visible:bg-white/[0.05] disabled:cursor-wait"
                    style={{ height: ROW_HEIGHT, paddingLeft: graphWidth + 12 }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-xs text-neutral-200">{commit.message}</span>
                      {isHead && (
                        <span
                          style={{ backgroundColor: `color-mix(in srgb, ${HEAD_COLOR} 22%, transparent)`, color: HEAD_COLOR }}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                          HEAD
                        </span>
                      )}
                      {commit.refs.map((ref) => (
                        <span
                          key={ref}
                          style={{
                            backgroundColor: `color-mix(in srgb, ${commit.color} 22%, transparent)`,
                            color: commit.color
                          }}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted">
                      {commit.hash} · {commit.author} · {commit.relativeDate}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-4 my-3 block rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted transition-colors hover:border-white hover:text-white disabled:opacity-50"
          >
            {loadingMore ? 'Carregando…' : 'Carregar mais 100 commits'}
          </button>
        )}
      </div>
    </div>
  )
}
