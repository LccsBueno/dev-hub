import { useEffect, useState } from 'react'
import { FilePlus } from 'lucide-react'
import { Marked } from 'marked'

const marked = new Marked()

interface Props {
  projectPath: string
  projectName: string
}

export default function NotesTab({ projectPath, projectName }: Props) {
  const [readme, setReadme] = useState<string | null | undefined>(undefined)
  const [creating, setCreating] = useState(false)

  const load = (): void => {
    setReadme(undefined)
    window.api.getReadme(projectPath).then(setReadme)
  }

  useEffect(load, [projectPath])

  const handleCreate = async (): Promise<void> => {
    setCreating(true)
    await window.api.createReadme(projectPath, projectName)
    setCreating(false)
    load()
  }

  if (readme === undefined) {
    return <div className="p-5 text-xs text-muted">Carregando…</div>
  }

  if (readme === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-5">
        <p className="text-sm text-muted">Nenhum README.md encontrado.</p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
        >
          <FilePlus size={15} />
          Criar README.md
        </button>
      </div>
    )
  }

  const html = marked.parse(readme) as string

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="readme-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
