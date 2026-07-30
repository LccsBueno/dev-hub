import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { spawn } from 'child_process'
import { loadConfig, saveConfig, mergeProjects } from './configStore'
import { scanRoots } from './scanner'
import { ProcessManager } from './processManager'
import { getGitInfo, emptyGitInfo } from './gitInfo'
import { armStopFallback, clearStopFallback, stopContainer } from './docker'
import { getContainerMounts, listContainers, restartContainer, startContainer } from './dockerInspect'
import { dockerContainerName, dockerRunCommand } from '../src/lib/dockerCommand'
import type { Config, DockerGroup, RunMode } from '../src/types'

const pm = new ProcessManager()
let win: BrowserWindow | null = null

const configPath = (): string => join(app.getPath('userData'), 'config.json')

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (win && !win.isDestroyed()) win.webContents.send(channel, ...args)
}

function sendError(message: string): void {
  sendToRenderer('app:error', message)
}

function isKnownProjectPath(path: string): boolean {
  const cfg = loadConfig(configPath())
  return Object.values(cfg.projects).some((p) => p.path === path)
}

function doScan(): Config {
  const cfg = loadConfig(configPath())
  const scanned = scanRoots(cfg.rootFolders)
  cfg.projects = mergeProjects(cfg.projects, scanned)
  saveConfig(configPath(), cfg)
  return cfg
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1040,
    minHeight: 600,
    backgroundColor: '#252525',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#252525',
      symbolColor: '#ececec',
      height: 32
    },
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('closed', () => {
    win = null
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('projects:scan', () => doScan())
  ipcMain.handle('config:get', () => loadConfig(configPath()))

  ipcMain.handle('config:updateRoots', (_e, folders: string[]) => {
    const cfg = loadConfig(configPath())
    cfg.rootFolders = folders
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateEditor', (_e, command: string) => {
    const cfg = loadConfig(configPath())
    cfg.editorCommand = command
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateProjectCommand', (_e, id: string, command: string) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    project.runCommand = command
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateTags', (_e, id: string, tags: string[]) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    project.tags = tags
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateNotes', (_e, id: string, notes: string) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    project.notes = notes
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateRunMode', (_e, id: string, runMode: RunMode) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    if (runMode === 'docker' && !project.hasDockerfile) {
      sendError(`"${project.name}" não tem Dockerfile — não é possível ativar o modo Docker.`)
      return
    }
    project.runMode = runMode
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updatePinned', (_e, id: string, pinned: boolean) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    project.pinned = pinned
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateHidden', (_e, id: string, hidden: boolean) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    project.hidden = hidden
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:setTagColor', (_e, tag: string, color: string) => {
    const cfg = loadConfig(configPath())
    cfg.tagColors[tag] = color
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:deleteTagColor', (_e, tag: string) => {
    const cfg = loadConfig(configPath())
    delete cfg.tagColors[tag]
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('config:updateDockerGroups', (_e, groups: DockerGroup[]) => {
    const cfg = loadConfig(configPath())
    cfg.dockerGroups = groups
    saveConfig(configPath(), cfg)
  })

  ipcMain.handle('docker:list', () => listContainers())

  ipcMain.handle('docker:mounts', (_e, id: string) => getContainerMounts(id))

  ipcMain.handle('docker:start', (_e, id: string) => {
    startContainer(id)
  })

  ipcMain.handle('docker:stop', (_e, id: string) => {
    stopContainer(id)
  })

  ipcMain.handle('docker:restart', (_e, id: string) => {
    restartContainer(id)
  })

  ipcMain.handle('docker:runGroup', async (_e, groupId: string, action: 'start' | 'stop' | 'restart') => {
    const cfg = loadConfig(configPath())
    const group = cfg.dockerGroups.find((g) => g.id === groupId)
    if (!group) return
    for (const containerName of group.containerNames) {
      try {
        if (action === 'start') startContainer(containerName)
        else if (action === 'stop') stopContainer(containerName)
        else restartContainer(containerName)
      } catch (err) {
        console.error(`[docker:runGroup] failed for container ${containerName}:`, err)
      }
    }
  })

  ipcMain.handle('compose:read', (_e, projectPath: string) => {
    const file = join(projectPath, 'docker-compose.yml')
    try {
      return existsSync(file) ? readFileSync(file, 'utf-8') : null
    } catch {
      return null
    }
  })

  ipcMain.handle('compose:write', (_e, projectPath: string, content: string) => {
    writeFileSync(join(projectPath, 'docker-compose.yml'), content, 'utf-8')
  })

  ipcMain.handle('git:info', (_e, path: string) => {
    if (!isKnownProjectPath(path)) return emptyGitInfo
    return getGitInfo(path)
  })

  ipcMain.handle('config:checkRoots', () => {
    const cfg = loadConfig(configPath())
    return cfg.rootFolders.map((path) => ({ path, exists: existsSync(path) }))
  })

  ipcMain.handle('dialog:pickFolder', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('process:logBuffer', (_e, id: string) => pm.logBuffer(id))
  ipcMain.handle('process:clearLog', (_e, id: string) => pm.clearBuffer(id))
  ipcMain.handle('process:runningIds', () => pm.runningIds())

  ipcMain.on('process:run', (_e, id: string) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (!project) return
    clearStopFallback(id)

    if (project.runMode === 'docker') {
      project.lastRunAt = new Date().toISOString()
      saveConfig(configPath(), cfg)
      pm.run(id, dockerRunCommand(project.path, id), project.path)
      return
    }

    if (typeof project.runCommand !== 'string' || !project.runCommand.trim()) {
      sendError(`"${project.name}" não tem comando de run configurado.`)
      return
    }
    project.lastRunAt = new Date().toISOString()
    saveConfig(configPath(), cfg)
    pm.run(id, project.runCommand, project.path)
  })

  ipcMain.on('process:stop', (_e, id: string) => {
    const cfg = loadConfig(configPath())
    const project = cfg.projects[id]
    if (project?.runMode === 'docker') {
      stopContainer(dockerContainerName(id))
      armStopFallback(
        id,
        () => {
          if (pm.isRunning(id)) {
            stopContainer(dockerContainerName(id))
            pm.stop(id)
          }
        },
        15000
      )
      return
    }
    pm.stop(id)
  })

  ipcMain.on('open:folder', (_e, path: string) => {
    if (!isKnownProjectPath(path)) return
    shell.openPath(path)
  })

  ipcMain.on('open:editor', (_e, path: string) => {
    if (!isKnownProjectPath(path)) return
    const cfg = loadConfig(configPath())
    const child = spawn(cfg.editorCommand, [`"${path}"`], { shell: true, stdio: 'ignore' })
    child.on('exit', (code) => {
      if (code !== 0) sendError(`"${cfg.editorCommand}" não encontrado no PATH.`)
    })
    child.on('error', () => sendError(`"${cfg.editorCommand}" não encontrado no PATH.`))
  })

  ipcMain.handle('fs:createReadme', (_e, dirPath: string, projectName: string) => {
    if (!isKnownProjectPath(dirPath)) return false
    const readmePath = join(dirPath, 'README.md')
    if (existsSync(readmePath)) return false
    try {
      writeFileSync(
        readmePath,
        `# ${projectName}\n\n## Descrição\n\n## Como rodar\n\n## Estrutura\n\n## Tecnologias\n`,
        'utf8'
      )
      return true
    } catch {
      return false
    }
  })

  const archDir = join(app.getPath('userData'), 'architectures')

  ipcMain.handle('arch:load', (_e, id: string) => {
    const filePath = join(archDir, `${id}.json`)
    if (!existsSync(filePath)) return null
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'))
    } catch {
      return null
    }
  })

  ipcMain.handle('arch:save', (_e, id: string, data: unknown) => {
    if (!existsSync(archDir)) mkdirSync(archDir, { recursive: true })
    try {
      writeFileSync(join(archDir, `${id}.json`), JSON.stringify(data))
    } catch {
      // ignore
    }
  })

  ipcMain.handle('fs:dirTree', (_e, dirPath: string) => {
    if (!isKnownProjectPath(dirPath)) return []
    try {
      return readdirSync(dirPath, { withFileTypes: true })
        .map((e) => ({ name: e.name, isDir: e.isDirectory() }))
        .sort((a, b) => {
          if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
          return a.name.localeCompare(b.name)
        })
    } catch {
      return []
    }
  })

  ipcMain.handle('fs:readme', (_e, dirPath: string) => {
    if (!isKnownProjectPath(dirPath)) return null
    try {
      const entries = readdirSync(dirPath)
      const name = entries.find((e) => /^readme\.md$/i.test(e))
      if (!name) return null
      return readFileSync(join(dirPath, name), 'utf8')
    } catch {
      return null
    }
  })

  ipcMain.on('open:terminal', (_e, path: string) => {
    if (!isKnownProjectPath(path)) return
    const wt = spawn('wt', ['-d', `"${path}"`], { shell: true, stdio: 'ignore' })
    let fellBack = false
    const fallback = (): void => {
      if (fellBack) return
      fellBack = true
      spawn('cmd', ['/c', 'start', 'cmd', '/k'], {
        cwd: path,
        detached: true,
        stdio: 'ignore'
      }).unref()
    }
    wt.on('exit', (code) => {
      if (code !== 0) fallback()
    })
    wt.on('error', fallback)
  })

  pm.onLog((id, chunk, stream) => sendToRenderer('process:log', id, chunk, stream))
  pm.onStatus((id, status) => sendToRenderer('process:status', id, status))
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
})

app.on('before-quit', () => {
  const cfg = loadConfig(configPath())
  for (const id of pm.runningIds()) {
    if (cfg.projects[id]?.runMode === 'docker') {
      stopContainer(dockerContainerName(id))
    }
  }
  pm.stopAll()
})
app.on('window-all-closed', () => app.quit())
