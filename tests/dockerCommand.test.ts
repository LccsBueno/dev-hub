import { describe, it, expect } from 'vitest'
import { dockerContainerName, dockerRunCommand } from '../src/lib/dockerCommand'

describe('dockerContainerName', () => {
  it('prefixes the project id with pm-', () => {
    expect(dockerContainerName('4ef7f170d4f1')).toBe('pm-4ef7f170d4f1')
  })
})

describe('dockerRunCommand', () => {
  it('builds a build-then-run command using the same container name as the image tag', () => {
    const command = dockerRunCommand('C:\\dev\\projetos\\demo', 'abc123')
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\demo" && docker run --rm --name pm-abc123 pm-abc123'
    )
  })

  it('quotes the project path so directory names with special shell characters are safe', () => {
    const command = dockerRunCommand('C:\\dev\\projetos\\proj&ver', 'abc123')
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\proj&ver" && docker run --rm --name pm-abc123 pm-abc123'
    )
  })
})
