// Dem credit Vivibe: moi lan bo cong cu tao giong (scripts/vivibe_tts.py) in "... N dòng cần tạo ... tổng X ký tự".
// App doc dong do tu ket qua lenh de cong so ky tu da gui Vivibe (Vivibe tinh credit theo ky tu).

export interface VoiceRunInfo {
  slug?: string
  /** Thu muc audio khac slug (--audio-dir), vd "<slug>-nu" */
  audioDir?: string
  lines: number
  chars: number
}

/** Doc mot lan chay tao giong tu cau lenh va ket qua; khong phai lan tao that thi tra null. */
export function parseVoiceRun(command: string, output: string): VoiceRunInfo | null {
  if (!/vivibe_tts\.py/.test(command)) return null
  if (/--estimate|--list-voices/.test(command)) return null
  const m = /(\d+)\s+dòng cần tạo[\s\S]*?tổng\s+(\d+)\s+ký tự/.exec(output)
  if (!m) return null
  const lines = Number(m[1])
  const chars = Number(m[2])
  if (!lines || !chars) return null
  const slug = /videos[\\/]+([A-Za-z0-9_-]+)[\\/]+script\.json/.exec(command)?.[1]
  const audioDir = /--audio-dir[=\s]+["']?([A-Za-z0-9_-]+)/.exec(command)?.[1]
  return { slug, audioDir, lines, chars }
}

export interface VivibeVideoUsage {
  slug: string
  title: string
  /** So lan tao giong trong thang */
  runs: number
  /** Ky tu da gui Vivibe trong thang */
  sent: number
  /** Phan dang nam trong video (uoc theo ti le cau dang dung) */
  used: number
  unused: number
  /** Video da bi bo / xoa: khong con cau nao dung */
  dropped: boolean
  lastAt: number
}

export interface VivibeUsage {
  /** "YYYY-MM" */
  month: string
  /** Cac thang co so lieu, moi nhat truoc */
  months: string[]
  sent: number
  used: number
  unused: number
  /** Thang lien truoc */
  prevSent: number
  videos: VivibeVideoUsage[]
}

export const monthOf = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export interface VoiceRun extends VoiceRunInfo {
  at: number
  projectDir: string
  /** Ten video luc tao (video bi xoa sau do van hien dung ten) */
  title?: string
  /** Lan tao nhan tu tro chuyen cu: khoa chong cong trung */
  src?: string
}

/**
 * Tong hop theo thang. usedOf(slug, audioDir) = so ky tu cua cac cau dang co audio trong video.
 * Moi video: phan "dang dung" chia cho cac lan tao theo ti le (khong vuot qua so da gui).
 */
export function summarize(
  runs: VoiceRun[],
  month: string,
  usedOf: (slug: string, audioDir?: string) => { chars: number; exists: boolean },
  titleOf: (slug: string) => string
): VivibeUsage {
  const months = [...new Set(runs.map((r) => monthOf(r.at)))].sort().reverse()
  const [y, mo] = month.split('-').map(Number)
  const prev = monthOf(new Date(y, mo - 2, 1).getTime())
  const keyOf = (r: VoiceRun): string => `${r.slug ?? '?'}|${r.audioDir ?? ''}`
  const total = new Map<string, number>()
  for (const r of runs) total.set(keyOf(r), (total.get(keyOf(r)) ?? 0) + r.chars)
  const videos = new Map<string, VivibeVideoUsage>()
  for (const r of runs.filter((x) => monthOf(x.at) === month)) {
    const k = keyOf(r)
    const v = videos.get(k) ?? {
      slug: r.slug ?? '',
      title: r.slug ? titleOf(r.slug) : 'Không rõ video',
      runs: 0,
      sent: 0,
      used: 0,
      unused: 0,
      dropped: false,
      lastAt: 0
    }
    v.runs += 1
    v.sent += r.chars
    v.lastAt = Math.max(v.lastAt, r.at)
    videos.set(k, v)
  }
  for (const [k, v] of videos) {
    const [slug, audioDir] = k.split('|')
    const u =
      slug && slug !== '?' ? usedOf(slug, audioDir || undefined) : { chars: 0, exists: false }
    const all = total.get(k) ?? v.sent
    const usedAll = Math.min(u.chars, all)
    v.used = Math.round((usedAll * v.sent) / all)
    v.unused = v.sent - v.used
    v.dropped = !u.exists
  }
  const list = [...videos.values()].sort((a, b) => b.sent - a.sent)
  const sum = (f: (v: VivibeVideoUsage) => number): number => list.reduce((s, v) => s + f(v), 0)
  return {
    month,
    months: months.includes(month) ? months : [month, ...months],
    sent: sum((v) => v.sent),
    used: sum((v) => v.used),
    unused: sum((v) => v.unused),
    prevSent: runs.filter((r) => monthOf(r.at) === prev).reduce((s, r) => s + r.chars, 0),
    videos: list
  }
}
