import { describe, expect, it } from 'vitest'
import { errorLines } from '../src/shared/bugs'

describe('errorLines', () => {
  it('dem dong loi va lay vai dong loi / canh bao gan nhat, bo moc thoi gian', () => {
    const log = [
      '[2026-11-21 08:00:00.001] [info]  [chay] git status',
      '[2026-11-21 08:00:01.002] [warn]  [chat] luot loi',
      '[2026-11-21 08:00:02.003] [error] [xuat video] render loi: ENOSPC',
      '[2026-11-21 08:00:03.004] [error] [bao loi] thu lai'
    ].join('\r\n')
    const r = errorLines(log)
    expect(r.count).toBe(2)
    expect(r.last).toEqual([
      '[warn]  [chat] luot loi',
      '[error] [xuat video] render loi: ENOSPC',
      '[error] [bao loi] thu lai'
    ])
  })
  it('nhat ky sach thi khong co gi', () => {
    expect(errorLines('[2026-11-21 08:00:00.001] [info] ok')).toEqual({ count: 0, last: [] })
  })
})
