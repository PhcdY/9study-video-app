// Kieu dung chung cho phien ban bo cong cu, luot ChatGPT, bao loi.
import type { AiChoice } from './ai-model'

export interface ChangelogGroup {
  /** "Chung (mọi môn)", "Tiếng Anh"... */
  name: string
  moi: string[]
  sua: string[]
}

export interface ChangelogEntry {
  version: string
  date?: string
  /** Doan tom tat dau muc (neu co) */
  summary?: string
  groups: ChangelogGroup[]
}

export interface VersionInfo {
  /** Ban dang dung (tag so tren commit hien tai) */
  current?: string
  /** Dang dung nhanh thu nghiem: ten nhanh */
  branch?: string
  /** Khong dung dung tren ban so: ban gan nhat phia truoc */
  base?: string
  latest?: string
  updateAvailable: boolean
  /** Cac ban moi hon ban dang dung, moi nhat truoc */
  notes: ChangelogEntry[]
  /** App tu doi ban duoc (khong co file bo cong cu bi sua, khong o nhanh thu nghiem) */
  safe: boolean
  /** Ban moi can app tu ban nay tro len */
  needAppVersion?: string
  /** Khong ket noi duoc GitHub: thong tin chi tu may */
  offline: boolean
  /** Ban lien truoc (de quay lai) */
  previous?: string
  /** Moi ban so da phat hanh, moi nhat truoc, kem mo ta (neu CHANGELOG co) */
  history: ChangelogEntry[]
}

export type UpdateResult =
  | { ok: true; version: string }
  | { ok: false; code: 'mang' | 'canAppMoi' | 'khongRo' }
  /** Can AI (skill phien-ban) giup doi ban de giu bai: khoa cuoc tro chuyen */
  | { ok: false; code: 'nhoAi'; chatKey: string }

export type UpdateStep = 'doiBan' | 'caiThuVien'
export interface UpdateProgress {
  step: UpdateStep
  status: 'running' | 'done'
}

export interface UsageWindow {
  /** Do dai cua so tinh luot (phut): 300 = 5 gio, 10080 = tuan */
  minutes: number | null
  usedPercent: number
  /** Luc lam moi (ms) */
  resetsAt?: number
}

export interface Usage {
  /** Tung han muc (vd 5 gio va tuan), ngan truoc */
  windows: UsageWindow[]
  /** Phan tram con lai cua han muc chat nhat (0-100) */
  remainingPercent: number
  /** Luc lam moi cua han muc chat nhat (ms) */
  resetsAt?: number
  plan?: string
}

/** Cai dat nguoi dung chinh duoc tren man Cai dat. */
export interface Prefs {
  /** Thu muc gop y chung (Drive), vd G:\My Drive\9Study_GopY */
  feedbackDir?: string
  /** Ten hien trong gop y */
  authorName?: string
  /** Luon gui kem ca video thanh pham */
  alwaysFullVideo?: boolean
  /** Hien muc Gop y de xu ly gop y cua moi nguoi */
  maintainer?: boolean
  /** 'tonCredit': AI tu hoi khi can (mac dinh); 'moiLenh': hoi moi lenh */
  askPolicy?: 'tonCredit' | 'moiLenh'
  /** Tu don bo nho AI khi sang buoc moi (mac dinh bat) */
  autoCompact?: boolean
  /** Tu tai ban app moi (mac dinh bat) */
  autoUpdateApp?: boolean
  /** Ban chua phat hanh nguoi bao tri tu tao de gom cac lan sua (vd "5") */
  plannedVersions?: string[]
  /** Giong mac dinh theo nhom mon (man Lam video moi chon san) */
  defaultVoices?: { tuNhien?: string; xaHoi?: string; anh?: string }
  /** Model + muc suy nghi cho cuoc tro chuyen moi (bo trong = Codex tu chon) */
  defaultAi?: AiChoice
}

/** Dung luong file tao lai duoc, de don. */
export interface DiskUsage {
  /** Anh nhap va storyboard (<noi luu>/_lam-viec) */
  drafts: number
  /** File tam khi xuat video va cai thu vien */
  temp: number
  /** O C con trong (GB) */
  cFreeGb?: number
}

export interface PrefsSnapshot extends Prefs {
  /** Thu muc gop y dang dung (da dat hoac tu tim thay trong Drive) */
  feedbackDirInUse?: string
  /** Thu muc du an (bo cong cu + video) */
  projectDir?: string
  /** Noi luu video thanh pham */
  outputDir?: string
}

/** Ban app moi da tai xong, cho khoi dong lai de cai. */
export interface AppUpdate {
  version: string
  /** Ban dang chay */
  current: string
  /** Cac dong "co gi moi" lay tu trang phat hanh */
  notes: string[]
  /** Trang phat hanh tren GitHub */
  url: string
}

/** Lay cac dong gach dau dong tu ghi chu phat hanh (HTML cua GitHub hoac Markdown). */
export function releaseNoteLines(notes: unknown): string[] {
  const text =
    typeof notes === 'string'
      ? notes
      : Array.isArray(notes)
        ? notes
            .map((n) => (n && typeof n === 'object' && 'note' in n ? String(n.note ?? '') : ''))
            .join('\n')
        : ''
  const decode = (x: string): string =>
    x
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
  const li = [...text.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => decode(m[1]))
  const lines = li.length
    ? li
    : text
        .split(/\r?\n/)
        .filter((l) => /^\s*[-*]\s+/.test(l))
        .map((l) => decode(l.replace(/^\s*[-*]\s+/, '').replace(/\*\*|`/g, '')))
  return lines.filter(Boolean)
}
