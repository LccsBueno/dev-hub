import { useEffect, useState } from 'react'
import type { ProjectConfig } from '../../types'

interface Props {
  projectId: string
  project: ProjectConfig
  onNotesChange: (id: string, notes: string) => void
}

export default function NotesTab({ projectId, project, onNotesChange }: Props) {
  const [notes, setNotes] = useState(project.notes)

  useEffect(() => setNotes(project.notes), [project.notes])

  const save = (): void => {
    if (notes !== project.notes) onNotesChange(projectId, notes)
  }

  return (
    <div className="flex h-full flex-col p-5">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Anotações sobre este projeto…"
        className="flex-1 resize-none rounded-md border border-border bg-bg p-3 text-sm outline-none focus:border-accent"
      />
    </div>
  )
}
