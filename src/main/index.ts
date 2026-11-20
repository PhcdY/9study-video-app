import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from './log'
import { handle, broadcast, pickFolder } from './ipc'
import { SetupService } from './services/setup'
import { killAll } from './services/process'
import { reopenLoginPage, stopAccountClient } from './services/codex/account'
import { restartToUpdate, startUpdater } from './services/updater'

if (!app.requestSingleInstanceLock()) app.quit()

const setup = new SetupService()
setup.on('changed', (snap) => broadcast('setup:changed', snap))

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: '9Study Video',
    backgroundColor: '#F6F8FE',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Link ngoai mo bang trinh duyet mac dinh; chi cho http(s)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(process.env['ELECTRON_RENDERER_URL'] ?? 'file://')) e.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  handle('setup:get', () => setup.refresh())
  handle('setup:run', (id, input) => {
    // chay nen; tien trinh bao qua su kien setup:changed
    void setup.runStep(id, input)
  })
  handle('setup:skip', (id) => setup.skip(id))
  handle('setup:cancel', (id) => setup.cancel(id))
  handle('dialog:pickFolder', (defaultPath) => pickFolder(defaultPath))
  handle('app:openLoginPage', () => reopenLoginPage())
  handle('app:restartToUpdate', () => restartToUpdate())
  handle('app:version', () => app.getVersion())
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('vn.9study.video')
  log.info(`[app] khoi dong ${app.getVersion()}, dong goi: ${app.isPackaged}`)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  registerIpc()
  createWindow()
  startUpdater()
})

// Tat sach moi tien trinh con (Codex, npm, Studio) truoc khi thoat
app.on('before-quit', () => {
  stopAccountClient()
  killAll()
})

app.on('window-all-closed', () => app.quit())
