import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { armStopFallback, clearStopFallback } from '../electron/docker'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('armStopFallback / clearStopFallback', () => {
  it('calls the fallback after the delay if not cleared', () => {
    const onFallback = vi.fn()
    armStopFallback('id1', onFallback, 1000)
    vi.advanceTimersByTime(999)
    expect(onFallback).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onFallback).toHaveBeenCalledTimes(1)
  })

  it('does not call the fallback if cleared before it fires', () => {
    const onFallback = vi.fn()
    armStopFallback('id1', onFallback, 1000)
    clearStopFallback('id1')
    vi.advanceTimersByTime(2000)
    expect(onFallback).not.toHaveBeenCalled()
  })

  it('re-arming for the same id replaces the previous timer instead of stacking', () => {
    const first = vi.fn()
    const second = vi.fn()
    armStopFallback('id1', first, 1000)
    armStopFallback('id1', second, 1000)
    vi.advanceTimersByTime(1000)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('clearing a different id does not affect this one', () => {
    const onFallback = vi.fn()
    armStopFallback('id1', onFallback, 1000)
    clearStopFallback('id2')
    vi.advanceTimersByTime(1000)
    expect(onFallback).toHaveBeenCalledTimes(1)
  })
})
