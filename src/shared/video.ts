// Kieu dung chung cho man Video cua toi, form Lam video moi va man mot video.
import type { AiChoice } from './ai-model'

/** Ba buoc lam video tren giao dien, cong buoc da xuat. */
export type VideoStage = 'kichBan' | 'duyetHinh' | 'giongDoc' | 'daXuat'

export interface VideoInfo {
  slug: string
  title: string
  subject: string
  lop?: number
  bai?: string
  loai?: string
  /** Ma composition trong Video.tsx (co the khac slug) */
  compositionId?: string
  stage: VideoStage
  /** Video mau di kem bo cong cu (khong phai bai cua nguoi dung) */
  sample: boolean
  /** Lan sua cuoi (ms) */
  updatedAt: number
  storyboardHtml?: string
  /** Co file trong src/videos/<slug>/ sua sau lan xuat storyboard cuoi: storyboard dang hien la ban cu */
  storyboardStale?: boolean
  /** Anh lam hinh thu nho: mot anh trong thu muc storyboard */
  thumb?: string
  finalMp4?: string
  /** Video co cuoc tro chuyen da luu trong app */
  hasChat: boolean
  /** Video moi dang do: AI chua tao thu muc video (slug la khoa cuoc tro chuyen) */
  draft?: boolean
}

/** Ket qua xoa video: ok; root = khong go duoc khoi danh sach dung video; files = con file chua chuyen vao Thung rac; loi = khong xoa duoc bai nay */
export type RemoveVideoResult = 'ok' | 'root' | 'files' | 'loi'

export interface VideosSnapshot {
  videos: VideoInfo[]
  /** Ban bo cong cu dang dung (tag so), neu doc duoc */
  toolkitVersion?: string
  outputDir: string
}

export interface ScriptLine {
  show?: string
  text?: string
  speak?: string
  at?: string
}
export interface ScriptBeat {
  id: string
  scene?: number
  section?: string
  keyword?: string
  visual?: string
  lines?: ScriptLine[]
}
export interface ScriptData {
  slug: string
  title?: string
  subject?: string
  lop?: number
  chuong?: string
  bai?: string
  beats?: ScriptBeat[]
}

export interface AudioLine {
  /** vd "b01-l02" */
  id: string
  file: string
  speak?: string
}

export interface Lesson {
  /** Duong dan tuong doi trong repo, vd references/toan/lop-12/tap-1/bai-01-....md */
  file: string
  title: string
}

// ---------- chat ----------

export type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'ai'; id: string; text: string; streaming?: boolean }
  | {
      kind: 'status'
      id: string
      /** Nhan dong trang thai (tieng Viet) */
      label: StatusLabel
      count: number
      state: 'running' | 'done' | 'failed'
    }
  | {
      kind: 'approval'
      id: string
      title: ApprovalTitle
      /** Lenh nguyen van khi la lenh la */
      command?: string
      /** Viec quen thuoc cua bo cong cu (title = 'congCu') */
      label?: StatusLabel
      /** Tao giong doc: so cau va so ky tu se gui (che do uoc tinh) */
      estimate?: { lines: number; chars: number }
      reason?: string
      costly: boolean
      state: 'pending' | 'accepted' | 'acceptedForSession' | 'declined'
    }
  | { kind: 'error'; id: string; code: ChatErrorCode }

/** Ma nhan trang thai; giao dien doi sang cau tieng Viet. */
export type StatusLabel =
  | 'docTaiLieu'
  | 'timTaiLieu'
  | 'kiemKichBan'
  | 'xuatStoryboard'
  | 'kiemBoCuc'
  | 'chupAnh'
  | 'taoGiong'
  | 'canTu'
  | 'xuatVideo'
  | 'kiemLoi'
  | 'suaFile'
  | 'xemBan'
  | 'hocSinhAo'
  | 'lamViec'

export type ApprovalTitle =
  | 'congCu'
  | 'taoGiong'
  | 'taoLaiGiong'
  | 'xuatVideo'
  | 'doiBan'
  | 'caiThuVien'
  | 'mang'
  | 'suaFile'
  | 'lenhLa'

/** Tra loi the xin quyen: dong y lan nay / dong y ca phien cho viec giong vay / tu choi. */
export type ApprovalDecision = 'accept' | 'acceptForSession' | 'decline'

export type ChatErrorCode = 'hetLuot' | 'mang' | 'chuaDangNhap' | 'khongRo'

export interface ChatState {
  key: string
  /** Video cua cuoc tro chuyen (video moi: co sau khi AI tao kich ban) */
  slug?: string
  items: ChatItem[]
  /** AI dang lam (co the bam Dung) */
  busy: boolean
  /** Model + muc suy nghi cua cuoc tro chuyen nay */
  ai: AiChoice
}

export type SubjectId = 'toan' | 'ly' | 'hoa' | 'sinh' | 'su' | 'dia' | 'van' | 'ktpl' | 'anh'

export interface NewVideoInput {
  subject: SubjectId
  lop: 10 | 11 | 12
  loai: 'baiHoc' | 'hienTuong'
  /** Bai SGK (video bai hoc) hoac cau hoi "vi sao" (video hien tuong) */
  bai: string
  lessonFile?: string
  yBanChat?: string
  voice: string
  voicePerScene?: boolean
  exams: string[]
  daHoc?: string
  chuaHoc?: string
  videoTruoc?: string
  moDau?: 'aiChon' | 'hienTuong' | 'cauDeThi' | 'hieuSai'
  goiYMoDau?: string
  viDu?: string
  doDai?: 'ai' | 'gon' | 'ky'
  loiHayMac?: string
  dangBaiThi?: string
  ghiChu?: string
  attachments?: string[]
}

/** Nut goi y theo buoc trong khung chat. */
export type ChipId =
  | 'duyetKichBan'
  | 'kiemKichBan'
  | 'hocSinhAoKichBan'
  | 'duyetHinh'
  | 'xuatLaiStoryboard'
  | 'hocSinhAoHinh'
  | 'nghiOnDungHoanChinh'
  | 'xuatVideo'
  | 'xuatLaiVideo'

/** Trang thai AI cua mot bai: dang chay, cho ban duyet (the xin quyen), da dung, gap loi. */
export type AiStatus = 'dang' | 'cho' | 'dung' | 'loi'

export function aiStatusOf(items: ChatItem[], busy: boolean): AiStatus {
  if (items.some((it) => it.kind === 'approval' && it.state === 'pending')) return 'cho'
  if (busy) return 'dang'
  return items.at(-1)?.kind === 'error' ? 'loi' : 'dung'
}
