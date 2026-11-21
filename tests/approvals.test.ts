import { describe, expect, it, vi } from 'vitest'

// approvals.ts goi Python dong goi de uoc tinh; bai thu chi can cac ham thuan
vi.mock('../src/main/services/runtime', () => ({ childEnv: () => ({}), exe: {} }))
vi.mock('../src/main/services/process', () => ({ run: vi.fn() }))

const { approvalKey, describeApproval } = await import('../src/main/services/codex/approvals')

const PS = '"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '
const key = (cmd: string, reason?: string): string | null =>
  approvalKey(describeApproval(PS + `'${cmd}'`, reason), PS + `'${cmd}'`)

describe('approvalKey', () => {
  it('cung cong cu, khac tham so: cung mot loai viec (bao loi Minh Tri 22/11)', () => {
    const a = key('py scripts/vivibe_tts.py src/videos/a/script.json --estimate --lines b01')
    const b = key('py scripts/vivibe_tts.py --list-voices')
    const c = key('py scripts/vivibe_tts.py src/videos/a/script.json --estimate --lines b05,b06')
    expect(a).toBe('congCu:taoGiong')
    expect(b).toBe(a)
    expect(c).toBe(a)
    expect(key('node scripts/check-layout.mjs a --frames 10,20')).toBe(
      key('node scripts/check-layout.mjs a --frames 300')
    )
  })

  it('viec ton credit va lenh la: luon hoi tung lan', () => {
    expect(key('py scripts/vivibe_tts.py src/videos/a/script.json')).toBeNull()
    expect(key('py scripts/vivibe_tts.py src/videos/a/script.json --only b01')).toBeNull()
    expect(key('Remove-Item -Recurse out')).toBeNull()
  })

  it('cong cu khac nhau khong dung chung quyen', () => {
    expect(key('node scripts/check-layout.mjs a')).not.toBe(key('node scripts/storyboard.mjs a'))
    expect(key('git switch main')).toBe('doiBan:switch')
    expect(key('git reset --hard')).toBe('doiBan:reset')
  })

  it('lenh can mang: theo chuong trinh va script', () => {
    expect(key('py scripts/fetch.py a', 'Cần mạng')).toBe('mang:py scripts/fetch.py')
    expect(key('py scripts/fetch.py b', 'Cần mạng')).toBe('mang:py scripts/fetch.py')
    expect(key('py scripts/other.py b', 'Cần mạng')).not.toBe('mang:py scripts/fetch.py')
  })
})
