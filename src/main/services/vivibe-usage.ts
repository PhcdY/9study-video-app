// So ghi credit Vivibe: moi lan bo cong cu tao giong, ghi so ky tu da gui (userData/vivibe-usage.json).
// Chi luu so lieu (slug, so cau, so ky tu), khong luu key hay noi dung loi doc.
import path from 'node:path'
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { app } from 'electron'
import {
  monthOf,
  summarize,
  type VivibeUsage,
  type VoiceRun,
  type VoiceRunInfo
} from '../../shared/vivibe'
import { readScript } from './project'

const file = (): string => path.join(app.getPath('userData'), 'vivibe-usage.json')

function readRuns(): VoiceRun[] {
  try {
    return (JSON.parse(readFileSync(file(), 'utf8')) as { runs?: VoiceRun[] }).runs ?? []
  } catch {
    return []
  }
}

export function recordVoiceRun(projectDir: string, info: VoiceRunInfo): void {
  const runs = readRuns()
  const title = info.slug ? readScript(projectDir, info.slug)?.title : undefined
  runs.push({ ...info, title, at: Date.now(), projectDir })
  writeFileSync(file() + '.tmp', JSON.stringify({ runs }, null, 2))
  renameSync(file() + '.tmp', file())
}

/** Cong cac lan tao giong cu (nhan du lieu cu). Bo qua lan da cong (theo src). Tra ve so ky tu moi cong. */
export function importVoiceRuns(
  projectDir: string,
  runs: (VoiceRunInfo & { at: number; src: string })[]
): number {
  const all = readRuns()
  const seen = new Set(all.map((r) => r.src).filter(Boolean))
  let added = 0
  for (const r of runs) {
    if (seen.has(r.src)) continue
    seen.add(r.src)
    const title = r.slug ? readScript(projectDir, r.slug)?.title : undefined
    all.push({ ...r, title, projectDir })
    added += r.chars
  }
  all.sort((a, b) => a.at - b.at)
  writeFileSync(file() + '.tmp', JSON.stringify({ runs: all }, null, 2))
  renameSync(file() + '.tmp', file())
  return added
}

/** So ky tu cua cac cau dang co audio trong video (lay loi doc tu script.json). */
function usedChars(
  projectDir: string,
  slug: string,
  audioDir?: string
): { chars: number; exists: boolean } {
  const exists = existsSync(path.join(projectDir, 'src', 'videos', slug, 'script.json'))
  const dir = path.join(projectDir, 'public', 'audio', audioDir ?? slug)
  if (!exists || !existsSync(dir)) return { chars: 0, exists }
  const speak = new Map<string, string>()
  for (const b of readScript(projectDir, slug)?.beats ?? [])
    (b.lines ?? []).forEach((l, i) =>
      speak.set(`${b.id}-l${String(i + 1).padStart(2, '0')}`, l.speak ?? l.text ?? '')
    )
  let chars = 0
  for (const f of readdirSync(dir)) {
    const m = /^(b\d+-l\d+)\.mp3$/i.exec(f)
    if (m) chars += (speak.get(m[1]) ?? '').length
  }
  return { chars, exists }
}

export function vivibeUsage(projectDir: string, month = monthOf(Date.now())): VivibeUsage {
  const runs = readRuns().filter((r) => r.projectDir === projectDir)
  return summarize(
    runs,
    month,
    (slug, audioDir) => usedChars(projectDir, slug, audioDir),
    (slug) =>
      readScript(projectDir, slug)?.title ??
      runs.findLast((r) => r.slug === slug && r.title)?.title ??
      slug
  )
}
