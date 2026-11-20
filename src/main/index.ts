import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from './log'
import { handle, broadcast, pickFiles, pickFolder } from './ipc'
import { SetupService } from './services/setup'
import { killAll, killOrphans } from './services/process'
import { exe } from './services/runtime'
import { logout, readUsage, reopenLoginPage, stopAccountClient } from './services/codex/account'
import { VersionService } from './services/version'
import { makeBugReport } from './services/report'
import { getSettings } from './services/settings'
import { restartToUpdate, startUpdater } from './services/updater'
import { VideosService } from './services/videos'
import { handleFileScheme, isInside, registerFileScheme } from './services/files-protocol'

// Thu tu dong: chay voi thu muc du lieu rieng, khong dung toi cai dat that cua nguoi dung
if (process.env.NINESTUDY_USER_DATA) app.setPath('userData', process.env.NINESTUDY_USER_DATA)

// Chi chay mot ban: ban mo sau chi dua cua so ban dang chay len truoc roi thoat, khong lam gi them
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

registerFileScheme()

const setup = new SetupService()
setup.on('changed', (snap) => broadcast('setup:changed', snap))
const videos = new VideosService()
videos.on('changed', (snap) => broadcast('videos:changed', snap))
videos.on('chat', (state) => broadcast('chat:changed', state))
// Sau moi luot AI: doc lai luot ChatGPT con lai
videos.on('turnDone', () => void readUsage().then((u) => broadcast('usage:changed', u)))
const versions = new VersionService(() => getSettings().projectDir ?? '')
let lastVersion: string | undefined

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

  handle('videos:list', () => videos.list())
  handle('videos:script', (slug) => videos.script(slug))
  handle('videos:audio', (slug) => videos.audio(slug))
  handle('videos:lessons', (subject, lop) => videos.lessons(subject, lop))
  handle('videos:create', (input) => videos.create(input))
  handle('chat:open', (key) => videos.chat().open(key))
  handle('chat:send', (key, text) => {
    void videos.chat().send(key, text)
  })
  handle('chat:chip', (key, chip, slug) => {
    void videos.chip(key, chip, slug)
  })
  handle('chat:interrupt', (key) => videos.chat().interrupt(key))
  handle('chat:approve', (key, itemId, decision) => videos.chat().approve(key, itemId, decision))
  handle('studio:start', async () => {
    try {
      return { url: await videos.studioUrl() }
    } catch {
      return { error: true as const }
    }
  })
  handle('shell:showItem', (p) => {
    // Chi mo duoc file trong thu muc du an / noi luu video
    if (videos.allowedRoots().some((r) => isInside(p, r))) shell.showItemInFolder(p)
  })
  handle('dialog:pickFiles', () => pickFiles())
  handle('shell:openPath', (p) => {
    if (videos.allowedRoots().some((r) => isInside(p, r))) void shell.openPath(p)
  })
  handle('version:get', async () => {
    const info = await versions.info()
    lastVersion = info.current ?? info.base
    return info
  })
  handle('version:update', async (target) => {
    const res = await versions.update(
      target,
      (p) => broadcast('version:progress', p),
      () => videos.handoffUpdate(target)
    )
    if (res.ok) {
      lastVersion = res.version
      videos.toolkitChanged()
    }
    return res
  })
  handle('account:usage', () => readUsage())
  handle('account:logout', async () => {
    await logout()
    await setup.refresh()
  })
  handle('app:bugReport', async () => {
    try {
      const zip = await makeBugReport({ 'Bo cong cu': lastVersion ?? '?' })
      shell.showItemInFolder(zip)
      return zip
    } catch (e) {
      log.error(`[bao loi] ${String(e)}`)
      return null
    }
  })
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  if (!gotLock) return
  electronApp.setAppUserModelId('vn.9study.video')
  log.info(`[app] khoi dong ${app.getVersion()}, dong goi: ${app.isPackaged}`)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  // Lan truoc app bi tat ngang (treo, mat dien) thi Codex co the con chay ngam: don truoc
  void killOrphans(exe.codex())
  handleFileScheme(() => videos.allowedRoots())
  registerIpc()
  createWindow()
  startUpdater()
})

// Tat sach moi tien trinh con (Codex, npm, Studio) truoc khi thoat
app.on('before-quit', () => {
  stopAccountClient()
  videos.stopAll()
  killAll()
})

app.on('window-all-closed', () => app.quit())
