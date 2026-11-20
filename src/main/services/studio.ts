// Remotion Studio (`npm run dev`) chay ngam de nhung vao tab "Xem chuyen dong".
// Bat mot lan, giu suot phien; tat sach ca cay tien trinh khi thoat app (killAll).
import net from 'node:net'
import type { ChildProcess } from 'node:child_process'
import { childEnv, exe } from './runtime'
import { killTree, spawnTracked } from './process'
import log from '../log'

function freePort(start = 3000): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(freePort(start + 1)))
    s.listen(start, '127.0.0.1', () => s.close(() => resolve(start)))
  })
}

export class StudioService {
  private child?: ChildProcess
  private url?: string
  private starting?: Promise<string>

  constructor(private readonly projectDir: string) {}

  start(): Promise<string> {
    if (this.url && this.child && this.child.exitCode === null) return Promise.resolve(this.url)
    this.starting ??= this.doStart().finally(() => (this.starting = undefined))
    return this.starting
  }

  private async doStart(): Promise<string> {
    const port = await freePort(3000)
    log.info(`[studio] bat o cong ${port}`)
    const child = spawnTracked(
      exe.npm(),
      ['run', 'dev', '--', '--port', String(port), '--no-open'],
      {
        cwd: this.projectDir,
        env: childEnv(this.projectDir)
      }
    )
    this.child = child
    let tail = ''
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => fail(new Error('het gio cho Studio')), 180_000)
      const onData = (d: Buffer): void => {
        tail = (tail + d.toString()).slice(-4000)
        if (/localhost:\d+|Server ready|Built in/i.test(tail)) {
          clearTimeout(timer)
          this.url = `http://localhost:${port}`
          resolve(this.url)
        }
      }
      const fail = (e: Error): void => {
        clearTimeout(timer)
        log.warn(`[studio] khong bat duoc: ${e.message}\n${tail.slice(-800)}`)
        this.stop()
        reject(e)
      }
      child.stdout?.on('data', onData)
      child.stderr?.on('data', onData)
      child.once('exit', (code) => {
        this.url = undefined
        if (code !== 0) fail(new Error(`Studio thoat ma ${code}`))
      })
    })
  }

  stop(): void {
    killTree(this.child?.pid)
    this.child = undefined
    this.url = undefined
  }
}
