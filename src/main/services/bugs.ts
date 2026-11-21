// Bao loi app:
// - Anh luc loi: moi khi giao dien hien thong bao loi, chup cua so app (giu 3 anh gan nhat).
// - Gui bao loi: ghi nhat ky (da che), thong tin may, mo ta, anh vao 9Study_GopY/_BaoLoi/<goi>.
// Khong bao gio gui .env, key, token (writeReportFiles da loai).
import { app, type WebContents } from 'electron'
import path from 'node:path'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statfsSync,
  writeFileSync
} from 'node:fs'
import {
  errorLines,
  type BugItem,
  type BugMeta,
  type BugSendInput,
  type BugStatus,
  type ErrorShot
} from '../../shared/bugs'
import { slugify } from '../../shared/feedback-rules'
import { getSettings } from './settings'
import { feedbackDir, machineId } from './feedback'
import { writeReportFiles } from './report'
import { redact } from '../redact'
import log from '../log'

export const BUG_FOLDER = '_BaoLoi'
const KEEP_SHOTS = 3

const shotsDir = (): string => path.join(app.getPath('userData'), 'anh-loi')
const shotsIndex = (): string => path.join(shotsDir(), 'index.json')

export function allowedShotRoot(): string {
  return shotsDir()
}

export function listShots(): ErrorShot[] {
  try {
    const list = JSON.parse(readFileSync(shotsIndex(), 'utf8')) as ErrorShot[]
    return list.filter((s) => existsSync(s.file)).sort((a, b) => b.at - a.at)
  } catch {
    return []
  }
}

const seen = new Set<string>()
let lastShot = 0

/** Giao dien vua hien mot thong bao loi: chup cua so app (moi loi mot lan, cach nhau it nhat 3 giay). */
export async function captureError(wc: WebContents, key: string, label: string): Promise<void> {
  if (seen.has(key) || Date.now() - lastShot < 3000) return
  seen.add(key)
  lastShot = Date.now()
  try {
    // Cho giao dien ve xong thong bao loi
    await new Promise((r) => setTimeout(r, 400))
    const img = await wc.capturePage()
    mkdirSync(shotsDir(), { recursive: true })
    const id = String(Date.now())
    const file = path.join(shotsDir(), `${id}.png`)
    writeFileSync(file, img.toPNG())
    const list = [{ id, at: Date.now(), label: label.slice(0, 120), file }, ...listShots()]
    for (const old of list.slice(KEEP_SHOTS)) rmSync(old.file, { force: true })
    writeFileSync(shotsIndex(), JSON.stringify(list.slice(0, KEEP_SHOTS), null, 2))
  } catch (e) {
    log.warn(`[bao loi] khong chup duoc anh: ${String(e)}`)
  }
}

function cFreeGb(): number | undefined {
  try {
    const s = statfsSync('C:/')
    return Math.floor((s.bavail * s.bsize) / 1024 ** 3)
  } catch {
    return undefined
  }
}

function stamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export type BugSendResult = { ok: true } | { ok: false; code: 'chuaCoThuMuc' | 'loi' }

export async function sendBugReport(
  input: BugSendInput,
  extra: { toolkitVersion?: string }
): Promise<BugSendResult> {
  const root = feedbackDir()
  if (!root || !existsSync(root)) return { ok: false, code: 'chuaCoThuMuc' }
  const author = getSettings().authorName?.trim() || 'CTV'
  const now = new Date()
  const name = [
    stamp(now),
    slugify(author, 16) || 'ctv',
    slugify(input.desc ?? '', 30) || 'bao-loi'
  ]
    .filter(Boolean)
    .join('-')
  const dir = path.join(root, BUG_FOLDER, name)
  try {
    mkdirSync(dir, { recursive: true })
    await writeReportFiles(dir, { 'Bo cong cu': extra.toolkitVersion ?? '?' })
    const mainLog = path.join(dir, 'nhat-ky', 'main.log')
    const errs = existsSync(mainLog)
      ? errorLines(readFileSync(mainLog, 'utf8').split(/\r?\n/).slice(-3000).join('\n'))
      : { count: 0, last: [] }
    const shots = listShots().filter((s) => input.shotIds.includes(s.id))
    if (shots.length) mkdirSync(path.join(dir, 'anh'), { recursive: true })
    for (const s of shots) copyFileSync(s.file, path.join(dir, 'anh', `${s.id}.png`))
    const meta: BugMeta = {
      id: name,
      author,
      machine: machineId(),
      createdAt: now.getTime(),
      desc: input.desc?.trim() ? redact(input.desc.trim()).slice(0, 2000) : undefined,
      appVersion: app.getVersion(),
      toolkitVersion: extra.toolkitVersion,
      cFreeGb: cFreeGb(),
      errorCount: errs.count,
      lastErrors: errs.last,
      shots: shots.map((s) => ({ file: `${s.id}.png`, label: s.label, at: s.at }))
    }
    writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
    log.info(`[bao loi] da gui vao ${dir}`)
    return { ok: true }
  } catch (e) {
    log.error(`[bao loi] gui loi: ${String(e)}`)
    return { ok: false, code: 'loi' }
  }
}

export function listBugs(): BugItem[] {
  const root = feedbackDir()
  const base = root ? path.join(root, BUG_FOLDER) : ''
  if (!base || !existsSync(base)) return []
  const out: BugItem[] = []
  for (const d of readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const dir = path.join(base, d.name)
    try {
      const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')) as BugMeta
      let state: BugItem['state'] = { status: 'moi', updatedAt: meta.createdAt }
      const sp = path.join(dir, 'trang-thai.json')
      if (existsSync(sp)) state = JSON.parse(readFileSync(sp, 'utf8'))
      const logFile = path.join(dir, 'nhat-ky', 'main.log')
      out.push({
        ...meta,
        dir,
        state,
        shotPaths: meta.shots.map((s) => path.join(dir, 'anh', s.file)),
        logFile: existsSync(logFile) ? logFile : undefined
      })
    } catch {
      // chua dong bo xong hoac khong phai goi bao loi
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt)
}

export function setBugState(id: string, status: BugStatus): void {
  const root = feedbackDir()
  if (!root || /[\\/]/.test(id)) return
  const dir = path.join(root, BUG_FOLDER, id)
  if (!existsSync(path.join(dir, 'meta.json'))) return
  writeFileSync(
    path.join(dir, 'trang-thai.json'),
    JSON.stringify({ status, updatedAt: Date.now() }, null, 2),
    'utf8'
  )
}
