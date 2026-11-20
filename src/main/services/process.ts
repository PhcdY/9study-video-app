// Chay tien trinh con, doc tung dong, va tat sach ca cay tien trinh khi thoat app.
import { spawn, execFile, execFileSync, type ChildProcess } from 'node:child_process'
import log, { redact } from '../log'

const live = new Set<ChildProcess>()

export interface RunOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  onLine?: (line: string, stream: 'out' | 'err') => void
  /** Chuoi bi mat can che khi ghi log (vd key nguoi dung vua dan) */
  secrets?: string[]
  signal?: AbortSignal
  logLabel?: string
}

export interface RunResult {
  code: number
  /** ~40 dong cuoi, da che bi mat, de ghi log / chan doan */
  tail: string[]
}

/** Trich mot tham so cho cmd.exe /s /c "...". */
export function quoteCmdArg(a: string): string {
  if (/^[\w\-.:\\/=@,+]+$/.test(a)) return a
  return `"${a.replace(/"/g, '""')}"`
}

export function splitLines(buf: string): { lines: string[]; rest: string } {
  const parts = buf.split(/\r\n|\n|\r/)
  const rest = parts.pop() ?? ''
  return { lines: parts.filter((l) => l.trim() !== ''), rest }
}

export function spawnTracked(cmd: string, args: string[], opts: RunOptions): ChildProcess {
  const isCmd = /\.(cmd|bat)$/i.test(cmd)
  // Node khong cho spawn .cmd truc tiep: di qua cmd.exe, tu trich tham so
  const child = isCmd
    ? spawn(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', `"${[quoteCmdArg(cmd), ...args.map(quoteCmdArg)].join(' ')}"`],
        {
          cwd: opts.cwd,
          env: opts.env,
          windowsHide: true,
          windowsVerbatimArguments: true
        }
      )
    : spawn(cmd, args, { cwd: opts.cwd, env: opts.env, windowsHide: true })
  live.add(child)
  child.once('exit', () => live.delete(child))
  child.once('error', () => live.delete(child))
  return child
}

export function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const label = opts.logLabel ?? cmd.split(/[\\/]/).pop()
    log.info(`[chay] ${label} ${redact(args.join(' '), opts.secrets)}  (cwd=${opts.cwd ?? '-'})`)
    const tail: string[] = []
    const child = spawnTracked(cmd, args, opts)
    const bufs = { out: '', err: '' }
    const feed = (stream: 'out' | 'err', chunk: Buffer): void => {
      bufs[stream] += chunk.toString('utf8')
      const { lines, rest } = splitLines(bufs[stream])
      bufs[stream] = rest
      for (const l of lines) {
        const safe = redact(l, opts.secrets)
        tail.push(safe)
        if (tail.length > 40) tail.shift()
        opts.onLine?.(l, stream)
      }
    }
    child.stdout?.on('data', (c: Buffer) => feed('out', c))
    child.stderr?.on('data', (c: Buffer) => feed('err', c))
    const onAbort = (): void => killTree(child.pid)
    opts.signal?.addEventListener('abort', onAbort, { once: true })
    const finish = (code: number): void => {
      opts.signal?.removeEventListener('abort', onAbort)
      for (const s of ['out', 'err'] as const)
        if (bufs[s].trim()) tail.push(redact(bufs[s], opts.secrets))
      if (code !== 0) log.warn(`[loi] ${label} thoat ma ${code}\n${tail.slice(-15).join('\n')}`)
      resolve({ code, tail })
    }
    child.once('error', (e) => {
      tail.push(String(e))
      finish(-1)
    })
    child.once('close', (code) => finish(code ?? -1))
  })
}

/** Tat ca cay tien trinh (cmd -> npm -> node -> esbuild...). */
export function killTree(pid: number | undefined): void {
  if (!pid) return
  try {
    execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    })
  } catch {
    // da thoat roi
  }
}

export function killAll(): void {
  for (const c of live) killTree(c.pid)
  live.clear()
}

/**
 * Tat cac tien trinh chay tu `exePath` ma tien trinh cha da chet (mo coi), vd Codex con lai
 * khi app bi tat ngang lan truoc. Khong dung toi tien trinh co cha con song (cua app khac dang chay).
 */
export function killOrphans(exePath: string): Promise<number> {
  const script = [
    `$exe = '${exePath.replace(/'/g, "''")}'`,
    '$all = Get-CimInstance Win32_Process',
    '$alive = @{}; foreach ($p in $all) { $alive[[int]$p.ProcessId] = $true }',
    '$n = 0',
    'foreach ($p in $all) { if ($p.ExecutablePath -eq $exe -and -not $alive[[int]$p.ParentProcessId]) { taskkill /PID $p.ProcessId /T /F | Out-Null; $n++ } }',
    '$n'
  ].join('; ')
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true },
      (err, stdout) => {
        const n = Number(String(stdout).trim()) || 0
        if (err) log.warn(`[don dep] loi: ${String(err)}`)
        else if (n) log.info(`[don dep] da tat ${n} tien trinh mo coi`)
        resolve(n)
      }
    )
  })
}
