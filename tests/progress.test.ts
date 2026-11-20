import { afterAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { countLockPackages, gitTransfer, remotionDownload } from '../src/main/services/rules'
import { canWriteTo, ensureDir } from '../src/main/services/fs-util'

describe('doc tien trinh tai', () => {
  it('so MB va toc do tu git', () => {
    expect(gitTransfer('Receiving objects:  45% (900/2000), 12.30 MiB | 2.10 MiB/s')).toEqual({
      mb: 12.3,
      speedMbps: 2.1
    })
    expect(gitTransfer('Receiving objects:  10% (200/2000), 512.00 KiB | 1.00 MiB/s')).toEqual({
      mb: 0.5,
      speedMbps: 1
    })
    expect(gitTransfer('Resolving deltas: 100% (900/900), done.')).toBeNull()
  })
  it('trinh duyet cua Remotion', () => {
    expect(remotionDownload('Getting Chrome Headless Shell - 44.7 Mb/89.4 Mb')).toEqual({
      done: 44.7,
      total: 89.4,
      pct: 50
    })
    expect(remotionDownload('Downloading browser 37%')).toEqual({ pct: 37 })
    expect(remotionDownload('Has browser at D:\\x')).toBeNull()
  })
  it('chi dem goi bat buoc', () => {
    const lock = JSON.stringify({
      packages: {
        '': {},
        'node_modules/react': { version: '1' },
        'node_modules/@rspack/binding-darwin-arm64': { version: '1', optional: true }
      }
    })
    expect(countLockPackages(lock)).toBe(1)
  })
})

describe('thu muc', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), '9study-fs-'))
  afterAll(() => rmSync(tmp, { recursive: true, force: true }))

  it('khong loi khi thu muc la goc o dia (mkdir goc o bao EPERM tren Windows)', () => {
    expect(() => ensureDir(path.parse(tmp).root)).not.toThrow()
  })
  it('ghi thu duoc vao thu muc thuong, tao thu muc con neu chua co', () => {
    const sub = path.join(tmp, 'a', 'b')
    expect(canWriteTo(sub)).toBe(true)
    expect(existsSync(sub)).toBe(true)
  })
})
