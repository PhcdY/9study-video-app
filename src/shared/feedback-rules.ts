// Ham thuan cho gop y (co bai thu): tra giay ra cau, doan cho sua, dat ten nhanh, ten thu muc goi.
import type { FeedbackItem, FeedbackKind, FeedbackSpot } from './feedback'

export interface TimelineLine {
  beat: string
  line: number | string
  start: number
  end: number
  section?: string
}

/** Cau dang doc (hoac vua doc xong) tai giay `t` trong timeline.json cua video. */
export function lineAt(lines: TimelineLine[], t: number): TimelineLine | null {
  let cur: TimelineLine | null = null
  for (const ln of lines) if (ln.start <= t) cur = ln
  return cur ?? lines[0] ?? null
}

/** "1:23" tu so giay. */
export function mmss(t: number): string {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Bo dau, chu thuong, gach ngang: "Nhãn đè đường cong" -> "nhan-de-duong-cong". */
export function slugify(s: string, max = 40): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '')
}

/** Ten nhanh theo quy uoc cua repo video: [mon]_fix_[mo-ta]; nhieu mon thi "all". */
export function branchName(subjects: string[], name: string): string {
  const uniq = [...new Set(subjects.filter(Boolean))]
  const mon = uniq.length === 1 ? uniq[0] : 'all'
  return `${mon}_fix_${slugify(name, 48) || 'gop-y'}`
}

/** Cho sua du kien trong bo cong cu, doan theo loai loi va mon. Codex se tu kiem lai. */
export function guessTarget(kind: FeedbackKind, subject: string): string {
  switch (kind) {
    case 'giong':
      return 'scripts/phonetic_dict.json'
    case 'hinh':
      return subject && subject !== 'toan'
        ? `.agents/mon/${subject}.md`
        : '.agents/skills/dung-video'
    case 'noiDung':
      return subject ? `.agents/mon/${subject}.md` : '.agents/skills/viet-kich-ban'
    case 'loiApp':
      return 'app NiniStudio'
  }
}

/** Ten thu muc goi gop y: 20261121-0912-lan-don-dieu. */
export function packageFolderName(now: Date, author: string, slug: string): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`
  return `${stamp}-${slugify(author, 20) || 'ctv'}-${slugify(slug, 40)}`
}

/** Mo ta cho bi loi de hien: "1:23 · cảnh 2 · câu 3" (khong co canh thi hien ma beat). */
export function spotLabel(s: FeedbackSpot): string {
  return [
    s.time !== undefined ? mmss(s.time) : '',
    s.scene ? `cảnh ${s.scene}` : s.beat ? `${s.beat}` : '',
    s.line ? `câu ${s.line}` : ''
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Cau lenh nho Codex sua bo cong cu tu mot hoac nhieu goi gop y. */
export function fixPrompt(items: FeedbackItem[], branch: string, target?: string): string {
  const out = [
    `Sửa bộ công cụ theo ${items.length} góp ý của cộng tác viên. Mỗi góp ý là một thư mục gói (meta.json, mô tả, đoạn video, ảnh storyboard, audio, nguồn video, điều AI trên máy CTV đã học).`,
    '',
    `1. Tạo nhánh mới \`${branch}\` từ \`main-codex\` (dùng \`git switch -c\`; nếu đang có thay đổi chưa lưu thì hỏi tôi trước).`,
    '2. Đọc từng gói, xem đoạn video/ảnh/audio, xác định lỗi nằm ở luật chung (skill, gói môn, `scripts/phonetic_dict.json`) hay chỉ ở video đó.',
    '3. Chỉ sửa luật chung của bộ công cụ; KHÔNG sửa video của CTV. Mỗi góp ý ghi một dòng vào `.agents/lessons.md` (lý do + luật mới).',
    '4. Thêm một dòng vào mục `## Chưa phát hành` của `CHANGELOG.md` bằng lời thường cho mỗi thay đổi người dùng cảm nhận được.',
    '5. Chạy kiểm tra phù hợp (check_script, lint) rồi báo lại: góp ý nào đã sửa ở đâu, góp ý nào không sửa và vì sao.',
    target ? `Dự kiến phát hành trong bản ${target}.` : '',
    '',
    'Các gói:'
  ]
  for (const it of items) {
    out.push(
      `- \`${it.dir}\` — ${it.title} (${it.subject}${it.lop ? ` ${it.lop}` : ''}), ${spotLabel(it.spot) || 'không rõ chỗ'}: "${it.desc.replace(/\s+/g, ' ').slice(0, 300)}"`
    )
  }
  return out.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n')
}

/** Tieu de ngan cua gop y: cau dau cua mo ta, toi da `max` ky tu. */
export function headline(desc: string, max = 60): string {
  const first =
    desc
      .trim()
      .split(/(?<=[.!?…])\s|\n/)[0]
      ?.trim() ?? ''
  const t = first.replace(/[.!?…]+$/, '')
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

/** Ten lan sua mac dinh tu cac tieu de: "A và B", nhieu hon thi "A và N góp ý khác". */
export function batchName(heads: string[]): string {
  if (heads.length <= 2) return heads.join(' và ')
  return `${heads[0]} và ${heads.length - 1} góp ý khác`
}

/** Ban se phat hanh tiep theo: ban moi nhat + 1. */
export function nextVersion(latest?: string): string | undefined {
  const n = Number(latest)
  return Number.isFinite(n) && latest ? String(n + 1) : undefined
}
