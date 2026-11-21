import { describe, expect, it } from 'vitest'
import { composeNewVideoPrompt, parseNewVideoPrompt } from '../src/shared/prompt'

describe('parseNewVideoPrompt', () => {
  it('doc lai mon, lop, loai, ten bai tu yeu cau video bai hoc', () => {
    const text = composeNewVideoPrompt({
      subject: 'ly',
      lop: 11,
      loai: 'baiHoc',
      bai: 'Bài 3. Dao động tắt dần',
      lessonFile: 'references/ly/lop-11/bai-03.md',
      voice: 'nam - c Bình',
      exams: []
    })
    expect(parseNewVideoPrompt(text)).toEqual({
      subject: 'ly',
      lop: 11,
      loai: 'bai-hoc',
      title: 'Bài 3. Dao động tắt dần'
    })
  })
  it('video hien tuong lay cau hoi lam ten', () => {
    const text = composeNewVideoPrompt({
      subject: 'hoa',
      lop: 10,
      loai: 'hienTuong',
      bai: 'Vì sao đá vôi sủi bọt trong giấm?',
      voice: 'x',
      exams: []
    })
    expect(parseNewVideoPrompt(text)).toMatchObject({
      subject: 'hoa',
      loai: 'hien-tuong',
      title: 'Vì sao đá vôi sủi bọt trong giấm?'
    })
  })
  it('khong phai yeu cau video moi thi tra null', () => {
    expect(parseNewVideoPrompt('xin chào')).toBeNull()
  })
})
