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
  shotIds: string[]
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
