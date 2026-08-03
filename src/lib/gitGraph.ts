import type { GitCommit } from '../types'

export const GRAPH_PALETTE = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767'
]

export function laneColor(lane: number): string {
  return GRAPH_PALETTE[lane % GRAPH_PALETTE.length]
}

export interface ParentEdge {
  hash: string
  lane: number
}

export interface LayoutedCommit extends GitCommit {
  lane: number
  color: string
  parentEdges: ParentEdge[]
  convergingLanes: number[]
  /** lanes with a line passing through just above this row (before it's processed) */
  columnsBefore: number[]
  /** lanes with a line passing through just below this row (after it's processed) */
  columnsAfter: number[]
}

export function computeGraphLayout(commits: GitCommit[]): LayoutedCommit[] {
  const waiters = new Map<string, number[]>()
  const activeLanes = new Set<number>()
  const freeLanes: number[] = []
  let nextLane = 0

  const takeLane = (): number => (freeLanes.length > 0 ? (freeLanes.pop() as number) : nextLane++)

  const result: LayoutedCommit[] = []

  for (const commit of commits) {
    const columnsBefore = Array.from(activeLanes).sort((a, b) => a - b)

    const waiting = waiters.get(commit.fullHash) ?? []
    waiters.delete(commit.fullHash)
    for (const l of waiting) activeLanes.delete(l)

    const lane = waiting.length > 0 ? waiting[0] : takeLane()
    const convergingLanes = waiting.slice(1)
    for (const l of convergingLanes) freeLanes.push(l)
    activeLanes.add(lane)

    const parentEdges: ParentEdge[] = commit.parents.map((parentHash, i) => {
      const targetLane = i === 0 ? lane : takeLane()
      if (i > 0) activeLanes.add(targetLane)
      const existing = waiters.get(parentHash) ?? []
      waiters.set(parentHash, [...existing, targetLane])
      return { hash: parentHash, lane: targetLane }
    })

    if (commit.parents.length === 0) {
      activeLanes.delete(lane)
      freeLanes.push(lane)
    }

    const columnsAfter = Array.from(activeLanes).sort((a, b) => a - b)

    result.push({
      ...commit,
      lane,
      color: laneColor(lane),
      parentEdges,
      convergingLanes,
      columnsBefore,
      columnsAfter
    })
  }

  return result
}
