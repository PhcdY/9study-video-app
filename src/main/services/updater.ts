// App tu cap nhat tu GitHub Releases: tai ngam, xong thi bao giao dien (nut "Cap nhat app" tren thanh dau).
// Ngoai lan tu tim moi 4 gio, nguoi dung bam "Tim ban moi" trong Cai dat de tim ngay.
import { app } from 'electron'
import electronUpdater from 'electron-updater'
import log from '../log'
import { broadcast } from '../ipc'
import { getSettings } from './settings'
import { releaseNoteLines, type AppUpdate, type AppUpdateCheck } from '../../shared/app'

const { autoUpdater } = electronUpdater
const RELEASES = 'https://github.com/PhcdY/9study-video-app/releases'

let ready: AppUpdate | null = null
let status: AppUpdateCheck | null = null

function setStatus(s: AppUpdateCheck): AppUpdateCheck {
  status = s
  broadcast('app:updateStatus', s)
  return s
}

const currentState = (): AppUpdateCheck['state'] | undefined => status?.state

/** Ban app moi da tai xong (giao dien mo sau khi tai xong van doc duoc). */
export function updateInfo(): AppUpdate | null {
  return ready
}

/** Dang tim / dang tai / ket qua lan tim gan nhat. */
export function updateStatus(): AppUpdateCheck | null {
  return status
}

/** Tim ban moi ngay (nut "Tim ban moi"); co ban moi thi tai luon, tai xong bao 'app:updateReady'. */
export async function checkNow(): Promise<AppUpdateCheck> {
  if (ready) return setStatus({ state: 'ready' })
  if (status?.state === 'checking' || status?.state === 'downloading') return status
  if (!app.isPackaged) {
    // May dev khong co ban phat hanh de tim: gia lap "da moi nhat"
    setStatus({ state: 'checking' })
    await new Promise((r) => setTimeout(r, 800))
    return setStatus({ state: 'latest' })
  }
  setStatus({ state: 'checking' })
  try {
    const r = await autoUpdater.checkForUpdates()
    // Su kien 'update-available' / 'update-not-available' da dat trang thai; con dang tim thi tu ket luan
    // (doc lai qua ham: su kien co the da doi `status` trong luc cho)
    if (currentState() === 'checking')
      setStatus(
        r?.isUpdateAvailable
          ? { state: 'downloading', version: r.updateInfo.version, percent: 0 }
          : { state: 'latest' }
      )
  } catch (e) {
    log.warn(`[cap nhat] tim thu cong: ${String(e)}`)
    setStatus({ state: 'error' })
  }
  return status ?? { state: 'latest' }
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
  autoUpdater.on('update-available', (info) =>
    setStatus({ state: 'downloading', version: info.version, percent: 0 })
  )
  autoUpdater.on('update-not-available', () => setStatus({ state: 'latest' }))
  autoUpdater.on('download-progress', (p) => {
    if (status?.state !== 'downloading') return
    const percent = Math.floor(p.percent)
    // Moi phan tram bao mot lan, khong day giao dien qua nhieu
    if (percent !== status.percent) setStatus({ ...status, percent })
  })
  autoUpdater.on('update-downloaded', (info) => {
    ready = {
      version: info.version,
      current: app.getVersion(),
      notes: releaseNoteLines(info.releaseNotes),
      url: `${RELEASES}/tag/v${info.version}`
    }
    setStatus({ state: 'ready' })
    broadcast('app:updateReady', ready)
  })
  autoUpdater.on('error', (e) => {
    log.warn(`[cap nhat] ${String(e)}`)
    if (!ready) setStatus({ state: 'error' })
  })
  const check = (): void => {
    // Nguoi dung tat "Tu tai ban app moi" trong Cai dat; dang tim / dang tai thi thoi
    if (getSettings().autoUpdateApp === false) return
    if (ready || status?.state === 'checking' || status?.state === 'downloading') return
    autoUpdater.checkForUpdates().catch((e) => log.warn(`[cap nhat] ${String(e)}`))
  }
  check()
  setInterval(check, 4 * 60 * 60 * 1000)
}

export function restartToUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}
