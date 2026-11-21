// "Da sua gi" trong mot lan sua gop y: doc tu git diff cua nhanh sua so voi luc bat dau sua.

export interface FixedFile {
  path: string
  added: number
  removed: number
  /** Cac dong thay doi (bat dau tu @@), cat ngan */
  patch: string[]
}

export interface FixDetail {
  /** Dong moi trong CHANGELOG.md */
  changelog: string[]
  /** Dong moi trong .agents/lessons.md */
  lessons: string[]
  files: FixedFile[]
  /** Ban so sanh (vd "3"), neu biet */
  since?: string
  /** Lan cuoi sua tren nhanh (ms) */
  at?: number
  /** Tim thay nhanh / ban da sua tren may nay khong */
  found: boolean
}

const CHANGELOG = /(^|\/)CHANGELOG\.md$/i
const LESSONS = /(^|\/)\.agents\/lessons\.md$/i
const MAX_PATCH = 60

/** Bo dinh dang Markdown cho de doc: **dam**, `ma`, [chu](link). */
export function plainText(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
}

/** Doc ket qua `git diff` (unified) thanh danh sach file + dong nhat ky phien ban + bai hoc. */
export function parseFixDiff(lines: string[]): Omit<FixDetail, 'since' | 'at' | 'found'> {
  const files: FixedFile[] = []
  let cur: FixedFile | null = null
  let inHunk = false
  const notes = new Map<FixedFile, string[]>()
  for (const l of lines) {
    const head = /^diff --git a\/(.+?) b\/(.+)$/.exec(l)
    if (head) {
      cur = { path: head[2], added: 0, removed: 0, patch: [] }
      files.push(cur)
      inHunk = false
      continue
    }
    if (!cur) continue
    if (l.startsWith('@@')) {
      inHunk = true
      if (cur.patch.length < MAX_PATCH) cur.patch.push(l)
      continue
    }
    if (!inHunk) continue
    if (l.startsWith('+')) {
      cur.added++
      if (CHANGELOG.test(cur.path) || LESSONS.test(cur.path))
        notes.set(cur, [...(notes.get(cur) ?? []), l.slice(1).trim()])
    } else if (l.startsWith('-')) cur.removed++
    if (cur.patch.length < MAX_PATCH) cur.patch.push(l)
  }

  const addedIn = (re: RegExp): string[] =>
    files
      .filter((f) => re.test(f.path))
      .flatMap((f) => notes.get(f) ?? [])
      .filter((l) => l && !l.startsWith('#'))

  const changelog = addedIn(CHANGELOG)
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => plainText(l.replace(/^[-*]\s+/, '')))
  const lessons = addedIn(LESSONS).map((l) => plainText(l.replace(/^[-*]\s+/, '')))
  // File luat (skill, script) len truoc; nhat ky phien ban va bai hoc xuong cuoi
  const isNote = (f: FixedFile): number => (CHANGELOG.test(f.path) || LESSONS.test(f.path) ? 1 : 0)
  files.sort((a, b) => isNote(a) - isNote(b))
  return { changelog, lessons, files }
}
