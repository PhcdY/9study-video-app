// Kieu dung chung cho phien ban bo cong cu, luot ChatGPT, bao loi.

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

export interface Usage {
  /** Phan tram luot con lai (0-100) */
  remainingPercent: number
  /** Luc lam moi luot (ms) */
  resetsAt?: number
  plan?: string
}
