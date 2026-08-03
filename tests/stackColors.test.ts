import { describe, it, expect } from 'vitest'
import { primaryTech, techList } from '../src/lib/stackColors'

describe('primaryTech', () => {
  it('never returns undefined, even for framework and stack both "unknown"', () => {
    // regression: frameworkTechs['unknown'] and stackTechs['unknown'] are both
    // defined-but-empty arrays, so `a ?? b ?? c` short-circuits on the empty
    // array (not nullish) and [0] used to be undefined — crashed InfoTab
    // for any project with no manifest file (just a Dockerfile, e.g.).
    const tech = primaryTech('unknown', 'unknown')
    expect(tech).toBeDefined()
    expect(typeof tech.color).toBe('string')
  })

  it('uses the framework chip when available', () => {
    const tech = primaryTech('nestjs', 'node')
    expect(tech.label).toBe('NestJS')
  })
})

describe('techList', () => {
  it('returns an empty array (not a crash) when both framework and stack are unknown', () => {
    expect(techList('unknown', 'unknown')).toEqual([])
  })
})
