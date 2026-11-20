// Moc 0 - tai Node portable, Python embeddable, git (dugite) vao spikes/output/runtimes
// va tao thu muc bin/ voi py.cmd. Ban that se nam o scripts/fetch-runtimes.mjs cua app.
//
//   node fetch-runtimes.mjs
//
// Ket qua:
//   output/runtimes/node/      node.exe, npm.cmd, npx.cmd
//   output/runtimes/python/    python.exe (embeddable, chi thu vien chuan)
//   output/runtimes/git/       cmd/git.exe (lay tu goi dugite)
//   output/runtimes/bin/       py.cmd, python3.cmd  (dung dau PATH)

import { mkdirSync, existsSync, writeFileSync, rmSync, readdirSync, renameSync, cpSync, createWriteStream } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NODE_VERSION = '22.23.5';
const PYTHON_VERSION = '3.12.10';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'output/runtimes');
const dl = path.join(here, 'output/downloads');
mkdirSync(root, { recursive: true });
mkdirSync(dl, { recursive: true });

async function download(url, file) {
  if (existsSync(file)) return file;
  console.log('tai', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file + '.part'));
  renameSync(file + '.part', file);
  return file;
}

function unzip(zip, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // tar cua Windows (bsdtar, doc duoc zip). tar cua Git Bash hieu `D:` la may tu xa.
  execFileSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-xf', zip, '-C', dest]);
}

// Node: zip co 1 thu muc con node-vX-win-x64, keo noi dung ra ngoai
const nodeName = `node-v${NODE_VERSION}-win-x64`;
const nodeZip = await download(`https://nodejs.org/dist/v${NODE_VERSION}/${nodeName}.zip`, path.join(dl, `${nodeName}.zip`));
unzip(nodeZip, path.join(root, '_node'));
rmSync(path.join(root, 'node'), { recursive: true, force: true });
renameSync(path.join(root, '_node', nodeName), path.join(root, 'node'));
rmSync(path.join(root, '_node'), { recursive: true, force: true });

// Python embeddable
const pyZip = await download(
  `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`,
  path.join(dl, `python-${PYTHON_VERSION}-embed-amd64.zip`),
);
unzip(pyZip, path.join(root, 'python'));

// git: lay tu dugite (da cai trong spikes/node_modules)
const dugiteGit = path.join(here, 'node_modules/dugite/git');
if (!existsSync(dugiteGit)) throw new Error('chua cai dugite: npm i dugite trong spikes/');
rmSync(path.join(root, 'git'), { recursive: true, force: true });
cpSync(dugiteGit, path.join(root, 'git'), { recursive: true });

// bin/: shim. %~dp0 = thu muc chua file .cmd
const bin = path.join(root, 'bin');
mkdirSync(bin, { recursive: true });
const shim = '@echo off\r\n"%~dp0..\\python\\python.exe" %*\r\n';
writeFileSync(path.join(bin, 'py.cmd'), shim);
writeFileSync(path.join(bin, 'python3.cmd'), shim);

console.log('xong:', readdirSync(root).join(', '));
