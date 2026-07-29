import type { Stack } from '../types'

export const stackColors: Partial<Record<Stack, string>> = {
  node: '#4ade80',
  maven: '#f87171',
  rust: '#fb923c',
  go: '#38bdf8',
  python: '#facc15',
  unknown: '#94a3b8'
}

export const stackTechs: Partial<Record<Stack, { label: string; color: string }[]>> = {
  node:    [{ label: 'Node.js', color: '#4ade80' }],
  maven:   [{ label: 'Java', color: '#f97316' }, { label: 'Maven', color: '#f87171' }],
  gradle:  [{ label: 'Kotlin', color: '#a78bfa' }, { label: 'Gradle', color: '#6ee7b7' }],
  compose: [{ label: 'Docker', color: '#38bdf8' }],
  rust:    [{ label: 'Rust', color: '#fb923c' }],
  go:      [{ label: 'Go', color: '#38bdf8' }],
  python:  [{ label: 'Python', color: '#facc15' }],
  unknown: []
}
