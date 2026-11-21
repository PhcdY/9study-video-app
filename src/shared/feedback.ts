// Gop y cho doi: goi gop y CTV gui vao thu muc chung tren Drive, nguoi bao tri xem va sua skill.
import type { BugItem } from './bugs'

export type FeedbackKind = 'hinh' | 'giong' | 'noiDung' | 'loiApp'
export type FeedbackScope = 'chung' | 'video'
export type FeedbackStatus = 'moi' | 'dangSua' | 'daSua' | 'khongSua'

/** Cho bi loi trong video. */
export interface FeedbackSpot {
  /** Giay trong video thanh pham (neu gop y tu video) */
  time?: number
  beat?: string
  /** So thu tu dong trong beat, tu 1 */
  line?: number
  /** Canh (scene) cua beat */
  scene?: number
  speak?: string
  text?: string
}

export type AttachId = 'doan' | 'storyboard' | 'audio' | 'nguon' | 'dayAi' | 'caVideo'

export interface AttachOption {
  id: AttachId
  /** Co the gui kem khong (vd chua co video thi khong co doan 20 giay) */
  available: boolean
  /** Mac dinh chon */
  checked: boolean
  /** Uoc dung luong (byte) */
  size?: number
  /** So thay doi (voi dayAi) */
  count?: number
}

/** Thong tin de mo form gop y. */
export interface FeedbackDraft {
  slug: string
  title: string
  subject: string
  lop?: number
  spot: FeedbackSpot
  /** Video thanh pham de xem va chon giay */
  finalMp4?: string
  /** Anh storyboard cua cau dang chon */
  storyboardPng?: string
  attachments: AttachOption[]
  /** Thu muc gop y chung da dat chua */
  feedbackDir?: string
  /** Cac cau trong kich ban (de chon lai cho bi loi khi chua co video) */
  lines: { beat: string; line: number; scene?: number; speak: string }[]
}

export interface FeedbackInput {
  slug: string
  spot: FeedbackSpot
  kind: FeedbackKind
  scope: FeedbackScope
  desc: string
  attach: AttachId[]
}

/** meta.json trong moi goi gop y. */
export interface FeedbackMeta {
  id: string
  createdAt: number
  author: string
  /** Ma may gui (de CTV loc "gop y cua toi") */
  machine: string
  slug: string
  title: string
  subject: string
  lop?: number
  toolkitVersion?: string
  appVersion: string
  voice?: string
  spot: FeedbackSpot
  kind: FeedbackKind
  scope: FeedbackScope
  desc: string
  files: { id: AttachId; name: string; size: number }[]
}

/** trang-thai.json do nguoi bao tri ghi. */
export interface FeedbackState {
  status: FeedbackStatus
  /** Ban da sua (vd "4") */
  fixedIn?: string
  /** Lan sua gop nhieu gop y */
  batch?: { name: string; branch: string; target?: string }
  updatedAt: number
}

export interface FeedbackItem extends FeedbackMeta {
  dir: string
  state: FeedbackState
  /** Duong dan file trong goi (de xem) */
  paths: Partial<Record<AttachId, string>>
  /** Noi dung "dieu da day AI" (diff), cat ngan */
  taught?: string
}

export interface BatchInput {
  ids: string[]
  name: string
  branch: string
  target?: string
  /** true: mo Codex ngay; false: luu, lam sau */
  openNow: boolean
}

export interface FeedbackList {
  items: FeedbackItem[]
  /** Bao loi app (thu muc _BaoLoi), tach khoi gop y */
  bugs: BugItem[]
  /** Ma may nay: loc "gop y cua toi" */
  me: string
  /** Thu muc gop y dang dung; khong co thi chua dat */
  dir?: string
}
