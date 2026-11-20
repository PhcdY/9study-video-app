// Ghep cau lenh gui cho tro ly AI. Dung chung main (gui di) va renderer (xem truoc). Ham thuan, co bai thu.
// Cau lenh viet tieng Viet vi skill trong repo video viet tieng Viet; skill duoc goi bang ten `$<skill>`.
import type { ChipId, NewVideoInput, SubjectId, VideoStage } from './video'

/** name: ten day du; short: ten ngan cho nut chon (theo thiet ke). */
export const SUBJECTS: { id: SubjectId; name: string; short: string }[] = [
  { id: 'toan', name: 'Toán', short: 'Toán' },
  { id: 'ly', name: 'Vật lý', short: 'Lý' },
  { id: 'hoa', name: 'Hóa học', short: 'Hóa' },
  { id: 'sinh', name: 'Sinh học', short: 'Sinh' },
  { id: 'su', name: 'Lịch sử', short: 'Sử' },
  { id: 'dia', name: 'Địa lý', short: 'Địa' },
  { id: 'van', name: 'Ngữ văn', short: 'Văn' },
  { id: 'ktpl', name: 'GDKT & PL', short: 'KTPL' },
  { id: 'anh', name: 'Tiếng Anh', short: 'Tiếng Anh' }
]

export function subjectName(id: string | undefined): string {
  return SUBJECTS.find((s) => s.id === (id ?? 'toan'))?.name ?? id ?? 'Toán'
}

/** Giong trong roster cua bo cong cu (scripts/tts_config.json) + mon hop. */
export const VOICES: { id: string; subjects: SubjectId[] }[] = [
  { id: 'nam - c Bình', subjects: ['toan', 'ly', 'hoa', 'sinh'] },
  { id: 'nữ - c Nhi', subjects: ['su', 'dia', 'van', 'ktpl'] },
  { id: 'anh-male', subjects: ['anh'] }
]

export function suggestedVoice(subject: SubjectId): string {
  return VOICES.find((v) => v.subjects.includes(subject))?.id ?? VOICES[0].id
}

export const EXAMS = ['THPTQG', 'TSA', 'HSA', 'V-ACT']

const MO_DAU: Record<NonNullable<NewVideoInput['moDau']>, string> = {
  aiChon: '',
  hienTuong: 'một hiện tượng đời thực',
  cauDeThi: 'một câu đề thi',
  hieuSai: 'một cách hiểu sai phổ biến'
}
const DO_DAI: Record<NonNullable<NewVideoInput['doDai']>, string> = {
  ai: '',
  gon: 'gọn, khoảng 2:30',
  ky: 'kỹ, khoảng 4:00'
}

const clean = (s?: string): string => (s ?? '').trim()

/** Cau lenh viet kich ban tu form Lam video moi. */
export function composeNewVideoPrompt(v: NewVideoInput): string {
  const out: string[] = ['$viet-kich-ban', 'Làm video mới với các thông tin sau.', '']
  const add = (label: string, value?: string): void => {
    if (clean(value)) out.push(`- ${label}: ${clean(value)}`)
  }
  add('Môn', `${subjectName(v.subject)} (gói môn \`${v.subject}\`), lớp ${v.lop}`)
  add(
    'Loại video',
    v.loai === 'baiHoc'
      ? 'video bài học (dạy đủ một bài SGK, "loai": "bai-hoc")'
      : 'video hiện tượng (trả lời một câu "vì sao", "loai": "hien-tuong")'
  )
  if (v.loai === 'baiHoc') {
    add('Bài', v.lessonFile ? `${clean(v.bai)} (thẻ bài học: \`${v.lessonFile}\`)` : v.bai)
  } else {
    add('Câu hỏi / hiện tượng', v.bai)
  }
  out.push(
    clean(v.yBanChat)
      ? `- Ý bản chất muốn học sinh hiểu: ${clean(v.yBanChat)}`
      : '- Ý bản chất: chưa chốt, hãy đề xuất 2–3 góc nhìn để tôi chọn.'
  )
  add(
    'Giọng đọc dự kiến (dùng ở bước tạo audio, chưa tạo bây giờ)',
    v.voice + (v.voicePerScene ? '; có đổi giọng theo nhân vật hoặc theo cảnh' : '')
  )
  if (v.exams.length) add('Kỳ thi nhắm tới (ghi vào "exams")', v.exams.join(', '))
  add('Học sinh đã học', v.daHoc)
  add('Học sinh chưa học', v.chuaHoc)
  if (clean(v.videoTruoc))
    add(
      'Video trước trong chuỗi',
      `\`src/videos/${clean(v.videoTruoc)}/script.json\` (đọc để không dạy lại và nối tiếp đúng chỗ)`
    )
  if (v.moDau && v.moDau !== 'aiChon') add('Mở đầu bằng', MO_DAU[v.moDau])
  add('Gợi ý hiện tượng / câu hỏi mở đầu', v.goiYMoDau)
  add('Ví dụ xuyên suốt muốn dùng', v.viDu)
  if (v.doDai && v.doDai !== 'ai') add('Độ dài', DO_DAI[v.doDai])
  add('Lỗi học sinh hay mắc (thành đoạn "BẪY THƯỜNG GẶP")', v.loiHayMac)
  add('Dạng bài trong đề thi muốn có (thành đoạn "TRONG ĐỀ THI")', v.dangBaiThi)
  if (v.attachments?.length)
    add('Tài liệu đính kèm (xem kèm khi viết)', v.attachments.map((a) => `\`${a}\``).join(', '))
  add('Ghi chú khác', v.ghiChu)
  out.push('', 'Bắt đầu bằng Bảng nội dung để tôi duyệt trước khi viết kịch bản.')
  return out.join('\n')
}

/** Cau lenh cho nut goi y theo buoc. */
export function chipPrompt(chip: ChipId, slug: string): string {
  switch (chip) {
    case 'duyetKichBan':
      return `$dung-video\nKịch bản \`${slug}\` đã duyệt. Dựng bản nháp (thời gian ước tính) và xuất storyboard để tôi duyệt hình (dung-video › Bước 2b). Chưa tạo giọng đọc.`
    case 'kiemKichBan':
      return `Chạy \`py scripts/check_script.py ${slug}\` rồi báo kết quả bằng lời dễ hiểu; có lỗi thì sửa và chạy lại.`
    case 'hocSinhAoKichBan':
      return `$hoc-sinh-ao\nNhờ học sinh ảo đọc thử kịch bản \`${slug}\` và báo chỗ nào khó hiểu hoặc nhảy bước.`
    case 'duyetHinh':
      return `$tao-audio\nHình của \`${slug}\` đã duyệt. Sang bước tạo giọng đọc: trước hết tạo các câu nghe thử để tôi nghe, chưa tạo cả bài.`
    case 'xuatLaiStoryboard':
      return `Xuất lại storyboard cho \`${slug}\` (bản nháp) sau các chỗ vừa sửa.`
    case 'hocSinhAoHinh':
      return `$hoc-sinh-ao\nNhờ học sinh ảo xem storyboard của \`${slug}\` và báo chỗ nào khó hiểu.`
    case 'nghiOnDungHoanChinh':
      return `$dung-video\nGiọng đọc của \`${slug}\` đã ổn. Dựng bản hoàn chỉnh theo audio thật, kiểm tra bố cục rồi xuất video.`
    case 'xuatVideo':
    case 'xuatLaiVideo':
      return `Xuất video \`${slug}\` ra thư mục thành phẩm (render + phụ đề) theo đúng hướng dẫn trong AGENTS.md.`
  }
}

/** Nut nao hien o buoc nao. Nut dau tien la nut chinh (sang buoc sau). */
export const STAGE_CHIPS: Record<VideoStage, ChipId[]> = {
  kichBan: ['duyetKichBan', 'kiemKichBan', 'hocSinhAoKichBan'],
  duyetHinh: ['duyetHinh', 'xuatLaiStoryboard', 'hocSinhAoHinh'],
  giongDoc: ['nghiOnDungHoanChinh', 'xuatVideo'],
  daXuat: ['xuatLaiVideo']
}

/** Nut lam chuyen buoc: thu gon cuoc tro chuyen truoc khi gui de tiet kiem luot. */
export const STAGE_CHANGING_CHIPS: ChipId[] = ['duyetKichBan', 'duyetHinh', 'nghiOnDungHoanChinh']
