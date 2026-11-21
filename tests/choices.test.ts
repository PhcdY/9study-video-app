import { describe, expect, it } from 'vitest'
import { findChoices } from '../src/shared/choices'

describe('findChoices', () => {
  it('doc cau hoi roi danh sach danh so o cuoi tin nhan', () => {
    const q = findChoices(
      [
        'Kịch bản 6 cảnh đã xong.',
        '',
        'Bạn muốn mở đầu kiểu nào?',
        '1. **Câu đố** — hỏi học sinh vì sao nhiệt kế dâng',
        '2. **Kể chuyện** — đo nhiệt độ khi bị sốt',
        '3. Vào thẳng định nghĩa'
      ].join('\n')
    )
    expect(q?.question).toBe('Bạn muốn mở đầu kiểu nào?')
    expect(q?.options).toEqual([
      { key: '1', label: 'Câu đố', detail: 'hỏi học sinh vì sao nhiệt kế dâng' },
      { key: '2', label: 'Kể chuyện', detail: 'đo nhiệt độ khi bị sốt' },
      { key: '3', label: 'Vào thẳng định nghĩa' }
    ])
  })

  it('doc danh sach roi cau hoi o dong cuoi, ca gach dau dong va A. B.', () => {
    const q = findChoices(
      'Có hai giọng hợp:\n\n- nam - c Bình\n- nữ - c Nhi\n\nBạn chọn giọng nào?'
    )
    expect(q?.question).toBe('Bạn chọn giọng nào?')
    expect(q?.options.map((o) => [o.key, o.label])).toEqual([
      ['1', 'nam - c Bình'],
      ['2', 'nữ - c Nhi']
    ])
    const ab = findChoices('Bạn muốn sửa cảnh nào trước?\nA. Cảnh 2\nB. Cảnh 5')
    expect(ab?.options.map((o) => o.key)).toEqual(['A', 'B'])
  })

  it('nhan cau mo dau bang dau hai cham neu co tu "chon"', () => {
    const q = findChoices('Bạn chọn một trong các cách sau:\n1. Giữ nguyên\n2. Rút ngắn')
    expect(q?.question).toBe('Bạn chọn một trong các cách sau')
  })

  it('cau hoi co/khong khong co danh sach', () => {
    const q = findChoices('Storyboard đã xuất xong. Bạn xem rồi duyệt giúp mình được không?')
    expect(q).toEqual({
      question: 'Storyboard đã xuất xong. Bạn xem rồi duyệt giúp mình được không?',
      options: [],
      yesNo: true
    })
  })

  it('bo qua tin nhan khong hoi gi', () => {
    // Danh sach tong ket, khong co cau hoi
    expect(findChoices('Mình đã làm:\n1. Sửa cảnh 2\n2. Xuất lại storyboard')).toBeNull()
    // Cau hoi mo, khong co lua chon
    expect(findChoices('Bạn muốn đổi gì ở cảnh 3?')).toBeNull()
    // Danh sach o giua, sau do con doan khac
    expect(findChoices('Bạn chọn nào?\n1. A\n2. B\n\nMình sẽ làm sau khi bạn chọn.')).toBeNull()
    // Danh so khong lien nhau (danh sach dai bi cat)
    expect(findChoices('Bạn chọn bước nào?\n4. Xuất\n5. Kiểm tra')).toBeNull()
    // Chi mot lua chon
    expect(findChoices('Bạn chọn gì?\n1. Xuất video')).toBeNull()
    expect(findChoices('')).toBeNull()
  })

  it('bo qua danh sach con thut vao', () => {
    expect(findChoices('Bạn chọn cách nào?\n1. Cách một\n   - chi tiết\n   - chi tiết')).toBeNull()
  })
})
