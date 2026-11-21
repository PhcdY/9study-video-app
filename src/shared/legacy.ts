// Nhan du lieu cu: nguoi da lam video bang bo cong cu (Codex / Claude Code) truoc khi co app.
import { parseVoiceRun, type VoiceRunInfo } from './vivibe'

export type LegacySource = 'codex' | 'claude'

/** Mot cuoc tro chuyen cu, da doc gon (chi chu nguoi dung va chu AI). */
export interface LegacyChat {
  /** "<source>-<id goc>" */
  id: string
  source: LegacySource
  title: string
  startedAt: number
  endedAt: number
  /** Video ma cuoc tro chuyen noi toi nhieu nhat; khong co thi la tro chuyen chung */
  slug?: string
  messages: number
  /** File goc (Codex: rollout de mo tiep) */
  file?: string
  /** Codex: id thread de mo tiep */
  threadId?: string
}

export interface LegacyMessage {
  role: 'user' | 'ai'
  text: string
  at: number
}

/** Mot lan tao giong doc tim thay trong tro chuyen cu. */
export interface LegacyVoiceRun extends VoiceRunInfo {
  at: number
  /** Khoa chong cong trung (nguon + id lenh) */
  src: string
}

export interface LegacyScan {
  dir: string
  /** So video co script.json */
  videos: number
  /** Video do nguoi dung lam (khong nam trong ban phat hanh) */
  ownVideos: number
  /** Video con do (chua xuat) */
  unfinished: number
  sizeBytes: number
  hasKey: boolean
  chats: LegacyChat[]
  voice: { runs: number; chars: number; since?: number }
  /** Thu muc se dung: chinh thu muc cu, hoac thu muc moi khi phai chep */
  target: string
  needsCopy: boolean
}

export interface LegacyOptions {
  videos: boolean
  key: boolean
  chats: boolean
  voice: boolean
}

export interface LegacyResult {
  videos: number
  chats: number
  chars: number
  key: boolean
}

/** Ten thu muc Claude Code dat cho mot du an: moi ky tu khong phai chu/so thanh "-". */
export function claudeProjectName(dir: string): string {
  return dir.replace(/[\\/]+$/, '').replace(/[^A-Za-z0-9]/g, '-')
}

/** Chuan hoa duong dan de so sanh (khong phan biet hoa thuong, gach cheo). */
export function sameDir(a: string, b: string): boolean {
  const n = (x: string): string =>
    x
      .replace(/^file:\/\/\/?/i, '')
      .replace(/%20/g, ' ')
      .replace(/\//g, '\\')
      .replace(/\\+$/, '')
      .toLowerCase()
  return n(a) === n(b)
}

/** Video nhac toi nhieu nhat trong cac doan chu (chi tinh slug co that). */
export function guessSlug(texts: string[], slugs: Set<string>): string | undefined {
  const count = new Map<string, number>()
  const re = /videos[\\/]+([A-Za-z0-9_-]+)/g
  for (const t of texts)
    for (const m of t.matchAll(re)) if (slugs.has(m[1])) count.set(m[1], (count.get(m[1]) ?? 0) + 1)
  let best: string | undefined
  let n = 0
  for (const [s, c] of count)
    if (c > n) {
      best = s
      n = c
    }
  return best
}

/** Tieu de ngan tu cau dau nguoi dung nhan. */
export function chatTitle(first: string, max = 70): string {
  const t = first.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

/** Chu nguoi dung that (bo loi nhac he thong, lenh noi bo). */
export function isHumanText(t: string): boolean {
  const s = t.trim()
  if (!s) return false
  if (/^<(system-reminder|command-|local-command|environment_context|user_instructions)/i.test(s))
    return false
  if (/^Caveat: The messages below/i.test(s)) return false
  // Loi dan Codex Desktop tu chen (vd khi giao viec cho tac tu phu)
  if (/^The following is the Codex agent/i.test(s)) return false
  return true
}

/** Lan tao giong that tu mot lenh va ket qua (them dang cu "N dòng cần tạo · X ký tự"). */
export function voiceRunOf(command: string, output: string): VoiceRunInfo | null {
  const run = parseVoiceRun(command, output)
  if (run) return run
  if (!/vivibe_tts\.py/.test(command) || /--estimate|--list-voices/.test(command)) return null
  const m = /(\d+)\s+dòng cần tạo\s*·\s*(\d+)\s+ký tự/.exec(output)
  if (!m) return null
  // Tao loi het thi Vivibe khong tinh
  const made = /Tạo mới\s+(\d+)/.exec(output)
  if (made && Number(made[1]) === 0) return null
  const slug =
    /videos[\\/]+([A-Za-z0-9_-]+)[\\/]+script\.json/.exec(command)?.[1] ??
    /vivibe_tts\.py\s+["']?([A-Za-z0-9_-]+)["']?(?:\s|$)/.exec(command)?.[1]
  const audioDir = /--audio-dir[=\s]+["']?([A-Za-z0-9_-]+)/.exec(command)?.[1]
  return { slug, audioDir, lines: Number(m[1]), chars: Number(m[2]) }
}
