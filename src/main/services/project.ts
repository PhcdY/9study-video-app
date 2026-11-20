// Doc danh sach video trong repo video va suy ra moi video dang o buoc nao, chi tu file co san.
import path from 'node:path'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import type { AudioLine, Lesson, ScriptData, VideoInfo, VideoStage } from '../../shared/video'
import { readEnvFile } from './env-file'

/** Ten thu muc mon trong out/ (giong scripts/lib/paths.mjs cua repo video). */
const MON: Record<string, string> = {
  toan: 'Toán',
  ly: 'Vật lý',
  hoa: 'Hóa học',
  sinh: 'Sinh học',
  su: 'Lịch sử',
  dia: 'Địa lý',
  van: 'Ngữ văn',
  ktpl: 'GDKT & PL',
  gtktpl: 'GDKT & PL',
  anh: 'Tiếng Anh',
  tienganh: 'Tiếng Anh'
}
const safe = (s: string): string =>
  String(s)
    .normalize('NFC')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[. ]+$/, '')
    .trim()

/** Noi luu video: OUTPUT_DIR trong .env, khong co thi <du an>/out. */
export function outputBase(projectDir: string): string {
  const v = process.env.OUTPUT_DIR || readEnvFile(path.join(projectDir, '.env')).get('OUTPUT_DIR')
  return v ? path.resolve(v) : path.join(projectDir, 'out')
}

export function workDir(projectDir: string, id: string): string {
  return path.join(outputBase(projectDir), '_lam-viec', id)
}

/** Thu muc thanh pham cua video (giong videoDir() trong scripts/lib/paths.mjs). */
export function finalDir(projectDir: string, s: ScriptData, id: string): string {
  if (s.lop == null || !s.chuong || !s.bai) return workDir(projectDir, id)
  const mon = MON[s.subject ?? 'toan'] ?? s.subject ?? 'Toán'
  return path.join(outputBase(projectDir), safe(mon), `Lớp ${s.lop}`, safe(s.chuong), safe(s.bai))
}

/** Ma composition: id="..." dau tien trong Video.tsx. */
export function compositionIdFrom(videoTsx: string): string | undefined {
  return (
    /<Composition[\s\S]*?\bid=["']([^"']+)["']/.exec(videoTsx)?.[1] ??
    /\bid=["']([^"']+)["']/.exec(videoTsx)?.[1]
  )
}

export interface StageFacts {
  hasVideoTsx: boolean
  hasStoryboard: boolean
  hasAudio: boolean
  hasMp4: boolean
}

export function stageFrom(f: StageFacts): VideoStage {
  if (f.hasMp4) return 'daXuat'
  if (f.hasAudio) return 'giongDoc'
  if (f.hasStoryboard || f.hasVideoTsx) return 'duyetHinh'
  return 'kichBan'
}

function mtime(p: string): number {
  try {
    return statSync(p).mtimeMs
  } catch {
    return 0
  }
}

export function readScript(projectDir: string, slug: string): ScriptData | null {
  try {
    return JSON.parse(
      readFileSync(path.join(projectDir, 'src', 'videos', slug, 'script.json'), 'utf8')
    )
  } catch {
    return null
  }
}

export function scanVideos(
  projectDir: string,
  sampleSlugs: Set<string>,
  chatSlugs: Set<string>
): VideoInfo[] {
  const root = path.join(projectDir, 'src', 'videos')
  if (!existsSync(root)) return []
  const out: VideoInfo[] = []
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const slug = d.name
    const scriptPath = path.join(root, slug, 'script.json')
    if (!existsSync(scriptPath)) continue
    const s = readScript(projectDir, slug)
    if (!s) continue
    const tsx = path.join(root, slug, 'Video.tsx')
    const id = existsSync(tsx) ? (compositionIdFrom(readFileSync(tsx, 'utf8')) ?? slug) : slug
    const storyboard = path.join(workDir(projectDir, id), 'storyboard', 'index.html')
    const manifest = path.join(projectDir, 'public', 'audio', slug, 'manifest.json')
    const mp4 = path.join(finalDir(projectDir, s, id), `${id}.mp4`)
    const facts: StageFacts = {
      hasVideoTsx: existsSync(tsx),
      hasStoryboard: existsSync(storyboard),
      hasAudio: existsSync(manifest),
      hasMp4: existsSync(mp4)
    }
    out.push({
      slug,
      title: s.title || slug,
      subject: s.subject ?? 'toan',
      lop: s.lop,
      bai: s.bai,
      loai: (s as { loai?: string }).loai,
      compositionId: facts.hasVideoTsx ? id : undefined,
      stage: stageFrom(facts),
      sample: sampleSlugs.has(slug),
      updatedAt: Math.max(
        mtime(scriptPath),
        mtime(tsx),
        mtime(storyboard),
        mtime(manifest),
        mtime(mp4)
      ),
      storyboardHtml: facts.hasStoryboard ? storyboard : undefined,
      finalMp4: facts.hasMp4 ? mp4 : undefined,
      hasChat: chatSlugs.has(slug)
    })
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Slug video mau: thu muc co script.json da nam trong ban phat hanh (git ls-files). */
export function sampleSlugsFrom(lsFiles: string[]): Set<string> {
  const set = new Set<string>()
  for (const f of lsFiles) {
    const m = /^src\/videos\/([^/]+)\/script\.json$/.exec(f.trim())
    if (m) set.add(m[1])
  }
  return set
}

/** Audio tung dong: public/audio/<slug>/<beat>-lNN.mp3, kem loi doc tu kich ban. */
export function listAudio(projectDir: string, slug: string): AudioLine[] {
  const dir = path.join(projectDir, 'public', 'audio', slug)
  if (!existsSync(dir)) return []
  const s = readScript(projectDir, slug)
  const speak = new Map<string, string>()
  for (const b of s?.beats ?? [])
    (b.lines ?? []).forEach((l, i) =>
      speak.set(`${b.id}-l${String(i + 1).padStart(2, '0')}`, l.speak ?? '')
    )
  return readdirSync(dir)
    .filter((f) => /^b\d+-l\d+\.mp3$/i.test(f))
    .sort()
    .map((f) => {
      const id = f.replace(/\.mp3$/i, '')
      return { id, file: path.join(dir, f), speak: speak.get(id) }
    })
}

/** The bai hoc co san: references/<mon>/lop-<lop>/**\/bai-NN-*.md, tieu de lay tu dong # dau tien. */
export function listLessons(projectDir: string, subject: string, lop: number): Lesson[] {
  const base = path.join(projectDir, 'references', subject, `lop-${lop}`)
  const out: Lesson[] = []
  const walk = (dir: string, depth: number): void => {
    if (depth > 3 || !existsSync(dir)) return
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, d.name)
      if (d.isDirectory()) walk(p, depth + 1)
      else if (/^bai-\d+.*\.md$/i.test(d.name)) {
        const head = readFileSync(p, 'utf8')
          .split(/\r?\n/)
          .find((l) => l.startsWith('# '))
        out.push({
          file: path.relative(projectDir, p).replace(/\\/g, '/'),
          title: head ? head.replace(/^#\s+/, '').trim() : d.name.replace(/\.md$/, '')
        })
      }
    }
  }
  walk(base, 0)
  return out.sort((a, b) => a.file.localeCompare(b.file, 'vi', { numeric: true }))
}
