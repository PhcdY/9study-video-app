// Tai va mo bo cai Google Drive cho may tinh (buoc cai dat "Google Drive").
// Chi chay file co chu ky so hop le cua Google LLC.
import path from 'node:path'
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { net, shell } from 'electron'
import { GOOGLE_DRIVE_SETUP_URL } from '../../shared/team'
import { cacheRoot } from './runtime'
import { run } from './process'
import { DRIVE_FOLDER_NAMES } from './rules'

/** O Google Drive (vd G:\My Drive) neu Drive da cai va da dang nhap. */
export function findGoogleDrive(): string | null {
  for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
    for (const name of DRIVE_FOLDER_NAMES) {
      const p = `${letter}:\\${name}`
      try {
        if (existsSync(p)) return p
      } catch {
        // o khong san sang
      }
    }
  }
  return null
}

/** Tai bo cai ve thu muc tam, bao tien trinh (MB). */
export async function downloadDriveSetup(
  projectDir: string,
  signal: AbortSignal,
  onProgress: (doneMb: number, totalMb?: number) => void
): Promise<string> {
  const dir = path.join(cacheRoot(projectDir), 'tmp')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'GoogleDriveSetup.exe')
  const res = await net.fetch(GOOGLE_DRIVE_SETUP_URL, { signal })
  if (!res.ok || !res.body) throw new Error(`tai bo cai Drive loi: HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length')) || undefined
  let done = 0
  const body = Readable.fromWeb(res.body as never)
  body.on('data', (c: Buffer) => {
    done += c.length
    onProgress(done / 1024 ** 2, total ? total / 1024 ** 2 : undefined)
  })
  try {
    await pipeline(body, createWriteStream(file), { signal })
  } catch (e) {
    rmSync(file, { force: true })
    throw e
  }
  return file
}

/** Kiem chu ky so: phai la file cua Google LLC, chu ky hop le. */
export async function isSignedByGoogle(file: string): Promise<boolean> {
  const out: string[] = []
  const ps = `$s = Get-AuthenticodeSignature -LiteralPath '${file.replace(/'/g, "''")}'; "$($s.Status)|$($s.SignerCertificate.Subject)"`
  const res = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    onLine: (l) => out.push(l)
  })
  const line = out.join('').trim()
  return res.code === 0 && line.startsWith('Valid|') && /O=Google LLC/.test(line)
}

/**
 * Mo bo cai qua Windows (ShellExecute) de Windows hoi quyen cai dat dung cach.
 * Khong cho bo cai chay xong; tra ve chuoi loi neu khong mo duoc.
 */
export function openDriveSetup(file: string): Promise<string> {
  return shell.openPath(file)
}
