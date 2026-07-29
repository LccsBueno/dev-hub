import { useEffect, useState } from 'react'
import { Marked } from 'marked'

const marked = new Marked()

interface Props {
  projectPath: string
}

export default function NotesTab({ projectPath }: Props) {
  const [readme, setReadme] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    setReadme(undefined)
    window.api.getReadme(projectPath).then(setReadme)
  }, [projectPath])

  if (readme === undefined) {
    return <div className="p-5 text-xs text-muted">Carregando…</div>
  }

  if (readme === null) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <p className="text-sm text-muted">Nenhum README.md encontrado.</p>
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
