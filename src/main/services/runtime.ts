// Duong dan toi Node/Python/Git/Codex dong goi kem app, va moi truong cho moi tien trinh con.
import { app } from 'electron'
import path from 'node:path'
import { mkdirSync } from 'node:fs'

export function runtimeRoot(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'runtimes')
    : path.join(app.getAppPath(), 'resources', 'runtimes')
}

export const exe = {
  node: (): string => path.join(runtimeRoot(), 'node', 'node.exe'),
  npm: (): string => path.join(runtimeRoot(), 'node', 'npm.cmd'),
  npx: (): string => path.join(runtimeRoot(), 'node', 'npx.cmd'),
  python: (): string => path.join(runtimeRoot(), 'python', 'python.exe'),
  py: (): string => path.join(runtimeRoot(), 'bin', 'py.cmd'),
  git: (): string => path.join(runtimeRoot(), 'git', 'cmd', 'git.exe'),
  codex: (): string => path.join(runtimeRoot(), 'codex', 'bin', 'codex.exe')
}

export function codexHome(): string {
  const dir = path.join(app.getPath('userData'), 'codex')
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Bo nho dem npm va thu muc tam: dat canh thu muc du an (khong dau, khong dau cach, khong o C),
 * tranh loi khi ten nguoi dung Windows co dau va tranh day o C (bundle Remotion tung chiem 5 GB).
 */
export function cacheRoot(projectDir?: string): string {
  const dir = projectDir
    ? path.join(path.dirname(projectDir), '.9study-cache')
    : path.join(app.getPath('userData'), 'cache')
  mkdirSync(path.join(dir, 'tmp'), { recursive: true })
  return dir
}

/** PATH sach: chi runtime dong goi + thu muc he thong cua Windows. May dev va may CTV chay giong nhau. */
export function childPath(): string {
  const rt = runtimeRoot()
  const sys = process.env.SystemRoot || 'C:\\Windows'
  return [
    path.join(rt, 'bin'),
    path.join(rt, 'node'),
    path.join(rt, 'python'),
    path.join(rt, 'git', 'cmd'),
    path.join(rt, 'codex', 'codex-path'),
    `${sys}\\System32`,
    sys,
    `${sys}\\System32\\Wbem`,
    `${sys}\\System32\\WindowsPowerShell\\v1.0`,
    `${sys}\\System32\\OpenSSH`
  ].join(';')
}

export function childEnv(
  projectDir?: string,
  extra: Record<string, string> = {}
): NodeJS.ProcessEnv {
  const cache = cacheRoot(projectDir)
  const env: NodeJS.ProcessEnv = { ...process.env }
  // Windows co the co ca "Path" lan "PATH": xoa het roi dat lai mot cai
  for (const k of Object.keys(env)) if (k.toLowerCase() === 'path') delete env[k]
  // Bien cua Node/Electron cha khong duoc lot sang tien trinh con
  delete env.ELECTRON_RUN_AS_NODE
  delete env.NODE_OPTIONS
  return {
    ...env,
    PATH: childPath(),
    CODEX_HOME: codexHome(),
    npm_config_cache: path.join(cache, 'npm'),
    npm_config_update_notifier: 'false',
    npm_config_fund: 'false',
    npm_config_audit: 'false',
    TEMP: path.join(cache, 'tmp'),
    TMP: path.join(cache, 'tmp'),
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    GIT_TERMINAL_PROMPT: '0',
    BROWSER: 'none',
    ...extra
  }
}
