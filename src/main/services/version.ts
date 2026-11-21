// Phien ban bo cong cu: xem ban moi, doi ban an toan (tang 1), con lai giao skill phien-ban (tang 2).
// Khong bao gio chay lenh git manh (reset, clean, checkout -f...).
import { app } from 'electron'
import type { ChangelogEntry, UpdateProgress, UpdateResult, VersionInfo } from '../../shared/app'
import { childEnv, exe } from './runtime'
import { run, type RunResult } from './process'
import { latestNumericTag, looksLikeNetworkError } from './rules'
import log from '../log'
import { TTS_CONFIG, readSpeed, writeSpeed } from './voice-config'

// ---------- ham thuan (co bai thu) ----------

/** Doc CHANGELOG.md cua repo video: moi muc "## Ban <so> — <ngay>". */
export function parseChangelog(md: string): ChangelogEntry[] {
  const out: ChangelogEntry[] = []
  const parts = md.split(/^## /m).slice(1)
  for (const part of parts) {
    const lines = part.split(/\r?\n/)
    const head = /^Bản\s+(\d+)\s*[—–-]\s*(.+)$/.exec(lines[0].trim())
    if (!head) continue
    const entry: ChangelogEntry = { version: head[1], date: head[2].trim(), groups: [] }
    let group: ChangelogEntry['groups'][number] | undefined
    let kind: 'moi' | 'sua' = 'moi'
    const summary: string[] = []
    for (const raw of lines.slice(1)) {
      const line = raw.trim()
      if (line.startsWith('### ')) {
        group = { name: line.slice(4).trim(), moi: [], sua: [] }
        entry.groups.push(group)
        kind = 'moi'
      } else if (/^\*\*Có gì mới\*\*/.test(line)) kind = 'moi'
      else if (/^\*\*Sửa lỗi\*\*/.test(line)) kind = 'sua'
      else if (line.startsWith('- ') && group) group[kind].push(line.slice(2).trim())
      else if (line && !group) summary.push(line)
    }
    if (summary.length) entry.summary = summary.join(' ')
    out.push(entry)
  }
  return out
}

/** Thu muc bai cua nguoi dung: chua theo doi trong Git, doi ban khong dung toi. */
const USER_AREAS = ['src/videos/', 'public/audio/', 'out/']
/** File bo cong cu ma app cho nguoi dung chinh trong Cai dat (toc do doc): app tu giu lai khi doi ban. */
const PREF_FILES = [TTS_CONFIG]

/**
 * Doi ban tu dong an toan khi `git status --porcelain` khong co file bo cong cu nao bi sua:
 * chi co thu muc bai moi chua theo doi (??) trong vung bai cua nguoi dung.
 */
export function isSafeToSwitch(porcelain: string[]): boolean {
  return porcelain
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim())
    .every((l) => {
      const code = l.slice(0, 2)
      const file = l.slice(3).replace(/^"|"$/g, '')
      if (code === ' M' && PREF_FILES.includes(file)) return true
      return code === '??' && USER_AREAS.some((a) => file.startsWith(a))
    })
}

/** So sanh phien ban dang 1.2.3: am neu a < b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0)
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}

// ---------- dich vu ----------

export class VersionService {
  constructor(private readonly projectDir: () => string) {}

  private git(
    args: string[],
    onLine?: (l: string) => void,
    timeoutMs = 60_000
  ): Promise<RunResult> {
    const dir = this.projectDir()
    return run(exe.git(), ['-c', 'core.longpaths=true', ...args], {
      cwd: dir,
      env: childEnv(dir),
      onLine,
      signal: AbortSignal.timeout(timeoutMs)
    })
  }

  private async lines(args: string[]): Promise<string[]> {
    const out: string[] = []
    await this.git(args, (l) => out.push(l))
    return out
  }

  async info(): Promise<VersionInfo> {
    const fetched = await this.git(
      ['fetch', 'origin', '--tags', '--force', '--quiet'],
      undefined,
      30_000
    )
    const offline = fetched.code !== 0
    if (offline) log.warn('[phien ban] khong lay duoc danh sach ban moi')
    const branch = (await this.lines(['branch', '--show-current']))[0]?.trim() || undefined
    const current = latestNumericTag(await this.lines(['tag', '--points-at', 'HEAD'])) ?? undefined
    let base: string | undefined
    if (!current) {
      const d = (await this.lines(['describe', '--tags', '--match', '[0-9]*']))[0] ?? ''
      base = /^(\d+)/.exec(d)?.[1]
    }
    const tags = await this.lines(['tag', '--list'])
    const latest = latestNumericTag(tags) ?? undefined
    const mine = Number(current ?? base ?? 0)
    // Ban lien truoc ban dang dung (de "Quay lai ban truoc")
    const previous = latestNumericTag(
      tags.filter((t) => /^\d+$/.test(t.trim()) && Number(t) < mine)
    )

    const updateAvailable = !!latest && Number(latest) > mine

    // Mo ta moi ban: doc CHANGELOG cua ban moi nhat (co du cac ban cu)
    const md = (
      await this.lines(['show', latest ? `refs/tags/${latest}:CHANGELOG.md` : 'HEAD:CHANGELOG.md'])
    ).join('\n')
    const parsed = parseChangelog(md)
    const history = tags
      .map((t) => t.trim())
      .filter((t) => /^\d+$/.test(t))
      .sort((a, b) => Number(b) - Number(a))
      .map((v) => parsed.find((e) => e.version === v) ?? { version: v, groups: [] })

    let notes: ChangelogEntry[] = []
    let needAppVersion: string | undefined
    if (updateAvailable && latest) {
      notes = parsed.filter((e) => Number(e.version) > mine)
      const compat = (await this.lines(['show', `refs/tags/${latest}:app-compat.json`])).join('\n')
      try {
        const min = (JSON.parse(compat) as { minAppVersion?: string }).minAppVersion
        if (min && compareVersions(app.getVersion(), min) < 0) needAppVersion = min
      } catch {
        // ban cu chua co app-compat.json
      }
    }
    const status = await this.lines(['status', '--porcelain'])
    return {
      current,
      branch,
      base,
      latest,
      updateAvailable,
      notes,
      safe: !branch && !!current && isSafeToSwitch(status),
      previous: previous ?? undefined,
      history,
      needAppVersion,
      offline
    }
  }

  /** Doi ban tang 1. Khong an toan thi tra ve de nho AI (tang 2). */
  async update(
    target: string,
    onProgress: (p: UpdateProgress) => void,
    handoff: () => string
  ): Promise<UpdateResult> {
    const info = await this.info()
    if (info.needAppVersion) return { ok: false, code: 'canAppMoi' }
    if (!info.safe) return { ok: false, code: 'nhoAi', chatKey: handoff() }
    const before = (await this.lines(['rev-parse', 'HEAD']))[0]?.trim()
    onProgress({ step: 'doiBan', status: 'running' })
    // Toc do doc nguoi dung da chinh: tra file ve nhu cu de doi ban, doi xong ghi lai
    const dir = this.projectDir()
    const speed = readSpeed(dir)
    const speedChanged = (await this.lines(['status', '--porcelain', '--', TTS_CONFIG])).some((l) =>
      l.startsWith(' M')
    )
    if (speedChanged) await this.git(['checkout', '--', TTS_CONFIG])
    const sw = await this.git(['switch', '--detach', `refs/tags/${target}`])
    if (speedChanged && speed !== null) writeSpeed(dir, speed)
    if (sw.code !== 0) {
      log.warn(`[phien ban] doi ban loi:\n${sw.tail.join('\n')}`)
      return { ok: false, code: looksLikeNetworkError(sw.tail) ? 'mang' : 'khongRo' }
    }
    onProgress({ step: 'doiBan', status: 'done' })
    // Thu vien chi cai lai khi package-lock.json doi giua hai ban
    const diff = await this.git([
      'diff',
      '--quiet',
      before ?? 'HEAD@{1}',
      'HEAD',
      '--',
      'package-lock.json'
    ])
    if (diff.code === 1) {
      onProgress({ step: 'caiThuVien', status: 'running' })
      const npm = await run(exe.npm(), ['install', '--no-fund', '--no-audit'], {
        cwd: dir,
        env: childEnv(dir)
      })
      if (npm.code !== 0)
        return { ok: false, code: looksLikeNetworkError(npm.tail) ? 'mang' : 'khongRo' }
    }
    onProgress({ step: 'caiThuVien', status: 'done' })
    log.info(`[phien ban] da len ban ${target}`)
    return { ok: true, version: target }
  }
}
