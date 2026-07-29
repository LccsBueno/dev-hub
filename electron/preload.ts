import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

const api = {
  scanProjects: () => ipcRenderer.invoke('projects:scan'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateRootFolders: (folders: string[]) => ipcRenderer.invoke('config:updateRoots', folders),
  updateEditorCommand: (command: string) => ipcRenderer.invoke('config:updateEditor', command),
  updateProjectCommand: (id: string, command: string) =>
    ipcRenderer.invoke('config:updateProjectCommand', id, command),
  updateTags: (id: string, tags: string[]) => ipcRenderer.invoke('config:updateTags', id, tags),
  updateNotes: (id: string, notes: string) => ipcRenderer.invoke('config:updateNotes', id, notes),
  updateRunMode: (id: string, runMode: 'native' | 'docker') =>
    ipcRenderer.invoke('config:updateRunMode', id, runMode),
  updatePinned: (id: string, pinned: boolean) => ipcRenderer.invoke('config:updatePinned', id, pinned),
  updateHidden: (id: string, hidden: boolean) => ipcRenderer.invoke('config:updateHidden', id, hidden),
  setTagColor: (tag: string, color: string) => ipcRenderer.invoke('config:setTagColor', tag, color),
  deleteTagColor: (tag: string) => ipcRenderer.invoke('config:deleteTagColor', tag),
  getGitInfo: (path: string) => ipcRenderer.invoke('git:info', path),
  checkRootFolders: () => ipcRenderer.invoke('config:checkRoots'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  getLogBuffer: (id: string) => ipcRenderer.invoke('process:logBuffer', id),
  clearLogBuffer: (id: string) => ipcRenderer.invoke('process:clearLog', id),
  getRunningIds: () => ipcRenderer.invoke('process:runningIds'),
  runProject: (id: string) => ipcRenderer.send('process:run', id),
  stopProject: (id: string) => ipcRenderer.send('process:stop', id),
  openFolder: (path: string) => ipcRenderer.send('open:folder', path),
  openInEditor: (path: string) => ipcRenderer.send('open:editor', path),
  openInTerminal: (path: string) => ipcRenderer.send('open:terminal', path),

  onLog: (callback: (id: string, chunk: string, stream: 'stdout' | 'stderr') => void) => {
    const handler = (
      _e: IpcRendererEvent,
      id: string,
      chunk: string,
      stream: 'stdout' | 'stderr'
    ): void => callback(id, chunk, stream)
    ipcRenderer.on('process:log', handler)
    return () => ipcRenderer.removeListener('process:log', handler)
  },
  onStatusChange: (callback: (id: string, status: 'running' | 'stopped') => void) => {
    const handler = (_e: IpcRendererEvent, id: string, status: 'running' | 'stopped'): void =>
      callback(id, status)
    ipcRenderer.on('process:status', handler)
    return () => ipcRenderer.removeListener('process:status', handler)
  },
  getDirTree: (path: string) => ipcRenderer.invoke('fs:dirTree', path),
  getReadme: (path: string) => ipcRenderer.invoke('fs:readme', path),
  createReadme: (path: string, projectName: string) =>
    ipcRenderer.invoke('fs:createReadme', path, projectName),
  loadArchitecture: (id: string) => ipcRenderer.invoke('arch:load', id),
  saveArchitecture: (id: string, data: unknown) => ipcRenderer.invoke('arch:save', id, data),

  onError: (callback: (message: string) => void) => {
    const handler = (_e: IpcRendererEvent, message: string): void => callback(message)
    ipcRenderer.on('app:error', handler)
    return () => ipcRenderer.removeListener('app:error', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
