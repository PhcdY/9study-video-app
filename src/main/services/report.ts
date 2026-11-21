// "Gui bao loi": gom nhat ky + thong tin may thanh mot file zip tren Desktop.
// Khong bao gio gom .env, key, token, file dang nhap (auth.json). Nhat ky da duoc che khi ghi.
import { app } from 'electron'
import path from 'node:path'
import os from 'node:os'
import {
  copyFileSync,
  cpSync,
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statfsSync,
  writeFileSync
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { getSettings } from './settings'
import { cacheRoot, childEnv, exe } from './runtime'
import { run } from './process'
import { redact } from '../redact'
import log from '../log'

function freeGb(p: string): string {
  try {
    const s = statfsSync(path.parse(p).root)
    return `${Math.floor((s.bavail * s.bsize) / 1024 ** 3)} GB`
  } catch {
    return '?'
  }
}

/** Ghi nhat ky (da che), cai dat, thong tin may vao thu muc stage. Khong bao gio co .env, key, token. */
export async function writeReportFiles(
  stage: string,
  extra: Record<string, string> = {}
): Promise<void> {
  const user = app.getPath('userData')
  // Nhat ky cua app (main.log va ban cu)
  const logs = path.join(user, 'logs')
  // Che lai bi mat mot lan nua khi dong goi (nhat ky cu co the ghi tu truoc khi co luat che moi)
  if (existsSync(logs)) {
    mkdirSync(path.join(stage, 'nhat-ky'), { recursive: true })
    for (const f of readdirSync(logs).filter((x) => x.endsWith('.log')))
      writeFileSync(
        path.join(stage, 'nhat-ky', f),
        redact(readFileSync(path.join(logs, f), 'utf8'))
      )
  }
  for (const f of ['settings.json', 'threads.json']) {
    const p = path.join(user, f)
    if (existsSync(p)) cpSync(p, path.join(stage, f))
  }
  // Trang thai thu muc du an (khong noi dung file)
  const dir = getSettings().projectDir ?? ''
  const git: string[] = []
  if (dir && existsSync(path.join(dir, '.git'))) {
    const env = childEnv(dir)
    for (const args of [
      ['describe', '--tags', '--always'],
      ['branch', '--show-current'],
      ['status', '--porcelain']
    ]) {
      git.push(`$ git ${args.join(' ')}`)
      await run(exe.git(), args, { cwd: dir, env, onLine: (l) => git.push(l) })
    }
  }
  const info = [
    `App: ${app.getVersion()} (dong goi: ${app.isPackaged})`,
    `Windows: ${os.release()} ${os.arch()}, RAM ${Math.round(os.totalmem() / 1024 ** 3)} GB`,
    `Thoi diem: ${new Date().toISOString()}`,
    `Thu muc du an: ${dir || '(chua chon)'}  · o trong ${dir ? freeGb(dir) : '?'}`,
    `O C trong: ${freeGb('C:\\')}`,
    ...Object.entries(extra).map(([k, v]) => `${k}: ${v}`),
    '',
    ...git
  ].join('\r\n')
  // BOM de Notepad cu doc dung tieng Viet
  writeFileSync(path.join(stage, 'thong-tin.txt'), '\ufeff' + redact(info), 'utf8')
}

export async function makeBugReport(extra: Record<string, string> = {}): Promise<string> {
  // Lam viec trong thu muc tam KHONG DAU cua app (ten nguoi dung Windows co the co dau)
  const work = mkdtempSync(path.join(cacheRoot(getSettings().projectDir), 'tmp', 'bao-loi-'))
  const stage = path.join(work, 'goi')
  mkdirSync(stage)
  try {
    await writeReportFiles(stage, extra)
    const desktop = app.getPath('desktop')
    mkdirSync(desktop, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
    const zip = path.join(desktop, `ninistudio-bao-loi-${stamp}.zip`)
    // tar cua Windows (bsdtar) tao zip trong thu muc khong dau, roi Node chep ra Desktop
    // (Desktop co the nam trong OneDrive voi ten co dau: tar.exe khong ghi duoc duong dan do)
    const tmpZip = path.join(work, 'bao-loi.zip')
    const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
    execFileSync(tar, ['-a', '-c', '-f', tmpZip, '-C', stage, '.'], { windowsHide: true })
    copyFileSync(tmpZip, zip)
    log.info(`[bao loi] da tao ${zip}`)
    return zip
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
