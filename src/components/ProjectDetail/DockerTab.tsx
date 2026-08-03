import { useState } from 'react'
import type { ProjectConfig } from '../../types'
import { generateComposeTemplate } from '../../lib/composeTemplate'
import { generateDockerfileTemplate } from '../../lib/dockerfileTemplate'
import DockerFileEditor from './DockerFileEditor'

interface Props {
  projectId: string
  project: ProjectConfig
}

type FileTab = 'dockerfile' | 'compose'

const fileTabs: { id: FileTab; label: string }[] = [
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'compose', label: 'docker-compose.yml' }
]

export default function DockerTab({ projectId, project }: Props) {
  const [activeFile, setActiveFile] = useState<FileTab>('dockerfile')

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border px-4 pt-2">
        {fileTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFile(tab.id)}
            className={`rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none ${
              activeFile === tab.id
                ? 'border border-b-0 border-border bg-bg text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {activeFile === 'dockerfile' ? (
          <DockerFileEditor
            key={`${projectId}:dockerfile`}
            projectId={projectId}
            project={project}
            fileLabel="Dockerfile"
            language="dockerfile"
            emptyMessage="Nenhum Dockerfile encontrado. Gere um template abaixo."
            read={(path) => window.api.readDockerfile(path)}
            write={(path, content) => window.api.writeDockerfile(path, content)}
            generate={generateDockerfileTemplate}
          />
        ) : (
          <DockerFileEditor
            key={`${projectId}:compose`}
            projectId={projectId}
            project={project}
            fileLabel="docker-compose.yml"
            language="yaml"
            emptyMessage="Nenhum compose encontrado. Gere um template abaixo."
            read={(path) => window.api.readDockerCompose(path)}
            write={(path, content) => window.api.writeDockerCompose(path, content)}
            generate={generateComposeTemplate}
          />
        )}
      </div>
    </div>
  )
}
