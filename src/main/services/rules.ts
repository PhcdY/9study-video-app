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

/** Dem goi bat buoc trong package-lock.json (goi tuy chon cho may khac khong tai tren Windows). */
export function countLockPackages(lockText: string): number {
  try {
    const lock = JSON.parse(lockText) as { packages?: Record<string, { optional?: boolean }> }
    return Object.entries(lock.packages ?? {}).filter(
      ([k, v]) => k.startsWith('node_modules/') && !v?.optional
    ).length
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

const UNIT_MB: Record<string, number> = { KiB: 1 / 1024, MiB: 1, GiB: 1024 }

/** So MB da nhan va toc do tu dong `git clone --progress`, vd "12.30 MiB | 2.10 MiB/s". */
export function gitTransfer(line: string): { mb: number; speedMbps?: number } | null {
  const m = /([\d.]+) (KiB|MiB|GiB)(?: \| ([\d.]+) (KiB|MiB|GiB)\/s)?/.exec(line)
  if (!m || !/Receiving objects/.test(line)) return null
  const mb = Number(m[1]) * UNIT_MB[m[2]]
  const speedMbps = m[3] ? Number(m[3]) * UNIT_MB[m[4]] : undefined
  return { mb: Math.round(mb * 10) / 10, speedMbps: speedMbps && Math.round(speedMbps * 10) / 10 }
}

/** Tien trinh tai trinh duyet cua Remotion: "Getting Chrome Headless Shell - 12.3 Mb/89.4 Mb" hoac "45%". */
export function remotionDownload(
  line: string
): { done?: number; total?: number; pct: number } | null {
  const mb = /([\d.]+)\s*Mb\s*\/\s*([\d.]+)\s*Mb/i.exec(line)
  if (mb) {
    const done = Number(mb[1])
    const total = Number(mb[2])
    return { done, total, pct: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0 }
  }
  const pct = /(\d+)%/.exec(line)
  return pct ? { pct: Math.min(100, Number(pct[1])) } : null
}
