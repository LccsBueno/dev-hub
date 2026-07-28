import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { loadConfig, saveConfig, mergeProjects } from './configStore'
import { scanRoots } from './scanner'
import { ProcessManager } from './processManager'
import { getGitInfo, emptyGitInfo } from './gitInfo'
import { stopContainer } from './docker'
import { dockerContainerName, dockerRunCommand } from '../src/lib/dockerCommand'
import type { Config, RunMode } from '../src/types'

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
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#ffffff',
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
    if (runMode === 'docker' && !project.hasDockerfile) return
    project.runMode = runMode
    saveConfig(configPath(), cfg)
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
      setTimeout(() => {
        if (pm.isRunning(id)) pm.stop(id)
      }, 12000)
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

app.on('before-quit', () => pm.stopAll())
app.on('window-all-closed', () => app.quit())
