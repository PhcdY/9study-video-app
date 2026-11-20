// Moc 0 - bai thu Codex app-server. Code xau cung duoc, chi de chung minh chay duoc.
//
// Cach dung (chay tu thu muc spikes/):
//   node codex-probe.mjs status                 -> tai khoan, luot dung, san sang sandbox
//   node codex-probe.mjs login                  -> dang nhap ChatGPT (mo trinh duyet, cho xong)
//   node codex-probe.mjs sandbox-setup [mode]   -> chuan bi sandbox Windows (mode: unelevated|elevated)
//   node codex-probe.mjs turn "<cau lenh>"      -> tao thread trong repo video, chay 1 luot, tu dong 'accept' moi yeu cau xin quyen
//   node codex-probe.mjs turn "<cau lenh>" --decline   -> nhu tren nhung tu choi
//
// Bien moi truong:
//   CODEX_HOME   mac dinh spikes/output/codex-home (tach khoi ~/.codex)
//   VIDEO_REPO   mac dinh spikes/output/video-repo
//   PROBE_PATH   neu co: thay PATH cua tien trinh con (dung de gia lap may sach)

import { spawn, execFile } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const codexExe = path.join(here, 'node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe');
const codexHome = process.env.CODEX_HOME || path.join(here, 'output/codex-home');
const videoRepo = process.env.VIDEO_REPO || path.join(here, 'output/video-repo');
const logFile = path.join(here, 'output/codex-probe.log');
mkdirSync(codexHome, { recursive: true });

const [cmd, ...rest] = process.argv.slice(2);
const decline = rest.includes('--decline');
const text = rest.filter((a) => !a.startsWith('--')).join(' ');

const env = { ...process.env, CODEX_HOME: codexHome };
if (process.env.PROBE_PATH) env.PATH = process.env.PROBE_PATH;

const child = spawn(codexExe, ['app-server'], { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
child.stderr.on('data', (d) => appendFileSync(logFile, `[stderr] ${d}`));
child.on('exit', (code) => {
  log(`app-server thoat, code=${code}`);
});

let nextId = 1;
const pending = new Map();
const listeners = [];

function log(...a) {
  const line = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  console.log(line);
  appendFileSync(logFile, line + '\n');
}

function send(msg) {
  appendFileSync(logFile, `>> ${JSON.stringify(msg)}\n`);
  child.stdin.write(JSON.stringify(msg) + '\n');
}

function request(method, params) {
  const id = nextId++;
  send({ id, method, params });
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
}

function waitFor(method, pred = () => true, timeoutMs = 10 * 60_000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`het gio cho ${method}`)), timeoutMs);
    listeners.push({ method, pred, resolve: (p) => { clearTimeout(t); resolve(p); } });
  });
}

const rl = createInterface({ input: child.stdout });
rl.on('line', (line) => {
  appendFileSync(logFile, `<< ${line}\n`);
  let msg;
  try { msg = JSON.parse(line); } catch { return log('[khong phai JSON]', line); }
  // tra loi cho request cua minh
  if (msg.id !== undefined && !msg.method) {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(`${p.method}: ${JSON.stringify(msg.error)}`));
    else p.resolve(msg.result);
    return;
  }
  // server hoi nguoc (xin quyen...)
  if (msg.id !== undefined && msg.method) return onServerRequest(msg);
  // thong bao
  onNotification(msg);
});

function onServerRequest(msg) {
  const p = msg.params || {};
  const decision = decline ? 'decline' : 'accept';
  if (msg.method === 'item/commandExecution/requestApproval') {
    log(`\n[XIN QUYEN CHAY LENH] ${p.command}\n  cwd=${p.cwd}\n  ly do=${p.reason ?? '-'}\n  -> tra loi: ${decision}`);
    send({ id: msg.id, result: { decision } });
  } else if (msg.method === 'item/fileChange/requestApproval') {
    log(`\n[XIN QUYEN SUA FILE] ly do=${p.reason ?? '-'} -> tra loi: ${decision}`);
    send({ id: msg.id, result: { decision } });
  } else {
    log(`\n[YEU CAU CHUA XU LY] ${msg.method}`, p);
    send({ id: msg.id, error: { code: -32601, message: 'spike khong xu ly' } });
  }
}

let streaming = false;
function onNotification(msg) {
  for (let i = listeners.length - 1; i >= 0; i--) {
    const l = listeners[i];
    if (l.method === msg.method && l.pred(msg.params)) {
      listeners.splice(i, 1);
      l.resolve(msg.params);
    }
  }
  const p = msg.params || {};
  switch (msg.method) {
    case 'item/agentMessage/delta':
      if (!streaming) { process.stdout.write('\n[AI] '); streaming = true; }
      process.stdout.write(p.delta ?? '');
      break;
    case 'item/started': {
      const it = p.item || {};
      if (it.type === 'commandExecution') log(`\n[DANG CHAY] ${it.command}`);
      else if (it.type === 'fileChange') log(`\n[DANG SUA FILE]`);
      break;
    }
    case 'item/completed': {
      const it = p.item || {};
      if (it.type === 'agentMessage') { streaming = false; process.stdout.write('\n'); }
      if (it.type === 'commandExecution') log(`[XONG LENH] exit=${it.exitCode} status=${it.status}`);
      break;
    }
    case 'turn/completed':
      log(`\n[LUOT XONG] status=${p.turn?.status}`, p.turn?.error ?? '');
      break;
    case 'error':
    case 'warning':
    case 'configWarning':
    case 'windows/worldWritableWarning':
      log(`[${msg.method}]`, p);
      break;
    default:
      break;
  }
}

async function main() {
  const init = await request('initialize', {
    clientInfo: { name: '9study_video_spike', title: '9Study Video (spike)', version: '0.0.0' },
    capabilities: null,
  });
  send({ method: 'initialized' });
  log('[initialize]', { userAgent: init?.userAgent, platform: init?.platformOs ?? init?.platform });

  if (cmd === 'status') {
    log('[account/read]', await request('account/read', { refreshToken: false }));
    try { log('[rateLimits]', await request('account/rateLimits/read', null)); } catch (e) { log('[rateLimits loi]', e.message); }
    log('[windowsSandbox/readiness]', await request('windowsSandbox/readiness', null));
  } else if (cmd === 'login') {
    const res = await request('account/login/start', { type: 'chatgpt' });
    log('[login] mo trinh duyet:', res.authUrl);
    // Khong dung `cmd /c start`: cmd coi `&` trong link la dau ngat lenh va cat mat tham so.
    // App that dung shell.openExternal cua Electron.
    execFile('rundll32', ['url.dll,FileProtocolHandler', res.authUrl]);
    const done = await waitFor('account/login/completed');
    log('[login xong]', done);
    log('[account/read]', await request('account/read', { refreshToken: false }));
  } else if (cmd === 'sandbox-setup') {
    const mode = text || 'unelevated';
    log('[readiness truoc]', await request('windowsSandbox/readiness', null));
    log('[setupStart]', await request('windowsSandbox/setupStart', { mode, cwd: videoRepo }));
    const done = await waitFor('windowsSandbox/setupCompleted');
    log('[setupCompleted]', done);
    log('[readiness sau]', await request('windowsSandbox/readiness', null));
  } else if (cmd === 'turn') {
    const t0 = Date.now();
    const th = await request('thread/start', {
      cwd: videoRepo,
      sandbox: 'workspace-write',
      approvalPolicy: 'on-request',
    });
    const threadId = th.thread?.id;
    log('[thread]', threadId, 'model=', th.model);
    const turnDone = waitFor('turn/completed', (p) => p.threadId === threadId, 30 * 60_000);
    await request('turn/start', {
      threadId,
      input: [{ type: 'text', text, text_elements: [] }],
    });
    await turnDone;
    log(`[thoi gian] ${Math.round((Date.now() - t0) / 1000)}s`);
    try { log('[rateLimits]', (await request('account/rateLimits/read', null)).rateLimits); } catch {}
  } else {
    log('lenh khong ro. Xem dau file.');
  }
  child.kill();
  process.exit(0);
}

main().catch((e) => {
  log('[LOI]', e.message);
  child.kill();
  process.exit(1);
});
