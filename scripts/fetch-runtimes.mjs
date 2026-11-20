// Tai va gom cac runtime di kem ban cai vao resources/runtimes/ (khong commit).
// Chay tu dong trong `npm run build:win`; chay tay: `npm run fetch-runtimes`.
//
// Ket qua:
//   resources/runtimes/node/     Node portable (node.exe, npm.cmd, npx.cmd)
//   resources/runtimes/python/   Python embeddable (chi thu vien chuan, du cho script cua repo video)
//   resources/runtimes/git/      git cua dugite (cmd/git.exe)
//   resources/runtimes/codex/    codex.exe va file di kem, ghim theo @openai/codex trong package.json
//   resources/runtimes/bin/      py.cmd, python3.cmd (dung dau PATH cua moi tien trinh con)

import {
  mkdirSync,
  existsSync,
  writeFileSync,
  rmSync,
  renameSync,
  cpSync,
  createWriteStream,
  readFileSync
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NODE_VERSION = '22.23.5'
// 3.12.10 la ban 3.12 cuoi con ban embeddable (3.12.11+ chi va bao mat, khong co file cai)
const PYTHON_VERSION = '3.12.10'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.join(appRoot, 'resources/runtimes')
const dl = path.join(appRoot, '.cache/downloads')
mkdirSync(root, { recursive: true })
mkdirSync(dl, { recursive: true })

async function download(url, file) {
  if (existsSync(file)) return file
  console.log('tai', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file + '.part'))
  renameSync(file + '.part', file)
  return file
}

function unzip(zip, dest) {
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  // tar cua Windows (bsdtar doc duoc zip). tar cua Git Bash hieu `D:` la may tu xa.
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
  execFileSync(tar, ['-xf', zip, '-C', dest])
}

function stamp(dir, version) {
  writeFileSync(path.join(dir, '.version'), version)
}
function hasVersion(dir, version) {
  const f = path.join(dir, '.version')
  return existsSync(f) && readFileSync(f, 'utf8') === version
}

// Node
const nodeDir = path.join(root, 'node')
if (!hasVersion(nodeDir, NODE_VERSION)) {
  const name = `node-v${NODE_VERSION}-win-x64`
  const zip = await download(
    `https://nodejs.org/dist/v${NODE_VERSION}/${name}.zip`,
    path.join(dl, `${name}.zip`)
  )
  unzip(zip, path.join(root, '_node'))
  rmSync(nodeDir, { recursive: true, force: true })
  renameSync(path.join(root, '_node', name), nodeDir)
  rmSync(path.join(root, '_node'), { recursive: true, force: true })
  stamp(nodeDir, NODE_VERSION)
}

// Python embeddable
const pyDir = path.join(root, 'python')
if (!hasVersion(pyDir, PYTHON_VERSION)) {
  const zip = await download(
    `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`,
    path.join(dl, `python-${PYTHON_VERSION}-embed-amd64.zip`)
  )
  unzip(zip, pyDir)
  stamp(pyDir, PYTHON_VERSION)
}

// git tu dugite
const dugitePkg = JSON.parse(
  readFileSync(path.join(appRoot, 'node_modules/dugite/package.json'), 'utf8')
)
const gitDir = path.join(root, 'git')
if (!hasVersion(gitDir, dugitePkg.version)) {
  const src = path.join(appRoot, 'node_modules/dugite/git')
  if (!existsSync(src)) throw new Error('Thieu node_modules/dugite/git: chay lai npm install')
  rmSync(gitDir, { recursive: true, force: true })
  cpSync(src, gitDir, { recursive: true })
  stamp(gitDir, dugitePkg.version)
}

// Codex: chep binary tu goi npm da ghim, bo phan giong noi (app khong dung)
const codexPkg = JSON.parse(
  readFileSync(path.join(appRoot, 'node_modules/@openai/codex/package.json'), 'utf8')
)
const codexDir = path.join(root, 'codex')
if (!hasVersion(codexDir, codexPkg.version)) {
  const src = path.join(
    appRoot,
    'node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc'
  )
  if (!existsSync(src)) throw new Error('Thieu binary Codex cho Windows: chay lai npm install')
  rmSync(codexDir, { recursive: true, force: true })
  cpSync(src, codexDir, {
    recursive: true,
    filter: (p) => !p.includes(`${path.sep}voice`)
  })
  stamp(codexDir, codexPkg.version)
}

// bin/: shim. %~dp0 = thu muc chua file .cmd
const bin = path.join(root, 'bin')
mkdirSync(bin, { recursive: true })
const shim = '@echo off\r\n"%~dp0..\\python\\python.exe" %*\r\n'
writeFileSync(path.join(bin, 'py.cmd'), shim)
writeFileSync(path.join(bin, 'python3.cmd'), shim)

console.log(
  `runtime san sang: node ${NODE_VERSION}, python ${PYTHON_VERSION}, git (dugite ${dugitePkg.version}), codex ${codexPkg.version}`
)
