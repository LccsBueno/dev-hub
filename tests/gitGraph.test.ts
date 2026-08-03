import { describe, it, expect } from 'vitest'
import { computeGraphLayout, GRAPH_PALETTE } from '../src/lib/gitGraph'
import type { GitCommit } from '../src/types'

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    hash: overrides.fullHash?.slice(0, 7) ?? 'aaaaaaa',
    fullHash: 'aaaaaaa',
    parents: [],
    refs: [],
    message: 'commit',
    author: 'Test',
    relativeDate: '1h ago',
    ...overrides
  }
}

describe('computeGraphLayout', () => {
  it('linear history: every commit on lane 0', () => {
    const commits = [
      makeCommit({ fullHash: 'c3', parents: ['c2'] }),
      makeCommit({ fullHash: 'c2', parents: ['c1'] }),
      makeCommit({ fullHash: 'c1', parents: [] })
    ]
    const laid = computeGraphLayout(commits)
    expect(laid.map((c) => c.lane)).toEqual([0, 0, 0])
    expect(laid.every((c) => c.color === GRAPH_PALETTE[0])).toBe(true)
    expect(laid.every((c) => c.convergingLanes.length === 0)).toBe(true)
  })

  it('merge commit: spawns a lane for the second parent, converges back', () => {
    // m (merge, parents [main1, feat1]) -> feat1 (parents [base]) -> base
    //                                   -> main1 -> base is skipped for simplicity: main1 has parent base too
    const commits = [
      makeCommit({ fullHash: 'm', parents: ['main1', 'feat1'] }),
      makeCommit({ fullHash: 'feat1', parents: ['base'] }),
      makeCommit({ fullHash: 'main1', parents: ['base'] })
    ]
    const laid = computeGraphLayout(commits)
    const [m, feat1, main1] = laid

    expect(m.lane).toBe(0)
    // merge commit's second parent (feat1) gets its own lane, different from main's
    const featLane = m.parentEdges.find((e) => e.hash === 'feat1')!.lane
    const mainLane = m.parentEdges.find((e) => e.hash === 'main1')!.lane
    expect(featLane).not.toBe(mainLane)
    expect(feat1.lane).toBe(featLane)
    expect(main1.lane).toBe(mainLane)

    // both main1 and feat1 converge into 'base' — base wasn't processed here,
    // but both should be waiting on the same hash. Simulate by adding base:
    const withBase = computeGraphLayout([...commits, makeCommit({ fullHash: 'base', parents: [] })])
    const base = withBase[3]
    expect(base.convergingLanes.length).toBe(1)
  })

  it('branch point without a merge commit: two lanes converge on the shared ancestor', () => {
    // main-tip and feature-tip both descend directly from 'base' (no merge commit anywhere)
    const commits = [
      makeCommit({ fullHash: 'main-tip', parents: ['base'] }),
      makeCommit({ fullHash: 'feature-tip', parents: ['base'] }),
      makeCommit({ fullHash: 'base', parents: [] })
    ]
    const laid = computeGraphLayout(commits)
    const [mainTip, featureTip, base] = laid

    expect(mainTip.lane).not.toBe(featureTip.lane)
    // base is claimed by whichever lane registered first (main-tip, processed first)
    expect(base.lane).toBe(mainTip.lane)
    // the other lane (feature-tip's) terminates here
    expect(base.convergingLanes).toEqual([featureTip.lane])
  })

  it('full scenario from the approved mockup: feature -> develop -> main, two merges', () => {
    // newest first, matching git log order
    const commits = [
      makeCommit({ fullHash: 'main2', parents: ['main1'] }), // bump version
      makeCommit({ fullHash: 'main1', parents: ['mainRoot', 'devMerge'] }), // merge develop into main
      makeCommit({ fullHash: 'devMerge', parents: ['devRoot', 'featTip'] }), // merge feature into develop
      makeCommit({ fullHash: 'featTip', parents: ['featRoot'] }),
      makeCommit({ fullHash: 'featRoot', parents: ['devRoot'] }),
      makeCommit({ fullHash: 'devRoot', parents: ['mainRoot'] }),
      makeCommit({ fullHash: 'mainRoot', parents: [] })
    ]
    const laid = computeGraphLayout(commits)
    const byHash = Object.fromEntries(laid.map((c) => [c.fullHash, c]))

    // main lane stays constant across main2 -> main1 -> mainRoot
    expect(byHash.main2.lane).toBe(byHash.main1.lane)
    expect(byHash.mainRoot.lane).toBe(byHash.main1.lane)

    // develop lane constant across devMerge -> devRoot
    expect(byHash.devMerge.lane).toBe(byHash.devRoot.lane)

    // feature lane constant across featTip -> featRoot
    expect(byHash.featTip.lane).toBe(byHash.featRoot.lane)

    // three distinct lanes overall
    const lanes = new Set(laid.map((c) => c.lane))
    expect(lanes.size).toBe(3)

    // mainRoot absorbs devRoot's lane (branch point, no merge commit for that divergence)
    expect(byHash.mainRoot.convergingLanes).toEqual([byHash.devRoot.lane])
  })
})
