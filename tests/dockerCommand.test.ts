import { describe, it, expect } from 'vitest'
import { dockerContainerName, dockerRunCommand } from '../src/lib/dockerCommand'

describe('dockerContainerName', () => {
  it('lowercases the project name and hyphenates spaces', () => {
    expect(dockerContainerName('Portifolio')).toBe('portifolio')
    expect(dockerContainerName('My Cool App')).toBe('my-cool-app')
  })
})

describe('dockerRunCommand', () => {
  it('publishes the inferred port and names the container after the project', () => {
    const command = dockerRunCommand(
      { name: 'demo', path: 'C:\\dev\\projetos\\demo', framework: 'express', inferredPort: 3000 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\demo" && docker run --rm --name demo -p 3000:3000 pm-abc123'
    )
  })

  it('quotes the project path so directory names with special shell characters are safe', () => {
    const command = dockerRunCommand(
      { name: 'demo', path: 'C:\\dev\\projetos\\proj&ver', framework: 'express', inferredPort: 3000 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\proj&ver" && docker run --rm --name demo -p 3000:3000 pm-abc123'
    )
  })

  it('maps the host port to container port 80 for vite-react (nginx)', () => {
    const command = dockerRunCommand(
      { name: 'portifolio', path: 'C:\\dev\\projetos\\portifolio', framework: 'vite-react', inferredPort: 5173 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\portifolio" && docker run --rm --name portifolio -p 5173:80 pm-abc123'
    )
  })

  it('falls back to port 80 for vite-react when no port was inferred', () => {
    const command = dockerRunCommand(
      { name: 'portifolio', path: 'C:\\dev\\projetos\\portifolio', framework: 'vite-react', inferredPort: 0 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\portifolio" && docker run --rm --name portifolio -p 80:80 pm-abc123'
    )
  })

  it('falls back to port 8000 for fastapi when no port was inferred', () => {
    const command = dockerRunCommand(
      { name: 'api', path: 'C:\\dev\\projetos\\api', framework: 'fastapi', inferredPort: 0 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\api" && docker run --rm --name api -p 8000:8000 pm-abc123'
    )
  })

  it('omits the publish flag when no port could be inferred for a generic framework', () => {
    const command = dockerRunCommand(
      { name: 'demo', path: 'C:\\dev\\projetos\\demo', framework: 'unknown', inferredPort: 0 },
      'abc123'
    )
    expect(command).toBe(
      'docker build -t pm-abc123 "C:\\dev\\projetos\\demo" && docker run --rm --name demo pm-abc123'
    )
  })
})
