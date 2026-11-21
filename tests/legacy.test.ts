import { describe, expect, it } from 'vitest'
import {
  chatTitle,
  claudeProjectName,
  guessSlug,
  isHumanText,
  sameDir,
  voiceRunOf
} from '../src/shared/legacy'

describe('du lieu cu', () => {
  it('ten thu muc Claude Code', () => {
    expect(claudeProjectName('D:\\Video AI')).toBe('D--Video-AI')
    expect(claudeProjectName('D:\\9study-video-app\\')).toBe('D--9study-video-app')
  })
  it('so sanh duong dan', () => {
    expect(sameDir('file:///D:/Video%20AI', 'd:\\video ai\\')).toBe(true)
    expect(sameDir('D:\\Video AI', 'D:\\test\\Video AI')).toBe(false)
  })
  it('doan video nhac toi nhieu nhat', () => {
    const slugs = new Set(['tiem-can', 'don-dieu'])
    expect(
      guessSlug(
        [
          'sua src/videos/tiem-can/script.json',
          'xem videos\\tiem-can',
          'src/videos/don-dieu',
          'src/videos/khac/x'
        ],
        slugs
      )
    ).toBe('tiem-can')
    expect(guessSlug(['không nhắc gì'], slugs)).toBeUndefined()
  })
  it('lan tao giong dang cu va dang moi', () => {
    const cmd = 'python scripts/vivibe_tts.py src/videos/don-dieu/script.json --voice "x"'
    expect(
      voiceRunOf(cmd, '1 dòng cần tạo · 38 ký tự (≈ 38 credit)\n✓ b06-l03.mp3\n\nTạo mới 1, lỗi 0')
    ).toEqual({ slug: 'don-dieu', audioDir: undefined, lines: 1, chars: 38 })
    expect(voiceRunOf(cmd, '2 dòng cần tạo · 90 ký tự\nTạo mới 0, lỗi 2')).toBeNull()
    expect(voiceRunOf(`${cmd} --estimate`, '1 dòng cần tạo · 38 ký tự')).toBeNull()
    expect(voiceRunOf(cmd, '3 dòng cần tạo · tổng 120 ký tự (Minh Anh)')?.chars).toBe(120)
  })
  it('loc chu nguoi dung that', () => {
    expect(isHumanText('<system-reminder>abc')).toBe(false)
    expect(isHumanText('  ')).toBe(false)
    expect(isHumanText('cảnh 3 nói ngắn lại')).toBe(true)
  })
  it('tieu de ngan', () => {
    expect(chatTitle('a'.repeat(100), 10)).toBe('aaaaaaaaa…')
  })
})
