import { afterAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  findVideoRepos,
  isVideoRepoConfig,
  librariesInstalled,
  lockSatisfied,
  renderBrowserInstalled
} from '../src/main/services/detect'
import { validateProjectDir } from '../src/main/services/rules'

const tmp = mkdtempSync(path.join(os.tmpdir(), '9study-detect-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

function fakeRepo(dir: string, url: string): void {
  mkdirSync(path.join(dir, '.git'), { recursive: true })
  writeFileSync(path.join(dir, '.git', 'config'), `[remote "origin"]\n\turl = ${url}\n`)
  writeFileSync(path.join(dir, 'package.json'), '{}')
}

describe('nhan ra bo cong cu', () => {
  it('doc dung url cua repo video', () => {
    expect(isVideoRepoConfig('\turl = https://github.com/PhcdY/remotion_claudecode.git')).toBe(true)
    expect(isVideoRepoConfig('\turl = https://github.com/PhcdY/remotion_claudecode')).toBe(true)
    expect(isVideoRepoConfig('\turl = git@github.com:PhcdY/remotion_claudecode.git')).toBe(true)
    expect(isVideoRepoConfig('\turl = https://github.com/PhcdY/remotion_claudecode_khac.git')).toBe(
      false
    )
    expect(isVideoRepoConfig('\turl = https://github.com/ai-do/repo-khac.git')).toBe(false)
  })

  it('tim repo sau 2 cap, bo repo khac va node_modules', () => {
    fakeRepo(path.join(tmp, 'Video AI'), 'https://github.com/PhcdY/remotion_claudecode.git')
    fakeRepo(
      path.join(tmp, '9Study', 'VideoAI'),
      'https://github.com/PhcdY/remotion_claudecode.git'
    )
    fakeRepo(path.join(tmp, 'khac'), 'https://github.com/ai-do/repo-khac.git')
    fakeRepo(
      path.join(tmp, 'node_modules', 'x'),
      'https://github.com/PhcdY/remotion_claudecode.git'
    )
    fakeRepo(
      path.join(tmp, 'a', 'b', 'qua-sau'),
      'https://github.com/PhcdY/remotion_claudecode.git'
    )
    const found = findVideoRepos([tmp], 2)
      .map((p) => path.relative(tmp, p))
      .sort()
    expect(found).toEqual([path.join('9Study', 'VideoAI'), 'Video AI'])
  })

  it('bo co san duoc phep co dau cach, thu muc moi thi khong', () => {
    expect(validateProjectDir('D:\\Video AI', { existing: true })).toBeNull()
    expect(validateProjectDir('D:\\Video AI')).toBe('thuMucCoDauCach')
    expect(validateProjectDir('D:\\Tài liệu\\Video', { existing: true })).toBe('thuMucCoDau')
  })
})

describe('nhan ra thu vien da cai', () => {
  const lock = JSON.stringify({
    packages: {
      '': { name: 'x' },
      'node_modules/react': { version: '19.2.3' },
      'node_modules/@rspack/binding-darwin-arm64': { version: '1.0.0', optional: true }
    }
  })
  it('khop phien ban, bo goi tuy chon cua may khac', () => {
    const installed = JSON.stringify({ packages: { 'node_modules/react': { version: '19.2.3' } } })
    expect(lockSatisfied(lock, installed)).toBe(true)
  })
  it('lech phien ban hoac thieu goi thi phai cai lai', () => {
    expect(
      lockSatisfied(
        lock,
        JSON.stringify({ packages: { 'node_modules/react': { version: '19.0.0' } } })
      )
    ).toBe(false)
    expect(lockSatisfied(lock, JSON.stringify({ packages: {} }))).toBe(false)
    expect(lockSatisfied(lock, 'hong')).toBe(false)
  })
  it('doc tu thu muc that', () => {
    const dir = path.join(tmp, 'cai')
    mkdirSync(path.join(dir, 'node_modules', '.remotion', 'chrome-headless-shell', 'win64'), {
      recursive: true
    })
    writeFileSync(path.join(dir, 'package-lock.json'), lock)
    expect(librariesInstalled(dir)).toBe(false)
    writeFileSync(
      path.join(dir, 'node_modules', '.package-lock.json'),
      JSON.stringify({ packages: { 'node_modules/react': { version: '19.2.3' } } })
    )
    expect(librariesInstalled(dir)).toBe(true)
    expect(renderBrowserInstalled(dir)).toBe(true)
    expect(renderBrowserInstalled(tmp)).toBe(false)
  })
})
