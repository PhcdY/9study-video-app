import { describe, expect, it } from 'vitest'
import { releaseNoteLines } from '../src/shared/app'

describe('releaseNoteLines', () => {
  it('lay dong <li> tu HTML cua GitHub, bo the va giai ma ky tu', () => {
    const html =
      '<p><strong>Có gì mới</strong></p>\n<ul>\n<li>Trang <strong>Hướng dẫn</strong> mới.</li>\n<li>Gửi báo lỗi &amp; ảnh &quot;tự chụp&quot;.</li>\n</ul>'
    expect(releaseNoteLines(html)).toEqual(['Trang Hướng dẫn mới.', 'Gửi báo lỗi & ảnh "tự chụp".'])
  })
  it('doc Markdown gach dau dong', () => {
    expect(
      releaseNoteLines('**Có gì mới**\n- Một **đậm**.\r\n* Hai `mã`.\nkhông phải dòng')
    ).toEqual(['Một đậm.', 'Hai mã.'])
  })
  it('mang ghi chu va rong', () => {
    expect(releaseNoteLines([{ version: '1', note: '<li>A</li>' }])).toEqual(['A'])
    expect(releaseNoteLines(null)).toEqual([])
  })
})
