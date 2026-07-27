import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { loadConfig, saveConfig, mergeProjects } from './configStore'
import { scanRoots } from './scanner'
import { ProcessManager } from './processManager'
import type { Config } from '../src/types'

const pm = new ProcessManager()
let win: BrowserWindow | null = null

const configPath = (): string => join(app.getPath('userData'), 'config.json')

function sendError(message: string): void {
  win?.webContents.send('app:error', message)
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
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

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
    if (!project.runCommand.trim()) {
      sendError(`"${project.name}" não tem comando de run configurado.`)
      return
    }
    project.lastRunAt = new Date().toISOString()
    saveConfig(configPath(), cfg)
    pm.run(id, project.runCommand, project.path)
  })

  ipcMain.on('process:stop', (_e, id: string) => pm.stop(id))

  ipcMain.on('open:folder', (_e, path: string) => {
    shell.openPath(path)
  })

  ipcMain.on('open:editor', (_e, path: string) => {
    const cfg = loadConfig(configPath())
    const child = spawn(cfg.editorCommand, [path], { shell: true, stdio: 'ignore' })
    child.on('exit', (code) => {
      if (code !== 0) sendError(`"${cfg.editorCommand}" não encontrado no PATH.`)
    })
    child.on('error', () => sendError(`"${cfg.editorCommand}" não encontrado no PATH.`))
  })

  ipcMain.on('open:terminal', (_e, path: string) => {
    const wt = spawn('wt', ['-d', path], { shell: true, stdio: 'ignore' })
    wt.on('exit', (code) => {
      if (code !== 0) {
        spawn('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${path}"`], {
          shell: false,
          detached: true,
          stdio: 'ignore'
        }).unref()
      }
    })
    wt.on('error', () => {
      spawn('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${path}"`], {
        shell: false,
        detached: true,
        stdio: 'ignore'
      }).unref()
    })
  })

  pm.onLog((id, chunk, stream) => win?.webContents.send('process:log', id, chunk, stream))
  pm.onStatus((id, status) => win?.webContents.send('process:status', id, status))
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
})

app.on('before-quit', () => pm.stopAll())
app.on('window-all-closed', () => app.quit())
