// Doc cau hoi lua chon o cuoi tin nhan cua AI, de giao dien ghim cac lua chon ngay tren o nhan.
// AI duoc dan (CHOICE_INSTRUCTIONS) ket thuc bang: cau hoi "...?" roi danh sach danh so 1. 2. 3.
// Van doc duoc vai kieu viet khac: danh sach truoc, cau hoi sau; gach dau dong; A. B. C.
// Ham thuan, co bai thu.

export interface ChoiceOption {
  /** Chu chinh tren nut (phan in dam, hoac ca dong neu ngan) */
  label: string
  /** Phan giai thich sau dau "—", ":" (neu co) */
  detail?: string
  /** So / chu dau dong ma AI dung (vd "2", "B"), de gui lai cho AI */
  key: string
}

export interface ChoiceQuestion {
  question: string
  options: ChoiceOption[]
  /** Cau hoi co/khong (khong co danh sach, options rong): giao dien tu hien nut Co / Khong */
  yesNo?: boolean
}

/** Loi dan them cho AI (developer instructions): viet lua chon dung kieu de app ghim thanh nut. */
export const CHOICE_INSTRUCTIONS = [
  'Ứng dụng này hiện các lựa chọn thành nút bấm ngay trên ô nhắn của người dùng.',
  'Khi cần người dùng chọn giữa vài phương án, kết thúc tin nhắn bằng một câu hỏi ngắn có dấu "?",',
  'ngay dưới là danh sách đánh số "1.", "2.", "3."… (2 đến 6 phương án), mỗi phương án một dòng ngắn,',
  'có thể in đậm tên phương án rồi giải thích sau dấu "—". Không viết gì thêm sau danh sách.',
  'Câu hỏi có/không thì chỉ cần kết thúc tin nhắn bằng câu hỏi đó.'
].join(' ')

const MIN_OPTS = 2
const MAX_OPTS = 8
const MAX_OPT_LEN = 220
const MAX_Q_LEN = 300

const LIST_RE = /^\s*(?:(\d{1,2})[.)]|([A-Za-z])[.)]|[-*•+])\s+(.+)$/

/** Tin nhan cua AI ket thuc bang cau hoi lua chon? null neu khong. */
export function findChoices(text: string): ChoiceQuestion | null {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  if (!lines.length) return null
  // Bo khoi code: khong doc lua chon trong do
  if (/^\s*```/.test(lines[lines.length - 1])) return null

  // Kieu 2: danh sach roi mot cau hoi ngan o dong cuoi
  const last = lines[lines.length - 1]
  if (!LIST_RE.test(last) && isQuestion(last)) {
    let i = lines.length - 2
    while (i >= 0 && !lines[i].trim()) i--
    const block = readListUp(lines, i)
    if (block) return build(clean(last), block.items)
    // Khong co danh sach: cau hoi co/khong
    if (isYesNo(last)) return { question: clean(last), options: [], yesNo: true }
    return null
  }

  // Kieu 1: cau hoi roi danh sach o cuoi
  const block = readListUp(lines, lines.length - 1)
  if (!block) return null
  let j = block.start - 1
  while (j >= 0 && !lines[j].trim()) j--
  if (j < 0) return null
  const q = clean(lines[j])
  if (!isQuestion(q) && !(/:\s*$/.test(q) && /chọn|muốn|phương án|cách|lựa/i.test(q))) return null
  return build(q.replace(/:\s*$/, ''), block.items)
}

function build(question: string, items: string[][]): ChoiceQuestion | null {
  if (!question || question.length > MAX_Q_LEN) return null
  const options: ChoiceOption[] = []
  for (const [key, raw] of items) {
    const opt = splitOption(raw)
    if (!opt.label || raw.length > MAX_OPT_LEN) return null
    options.push({ ...opt, key })
  }
  return { question, options }
}

/** Doc nguoc tu dong `end` len: cac dong cung mot danh sach (cung kieu dau dong). */
function readListUp(lines: string[], end: number): { start: number; items: string[][] } | null {
  const items: string[][] = []
  let kind: string | null = null
  let i = end
  for (; i >= 0; i--) {
    const m = LIST_RE.exec(lines[i])
    if (!m) break
    // Dong thut vao sau hon: danh sach con, khong phai lua chon
    if (/^\s{2,}/.test(lines[i])) return null
    const k = m[1] ? 'so' : m[2] ? 'chu' : 'gach'
    if (kind && k !== kind) break
    kind = k
    items.unshift([m[1] ?? m[2]?.toUpperCase() ?? String(end - i + 1), m[3].trim()])
  }
  if (items.length < MIN_OPTS || items.length > MAX_OPTS) return null
  // Gach dau dong khong co so: danh lai so theo thu tu
  if (kind === 'gach') items.forEach((it, n) => (it[0] = String(n + 1)))
  // Danh so phai lien nhau tu dau (1,2,3 / A,B,C), tranh lay nham danh sach giua bai
  if (kind === 'so' && items.some((it, n) => Number(it[0]) !== n + 1)) return null
  if (kind === 'chu' && items.some((it, n) => it[0] !== String.fromCharCode(65 + n))) return null
  return { start: i + 1, items }
}

function splitOption(raw: string): { label: string; detail?: string } {
  const bold = /^\*\*(.+?)\*\*\s*(?:[—–:-]\s*)?(.*)$/.exec(raw)
  if (bold) return pair(bold[1], bold[2])
  const dash = /^(.{2,80}?)\s+[—–]\s+(.+)$/.exec(raw)
  if (dash) return pair(dash[1], dash[2])
  return { label: clean(raw) }
}

function pair(label: string, detail: string): { label: string; detail?: string } {
  const d = clean(detail)
  return { label: clean(label).replace(/[:.]$/, ''), ...(d && { detail: d }) }
}

/** Bo dinh dang markdown don gian de hien tren nut. */
function clean(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|\s)[*_](\S.*?)[*_](?=\s|$|[.,?!])/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/, '')
    .trim()
}

function isQuestion(line: string): boolean {
  return /\?\s*\**\s*$/.test(line.trim())
}

function isYesNo(line: string): boolean {
  return /(không|chứ|nhé|chưa|được không|ổn không)\s*\?\s*\**\s*$/i.test(line.trim())
}
