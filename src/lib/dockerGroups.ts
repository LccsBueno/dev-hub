import type { DockerGroup } from '../types'

export function addContainerToGroup(group: DockerGroup, containerName: string): DockerGroup {
  if (group.containerNames.includes(containerName)) return group
  return { ...group, containerNames: [...group.containerNames, containerName] }
}

export function removeContainerFromGroup(group: DockerGroup, containerName: string): DockerGroup {
  return { ...group, containerNames: group.containerNames.filter((n) => n !== containerName) }
}

export function reorderGroup(group: DockerGroup, fromIndex: number, toIndex: number): DockerGroup {
  const { containerNames } = group
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= containerNames.length ||
    toIndex >= containerNames.length
  ) {
    return group
  }
  const next = [...containerNames]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return { ...group, containerNames: next }
}
