// Moc 0 - bat Remotion Studio (`npm run dev`) bang runtime dong goi, cho no san sang,
// mo thu trang, roi tat sach ca cay tien trinh va kiem tra cong da duoc tra.
//
//   node studio-probe.mjs [--keep 5]   (giu Studio chay N giay truoc khi tat)

import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rt = path.join(here, 'output/runtimes');
const repo = path.join(here, 'output/video-repo');
const keep = Number(process.argv[process.argv.indexOf('--keep') + 1]) || 3;
const sys = process.env.SystemRoot || 'C:\\Windows';

const env = {
  ...process.env,
  PATH: [path.join(rt, 'bin'), path.join(rt, 'node'), path.join(rt, 'python'), path.join(rt, 'git/cmd'),
    `${sys}\\System32`, sys, `${sys}\\System32\\Wbem`, `${sys}\\System32\\WindowsPowerShell\\v1.0`].join(';'),
  BROWSER: 'none', // khong cho Studio tu mo trinh duyet ngoai
};

function freePort(start = 3000) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(freePort(start + 1)));
    s.listen(start, '127.0.0.1', () => s.close(() => resolve(start)));
  });
}

function portInUse(port) {
  return new Promise((resolve) => {
    const c = net.connect(port, '127.0.0.1');
    c.once('connect', () => { c.destroy(); resolve(true); });
    c.once('error', () => resolve(false));
  });
}

function descendants(pid) {
  // danh sach tien trinh con chau qua CIM (wmic da bi bo tren Win11 moi)
  const out = execFileSync('powershell', ['-NoProfile', '-Command',
    'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress'], { encoding: 'utf8' });
  const all = JSON.parse(out);
  const res = [];
  const walk = (p) => all.filter((x) => x.ParentProcessId === p).forEach((x) => { res.push(x); walk(x.ProcessId); });
  walk(pid);
  return res;
}

const port = await freePort(3000);
const t0 = Date.now();
console.log(`bat Studio o cong ${port}...`);
// npm.cmd can shell tren Windows; khong dung `detached` de taskkill /T bat duoc ca cay
const child = spawn('npm.cmd', ['run', 'dev', '--', '--port', String(port), '--no-open'], { cwd: repo, env, shell: true, windowsHide: true });

let log = '';
const ready = new Promise((resolve, reject) => {
  const onData = (d) => {
    log += d;
    if (/localhost:\d+|Server ready|Built in/i.test(log)) resolve();
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (c) => reject(new Error(`Studio thoat som, code=${c}\n${log.slice(-800)}`)));
  setTimeout(() => reject(new Error('het gio cho Studio\n' + log.slice(-800))), 180_000);
});

try {
  await ready;
  console.log(`Studio san sang sau ${Math.round((Date.now() - t0) / 1000)}s`);
  const res = await fetch(`http://localhost:${port}/`);
  console.log(`GET / -> ${res.status}, ${(await res.text()).length} byte`);
  await new Promise((r) => setTimeout(r, keep * 1000));
} catch (e) {
  console.log('LOI:', e.message);
}

const tree = descendants(child.pid);
console.log(`cay tien trinh truoc khi tat: ${tree.length + 1} (${[...new Set(tree.map((x) => x.Name))].join(', ')})`);
// Cach tat cua app that: taskkill /T /F tren pid goc
execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const left = tree.filter((x) => {
  try { process.kill(x.ProcessId, 0); return true; } catch { return false; }
});
console.log(`con sot lai: ${left.length}`, left.map((x) => `${x.Name}#${x.ProcessId}`).join(' '));
console.log(`cong ${port} con bi chiem: ${await portInUse(port)}`);
process.exit(left.length || (await portInUse(port)) ? 1 : 0);
