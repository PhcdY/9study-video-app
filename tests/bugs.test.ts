import { describe, expect, it } from 'vitest'
import { errorLines, imageExt } from '../src/shared/bugs'

describe('imageExt', () => {
  it('nhan anh theo ten file, khong phan biet hoa thuong', () => {
    expect(imageExt('Chup man hinh.PNG')).toBe('.png')
    expect(imageExt('a.jpeg')).toBe('.jpg')
    expect(imageExt('b.webp')).toBe('.webp')
  })
  it('anh dan tu clipboard: dung kieu MIME khi ten khong co duoi', () => {
    expect(imageExt('', 'image/png')).toBe('.png')
    expect(imageExt('image', 'image/jpeg')).toBe('.jpg')
  })
  it('khong phai anh thi null', () => {
    expect(imageExt('bao-cao.pdf', 'application/pdf')).toBeNull()
    expect(imageExt('x.svg', 'image/svg+xml')).toBeNull()
    expect(imageExt('noduoi')).toBeNull()
  })
})

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
