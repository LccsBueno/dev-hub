import { describe, it, expect } from 'vitest'
import { parseContainerList, parseMounts } from '../electron/dockerInspect'

describe('parseContainerList', () => {
  it('parses a single running container with one published port', () => {
    const line = JSON.stringify({
      ID: 'abc123',
      Names: 'my-app',
      Image: 'node:20',
      Status: 'Up 3 hours',
      State: 'running',
      Ports: '0.0.0.0:8080->80/tcp'
    })
    const result = parseContainerList(line)
    expect(result).toEqual([
      {
        id: 'abc123',
        name: 'my-app',
        image: 'node:20',
        status: 'Up 3 hours',
        state: 'running',
        ports: '0.0.0.0:8080->80/tcp',
        startedAt: null
      }
    ])
  })

  it('parses multiple containers from newline-delimited JSON, one per line', () => {
    const line1 = JSON.stringify({
      ID: 'a1', Names: 'db', Image: 'postgres:16', Status: 'Up 1 hour',
      State: 'running', Ports: '5432/tcp'
    })
    const line2 = JSON.stringify({
      ID: 'a2', Names: 'cache', Image: 'redis:7', Status: 'Exited (0) 2 days ago',
      State: 'exited', Ports: ''
    })
    const result = parseContainerList(`${line1}\n${line2}`)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('db')
    expect(result[1].name).toBe('cache')
    expect(result[1].state).toBe('exited')
    expect(result[1].ports).toBe('')
  })

  it('maps an unrecognized State value to "unknown" instead of throwing', () => {
    const line = JSON.stringify({
      ID: 'x1', Names: 'weird', Image: 'scratch', Status: '???',
      State: 'some-future-state', Ports: ''
    })
    const result = parseContainerList(line)
    expect(result[0].state).toBe('unknown')
  })

  it('ignores blank lines between entries', () => {
    const line = JSON.stringify({
      ID: 'a1', Names: 'db', Image: 'postgres:16', Status: 'Up 1 hour',
      State: 'running', Ports: ''
    })
    const result = parseContainerList(`\n${line}\n\n`)
    expect(result).toHaveLength(1)
  })

  it('returns an empty array for empty input', () => {
    expect(parseContainerList('')).toEqual([])
  })
})

describe('parseMounts', () => {
  it('extracts source, destination, and mode from docker inspect output', () => {
    const inspectOutput = JSON.stringify([
      {
        Mounts: [
          { Source: 'C:\\data\\pg', Destination: '/var/lib/postgresql/data', Mode: 'rw' },
          { Source: 'C:\\data\\conf', Destination: '/etc/conf', Mode: 'ro' }
        ]
      }
    ])
    const result = parseMounts(inspectOutput)
    expect(result).toEqual([
      { source: 'C:\\data\\pg', destination: '/var/lib/postgresql/data', mode: 'rw' },
      { source: 'C:\\data\\conf', destination: '/etc/conf', mode: 'ro' }
    ])
  })

  it('returns an empty array when the container has no mounts', () => {
    const inspectOutput = JSON.stringify([{ Mounts: [] }])
    expect(parseMounts(inspectOutput)).toEqual([])
  })

  it('returns an empty array for malformed JSON instead of throwing', () => {
    expect(parseMounts('not json')).toEqual([])
  })
})
