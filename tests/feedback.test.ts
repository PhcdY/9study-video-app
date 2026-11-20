import { describe, expect, it } from 'vitest'
import {
  batchName,
  branchName,
  headline,
  nextVersion,
  fixPrompt,
  guessTarget,
  lineAt,
  mmss,
  packageFolderName,
  slugify,
  spotLabel
} from '../src/shared/feedback-rules'
import type { FeedbackItem } from '../src/shared/feedback'

describe('gop y', () => {
  const lines = [
    { beat: 'b01', line: 1, start: 0, end: 3.8 },
    { beat: 'b01', line: 2, start: 4.1, end: 12 },
    { beat: 'b02', line: 1, start: 12.6, end: 20 }
  ]
  it('tra giay ra cau dang doc', () => {
    expect(lineAt(lines, 5)?.line).toBe(2)
    expect(lineAt(lines, 12.7)?.beat).toBe('b02')
    expect(lineAt(lines, 0)?.beat).toBe('b01')
    expect(lineAt([], 3)).toBeNull()
    expect(mmss(83.6)).toBe('1:23')
  })
  it('ten nhanh theo quy uoc [mon]_fix_[mo-ta]', () => {
    expect(slugify('Nhãn đè đường cong')).toBe('nhan-de-duong-cong')
    expect(branchName(['toan'], 'Nhãn đè đường cong')).toBe('toan_fix_nhan-de-duong-cong')
    expect(branchName(['toan', 'hoa'], 'Đọc tên chất')).toBe('all_fix_doc-ten-chat')
  })
  it('doan cho sua theo loai loi va mon', () => {
    expect(guessTarget('giong', 'hoa')).toBe('scripts/phonetic_dict.json')
    expect(guessTarget('hinh', 'van')).toBe('.agents/mon/van.md')
    expect(guessTarget('hinh', 'toan')).toBe('.agents/skills/dung-video')
  })
  it('ten thu muc goi va nhan cho loi', () => {
    expect(packageFolderName(new Date(2026, 10, 21, 9, 5), 'Lan Anh', 'don-dieu')).toBe(
      '20261121-0905-lan-anh-don-dieu'
    )
    expect(spotLabel({ beat: 'b02', line: 3 })).toBe('b02 · câu 3')
    expect(spotLabel({ time: 83, scene: 2, beat: 'b02', line: 3 })).toBe('1:23 · cảnh 2 · câu 3')
  })
  it('cau lenh sua bo cong cu co nhanh, khong sua video CTV, du cac goi', () => {
    const it1 = {
      dir: 'G:\\My Drive\\9Study_GopY\\goi-1',
      title: 'Đơn điệu',
      subject: 'toan',
      lop: 12,
      spot: { time: 83 },
      desc: 'Nhãn đè đường'
    } as FeedbackItem
    const p = fixPrompt([it1], 'toan_fix_nhan', '4')
    expect(p).toContain('`toan_fix_nhan`')
    expect(p).toContain('KHÔNG sửa video của CTV')
    expect(p).toContain('goi-1')
    expect(p).toContain('bản 4')
  })
  it('tieu de ngan, ten lan sua, ban tiep theo', () => {
    expect(headline('Nhãn "cực đại" đè lên đường cong. Video Hóa cũng bị.')).toBe(
      'Nhãn "cực đại" đè lên đường cong'
    )
    expect(headline('a'.repeat(80), 10)).toBe('aaaaaaaaa…')
    expect(batchName(['A', 'B'])).toBe('A và B')
    expect(batchName(['A', 'B', 'C'])).toBe('A và 2 góp ý khác')
    expect(nextVersion('3')).toBe('4')
    expect(nextVersion(undefined)).toBeUndefined()
  })
})
