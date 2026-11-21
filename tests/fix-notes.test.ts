import { describe, expect, it } from 'vitest'
import { parseFixDiff, plainText } from '../src/shared/fix-notes'

const diff = [
  'diff --git a/CHANGELOG.md b/CHANGELOG.md',
  'index 1..2 100644',
  '--- a/CHANGELOG.md',
  '+++ b/CHANGELOG.md',
  '@@ -1,2 +1,4 @@',
  ' ## Chưa phát hành',
  '+',
  '+- Chữ dài trong **khung định nghĩa** tự xuống dòng.',
  '+- Kiểm tra bố cục báo khi chữ chạm `mép khung`.',
  'diff --git a/.agents/lessons.md b/.agents/lessons.md',
  '--- a/.agents/lessons.md',
  '+++ b/.agents/lessons.md',
  '@@ -3 +3,2 @@',
  ' - cũ',
  '+- Khung định nghĩa: đặt chiều rộng tối đa.',
  'diff --git a/.agents/skills/storyboard/khung.md b/.agents/skills/storyboard/khung.md',
  '--- a/.agents/skills/storyboard/khung.md',
  '+++ b/.agents/skills/storyboard/khung.md',
  '@@ -10,2 +10,3 @@',
  '-Khung rộng cố định 520px.',
  '+Khung rộng tối đa 560px.',
  '+Chữ dài hơn 2 dòng thì giảm cỡ chữ.'
]

describe('parseFixDiff', () => {
  it('tach file, dem dong them/bot', () => {
    const r = parseFixDiff(diff)
    expect(r.files.map((f) => [f.path, f.added, f.removed])).toEqual([
      ['.agents/skills/storyboard/khung.md', 2, 1],
      ['CHANGELOG.md', 3, 0],
      ['.agents/lessons.md', 1, 0]
    ])
    expect(r.files[0].patch[0]).toMatch(/^@@/)
  })
  it('lay dong nhat ky phien ban va bai hoc, bo dinh dang', () => {
    const r = parseFixDiff(diff)
    expect(r.changelog).toEqual([
      'Chữ dài trong khung định nghĩa tự xuống dòng.',
      'Kiểm tra bố cục báo khi chữ chạm mép khung.'
    ])
    expect(r.lessons).toEqual(['Khung định nghĩa: đặt chiều rộng tối đa.'])
  })
  it('diff rong', () => {
    expect(parseFixDiff([])).toEqual({ changelog: [], lessons: [], files: [] })
  })
  it('plainText', () => {
    expect(plainText('[Xem](http://x) **đậm** `mã`')).toBe('Xem đậm mã')
  })
})
