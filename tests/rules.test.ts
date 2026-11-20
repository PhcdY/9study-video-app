import { describe, expect, it } from 'vitest'
import {
  countLockPackages,
  gitCloneProgress,
  isNpmFetchLine,
  latestNumericTag,
  looksLikeNetworkError,
  validateProjectDir
} from '../src/main/services/rules'
import { maskKey, parseEnv, setEnvValues } from '../src/main/services/env-file'
import { redact } from '../src/main/redact'
import { quoteCmdArg, splitLines } from '../src/main/services/process'

describe('validateProjectDir', () => {
  it('nhan thu muc mac dinh', () => {
    expect(validateProjectDir('D:\\9Study\\VideoAI')).toBeNull()
    expect(validateProjectDir('C:/9Study/VideoAI/')).toBeNull()
  })
  it('chan dau, dau cach, OneDrive, thu muc he thong', () => {
    expect(validateProjectDir('D:\\Video AI')).toBe('thuMucCoDauCach')
    expect(validateProjectDir('D:\\Tài liệu\\Video')).toBe('thuMucCoDau')
    expect(validateProjectDir('C:\\Users\\ctv\\OneDrive\\Video')).toBe('thuMucOneDrive')
    expect(validateProjectDir('D:\\')).toBe('thuMucHeThong')
    expect(validateProjectDir('C:\\Windows\\Video')).toBe('thuMucHeThong')
    expect(validateProjectDir('C:\\Program Files\\Video')).toBe('thuMucCoDauCach')
    expect(validateProjectDir('\\\\server\\share\\video')).toBe('thuMucHeThong')
  })
})

describe('latestNumericTag', () => {
  it('chon tag so lon nhat, bo tag khong phai so', () => {
    expect(latestNumericTag(['2', '3', 'v1.0.0', '10', 'old/x'])).toBe('10')
    expect(latestNumericTag(['v1.0.0'])).toBeNull()
  })
})

describe('gitCloneProgress', () => {
  it('doi dong tien trinh ra phan tram chung', () => {
    expect(gitCloneProgress('Receiving objects:   0% (1/2000)')).toBe(10)
    expect(gitCloneProgress('Receiving objects:  50% (1000/2000), 3.20 MiB | 2 MiB/s')).toBe(50)
    expect(gitCloneProgress('Resolving deltas: 100% (900/900), done.')).toBe(100)
    expect(gitCloneProgress("Cloning into 'D:\\9Study\\VideoAI'...")).toBeNull()
  })
})

describe('npm', () => {
  it('dem goi trong package-lock', () => {
    const lock = JSON.stringify({
      packages: { '': {}, 'node_modules/a': {}, 'node_modules/b/node_modules/c': {} }
    })
    expect(countLockPackages(lock)).toBe(2)
    expect(countLockPackages('khong phai json')).toBe(0)
  })
  it('nhan dong tai goi', () => {
    expect(
      isNpmFetchLine(
        'npm http fetch GET 200 https://registry.npmjs.org/react/-/react-19.2.3.tgz 120ms'
      )
    ).toBe(true)
    expect(isNpmFetchLine('npm http fetch GET 200 https://registry.npmjs.org/react 120ms')).toBe(
      false
    )
  })
  it('nhan loi mang', () => {
    expect(looksLikeNetworkError(['npm error code ENOTFOUND'])).toBe(true)
    expect(
      looksLikeNetworkError([
        "fatal: unable to access 'https://github.com/x': Could not resolve host"
      ])
    ).toBe(true)
    expect(looksLikeNetworkError(['npm error code ERESOLVE'])).toBe(false)
  })
})

describe('.env', () => {
  it('doc dong co dau ngoac va chu thich', () => {
    const m = parseEnv('# ghi chu\nVIVIBE_API_KEY="abc"\nOUTPUT_DIR=G:\\My Drive\\9Study Video\r\n')
    expect(m.get('VIVIBE_API_KEY')).toBe('abc')
    expect(m.get('OUTPUT_DIR')).toBe('G:\\My Drive\\9Study Video')
  })
  it('giu dong cu, thay tai cho, them cuoi, giu kieu xuong dong', () => {
    const before = '# ghi chu\r\nFOO=1\r\nVIVIBE_API_KEY=old\r\n'
    expect(setEnvValues(before, { VIVIBE_API_KEY: 'new', OUTPUT_DIR: 'D:\\X' })).toBe(
      '# ghi chu\r\nFOO=1\r\nVIVIBE_API_KEY=new\r\nOUTPUT_DIR=D:\\X\r\n'
    )
    expect(setEnvValues('', { A: '1' })).toBe('A=1\n')
  })
  it('che key', () => {
    expect(maskKey('vb_1234567890abcd')).toBe('vb_1••••abcd')
    expect(maskKey('short')).toBe('••••')
  })
})

describe('redact', () => {
  it('khong de key va token lot vao log', () => {
    expect(redact('VIVIBE_API_KEY=vb_secret_value_123')).toBe('VIVIBE_API_KEY=***')
    expect(redact('{"access_token":"abc.def"}')).toBe('{"access_token":"***"}')
    expect(redact('https://auth.openai.com/cb?code=XYZ&state=abc')).toBe(
      'https://auth.openai.com/cb?code=***&state=***'
    )
    expect(redact('loi: key vb_mysecretkey sai', ['vb_mysecretkey'])).toBe('loi: key *** sai')
  })
})

describe('tien trinh', () => {
  it('trich tham so cho cmd', () => {
    expect(quoteCmdArg('ci')).toBe('ci')
    expect(quoteCmdArg('--loglevel=http')).toBe('--loglevel=http')
    expect(quoteCmdArg('D:\\a b\\c')).toBe('"D:\\a b\\c"')
  })
  it('tach dong ca \\r cua git', () => {
    expect(splitLines('a\r\nb\rc\nd')).toEqual({ lines: ['a', 'b', 'c'], rest: 'd' })
  })
})
