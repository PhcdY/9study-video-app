import { describe, expect, it } from 'vitest'
import {
  lineId,
  lineLabels,
  splitPicks,
  togglePick,
  withPicks,
  type Pick
} from '../src/shared/picks'

const a: Pick = { kind: 'hinh', id: 'b02-l01', label: 'Cảnh 2 · câu 1', speak: 'Lên rồi\nxuống.' }
const b: Pick = { kind: 'giong', id: 'b01-l02', label: 'Cảnh 1 · câu 2', speak: 'Mạnh hơn?' }

describe('ten cau', () => {
  it('ghep ma cau giong ten file anh / mp3', () => {
    expect(lineId('b02', 0)).toBe('b02-l01')
    expect(lineId('b10', 11)).toBe('b10-l12')
  })
  it('dem cau lien tuc trong ca canh (canh nhieu beat khong trung ten), thieu canh thi dung ma beat', () => {
    const m = lineLabels([
      { id: 'b01', scene: 1, lines: [{}, {}] },
      { id: 'b02', scene: 2, lines: [{}, {}] },
      { id: 'b03', scene: 2, lines: [{}] },
      { id: 'b04', lines: [{}, {}, {}] }
    ])
    expect(m.get('b01-l02')).toBe('Cảnh 1 · câu 2')
    expect(m.get('b02-l01')).toBe('Cảnh 2 · câu 1')
    expect(m.get('b03-l01')).toBe('Cảnh 2 · câu 3')
    expect(m.get('b04-l03')).toBe('b04 · câu 3')
  })
})

describe('togglePick', () => {
  it('bam them cau moi thi giu cac cau da chon', () => {
    expect(togglePick([], a)).toEqual([a])
    expect(togglePick([a], b)).toEqual([a, b])
  })
  it('bam lai cau dang chon thi chi bo cau do', () => {
    expect(togglePick([a], a)).toEqual([])
    expect(togglePick([a, b], a)).toEqual([b])
  })
  it('cung ma nhung khac loai (hinh / giong) la hai cau khac nhau', () => {
    const giong: Pick = { ...a, kind: 'giong' }
    expect(togglePick([a], giong)).toEqual([a, giong])
  })
})

describe('withPicks / splitPicks', () => {
  it('khong chon gi thi giu nguyen loi nhan', () => {
    expect(withPicks('xin chào', [])).toBe('xin chào')
    expect(splitPicks('xin chào')).toEqual({ text: 'xin chào', picks: [] })
  })
  it('gan ma cau, loi doc, huong dan cho AI; tach lai dung loi nguoi dung va the', () => {
    const msg = withPicks('đẩy nhãn ra xa\nchút nữa', [a, b])
    expect(msg).toContain('- hình b02-l01 (Cảnh 2 · câu 1) · lời: "Lên rồi xuống."')
    expect(msg).toContain('- giọng b01-l02 (Cảnh 1 · câu 2)')
    expect(msg).toContain('Câu "hình"')
    expect(msg).toContain('Câu "giọng"')
    expect(splitPicks(msg)).toEqual({
      text: 'đẩy nhãn ra xa\nchút nữa',
      picks: [
        { kind: 'hinh', label: 'Cảnh 2 · câu 1' },
        { kind: 'giong', label: 'Cảnh 1 · câu 2' }
      ]
    })
  })
  it('chon nhieu cau thi dan AI sua dung loi tung cau, chon mot cau thi khong', () => {
    expect(withPicks('sửa', [a, b])).toContain('lỗi riêng cho từng câu')
    expect(withPicks('sửa', [a])).not.toContain('lỗi riêng cho từng câu')
  })
  it('chi co hinh thi khong nhac tao giong', () => {
    const msg = withPicks('to hơn', [{ ...a, image: 'D:\\out\\b02-l01.png' }])
    expect(msg).toContain('ảnh: D:\\out\\b02-l01.png')
    expect(msg).not.toContain('Câu "giọng"')
  })
})
