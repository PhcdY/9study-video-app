// App tu cap nhat tu GitHub Releases: tai ngam, xong thi bao giao dien "Khoi dong lai de cap nhat".
import { app } from 'electron'
import electronUpdater from 'electron-updater'
import log from '../log'
import { broadcast } from '../ipc'
import { getSettings } from './settings'

const { autoUpdater } = electronUpdater

export function startUpdater(): void {
  if (!app.isPackaged) return
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-downloaded', (info) =>
    broadcast('app:updateReady', { version: info.version })
  )
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
