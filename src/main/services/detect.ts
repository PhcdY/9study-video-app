// Do tim nhung gi may da co san: bo cong cu da tai, thu vien da cai.
// Chi doc file, khong chay lenh git/npm, de nhanh va khong dung toi bai cua nguoi dung.
import path from 'node:path'
import os from 'node:os'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'

/** .git/config co tro ve repo bo cong cu video khong. */
export function isVideoRepoConfig(configText: string): boolean {
  return /^\s*url\s*=\s*\S*[/:]PhcdY\/remotion_claudecode(?:\.git)?\/?\s*$/im.test(configText)
}

export function isVideoRepo(dir: string): boolean {
  try {
    const cfg = path.join(dir, '.git', 'config')
    return (
      existsSync(cfg) &&
      existsSync(path.join(dir, 'package.json')) &&
      isVideoRepoConfig(readFileSync(cfg, 'utf8'))
    )
  } catch {
    return false
  }
}

const SKIP_DIRS = new Set([
  'windows',
  'program files',
  'program files (x86)',
  'programdata',
  '$recycle.bin',
  'system volume information',
  'node_modules',
  'appdata',
  '$windows.~ws',
  '$windows.~bt',
  'recovery',
  'perflogs'
])

function subdirs(dir: string, limit: number): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(
        (d) => d.isDirectory() && !d.name.startsWith('.') && !SKIP_DIRS.has(d.name.toLowerCase())
      )
      .slice(0, limit)
      .map((d) => path.join(dir, d.name))
  } catch {
    return []
  }
}

/** Tim repo bo cong cu trong cac thu muc goc, sau toi `depth` cap. */
export function findVideoRepos(roots: string[], depth = 2, limitPerDir = 300): string[] {
  const found = new Set<string>()
  const walk = (dir: string, level: number): void => {
    if (isVideoRepo(dir)) {
      found.add(path.resolve(dir))
      return
    }
    if (level >= depth) return
    for (const d of subdirs(dir, limitPerDir)) walk(d, level + 1)
  }
  for (const r of roots) if (existsSync(r)) walk(r, 0)
  return [...found]
}

/** Goc moi o dia + Desktop/Documents/Downloads cua nguoi dung. */
export function defaultSearchRoots(): string[] {
  const roots: string[] = []
  for (const l of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
    const r = `${l}:\\`
    try {
      if (existsSync(r)) roots.push(r)
    } catch {
      // o khong san sang (o CD, o mang ngat)
    }
  }
  const home = os.homedir()
  for (const d of ['Desktop', 'Documents', 'Downloads']) roots.push(path.join(home, d))
  return roots
}

interface LockEntry {
  version?: string
  optional?: boolean
  link?: boolean
}

/**
 * Thu vien da cai khop package-lock.json chua: moi goi bat buoc trong package-lock co trong
 * node_modules/.package-lock.json (file npm tu ghi sau khi cai) voi dung phien ban.
 * Goi tuy chon (vd ban rieng cho macOS) duoc bo qua.
 */
export function lockSatisfied(lockText: string, installedText: string): boolean {
  try {
    const want = (JSON.parse(lockText) as { packages?: Record<string, LockEntry> }).packages ?? {}
    const have =
      (JSON.parse(installedText) as { packages?: Record<string, LockEntry> }).packages ?? {}
    let checked = 0
    for (const [key, entry] of Object.entries(want)) {
      if (!key.startsWith('node_modules/') || entry.optional || entry.link) continue
      if (have[key]?.version !== entry.version) return false
      checked++
    }
    return checked > 0
  } catch {
    return false
  }
}

export function librariesInstalled(dir: string): boolean {
  const lock = path.join(dir, 'package-lock.json')
  const installed = path.join(dir, 'node_modules', '.package-lock.json')
  if (!existsSync(lock) || !existsSync(installed)) return false
  return lockSatisfied(readFileSync(lock, 'utf8'), readFileSync(installed, 'utf8'))
}

/** Trinh duyet render cua Remotion da tai ve chua. */
export function renderBrowserInstalled(dir: string): boolean {
  const p = path.join(dir, 'node_modules', '.remotion', 'chrome-headless-shell')
  try {
    return existsSync(p) && statSync(p).isDirectory() && readdirSync(p).length > 0
  } catch {
    return false
  }
}
