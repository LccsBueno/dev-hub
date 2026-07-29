import type { Stack } from '../types'
import { stackColors } from '../lib/stackColors'

const STACK_ORDER: (Stack | 'all')[] = ['all', 'node', 'maven', 'gradle', 'compose', 'rust', 'go', 'python', 'unknown']

const stackLabels: Record<Stack | 'all', string> = {
  all:     'Todos',
  node:    'Node',
  maven:   'Maven',
  gradle:  'Gradle',
  compose: 'Compose',
  rust:    'Rust',
  go:      'Go',
  python:  'Python',
  unknown: 'Outro'
}

interface Props {
  availableStacks: Stack[]
  stackFilter: Stack | 'all'
  onStackFilter: (value: Stack | 'all') => void
  tags: string[]
  tagColors: Record<string, string>
  tagFilter: string | null
  onTagFilter: (tag: string | null) => void
}

export default function FilterBar({
  availableStacks,
  stackFilter,
  onStackFilter,
  tags,
  tagColors,
  tagFilter,
  onTagFilter
}: Props) {
  const visibleStacks = STACK_ORDER.filter(
    (s) => s === 'all' || availableStacks.includes(s as Stack)
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div role="group" aria-label="Filtrar por stack" className="flex flex-wrap gap-2">
        {visibleStacks.map((s) => {
          const active = stackFilter === s
          const color = s !== 'all' ? stackColors[s as Stack] : undefined

          if (color) {
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStackFilter(s)}
                aria-pressed={active}
                style={
                  active
                    ? {
                        backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
                        color,
                        borderColor: color
                      }
                    : {
                        borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
                        color: `color-mix(in srgb, ${color} 75%, #8f8f8f)`
                      }
                }
                className="rounded-full border px-3 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 hover:opacity-90"
              >
                {stackLabels[s]}
              </button>
            )
          }

          return (
            <button
              key={s}
              type="button"
              onClick={() => onStackFilter(s)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                active
                  ? 'bg-accent/15 text-accent'
                  : 'border border-border text-muted hover:text-white'
              }`}
            >
              {stackLabels[s]}
            </button>
          )
        })}
      </div>

      {tags.length > 0 && (
        <div role="group" aria-label="Filtrar por tag" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTagFilter(null)}
            aria-pressed={tagFilter === null}
            className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              tagFilter === null
                ? 'bg-accent/15 text-accent'
                : 'border border-border text-muted hover:text-white'
            }`}
          >
            Todas as tags
          </button>
          {tags.map((tag) => {
            const color = tagColors[tag] ?? '#8f8f8f'
            const active = tagFilter === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagFilter(active ? null : tag)}
                aria-pressed={active}
                style={
                  active
                    ? {
                        backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
                        color,
                        borderColor: color
                      }
                    : { borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, color }
                }
                className="rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
