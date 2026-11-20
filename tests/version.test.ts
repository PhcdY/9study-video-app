import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { compareVersions, isSafeToSwitch, parseChangelog } from '../src/main/services/version'

const MD = `# Nhật ký phiên bản

Giới thiệu.

## Chưa phát hành

## Bản 3 — 2026-11-17

Lời đọc nghe giống lời giảng hơn.

### Chung (mọi môn)

**Có gì mới**
- Luật **văn nói**.
- Kiểm tra kịch bản cảnh báo dấu ":".

### Tiếng Anh

**Sửa lỗi**
- Chỗ đổi giọng có fade nhẹ.

## Bản 2 — 2026-11-13

### Chung (mọi môn)

**Có gì mới**
- Chuyển sang Codex.

**Sửa lỗi**
- Ý liệt kê không chồng nhau.
`

describe('CHANGELOG', () => {
  it('tach tung ban, tom tat, nhom, co gi moi / sua loi', () => {
    const e = parseChangelog(MD)
    expect(e.map((x) => x.version)).toEqual(['3', '2'])
    expect(e[0].date).toBe('2026-11-17')
    expect(e[0].summary).toBe('Lời đọc nghe giống lời giảng hơn.')
    expect(e[0].groups[0]).toEqual({
      name: 'Chung (mọi môn)',
      moi: ['Luật **văn nói**.', 'Kiểm tra kịch bản cảnh báo dấu ":".'],
      sua: []
    })
    expect(e[0].groups[1].sua).toEqual(['Chỗ đổi giọng có fade nhẹ.'])
    expect(e[1].groups[0].sua).toEqual(['Ý liệt kê không chồng nhau.'])
  })
  const real = 'D:\\9study-video-app\\spikes\\output\\video-repo\\CHANGELOG.md'
  it.skipIf(!existsSync(real))('doc duoc CHANGELOG that cua bo cong cu', () => {
    const e = parseChangelog(readFileSync(real, 'utf8'))
    expect(e[0].version).toBe('3')
    expect(e.find((x) => x.version === '2')?.groups[0].moi.length).toBeGreaterThan(5)
  })
})

describe('doi ban an toan', () => {
  it('sach hoac chi co bai moi chua theo doi thi tu doi duoc', () => {
    expect(isSafeToSwitch([])).toBe(true)
    expect(isSafeToSwitch(['?? src/videos/bai-moi/', '?? public/audio/bai-moi/'])).toBe(true)
  })
  it('co file bo cong cu bi sua (vd Root.tsx, skill) thi nho AI', () => {
    expect(isSafeToSwitch([' M src/Root.tsx', '?? src/videos/bai-moi/'])).toBe(false)
    expect(isSafeToSwitch([' M .agents/lessons.md'])).toBe(false)
    expect(isSafeToSwitch(['?? scripts/la.py'])).toBe(false)
  })
})

describe('so sanh phien ban', () => {
  it('theo so, khong theo chu', () => {
    expect(compareVersions('0.1.10', '0.1.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0')).toBe(0)
    expect(compareVersions('0.1.2', '1.0.0')).toBeLessThan(0)
  })
})
