import { describe, expect, it } from 'vitest'
import { parseVoiceRun, summarize, type VoiceRun } from '../src/shared/vivibe'

const OUT = 'Giọng chính: nam · tốc độ: 1.0 · 12 dòng cần tạo · tổng 1840 ký tự (nam: 1840 ký tự)'

describe('parseVoiceRun', () => {
  it('doc slug va so ky tu tu lan tao that', () => {
    expect(
      parseVoiceRun('py scripts/vivibe_tts.py src/videos/mat-phang/script.json --voice x', OUT)
    ).toEqual({ slug: 'mat-phang', audioDir: undefined, lines: 12, chars: 1840 })
  })
  it('bo qua che do uoc tinh va lan khong tao cau nao', () => {
    expect(parseVoiceRun('py scripts/vivibe_tts.py a/script.json --estimate', OUT)).toBeNull()
    expect(
      parseVoiceRun(
        'py scripts/vivibe_tts.py src/videos/a/script.json',
        '0 dòng cần tạo · tổng 0 ký tự'
      )
    ).toBeNull()
    expect(parseVoiceRun('npm run build', OUT)).toBeNull()
  })
  it('doc --audio-dir', () => {
    expect(
      parseVoiceRun('py scripts/vivibe_tts.py src\\videos\\a\\script.json --audio-dir a-nu', OUT)
    ).toMatchObject({ slug: 'a', audioDir: 'a-nu' })
  })
})

describe('summarize', () => {
  const at = (d: string): number => new Date(d).getTime()
  const runs: VoiceRun[] = [
    { at: at('2026-11-02T10:00'), projectDir: 'D', slug: 'a', lines: 10, chars: 1000 },
    { at: at('2026-11-10T10:00'), projectDir: 'D', slug: 'a', lines: 2, chars: 200 },
    { at: at('2026-11-12T10:00'), projectDir: 'D', slug: 'b', lines: 5, chars: 500 },
    { at: at('2026-10-20T10:00'), projectDir: 'D', slug: 'c', lines: 3, chars: 300 }
  ]
  const used = (slug: string): { chars: number; exists: boolean } =>
    slug === 'a' ? { chars: 1050, exists: true } : { chars: 0, exists: false }
  it('chia dang dung / khong dung, video da bo tinh het la khong dung', () => {
    const s = summarize(runs, '2026-11', used, (x) => x.toUpperCase())
    expect(s.sent).toBe(1700)
    expect(s.used).toBe(1050)
    expect(s.unused).toBe(650)
    expect(s.prevSent).toBe(300)
    expect(s.months).toEqual(['2026-11', '2026-10'])
    expect(s.videos.map((v) => [v.title, v.runs, v.dropped])).toEqual([
      ['A', 2, false],
      ['B', 1, true]
    ])
  })
})
