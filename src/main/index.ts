import './app-identity'
import { app, shell, BrowserWindow } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from './log'
import { handle, broadcast, pickFiles, pickFolder } from './ipc'
import { SetupService } from './services/setup'
import { killAll, killOrphans } from './services/process'
import { exe } from './services/runtime'
import { logout, readUsage, reopenLoginPage, stopAccountClient } from './services/codex/account'
import { VersionService } from './services/version'
import { vivibeUsage } from './services/vivibe-usage'
import { TEAM_FEEDBACK_FOLDER_URL } from '../shared/team'
import {
  addImage,
  allowedShotRoot,
  clearAddedImages,
  removeImage,
  captureError,
  listBugs,
  listShots,
  sendBugReport,
  setBugState
} from './services/bugs'
import { makeBugReport } from './services/report'
import { getSettings, updateSettings } from './services/settings'
import {
  createFeedback,
  feedbackDir,
  feedbackDraft,
  fixFeedback,
  checkFeedbackDir,
  markTeamFolder,
  fixDetail,
  listFeedback,
  machineId,
  setFeedbackState,
  voiceOf,
  FEEDBACK_FOLDER
} from './services/feedback'
import { outputBase } from './services/project'
import { readSpeed, writeSpeed } from './services/voice-config'
import { cleanDisk, diskUsage } from './services/disk'
import type { Prefs, PrefsSnapshot } from '../shared/app'
import { bugAiPrompt } from '../shared/bugs'
import type { FeedbackList } from '../shared/feedback'
import { existsSync, mkdirSync, watch, type FSWatcher } from 'node:fs'
import {
  checkNow,
  restartToUpdate,
  startUpdater,
  updateInfo,
  updateStatus
} from './services/updater'
import { VideosService } from './services/videos'
import {
  copyKey,
  copyMissingVideos,
  legacyChats,
  legacyTranscript,
  saveChats,
  scanLegacy,
  trashFolder
} from './services/legacy'
import { importVoiceRuns } from './services/vivibe-usage'
import { defaultSearchRoots, findVideoRepos, isVideoRepo } from './services/detect'
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
// Trang thai AI tung bai (Video cua toi): chi bao khi doi
let lastAi = ''
videos.on('chat', (state) => {
  broadcast('chat:changed', state)
  const ai = videos.aiStatuses()
  const key = JSON.stringify(ai)
  if (key !== lastAi) {
    lastAi = key
    broadcast('chat:statuses', ai)
  }
})
videos.on('vivibe', () => broadcast('vivibe:changed', null))
// Sau moi luot AI: doc lai luot ChatGPT con lai
videos.on('turnDone', () => void readUsage().then((u) => broadcast('usage:changed', u)))
const versions = new VersionService(() => getSettings().projectDir ?? '')
let lastVersion: string | undefined

let mainWindow: BrowserWindow | null = null

/** Noi giao dien duoc mo file: du an, noi luu video, thu muc gop y. */
function allowedRoots(): string[] {
  const fb = feedbackDir()
  return [...videos.allowedRoots(), ...(fb ? [fb] : []), allowedShotRoot()]
}

function prefsSnapshot(): PrefsSnapshot {
  const s = getSettings()
  const dir = s.projectDir
  return {
    feedbackDir: s.feedbackDir,
    authorName: s.authorName,
    alwaysFullVideo: s.alwaysFullVideo,
    maintainer: s.maintainer,
    askPolicy: s.askPolicy,
    autoCompact: s.autoCompact,
    autoUpdateApp: s.autoUpdateApp,
    defaultVoices: s.defaultVoices,
    defaultAi: s.defaultAi,
    plannedVersions: s.plannedVersions,
    feedbackDirInUse: feedbackDir(),
    projectDir: dir,
    outputDir: dir ? outputBase(dir) : undefined
  }
}

function feedbackList(): FeedbackList {
  return { items: listFeedback(), bugs: listBugs(), me: machineId(), dir: feedbackDir() }
}

// Theo doi thu muc gop y (Drive dong bo ve): bao giao dien doc lai
let fbWatcher: FSWatcher | undefined
let fbWatchDir: string | undefined
let fbTimer: NodeJS.Timeout | undefined
function watchFeedback(): void {
  const dir = feedbackDir()
  if (dir === fbWatchDir) return
  fbWatcher?.close()
  fbWatcher = undefined
  fbWatchDir = dir
  if (!dir || !existsSync(dir)) return
  try {
    fbWatcher = watch(dir, { recursive: true }, () => {
      if (fbTimer) clearTimeout(fbTimer)
      fbTimer = setTimeout(() => broadcast('feedback:changed', feedbackList()), 1500)
    })
  } catch (e) {
    log.warn(`[gop y] khong theo doi duoc thu muc: ${String(e)}`)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'NiniStudio',
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
  handle('app:update', () => updateInfo())
  handle('app:checkUpdate', () => checkNow())
  handle('app:updateState', () => updateStatus())
  handle('app:busyWork', () => videos.busyTitles())
  handle('app:version', () => app.getVersion())
  handle('app:openTeamFolder', () => shell.openExternal(TEAM_FEEDBACK_FOLDER_URL))

  handle('videos:list', () => videos.list())
  handle('videos:script', (slug) => videos.script(slug))
  handle('videos:audio', (slug) => videos.audio(slug))
  handle('videos:lessons', (subject, lop) => videos.lessons(subject, lop))
  handle('videos:create', (input) => videos.create(input))
  handle('videos:resumeDraft', (key) => videos.resumeDraft(key))
  handle('videos:dropDraft', (key) => videos.dropDraft(key))
  handle('videos:remove', (slug) => videos.removeVideo(slug))
  handle('chat:open', (key) => videos.chat().open(key))
  handle('chat:send', (key, text) => {
    void videos.chat().send(key, text)
  })
  handle('chat:chip', (key, chip, slug) => {
    void videos.chip(key, chip, slug)
  })
  handle('chat:interrupt', (key) => videos.chat().interrupt(key))
  handle('chat:setAi', (key, choice) => videos.chat().setAi(key, choice))
  handle('ai:models', () => (videos.projectDir ? videos.chat().models() : []))
  handle('chat:statuses', () => videos.aiStatuses())
  handle('legacy:scan', async (dir) => {
    const s = getSettings()
    const source = dir ?? s.legacySource
    if (!source || !s.projectDir) return null
    try {
      const full = await scanLegacy(source, s.projectDir, (done, total) =>
        broadcast('legacy:progress', { done, total })
      )
      return full.scan
    } catch (e) {
      log.error(`[du lieu cu] quet loi: ${String(e)}`)
      return null
    }
  })
  handle('legacy:findDirs', () => {
    const cur = getSettings().projectDir ?? ''
    return findVideoRepos(defaultSearchRoots()).filter((d) => d.toLowerCase() !== cur.toLowerCase())
  })
  handle('legacy:import', async (dir, opts) => {
    const target = getSettings().projectDir
    if (!target) return null
    try {
      const full = await scanLegacy(dir, target)
      const videosAdded = opts.videos ? await copyMissingVideos(dir, target) : 0
      const key = opts.key ? copyKey(dir, target) : false
      if (opts.chats) saveChats(target, full.parsed)
      const chars = opts.voice
        ? importVoiceRuns(
            target,
            full.parsed.flatMap((p) => p.runs)
          )
        : 0
      void videos.list().then((snap) => broadcast('videos:changed', snap))
      void setup.refresh().then((snap) => broadcast('setup:changed', snap))
      return { videos: videosAdded, chats: opts.chats ? full.scan.chats.length : 0, chars, key }
    } catch (e) {
      log.error(`[du lieu cu] nhan loi: ${String(e)}`)
      return null
    }
  })
  handle('legacy:chats', (slug) => legacyChats(getSettings().projectDir ?? '', slug))
  handle('legacy:transcript', (id) => legacyTranscript(id))
  handle('legacy:resume', (key, id) => videos.resumeLegacy(key, id))
  handle('legacy:ack', async () => {
    updateSettings({ legacySeen: true })
    broadcast('setup:changed', await setup.refresh())
  })
  handle('legacy:trashSource', async () => {
    const s = getSettings()
    const src = s.legacyResult?.copiedFrom
    const cur = s.projectDir
    if (!src || !cur || !existsSync(src)) return { ok: false }
    const a = resolve(src).toLowerCase()
    const b = resolve(cur).toLowerCase()
    // Chi bo dung thu muc da chep du, khong bao gio la (hoac chua) thu muc dang dung
    if (a === b || b.startsWith(`${a}\\`) || a.startsWith(`${b}\\`) || !isVideoRepo(cur))
      return { ok: false }
    const ok = await trashFolder(src)
    if (ok) {
      updateSettings({
        legacyResult: { ...s.legacyResult!, copiedFrom: undefined, sourceRemoved: true }
      })
      broadcast('setup:changed', await setup.refresh())
    }
    log.info(`[du lieu cu] bo thu muc cu ${src}: ${ok ? 'da vao thung rac' : 'chua bo'}`)
    return { ok }
  })
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
    if (allowedRoots().some((r) => isInside(p, r))) shell.showItemInFolder(p)
  })
  handle('dialog:pickFiles', () => pickFiles())
  handle('shell:openPath', (p) => {
    if (allowedRoots().some((r) => isInside(p, r))) void shell.openPath(p)
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

  handle('prefs:get', () => prefsSnapshot())
  handle('prefs:set', (patch: Prefs) => {
    updateSettings(patch)
    watchFeedback()
    const snap = prefsSnapshot()
    broadcast('prefs:changed', snap)
    if ('feedbackDir' in patch) broadcast('feedback:changed', feedbackList())
    return snap
  })
  handle('feedback:pickDir', async () => {
    const picked = await pickFolder(feedbackDir() ?? app.getPath('home'))
    if (!picked) return null
    // Chon thu muc cha (vd My Drive) thi tao 9Study_GopY ben trong
    const dir = /9Study_GopY$/i.test(picked) ? picked : join(picked, FEEDBACK_FOLDER)
    try {
      mkdirSync(dir, { recursive: true })
    } catch (e) {
      log.warn(`[gop y] khong tao duoc thu muc: ${String(e)}`)
      return null
    }
    updateSettings({ feedbackDir: dir })
    watchFeedback()
    const snap = prefsSnapshot()
    broadcast('prefs:changed', snap)
    broadcast('feedback:changed', feedbackList())
    return snap
  })
  handle('voice:speed', () => {
    const dir = getSettings().projectDir
    return dir ? readSpeed(dir) : null
  })
  handle('voice:setSpeed', (speed) => {
    const dir = getSettings().projectDir
    if (dir) writeSpeed(dir, speed)
  })
  handle('disk:usage', () => diskUsage(getSettings().projectDir ?? ''))
  handle('vivibe:usage', (month) => vivibeUsage(getSettings().projectDir ?? '', month))
  handle('app:errorShown', async (key, label) => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (win) await captureError(win.webContents, key, label)
  })
  // O bao loi vua mo: bo anh them con sot tu lan mo truoc
  handle('bugs:shots', () => {
    clearAddedImages()
    return listShots()
  })
  handle('bugs:addImage', (name, mime, data) => addImage(name, mime, data))
  handle('bugs:removeImage', (id) => removeImage(id))
  handle('bugs:send', async (input) => {
    const res = await sendBugReport(input, {
      toolkitVersion: lastVersion ?? (await videos.toolkitVersion())
    })
    if (res.ok) broadcast('feedback:changed', feedbackList())
    return res
  })
  handle('bugs:askAi', (id) => {
    const bug = listBugs().find((b) => b.id === id)
    if (!bug) return null
    const key = `he-baoloi-${id.replace(/[^A-Za-z0-9_-]/g, '-')}`
    void videos.chat().send(key, bugAiPrompt(bug, 'app'))
    if (bug.state.status === 'moi') setBugState(id, 'dangXem')
    broadcast('feedback:changed', feedbackList())
    return key
  })
  handle('bugs:setState', (id, status) => {
    setBugState(id, status)
    broadcast('feedback:changed', feedbackList())
  })
  handle('disk:clean', (which) => cleanDisk(getSettings().projectDir ?? '', which))
  handle('feedback:draft', (slug, time, beatLine) =>
    feedbackDraft(getSettings().projectDir ?? '', slug, time, beatLine)
  )
  handle('feedback:create', async (input) => {
    if (!feedbackDir()) return { ok: false as const, code: 'chuaCoThuMuc' as const }
    const dir = getSettings().projectDir ?? ''
    try {
      const out = await createFeedback(dir, input, {
        toolkitVersion: await videos.toolkitVersion(),
        voice: voiceOf(dir, input.slug)
      })
      broadcast('feedback:changed', feedbackList())
      return { ok: true as const, dir: out }
    } catch (e) {
      log.error(`[gop y] tao goi loi: ${String(e)}`)
      return { ok: false as const, code: 'loi' as const }
    }
  })
  handle('feedback:list', () => {
    watchFeedback()
    return feedbackList()
  })
  handle('feedback:setState', async (ids, patch) => {
    // Danh dau xong: ghi kem dong nhat ky phien ban de CTV cung thay da sua gi
    if (patch.status === 'daSua' && !patch.changelog && ids[0]) {
      const d = await fixDetail(getSettings().projectDir ?? '', ids[0]).catch(() => null)
      if (d?.found && d.changelog.length) patch = { ...patch, changelog: d.changelog }
    }
    setFeedbackState(ids, patch)
    broadcast('feedback:changed', feedbackList())
  })
  handle('feedback:checkDir', () => checkFeedbackDir())
  handle('feedback:markTeam', () => {
    markTeamFolder()
    broadcast('feedback:changed', feedbackList())
    return checkFeedbackDir()
  })
  handle('feedback:fixDetail', (id) => fixDetail(getSettings().projectDir ?? '', id))
  handle('feedback:fix', async (input) => {
    const key = await fixFeedback(getSettings().projectDir ?? '', input, (k, text) =>
      videos.chat().send(k, text)
    )
    broadcast('feedback:changed', feedbackList())
    return key
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
  handleFileScheme(() => allowedRoots())
  watchFeedback()
  registerIpc()
  createWindow()
  startUpdater()
})

// Tat sach moi tien trinh con (Codex, npm, Studio) truoc khi thoat
app.on('before-quit', () => {
  stopAccountClient()
  videos.stopAll()
  fbWatcher?.close()
  killAll()
})

app.on('window-all-closed', () => app.quit())
