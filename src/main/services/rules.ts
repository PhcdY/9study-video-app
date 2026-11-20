// Luat thuan (khong dung tien trinh hay file), de viet bai thu de dang.
import type { ErrorCode } from '../../shared/types'

/**
 * Thu muc du an: khong dau, khong dau cach, khong OneDrive, khong thu muc he thong, khong goc o dia.
 * Bo cong cu da co san (`existing`) duoc phep co dau cach: nguoi dung da chay duoc o do roi.
 */
export function validateProjectDir(p: string, opts: { existing?: boolean } = {}): ErrorCode | null {
  const norm = p.replace(/\//g, '\\').replace(/\\+$/, '')
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(norm)) return 'thuMucCoDau'
  if (/\s/.test(norm) && !opts.existing) return 'thuMucCoDauCach'
  if (/\\onedrive/i.test(norm)) return 'thuMucOneDrive'
  if (/^[a-z]:$/i.test(norm)) return 'thuMucHeThong'
  if (/^[a-z]:\\(windows|program files|program files \(x86\)|programdata)(\\|$)/i.test(norm))
    return 'thuMucHeThong'
  if (!/^[a-z]:\\/i.test(norm)) return 'thuMucHeThong'
  return null
}

/** Ban phat hanh so lon nhat trong danh sach tag (chi tag la so nguyen: "2", "3"). */
export function latestNumericTag(tags: string[]): string | null {
  const nums = tags.map((t) => t.trim()).filter((t) => /^\d+$/.test(t))
  if (!nums.length) return null
  return nums.sort((a, b) => Number(a) - Number(b)).pop() as string
}

/**
 * Doi dong tien trinh cua `git clone --progress` ra phan tram chung 0-100.
 * Dem 0-5, nen 5-10, nhan 10-90, giai 90-100.
 */
export function gitCloneProgress(line: string): number | null {
  const m = /(Counting|Compressing|Receiving|Resolving) (?:objects|deltas):\s+(\d+)%/.exec(line)
  if (!m) return null
  const pct = Number(m[2]) / 100
  const [from, to] = {
    Counting: [0, 5],
    Compressing: [5, 10],
    Receiving: [10, 90],
    Resolving: [90, 100]
  }[m[1] as 'Counting' | 'Compressing' | 'Receiving' | 'Resolving']
  return Math.round(from + (to - from) * pct)
}

/** Dem goi trong package-lock.json (de uoc tien trinh npm ci). */
export function countLockPackages(lockText: string): number {
  try {
    const lock = JSON.parse(lockText) as { packages?: Record<string, unknown> }
    return Object.keys(lock.packages ?? {}).filter((k) => k.startsWith('node_modules/')).length
  } catch {
    return 0
  }
}

/** Dong log npm (--loglevel=http) bao mot goi da tai/lay tu bo nho dem. */
export function isNpmFetchLine(line: string): boolean {
  return /npm http (fetch|cache)/i.test(line) && /\.tgz\b/.test(line)
}

/** Nhan ra loi mang trong dau ra cua git/npm. */
export function looksLikeNetworkError(lines: string[]): boolean {
  return lines.some((l) =>
    /(could not resolve host|unable to access|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|network|getaddrinfo|Failed to connect|timed out)/i.test(
      l
    )
  )
}

/** Duong dan Google Drive cho Desktop: "<o>:\My Drive" hoac "<o>:\Drive cua toi". */
export const DRIVE_FOLDER_NAMES = ['My Drive', 'Drive của tôi']
