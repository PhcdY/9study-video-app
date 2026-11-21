// App tu cap nhat tu GitHub Releases: tai ngam, xong thi bao giao dien (nut "Cap nhat app" tren thanh dau).
import { app } from 'electron'
import electronUpdater from 'electron-updater'
import log from '../log'
import { broadcast } from '../ipc'
import { getSettings } from './settings'
import { releaseNoteLines, type AppUpdate } from '../../shared/app'

const { autoUpdater } = electronUpdater
const RELEASES = 'https://github.com/PhcdY/9study-video-app/releases'

let ready: AppUpdate | null = null

/** Ban app moi da tai xong (giao dien mo sau khi tai xong van doc duoc). */
export function updateInfo(): AppUpdate | null {
  return ready
}

export function startUpdater(): void {
  if (!app.isPackaged) {
    // Chi de thu giao dien tren may dev: NINESTUDY_FAKE_UPDATE=0.1.5
    const fake = process.env.NINESTUDY_FAKE_UPDATE
    if (fake)
      ready = {
        version: fake,
        current: app.getVersion(),
        notes: ['Dòng thử một.', 'Dòng thử hai.', 'Dòng thử ba.', 'Dòng thử bốn.'],
        url: `${RELEASES}/tag/v${fake}`
      }
    return
  }
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-downloaded', (info) => {
    ready = {
      version: info.version,
      current: app.getVersion(),
      notes: releaseNoteLines(info.releaseNotes),
      url: `${RELEASES}/tag/v${info.version}`
    }
    broadcast('app:updateReady', ready)
  })
  autoUpdater.on('error', (e) => log.warn(`[cap nhat] ${String(e)}`))
  const check = (): void => {
    // Nguoi dung tat "Tu tai ban app moi" trong Cai dat
    if (getSettings().autoUpdateApp === false) return
    autoUpdater.checkForUpdates().catch((e) => log.warn(`[cap nhat] ${String(e)}`))
  }
  check()
  setInterval(check, 4 * 60 * 60 * 1000)
}

export function restartToUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}
