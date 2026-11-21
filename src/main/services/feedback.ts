// Gop y cho doi: CTV tao goi gop y vao thu muc chung (Drive), nguoi bao tri doc va doi trang thai.
// Goi KHONG BAO GIO chua .env, key, token: chi chep nhung file liet ke duoi day.
import { app } from 'electron'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  copyFileSync
} from 'node:fs'
import type {
  BatchInput,
  AttachId,
  AttachOption,
  FeedbackDraft,
  FeedbackInput,
  FeedbackItem,
  FeedbackMeta,
  FeedbackSpot,
  FeedbackState
} from '../../shared/feedback'
import { getSettings, updateSettings } from './settings'
import { childEnv, exe } from './runtime'
import { run } from './process'
import { compositionIdFrom, finalDir, readScript, workDir } from './project'
import {
  fixPrompt,
  lineAt,
  packageFolderName,
  spotLabel,
  type TimelineLine
} from '../../shared/feedback-rules'
import { DRIVE_FOLDER_NAMES } from './rules'
import { redact } from '../redact'
import log from '../log'

export const FEEDBACK_FOLDER = '9Study_GopY'

/** Thu muc gop y: da dat trong Cai dat, khong thi tim "9Study_GopY" trong Google Drive. */
export function feedbackDir(): string | undefined {
  // Thu muc da chon con do thi dung; mat (vd doi o Drive) thi tu tim lai trong Drive
  const set = getSettings().feedbackDir
  if (set && existsSync(set)) return set
  for (const l of 'DEFGHIJKLMNOPQRSTUVWXYZ')
    for (const name of DRIVE_FOLDER_NAMES) {
      const p = `${l}:\\${name}\\${FEEDBACK_FOLDER}`
      try {
        if (existsSync(p)) return p
      } catch {
        // o khong san sang
      }
    }
  return set
}

export function machineId(): string {
  const s = getSettings()
  if (s.machineId) return s.machineId
  const id = randomUUID()
  updateSettings({ machineId: id })
  return id
}

function size(p: string): number {
  try {
    const st = statSync(p)
    if (!st.isDirectory()) return st.size
    return readdirSync(p).reduce((a, f) => a + size(path.join(p, f)), 0)
  } catch {
    return 0
  }
}

interface VideoFiles {
  id: string
  mp4?: string
  timeline?: string
  storyboardDir: string
  audioDir: string
  sourceDir: string
}

function videoFiles(projectDir: string, slug: string): VideoFiles | null {
  const s = readScript(projectDir, slug)
  if (!s) return null
  const tsx = path.join(projectDir, 'src', 'videos', slug, 'Video.tsx')
  const id = existsSync(tsx) ? (compositionIdFrom(readFileSync(tsx, 'utf8')) ?? slug) : slug
  const fdir = finalDir(projectDir, s, id)
  const mp4 = path.join(fdir, `${id}.mp4`)
  const tl = path.join(fdir, `${id}.timeline.json`)
  return {
    id,
    mp4: existsSync(mp4) ? mp4 : undefined,
    timeline: existsSync(tl) ? tl : undefined,
    storyboardDir: path.join(workDir(projectDir, id), 'storyboard'),
    audioDir: path.join(projectDir, 'public', 'audio', slug),
    sourceDir: path.join(projectDir, 'src', 'videos', slug)
  }
}

const lineKey = (beat?: string, line?: number): string =>
  beat && line ? `${beat}-l${String(line).padStart(2, '0')}` : ''

/** Cho bi loi tu giay trong video (timeline.json) hoac tu cau duoc chon. */
function locate(
  projectDir: string,
  slug: string,
  files: VideoFiles,
  time?: number,
  beatLine?: string
): FeedbackSpot {
  const s = readScript(projectDir, slug)
  let beat: string | undefined
  let line: number | undefined
  if (time !== undefined && files.timeline) {
    try {
      const tl = JSON.parse(readFileSync(files.timeline, 'utf8')) as { lines: TimelineLine[] }
      const ln = lineAt(tl.lines, time)
      if (ln) {
        beat = ln.beat
        line = Number(ln.line)
      }
    } catch (e) {
      log.warn(`[gop y] doc timeline loi: ${String(e)}`)
    }
  }
  if (beatLine) {
    const m = /^(b\d+)-l(\d+)$/.exec(beatLine)
    if (m) {
      beat = m[1]
      line = Number(m[2])
    }
  }
  const b = s?.beats?.find((x) => x.id === beat)
  const l = line ? b?.lines?.[line - 1] : undefined
  return { time, beat, line, scene: b?.scene, speak: l?.speak, text: l?.text }
}

/** Thong tin mo form gop y. */
export async function feedbackDraft(
  projectDir: string,
  slug: string,
  time?: number,
  beatLine?: string
): Promise<FeedbackDraft | null> {
  const s = readScript(projectDir, slug)
  const f = videoFiles(projectDir, slug)
  if (!s || !f) return null
  const spot = locate(projectDir, slug, f, time, beatLine)
  const key = lineKey(spot.beat, spot.line)
  const png = key ? path.join(f.storyboardDir, `${key}.png`) : ''
  const mp3 = key ? path.join(f.audioDir, `${key}.mp3`) : ''
  // "Dieu da day AI": file trong .agents/ bi sua hoac moi, va FEEDBACK.md cua video
  const changed: string[] = []
  await run(exe.git(), ['status', '--porcelain', '--', '.agents'], {
    cwd: projectDir,
    env: childEnv(projectDir),
    onLine: (l) => changed.push(l)
  })
  const fb = path.join(f.sourceDir, 'FEEDBACK.md')
  const taughtCount = changed.length + (existsSync(fb) ? 1 : 0)
  let duration = 0
  try {
    if (f.timeline) {
      const tl = JSON.parse(readFileSync(f.timeline, 'utf8')) as { lines: TimelineLine[] }
      duration = tl.lines.at(-1)?.end ?? 0
    }
  } catch {
    // khong doc duoc thi uoc theo ca video
  }
  const mp4Size = f.mp4 ? size(f.mp4) : 0
  const attachments: AttachOption[] = [
    {
      id: 'doan',
      available: !!f.mp4 && time !== undefined,
      checked: !!f.mp4 && time !== undefined,
      size: duration ? Math.round((mp4Size * 20) / duration) : undefined
    },
    {
      id: 'storyboard',
      available: !!png && existsSync(png),
      checked: true,
      size: png && existsSync(png) ? size(png) : undefined
    },
    {
      id: 'audio',
      available: !!mp3 && existsSync(mp3),
      checked: true,
      size: mp3 && existsSync(mp3) ? size(mp3) : undefined
    },
    { id: 'nguon', available: existsSync(f.sourceDir), checked: true, size: size(f.sourceDir) },
    { id: 'dayAi', available: taughtCount > 0, checked: taughtCount > 0, count: taughtCount },
    {
      id: 'caVideo',
      available: !!f.mp4,
      checked: !!f.mp4 && !!getSettings().alwaysFullVideo,
      size: mp4Size || undefined
    }
  ]
  const lines: FeedbackDraft['lines'] = []
  for (const b of s.beats ?? [])
    (b.lines ?? []).forEach((l, i) =>
      lines.push({ beat: b.id, line: i + 1, scene: b.scene, speak: l.speak ?? '' })
    )
  return {
    slug,
    title: s.title ?? slug,
    subject: s.subject ?? 'toan',
    lop: s.lop,
    spot,
    finalMp4: f.mp4,
    storyboardPng: png && existsSync(png) ? png : undefined,
    attachments,
    feedbackDir: feedbackDir(),
    lines
  }
}

const NAMES: Record<AttachId, string> = {
  doan: 'doan-loi.mp4',
  storyboard: 'anh-storyboard.png',
  audio: 'giong-doc.mp3',
  nguon: 'nguon',
  dayAi: 'day-ai.diff',
  caVideo: 'ca-video.mp4'
}

/** Tao goi gop y trong thu muc chung. Tra ve duong dan goi. */
export async function createFeedback(
  projectDir: string,
  input: FeedbackInput,
  extra: { toolkitVersion?: string; voice?: string }
): Promise<string> {
  const root = feedbackDir()
  if (!root) throw new Error('chua co thu muc gop y')
  const s = readScript(projectDir, input.slug)
  const f = videoFiles(projectDir, input.slug)
  if (!s || !f) throw new Error('khong doc duoc video')
  const author = getSettings().authorName?.trim() || 'CTV'
  const dir = path.join(root, packageFolderName(new Date(), author, input.slug))
  mkdirSync(dir, { recursive: true })
  const env = childEnv(projectDir)
  const files: FeedbackMeta['files'] = []
  const key = lineKey(input.spot.beat, input.spot.line)
  const add = (id: AttachId): void => {
    const p = path.join(dir, NAMES[id])
    if (existsSync(p)) files.push({ id, name: NAMES[id], size: size(p) })
  }

  for (const id of input.attach) {
    try {
      if (id === 'doan' && f.mp4 && input.spot.time !== undefined) {
        const ffmpeg = path.join(
          projectDir,
          'node_modules',
          '@remotion',
          'compositor-win32-x64-msvc',
          'ffmpeg.exe'
        )
        const start = Math.max(0, input.spot.time - 10)
        await run(
          ffmpeg,
          [
            '-y',
            '-loglevel',
            'error',
            '-ss',
            String(start),
            '-i',
            f.mp4,
            '-t',
            '20',
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '30',
            '-c:a',
            'aac',
            '-b:a',
            '96k',
            path.join(dir, NAMES.doan)
          ],
          { cwd: projectDir, env }
        )
      } else if (id === 'storyboard' && key) {
        const p = path.join(f.storyboardDir, `${key}.png`)
        if (existsSync(p)) copyFileSync(p, path.join(dir, NAMES.storyboard))
      } else if (id === 'audio' && key) {
        const p = path.join(f.audioDir, `${key}.mp3`)
        if (existsSync(p)) copyFileSync(p, path.join(dir, NAMES.audio))
      } else if (id === 'nguon' && existsSync(f.sourceDir)) {
        cpSync(f.sourceDir, path.join(dir, NAMES.nguon), {
          recursive: true,
          filter: (src) => !/[\\/]\.env/i.test(src)
        })
      } else if (id === 'dayAi') {
        const out: string[] = []
        await run(exe.git(), ['diff', '--', '.agents'], {
          cwd: projectDir,
          env,
          onLine: (l) => out.push(l)
        })
        const fresh: string[] = []
        await run(exe.git(), ['ls-files', '--others', '--exclude-standard', '--', '.agents'], {
          cwd: projectDir,
          env,
          onLine: (l) => fresh.push(l.trim())
        })
        for (const rel of fresh) {
          out.push(`\n+++ file moi: ${rel}`)
          try {
            out.push(
              ...readFileSync(path.join(projectDir, rel), 'utf8')
                .split(/\r?\n/)
                .map((x) => `+ ${x}`)
            )
          } catch {
            // bo qua file khong doc duoc
          }
        }
        const fb = path.join(f.sourceDir, 'FEEDBACK.md')
        if (existsSync(fb))
          out.push(`\n+++ ${path.relative(projectDir, fb)}`, readFileSync(fb, 'utf8'))
        writeFileSync(path.join(dir, NAMES.dayAi), redact(out.join('\n')), 'utf8')
      } else if (id === 'caVideo' && f.mp4) {
        copyFileSync(f.mp4, path.join(dir, NAMES.caVideo))
      }
      add(id)
    } catch (e) {
      log.warn(`[gop y] khong gui kem duoc ${id}: ${String(e)}`)
    }
  }

  const meta: FeedbackMeta = {
    id: path.basename(dir),
    createdAt: Date.now(),
    author,
    machine: machineId(),
    slug: input.slug,
    title: s.title ?? input.slug,
    subject: s.subject ?? 'toan',
    lop: s.lop,
    toolkitVersion: extra.toolkitVersion,
    appVersion: app.getVersion(),
    voice: extra.voice,
    spot: input.spot,
    kind: input.kind,
    scope: input.scope,
    desc: input.desc.trim(),
    files
  }
  writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
  writeFileSync(path.join(dir, 'index.html'), viewerHtml(meta), 'utf8')
  log.info(`[gop y] da tao goi ${dir}`)
  return dir
}

function esc(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
  )
}

/** Trang xem goi bang trinh duyet (khong can app). */
function viewerHtml(m: FeedbackMeta): string {
  const has = (id: AttachId): boolean => m.files.some((f) => f.id === id)
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Góp ý: ${esc(m.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:32px auto;padding:0 16px;color:#0E1046;background:#F6F8FE}
.box{background:#fff;border:1px solid #E4EAF6;border-radius:12px;padding:16px 20px;margin:12px 0}
h1{font-size:22px;margin:0 0 4px}.muted{color:#5E6785;font-size:14px}img,video{max-width:100%;border-radius:8px}</style></head><body>
<h1>${esc(m.title)}</h1><div class="muted">${esc(m.author)} · ${new Date(m.createdAt).toLocaleString('vi-VN')} · ${esc(spotLabel(m.spot))} · bản ${esc(m.toolkitVersion ?? '?')} · app ${esc(m.appVersion)}</div>
<div class="box"><b>Mô tả</b><p>${esc(m.desc)}</p><div class="muted">Loại: ${m.kind} · Nên sửa: ${m.scope === 'chung' ? 'luật chung' : 'chỉ video này'}</div>
${m.spot.speak ? `<p class="muted">Lời đọc: ${esc(m.spot.speak)}</p>` : ''}</div>
${has('doan') ? '<div class="box"><b>Đoạn video</b><br><video controls src="doan-loi.mp4"></video></div>' : ''}
${has('storyboard') ? '<div class="box"><b>Ảnh storyboard</b><br><img src="anh-storyboard.png"></div>' : ''}
${has('audio') ? '<div class="box"><b>Giọng đọc</b><br><audio controls src="giong-doc.mp3"></audio></div>' : ''}
${has('dayAi') ? '<div class="box"><b>Điều đã dạy AI</b>: xem file <code>day-ai.diff</code></div>' : ''}
</body></html>`
}

/** Doc moi goi trong thu muc gop y. */
export function listFeedback(): FeedbackItem[] {
  const root = feedbackDir()
  if (!root || !existsSync(root)) return []
  const out: FeedbackItem[] = []
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const dir = path.join(root, d.name)
    try {
      const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')) as FeedbackMeta
      let state: FeedbackState = { status: 'moi', updatedAt: meta.createdAt }
      const sp = path.join(dir, 'trang-thai.json')
      if (existsSync(sp)) state = JSON.parse(readFileSync(sp, 'utf8'))
      const paths: FeedbackItem['paths'] = {}
      for (const f of meta.files) paths[f.id] = path.join(dir, f.name)
      let taught: string | undefined
      if (paths.dayAi) taught = readFileSync(paths.dayAi, 'utf8').slice(0, 6000)
      out.push({ ...meta, dir, state, paths, taught })
    } catch {
      // thu muc khong phai goi gop y
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt)
}

export function setFeedbackState(ids: string[], patch: Omit<FeedbackState, 'updatedAt'>): void {
  const root = feedbackDir()
  if (!root) return
  for (const id of ids) {
    const dir = path.join(root, id)
    if (!existsSync(path.join(dir, 'meta.json'))) continue
    writeFileSync(
      path.join(dir, 'trang-thai.json'),
      JSON.stringify({ ...patch, updatedAt: Date.now() }, null, 2),
      'utf8'
    )
  }
}

/** Giong da dung de doc video (tu manifest.json cua audio), neu co. */
export function voiceOf(projectDir: string, slug: string): string | undefined {
  try {
    const m = JSON.parse(
      readFileSync(path.join(projectDir, 'public', 'audio', slug, 'manifest.json'), 'utf8')
    ) as Record<string, unknown>
    const v = m.voice ?? m.voice_id ?? m.voiceId
    return typeof v === 'string' ? v : undefined
  } catch {
    return undefined
  }
}

/** Gom nhieu gop y thanh mot lan sua: danh dau "Dang sua"; openNow thi nho Codex sua. */
export async function fixFeedback(
  input: BatchInput,
  send: (key: string, text: string) => void
): Promise<string | null> {
  const picked = listFeedback().filter((f) => input.ids.includes(f.id))
  if (picked.length === 0) return null
  const batch = { name: input.name.trim(), branch: input.branch.trim(), target: input.target }
  setFeedbackState(
    picked.map((p) => p.id),
    { status: 'dangSua', batch }
  )
  if (!input.openNow) return null
  const key = `he-gopy-${batch.branch}`
  send(key, fixPrompt(picked, batch.branch, batch.target))
  return key
}
