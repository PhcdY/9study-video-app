// Bam anh storyboard / cau giong doc de nho AI sua dung cau do.
// Cau duoc chon gan vao dau loi nhan thanh mot khoi co dinh dang; khi hien lai (ca luc mo lai
// cuoc tro chuyen tu lich su Codex) thi tach khoi do ra thanh the nho tren bong bong chat.
// Ham thuan, co bai thu.

/** hinh: anh storyboard; giong: cau giong doc. */
export type PickKind = 'hinh' | 'giong'

export interface Pick {
  kind: PickKind
  /** vd "b02-l01" (trung ten file anh / mp3) */
  id: string
  /** vd "Cảnh 2 · câu 1" */
  label: string
  speak?: string
  /** Duong dan anh storyboard cua cau (chi voi hinh) */
  image?: string
}

/** The hien tren bong bong chat. */
export interface PickTag {
  kind: PickKind
  label: string
}

/** "b02" + dong 0 -> "b02-l01". */
export function lineId(beatId: string, lineIndex: number): string {
  return `${beatId}-l${String(lineIndex + 1).padStart(2, '0')}`
}

/**
 * Ten de nguoi dung doc cho moi cau, theo ma cau: "Cảnh 2 · câu 5". Mot canh co the gom nhieu
 * beat nen dem cau lien tuc trong ca canh (khong trung ten); beat khong co so canh thi "b02 · câu 1".
 */
export function lineLabels(
  beats: { id: string; scene?: number; lines?: unknown[] }[] | undefined
): Map<string, string> {
  const out = new Map<string, string>()
  const count = new Map<number, number>()
  for (const b of beats ?? [])
    (b.lines ?? []).forEach((_, i) => {
      if (b.scene == null) return void out.set(lineId(b.id, i), `${b.id} · câu ${i + 1}`)
      const n = (count.get(b.scene) ?? 0) + 1
      count.set(b.scene, n)
      out.set(lineId(b.id, i), `Cảnh ${b.scene} · câu ${n}`)
    })
  return out
}

/**
 * Bam thuong: chi chon cau nay (bam lai cau dang chon duy nhat thi bo chon).
 * Bam kem Ctrl: them / bot cau nay, giu cac cau khac.
 */
export function togglePick(list: Pick[], p: Pick, many: boolean): Pick[] {
  const same = (x: Pick): boolean => x.kind === p.kind && x.id === p.id
  const has = list.some(same)
  if (many) return has ? list.filter((x) => !same(x)) : [...list, p]
  return has && list.length === 1 ? [] : [p]
}

export function isPicked(list: Pick[], kind: PickKind, id: string): boolean {
  return list.some((x) => x.kind === kind && x.id === id)
}

const OPEN = '[Đang chọn trong app]'
const CLOSE = '[Hết phần chọn]'
const WORD: Record<PickKind, string> = { hinh: 'hình', giong: 'giọng' }

const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim()

/** Loi gui cho AI: khoi cau da chon + loi nguoi dung. Khong chon gi thi giu nguyen. */
export function withPicks(text: string, picks: Pick[]): string {
  if (!picks.length) return text
  const rows = picks.map((p) => {
    const parts = [`- ${WORD[p.kind]} ${p.id} (${oneLine(p.label).replace(/[()]/g, '')})`]
    if (p.speak) parts.push(`lời: "${oneLine(p.speak)}"`)
    if (p.image) parts.push(`ảnh: ${p.image}`)
    return parts.join(' · ')
  })
  const kinds = new Set(picks.map((p) => p.kind))
  const how: string[] = ['Yêu cầu bên dưới chỉ áp dụng cho những câu trên, không sửa câu khác.']
  if (kinds.has('hinh'))
    how.push(
      'Câu "hình": sửa hình của câu đó trong video, xong xuất lại storyboard cho beat đó để người dùng xem ảnh mới.'
    )
  if (kinds.has('giong'))
    how.push(
      'Câu "giọng": sửa cách đọc của câu đó (lời đọc, phiên âm, nhấn giọng) rồi chỉ tạo lại audio của câu đó; tạo giọng tốn credit nên hỏi trước.'
    )
  return [OPEN, ...rows, ...how, CLOSE, text].join('\n')
}

const ROW = /^- (hình|giọng) (\S+) \(([^)]*)\)/

/** Tach khoi cau da chon ra khoi loi nhan de hien: loi nguoi dung + the. */
export function splitPicks(text: string): { text: string; picks: PickTag[] } {
  if (!text.startsWith(OPEN)) return { text, picks: [] }
  const end = text.indexOf(`\n${CLOSE}`)
  if (end < 0) return { text, picks: [] }
  const picks: PickTag[] = []
  for (const row of text.slice(OPEN.length, end).split('\n')) {
    const m = ROW.exec(row)
    if (m) picks.push({ kind: m[1] === 'hình' ? 'hinh' : 'giong', label: m[3] })
  }
  return { text: text.slice(end + CLOSE.length + 1).replace(/^\n/, ''), picks }
}
