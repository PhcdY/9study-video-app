// Ket noi toi `codex app-server` (JSON-RPC, moi dong mot thong diep qua stdio).
// Chi dung ham khong "experimental" (kieu sinh bang `npm run gen:codex`, khong co --experimental).
import { EventEmitter } from 'node:events'
import { createInterface } from 'node:readline'
import type { ChildProcess } from 'node:child_process'
import type { ClientRequest } from './protocol/ClientRequest'
import type { ServerNotification } from './protocol/ServerNotification'
import type { ServerRequest } from './protocol/ServerRequest'
import { exe, childEnv } from '../runtime'
import { spawnTracked, killTree } from '../process'
import log, { redact } from '../../log'

export type Method = ClientRequest['method']
export type ParamsOf<M extends Method> = Extract<ClientRequest, { method: M }>['params']
export type NotificationOf<M extends ServerNotification['method']> = Extract<
  ServerNotification,
  { method: M }
>['params']

interface Pending {
  resolve: (v: unknown) => void
  reject: (e: Error) => void
  method: string
}

export class CodexRpcError extends Error {
  constructor(
    public readonly method: string,
    public readonly code: number,
    message: string
  ) {
    super(`${method}: ${message}`)
  }
}

export class CodexClient extends EventEmitter {
  private child?: ChildProcess
  private nextId = 1
  private pending = new Map<number, Pending>()
  private ready?: Promise<void>
  /** Tra loi cho yeu cau cua server (xin quyen...). Chua gan thi tu choi. */
  serverRequestHandler?: (req: ServerRequest) => Promise<unknown>

  constructor(private readonly cwd?: string) {
    super()
  }

  start(): Promise<void> {
    if (this.ready) return this.ready
    this.ready = (async () => {
      const child = spawnTracked(exe.codex(), ['app-server'], {
        cwd: this.cwd,
        env: childEnv(this.cwd)
      })
      this.child = child
      child.stderr?.on('data', (d: Buffer) => log.debug(`[codex stderr] ${redact(d.toString())}`))
      child.once('exit', (code) => {
        log.info(`[codex] app-server da tat (ma ${code})`)
        for (const p of this.pending.values())
          p.reject(new CodexRpcError(p.method, -1, 'app-server da thoat'))
        this.pending.clear()
        this.ready = undefined
        this.child = undefined
        this.emit('exit', code)
      })
      const rl = createInterface({ input: child.stdout! })
      rl.on('line', (line) => this.onLine(line))
      await this.request('initialize', {
        clientInfo: { name: '9study_video', title: '9Study Video', version: '0.1.0' },
        capabilities: null
      })
      this.send({ method: 'initialized' })
    })()
    return this.ready
  }

  stop(): void {
    killTree(this.child?.pid)
  }

  request<M extends Method>(method: M, params: ParamsOf<M>): Promise<unknown> {
    const id = this.nextId++
    this.send({ id, method, params })
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, method }))
  }

  /** Cho mot thong bao thoa dieu kien. */
  waitFor<M extends ServerNotification['method'], P = NotificationOf<M>>(
    method: M,
    pred: (p: P) => boolean = () => true,
    timeoutMs = 15 * 60_000,
    signal?: AbortSignal
  ): Promise<P> {
    return new Promise((resolve, reject) => {
      const done = (): void => {
        clearTimeout(t)
        this.off(method, on)
        signal?.removeEventListener('abort', onAbort)
      }
      const on = (raw: unknown): void => {
        const p = raw as P
        if (!pred(p)) return
        done()
        resolve(p)
      }
      const onAbort = (): void => {
        done()
        reject(new Error('da huy'))
      }
      const t = setTimeout(() => {
        done()
        reject(new Error(`het gio cho ${method}`))
      }, timeoutMs)
      this.on(method, on)
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }

  private send(msg: object): void {
    const text = JSON.stringify(msg)
    log.debug(`[codex >>] ${redact(text).slice(0, 500)}`)
    this.child?.stdin?.write(text + '\n')
  }

  private onLine(line: string): void {
    let msg: {
      id?: number
      method?: string
      params?: unknown
      result?: unknown
      error?: { code: number; message: string }
    }
    try {
      msg = JSON.parse(line)
    } catch {
      return
    }
    log.debug(`[codex <<] ${redact(line).slice(0, 500)}`)
    if (msg.id !== undefined && !msg.method) {
      const p = this.pending.get(msg.id)
      if (!p) return
      this.pending.delete(msg.id)
      if (msg.error) p.reject(new CodexRpcError(p.method, msg.error.code, msg.error.message))
      else p.resolve(msg.result)
      return
    }
    if (msg.id !== undefined && msg.method) {
      void this.answerServerRequest(msg as unknown as ServerRequest)
      return
    }
    if (msg.method) this.emit(msg.method, msg.params)
  }

  private async answerServerRequest(req: ServerRequest): Promise<void> {
    try {
      if (!this.serverRequestHandler) throw new Error('chua ho tro')
      const result = await this.serverRequestHandler(req)
      this.send({ id: req.id, result })
    } catch (e) {
      this.send({ id: req.id, error: { code: -32601, message: String(e) } })
    }
  }
}
