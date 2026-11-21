// Bao loi app: CTV gui vao thu muc chung (9Study_GopY/_BaoLoi), tach khoi gop y ve video.

export type BugStatus = 'moi' | 'dangXem' | 'daXuLy'

/** Anh app tu chup cua so luc hien thong bao loi (giu 3 lan gan nhat). */
export interface ErrorShot {
  id: string
  at: number
  /** Thong bao loi luc chup (tieng Viet, ngan) */
  label: string
  file: string
}

export interface BugMeta {
  id: string
  author: string
  machine: string
  createdAt: number
  desc?: string
  appVersion: string
  toolkitVersion?: string
  /** O C con trong (GB) */
  cFreeGb?: number
  /** So dong loi trong nhat ky gan day */
  errorCount: number
  /** Vai dong loi gan nhat (da che bi mat) */
  lastErrors: string[]
  /** Ten file anh trong thu muc anh/ */
  shots: { file: string; label: string; at: number }[]
}

export interface BugItem extends BugMeta {
  dir: string
  state: { status: BugStatus; updatedAt: number }
  /** Duong dan day du cua anh */
  shotPaths: string[]
  /** File nhat ky chinh (main.log) */
  logFile?: string
}

export interface BugSendInput {
  desc?: string
  /** Anh app tu chup va anh CTV tu them tu may (id tu 'bugs:addImage') */
  shotIds: string[]
}

/** Anh CTV them tu may: toi da bao nhieu anh, moi anh bao nhieu MB. */
export const MAX_ADDED_IMAGES = 6
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024

export type AddImageResult =
  | { ok: true; shot: ErrorShot }
  | { ok: false; code: 'khongPhaiAnh' | 'quaLon' | 'quaNhieu' | 'loi' }

const IMAGE_EXT: Record<string, string> = {
  png: '.png',
  jpg: '.jpg',
  jpeg: '.jpg',
  webp: '.webp',
  gif: '.gif',
  bmp: '.bmp'
}

/** Duoi file anh hop le tu ten file hoac kieu MIME ("image/png"); khong phai anh thi null. */
export function imageExt(name: string, mime?: string): string | null {
  const byName = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase()
  if (byName && IMAGE_EXT[byName]) return IMAGE_EXT[byName]
  const byMime = /^image\/([a-z0-9]+)$/i.exec(mime ?? '')?.[1]?.toLowerCase()
  return byMime && IMAGE_EXT[byMime] ? IMAGE_EXT[byMime] : null
}

/** Dong loi trong nhat ky electron-log: "[...] [error] ..." hoac "[warn]". */
export function errorLines(log: string, max = 6): { count: number; last: string[] } {
  const lines = log.split(/\r?\n/).filter((l) => /\[(error|warn)\]/i.test(l))
  const errors = lines.filter((l) => /\[error\]/i.test(l))
  return {
    count: errors.length,
    last: lines.slice(-max).map((l) => l.replace(/^\[[\d\- :.]+\]\s*/, '').slice(0, 300))
  }
}

const two = (n: number): string => String(n).padStart(2, '0')

/** Loi nho AI doc bao loi: 'app' = tro ly trong app (chi doc, chan doan); 'ngoai' = dan vao Claude Code / ChatGPT. */
export function bugAiPrompt(bug: BugItem, who: 'app' | 'ngoai'): string {
  const d = new Date(bug.createdAt)
  const when = `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`
  const info = [
    `Mô tả: ${bug.desc?.trim() || '(không có)'}`,
    `Người gửi: ${bug.author} · ${when}`,
    [
      `App ${bug.appVersion}`,
      bug.toolkitVersion ? `bộ công cụ bản ${bug.toolkitVersion}` : '',
      bug.cFreeGb !== undefined ? `ổ C còn ${bug.cFreeGb} GB` : ''
    ]
      .filter(Boolean)
      .join(' · '),
    `Lỗi trong nhật ký: ${bug.errorCount} lần.`,
    ...(bug.lastErrors.length ? ['Dòng lỗi gần nhất:', ...bug.lastErrors] : [])
  ]
  const head =
    who === 'app'
      ? [
          `Đọc báo lỗi của app NiniStudio trong thư mục ${bug.dir} (meta.json, thong-tin.txt, thư mục nhật ký và ảnh lúc lỗi). Chỉ đọc, không sửa file nào.`,
          'Cho tôi biết: lỗi xảy ra lúc người gửi làm gì, do đâu (máy người gửi, bộ công cụ, hay chính app), và cách khắc phục. Nếu do app thì chỉ rõ dòng nhật ký cho thấy điều đó để báo người phát triển app.'
        ]
      : [
          'Đọc báo lỗi của app NiniStudio trong thư mục:',
          bug.dir,
          '(meta.json, thong-tin.txt, thư mục nhật ký và ảnh lúc lỗi). Tìm nguyên nhân trong mã app, sửa, rồi báo lại đã sửa gì.'
        ]
  return [...head, '', ...info].join('\n')
}
