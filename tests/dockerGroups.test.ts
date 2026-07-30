import { describe, it, expect } from 'vitest'
import { addContainerToGroup, removeContainerFromGroup, reorderGroup } from '../src/lib/dockerGroups'
import type { DockerGroup } from '../src/types'

const baseGroup: DockerGroup = { id: 'g1', name: 'Dev stack', containerNames: ['db', 'api'] }

describe('addContainerToGroup', () => {
  it('appends the container name to the end', () => {
    const result = addContainerToGroup(baseGroup, 'worker')
    expect(result.containerNames).toEqual(['db', 'api', 'worker'])
  })

  it('does not add a duplicate if the container is already in the group', () => {
    const result = addContainerToGroup(baseGroup, 'db')
    expect(result.containerNames).toEqual(['db', 'api'])
  })

  it('does not mutate the original group', () => {
    addContainerToGroup(baseGroup, 'worker')
    expect(baseGroup.containerNames).toEqual(['db', 'api'])
  })
})

describe('removeContainerFromGroup', () => {
  it('removes the named container', () => {
    const result = removeContainerFromGroup(baseGroup, 'db')
    expect(result.containerNames).toEqual(['api'])
  })

  it('is a no-op when the container is not in the group', () => {
    const result = removeContainerFromGroup(baseGroup, 'nonexistent')
    expect(result.containerNames).toEqual(['db', 'api'])
  })
})

describe('reorderGroup', () => {
  it('moves a container from one index to another', () => {
    const group: DockerGroup = { id: 'g1', name: 'X', containerNames: ['a', 'b', 'c'] }
    const result = reorderGroup(group, 0, 2)
    expect(result.containerNames).toEqual(['b', 'c', 'a'])
  })

  it('moving to the same index is a no-op', () => {
    const group: DockerGroup = { id: 'g1', name: 'X', containerNames: ['a', 'b', 'c'] }
    const result = reorderGroup(group, 1, 1)
    expect(result.containerNames).toEqual(['a', 'b', 'c'])
  })

  it('out-of-range indices return the group unchanged', () => {
    const group: DockerGroup = { id: 'g1', name: 'X', containerNames: ['a', 'b', 'c'] }
    expect(reorderGroup(group, 0, 99).containerNames).toEqual(['a', 'b', 'c'])
    expect(reorderGroup(group, -1, 1).containerNames).toEqual(['a', 'b', 'c'])
  })
})
