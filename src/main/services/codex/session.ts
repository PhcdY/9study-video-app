// Tro chuyen voi Codex trong man mot video: mot app-server cho ca du an, moi video mot thread.
// Giu trang thai chat o phan loi, day ban moi nhat sang giao dien (co dieu tiet).
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync } from 'node:fs'
import { app } from 'electron'
import {
  aiStatusOf,
  type AiStatus,
  type ApprovalDecision,
  type ChatErrorCode,
  type ChatItem,
  type ChatState
} from '../../../shared/video'
import type { ServerRequest } from './protocol/ServerRequest'
import type { ThreadItem } from './protocol/v2/ThreadItem'
import type { Turn } from './protocol/v2/Turn'
import type { ThreadStartResponse } from './protocol/v2/ThreadStartResponse'
import type { ThreadTurnsListResponse } from './protocol/v2/ThreadTurnsListResponse'
import type { TurnStartResponse } from './protocol/v2/TurnStartResponse'
import type { UserInput } from './protocol/v2/UserInput'
import type { ModelListResponse } from './protocol/v2/ModelListResponse'
import {
  modelDisplayName,
  resolveAi,
  type AiChoice,
  type AiModelOption
} from '../../../shared/ai-model'
import { CodexClient } from './client'
import { trustProject } from '../runtime'
import { describeApproval, estimateVoice, statusLabelFor } from './approvals'
import { parseVoiceRun } from '../../../shared/vivibe'
import { CHOICE_INSTRUCTIONS } from '../../../shared/choices'
import log from '../../log'
import { getSettings } from '../settings'

const SANDBOX = 'workspace-write' as const
/** Xin quyen: mac dinh de AI tu hoi khi can; 'moiLenh' thi hoi moi lenh ngoai danh sach an toan. */
const approval = (): 'on-request' | 'untrusted' =>
  getSettings().askPolicy === 'moiLenh' ? 'untrusted' : 'on-request'

interface Chat {
  key: string
  slug?: string
  threadId?: string
  turnId?: string
  items: ChatItem[]
  busy: boolean
  createdAt: number
  /** Cho tra loi the xin quyen: id the -> ham tra loi */
  waiting: Map<string, (decision: ApprovalDecision) => void>
  emitTimer?: NodeJS.Timeout
  loaded: boolean
  /** Ham goi khi luot dang chay cua thread xong (ke ca luot thu gon) */
  turnWaiters: ((status?: Turn['status']) => void)[]
  /** Model + muc suy nghi rieng; chua co thi theo mac dinh trong Cai dat */
  ai?: AiChoice
}

/** Doi luot thu gon (hoac luot dang chay) xong toi da bao lau truoc khi gui tiep. */
const TURN_WAIT_MS = 3 * 60_000
/** Codex tu choi tin moi khi dang chay luot khong chen duoc (vd dang thu gon cuoc tro chuyen). */
export const isTurnBusyError = (message: string): boolean => /ActiveTurnNotSteerable/i.test(message)

// ---------- luu threadId theo du an + video ----------

type ThreadStore = Record<string, Record<string, string>>
const storeFile = (): string => path.join(app.getPath('userData'), 'threads.json')
function readStore(): ThreadStore {
  try {
    return JSON.parse(readFileSync(storeFile(), 'utf8'))
  } catch {
    return {}
  }
}
function saveThread(projectDir: string, key: string, threadId: string): void {
  const s = readStore()
  s[projectDir] = { ...(s[projectDir] ?? {}), [key]: threadId }
  writeFileSync(storeFile() + '.tmp', JSON.stringify(s, null, 2))
  renameSync(storeFile() + '.tmp', storeFile())
}
export function slugsWithChat(projectDir: string): Set<string> {
  return new Set(
    Object.keys(readStore()[projectDir] ?? {}).filter(
      (k) => !k.startsWith('moi-') && !k.startsWith('he-')
    )
  )
}

/** Thread da luu cua mot cuoc tro chuyen (neu co). */
export function threadOf(projectDir: string, key: string): string | undefined {
  return readStore()[projectDir]?.[key]
}
/** Video moi chua gan vao thu muc video nao: khoa moi- co thread chua duoc video nao dung. */
export function unboundNewChats(projectDir: string): string[] {
  const all = readStore()[projectDir] ?? {}
  const bound = boundThreads(projectDir)
  return Object.entries(all)
    .filter(([k, v]) => k.startsWith('moi-') && !bound.has(v))
    .map(([k]) => k)
}
/** Quen cuoc tro chuyen (nguoi dung bo video dang do). */
export function forgetThread(projectDir: string, key: string): void {
  const s = readStore()
  if (!s[projectDir]?.[key]) return
  delete s[projectDir][key]
  writeFileSync(storeFile() + '.tmp', JSON.stringify(s, null, 2))
  renameSync(storeFile() + '.tmp', storeFile())
}
/** Thread da gan vao mot video (de biet video moi nao da co thu muc). */
export function boundThreads(projectDir: string): Set<string> {
  return new Set(
    Object.entries(readStore()[projectDir] ?? {})
      .filter(([k]) => !k.startsWith('moi-') && !k.startsWith('he-'))
      .map(([, v]) => v)
  )
}

// ---------- luu model + muc suy nghi theo thread ----------

const aiFile = (): string => path.join(app.getPath('userData'), 'ai-choices.json')
function readAiStore(): Record<string, AiChoice> {
  try {
    return JSON.parse(readFileSync(aiFile(), 'utf8'))
  } catch {
    return {}
  }
}
function saveAiChoice(threadId: string, choice: AiChoice): void {
  const s = { ...readAiStore(), [threadId]: choice }
  writeFileSync(aiFile() + '.tmp', JSON.stringify(s, null, 2))
  renameSync(aiFile() + '.tmp', aiFile())
}

/** Lay lai danh sach model sau bao lau (tai khoan co the doi goi). */
const MODELS_TTL_MS = 10 * 60_000

/** Doi loi tho cua Codex ra ma loi cho giao dien. */
export function chatErrorCode(message: string): ChatErrorCode {
  if (/usage limit|rate limit|quota|too many requests|429/i.test(message)) return 'hetLuot'
  if (/unauthori[sz]ed|401|login|auth/i.test(message)) return 'chuaDangNhap'
  if (/network|connect|timed? ?out|dns|ENOTFOUND|stream disconnected/i.test(message)) return 'mang'
  return 'khongRo'
}

export class CodexSession extends EventEmitter {
  private client?: CodexClient
  private chats = new Map<string, Chat>()
  private byThread = new Map<string, Chat>()
  private modelCache?: { at: number; list: Promise<AiModelOption[]> }

  constructor(private readonly projectDir: string) {
    super()
  }

  // ---------- ket noi ----------

  private async ensureClient(): Promise<CodexClient> {
    if (this.client) {
      await this.client.start()
      return this.client
    }
    trustProject(this.projectDir)
    const c = new CodexClient(this.projectDir)
    this.client = c
    c.serverRequestHandler = (req) => this.onServerRequest(req)
    c.on('item/started', (p: { threadId: string; item: ThreadItem }) =>
      this.onItem(p.threadId, p.item, false)
    )
    c.on('item/completed', (p: { threadId: string; item: ThreadItem }) =>
      this.onItem(p.threadId, p.item, true)
    )
    c.on('item/agentMessage/delta', (p: { threadId: string; itemId: string; delta: string }) => {
      const chat = this.byThread.get(p.threadId)
      const it = chat?.items.find((i) => i.kind === 'ai' && i.id === p.itemId)
      if (chat && it && it.kind === 'ai') {
        it.text += p.delta
        this.emitSoon(chat)
      }
    })
    c.on('turn/started', (p: { threadId: string; turn: Turn }) => {
      const chat = this.byThread.get(p.threadId)
      if (!chat) return
      chat.turnId = p.turn.id
      chat.busy = true
      this.emitSoon(chat)
    })
    c.on('turn/completed', (p: { threadId: string; turn: Turn }) => {
      const chat = this.byThread.get(p.threadId)
      if (!chat) return
      chat.busy = false
      chat.turnId = undefined
      for (const done of chat.turnWaiters.splice(0)) done(p.turn.status)
      for (const it of chat.items) {
        if (it.kind === 'status' && it.state === 'running') it.state = 'done'
        if (it.kind === 'ai') it.streaming = false
      }
      if (p.turn.status === 'failed' && p.turn.error) {
        log.warn(`[chat] luot loi: ${JSON.stringify(p.turn.error)}`)
        chat.items.push({
          kind: 'error',
          id: `err-${Date.now()}`,
          code: chatErrorCode(JSON.stringify(p.turn.error))
        })
      }
      this.bindSlug(chat)
      this.emitNow(chat)
      this.emit('turnDone', chat.slug)
    })
    c.on('exit', () => {
      this.client = undefined
      this.modelCache = undefined
      for (const chat of this.chats.values()) {
        for (const done of chat.turnWaiters.splice(0)) done()
        if (!chat.busy) continue
        chat.busy = false
        chat.items.push({ kind: 'error', id: `err-${Date.now()}`, code: 'khongRo' })
        this.emitNow(chat)
      }
    })
    await c.start()
    return c
  }

  /** Gan cuoc tro chuyen cua video vao thread khac roi mo lai. false (va giu nguyen) neu Codex khong mo duoc. */
  async switchThread(key: string, threadId: string): Promise<boolean> {
    const prev = readStore()[this.projectDir]?.[key]
    const old = this.chats.get(key)
    if (old?.busy) return false
    saveThread(this.projectDir, key, threadId)
    this.chats.delete(key)
    const st = await this.open(key)
    if (this.chats.get(key)?.threadId === threadId) {
      this.emitNow(this.chats.get(key)!)
      return true
    }
    // Khong mo duoc: tra lai nhu cu
    if (prev) saveThread(this.projectDir, key, prev)
    else forgetThread(this.projectDir, key)
    this.chats.delete(key)
    if (old) this.chats.set(key, old)
    void st
    return false
  }

  /** Cac tin nhan chu (nguoi dung, AI) cua cuoc tro chuyen dang mo, de luu lai khi bi thay. */
  textItems(key: string): { role: 'user' | 'ai'; text: string }[] {
    const out: { role: 'user' | 'ai'; text: string }[] = []
    for (const it of this.chats.get(key)?.items ?? []) {
      if (it.kind === 'user') out.push({ role: 'user', text: it.text })
      else if (it.kind === 'ai') out.push({ role: 'ai', text: it.text })
    }
    return out
  }

  /** Trang thai AI theo khoa cuoc tro chuyen va theo slug video (chi cac cuoc da mo trong lan chay nay). */
  statuses(): Record<string, AiStatus> {
    const out: Record<string, AiStatus> = {}
    for (const c of this.chats.values()) {
      const st = aiStatusOf(c.items, c.busy)
      out[c.key] = st
      if (c.slug) out[c.slug] = st
    }
    return out
  }

  /** Khoa cac cuoc tro chuyen AI dang lam viec. */
  busyKeys(): string[] {
    return [...this.chats.values()].filter((c) => c.busy).map((c) => c.key)
  }

  stop(): void {
    this.client?.stop()
  }

  // ---------- mo / gui ----------

  private getChat(key: string): Chat {
    let chat = this.chats.get(key)
    if (!chat) {
      chat = {
        key,
        items: [],
        busy: false,
        createdAt: Date.now(),
        waiting: new Map(),
        loaded: false,
        turnWaiters: []
      }
      // moi-: video moi chua co slug; he-: cuoc tro chuyen cua app (vd doi phien ban), khong gan video
      if (!key.startsWith('moi-') && !key.startsWith('he-')) chat.slug = key
      this.chats.set(key, chat)
    }
    return chat
  }

  state(chat: Chat): ChatState {
    return {
      key: chat.key,
      slug: chat.slug,
      items: chat.items,
      busy: chat.busy,
      ai: chat.ai ?? getSettings().defaultAi ?? {}
    }
  }

  // ---------- model + muc suy nghi ----------

  /** Model tai khoan dang dang nhap dung duoc; [] neu Codex chua san (chua dang nhap, mat mang). */
  async models(): Promise<AiModelOption[]> {
    if (this.modelCache && Date.now() - this.modelCache.at < MODELS_TTL_MS)
      return this.modelCache.list
    const list = this.fetchModels()
    this.modelCache = { at: Date.now(), list }
    const out = await list
    // Loi thi khong giu ket qua rong, lan sau hoi lai
    if (!out.length) this.modelCache = undefined
    return out
  }

  private async fetchModels(): Promise<AiModelOption[]> {
    try {
      const c = await this.ensureClient()
      const out: AiModelOption[] = []
      let cursor: string | null = null
      do {
        const res = (await c.request('model/list', {
          cursor,
          includeHidden: false
        })) as ModelListResponse
        for (const m of res.data) {
          if (m.hidden) continue
          out.push({
            id: m.model,
            name: modelDisplayName(m.displayName),
            description: m.description,
            isDefault: m.isDefault,
            efforts: m.supportedReasoningEfforts.map((e) => ({
              id: e.reasoningEffort,
              description: e.description
            })),
            defaultEffort: m.defaultReasoningEffort
          })
        }
        cursor = res.nextCursor
      } while (cursor)
      return out
    } catch (e) {
      log.warn(`[chat] khong lay duoc danh sach model: ${String(e)}`)
      return []
    }
  }

  /** Doi model / muc suy nghi cua cuoc tro chuyen; ap dung tu tin nhan sau. */
  setAi(key: string, choice: AiChoice): void {
    const chat = this.getChat(key)
    chat.ai = { model: choice.model || undefined, effort: choice.effort || undefined }
    if (chat.threadId) saveAiChoice(chat.threadId, chat.ai)
    this.emitNow(chat)
  }

  /** Mo cuoc tro chuyen cua mot video: noi lai thread cu va doc lai lich su. */
  async open(key: string): Promise<ChatState> {
    const chat = this.getChat(key)
    if (chat.loaded) return this.state(chat)
    chat.loaded = true
    const threadId = readStore()[this.projectDir]?.[key]
    if (!threadId) return this.state(chat)
    chat.ai = readAiStore()[threadId] ?? chat.ai
    try {
      const c = await this.ensureClient()
      await c.request('thread/resume', {
        threadId,
        cwd: this.projectDir,
        sandbox: SANDBOX,
        approvalPolicy: approval(),
        developerInstructions: CHOICE_INSTRUCTIONS
      })
      chat.threadId = threadId
      this.byThread.set(threadId, chat)
      const res = (await c.request('thread/turns/list', {
        threadId,
        limit: 40,
        sortDirection: 'desc',
        itemsView: 'full'
      })) as ThreadTurnsListResponse
      chat.items = res.data
        .slice()
        .reverse()
        .flatMap((t) => historyItems(t.items))
    } catch (e) {
      // Thread mat (vd xoa du lieu): bat dau lai, khong chan nguoi dung
      log.warn(`[chat] khong mo lai duoc thread ${threadId}: ${String(e)}`)
    }
    return this.state(chat)
  }

  async send(key: string, text: string): Promise<void> {
    const chat = this.getChat(key)
    const c = await this.ensureClient()
    if (!chat.threadId) {
      const res = (await c.request('thread/start', {
        cwd: this.projectDir,
        sandbox: SANDBOX,
        approvalPolicy: approval(),
        developerInstructions: CHOICE_INSTRUCTIONS
      })) as ThreadStartResponse
      chat.threadId = res.thread.id
      this.byThread.set(chat.threadId, chat)
      saveThread(this.projectDir, key, chat.threadId)
      // Bai moi giu lua chon luc tao, doi mac dinh trong Cai dat sau nay khong anh huong
      chat.ai ??= { ...(getSettings().defaultAi ?? {}) }
      saveAiChoice(chat.threadId, chat.ai)
    }
    chat.items.push({ kind: 'user', id: `u-${Date.now()}`, text: displayText(text) })
    chat.busy = true
    this.emitNow(chat)
    const threadId = chat.threadId
    const start = async (): Promise<TurnStartResponse> => {
      // Luon gui model + muc suy nghi cu the: chon lai "Default" giua chung cung ve dung mac dinh
      const ai = resolveAi(await this.models(), this.state(chat).ai)
      return (await c.request('turn/start', {
        threadId,
        input: this.toInput(text),
        ...(ai && { model: ai.model.id, effort: ai.effort })
      })) as TurnStartResponse
    }
    try {
      let res: TurnStartResponse
      try {
        res = await start()
      } catch (e) {
        // AI con dang thu gon cuoc tro chuyen: doi xong roi gui lai mot lan
        if (!isTurnBusyError(String(e))) throw e
        log.info('[chat] AI dang ban (thu gon), doi xong roi gui lai')
        await this.waitTurnDone(chat)
        chat.busy = true
        this.emitNow(chat)
        res = await start()
      }
      chat.turnId = res.turn?.id ?? chat.turnId
    } catch (e) {
      log.warn(`[chat] gui loi: ${String(e)}`)
      chat.busy = false
      chat.items.push({ kind: 'error', id: `err-${Date.now()}`, code: chatErrorCode(String(e)) })
      this.emitNow(chat)
    }
  }

  /**
   * Thu gon cuoc tro chuyen (thay /compact) truoc khi sang buoc moi, tiet kiem luot.
   * thread/compact/start tra ve ngay nhung Codex con thu gon trong mot luot rieng;
   * gui tin trong luc do bi tu choi (ActiveTurnNotSteerable), nen doi luot nay xong moi tra ve.
   * false neu nguoi dung bam Dung trong luc thu gon (khong gui tiep).
   */
  async compact(key: string): Promise<boolean> {
    const chat = this.chats.get(key)
    if (!chat?.threadId || chat.busy) return true
    const done = this.waitTurnDone(chat)
    chat.busy = true
    this.emitNow(chat)
    try {
      const c = await this.ensureClient()
      await c.request('thread/compact/start', { threadId: chat.threadId })
    } catch (e) {
      log.warn(`[chat] thu gon loi: ${String(e)}`)
      chat.turnWaiters.splice(0).forEach((f) => f())
      chat.busy = false
      this.emitNow(chat)
      return true
    }
    const status = await done
    if (status === 'timeout') log.warn('[chat] thu gon qua lau, gui tiep')
    return status !== 'interrupted'
  }

  /** Doi luot dang chay cua cuoc tro chuyen xong: tra ve trang thai luot, hoac 'timeout'. */
  private waitTurnDone(
    chat: Chat,
    ms = TURN_WAIT_MS
  ): Promise<Turn['status'] | 'timeout' | undefined> {
    return new Promise((resolve) => {
      const fn = (status?: Turn['status']): void => {
        clearTimeout(timer)
        resolve(status)
      }
      const timer = setTimeout(() => {
        chat.turnWaiters = chat.turnWaiters.filter((f) => f !== fn)
        resolve('timeout')
      }, ms)
      chat.turnWaiters.push(fn)
    })
  }

  async interrupt(key: string): Promise<void> {
    const chat = this.chats.get(key)
    if (!chat?.threadId || !chat.turnId || !this.client) return
    for (const resolve of chat.waiting.values()) resolve('decline')
    await this.client
      .request('turn/interrupt', { threadId: chat.threadId, turnId: chat.turnId })
      .catch((e) => log.warn(`[chat] dung loi: ${String(e)}`))
  }

  approve(key: string, itemId: string, decision: ApprovalDecision): void {
    const chat = this.chats.get(key)
    chat?.waiting.get(itemId)?.(decision)
  }

  // ---------- noi bo ----------

  /** `$ten-skill` o dau cau lenh: gui kem muc skill de Codex chac chan doc dung skill. */
  private toInput(text: string): UserInput[] {
    const input: UserInput[] = [{ type: 'text', text, text_elements: [] }]
    const m = /^\$([a-z0-9-]+)/.exec(text.trim())
    if (m) {
      const p = path.join(this.projectDir, '.agents', 'skills', m[1], 'SKILL.md')
      if (existsSync(p)) input.unshift({ type: 'skill', name: m[1], path: p })
    }
    return input
  }

  private onItem(threadId: string, item: ThreadItem, completed: boolean): void {
    const chat = this.byThread.get(threadId)
    if (!chat) return
    if (item.type === 'agentMessage') {
      const it = chat.items.find((i) => i.kind === 'ai' && i.id === item.id)
      if (it && it.kind === 'ai') {
        if (completed) {
          it.text = item.text
          it.streaming = false
        }
      } else {
        chat.items.push({ kind: 'ai', id: item.id, text: item.text ?? '', streaming: !completed })
      }
    } else if (item.type === 'commandExecution' || item.type === 'fileChange') {
      // Lan tao giong doc that: bao so ky tu da gui Vivibe de ghi so
      if (completed && item.type === 'commandExecution') {
        const run = parseVoiceRun(item.command, item.aggregatedOutput ?? '')
        if (run) this.emit('voiceRun', { ...run, slug: run.slug ?? chat.slug })
      }
      const label = item.type === 'fileChange' ? 'suaFile' : statusLabelFor(item.command)
      const failed =
        completed &&
        ((item.type === 'commandExecution' &&
          (item.status === 'failed' || item.status === 'declined')) ||
          (item.type === 'fileChange' && item.status === 'failed'))
      const last = chat.items[chat.items.length - 1]
      // Gom cac lenh lien nhau thanh mot dong trang thai
      if (!completed) {
        if (last?.kind === 'status') {
          last.label = label
          last.count += 1
          last.state = 'running'
        } else chat.items.push({ kind: 'status', id: item.id, label, count: 1, state: 'running' })
      } else if (last?.kind === 'status') {
        last.state = failed ? 'failed' : 'done'
      }
    } else return
    this.emitSoon(chat)
  }

  private onServerRequest(req: ServerRequest): Promise<unknown> {
    const p = req.params as { threadId?: string; command?: string | null; reason?: string | null }
    const chat = p.threadId ? this.byThread.get(p.threadId) : undefined
    if (!chat) return Promise.reject(new Error('khong ro video'))
    let card: ChatItem
    if (req.method === 'item/commandExecution/requestApproval') {
      const info = describeApproval(p.command ?? '', p.reason)
      card = {
        kind: 'approval',
        id: `ap-${String(req.id)}`,
        ...info,
        reason: p.reason ?? undefined,
        state: 'pending'
      }
    } else if (req.method === 'item/fileChange/requestApproval') {
      card = {
        kind: 'approval',
        id: `ap-${String(req.id)}`,
        title: 'suaFile',
        costly: false,
        reason: p.reason ?? undefined,
        state: 'pending'
      }
    } else {
      return Promise.reject(new Error(`chua ho tro ${req.method}`))
    }
    chat.items.push(card)
    this.emitNow(chat)
    // Tao giong doc ton credit: chay thu che do uoc tinh de hien so cau va so ky tu
    if (card.kind === 'approval' && card.costly && p.command) {
      void estimateVoice(this.projectDir, p.command).then((est) => {
        if (est && card.kind === 'approval') {
          card.estimate = est
          this.emitNow(chat)
        }
      })
    }
    return new Promise((resolve) => {
      chat.waiting.set(card.id, (decision) => {
        chat.waiting.delete(card.id)
        if (card.kind === 'approval')
          card.state =
            decision === 'accept'
              ? 'accepted'
              : decision === 'acceptForSession'
                ? 'acceptedForSession'
                : 'declined'
        this.emitNow(chat)
        resolve({ decision })
      })
    })
  }

  /** Video moi: sau moi luot, tim thu muc video vua tao de gan cuoc tro chuyen vao slug. */
  private bindSlug(chat: Chat): void {
    if (chat.slug || !chat.threadId || !chat.key.startsWith('moi-')) return
    const root = path.join(this.projectDir, 'src', 'videos')
    if (!existsSync(root)) return
    const taken = slugsWithChat(this.projectDir)
    let best: { slug: string; t: number } | undefined
    for (const d of readdirSync(root, { withFileTypes: true })) {
      if (!d.isDirectory() || taken.has(d.name)) continue
      const f = path.join(root, d.name, 'script.json')
      if (!existsSync(f)) continue
      const t = statSync(f).birthtimeMs || statSync(f).mtimeMs
      if (t >= chat.createdAt - 5000 && (!best || t > best.t)) best = { slug: d.name, t }
    }
    if (!best) return
    chat.slug = best.slug
    this.chats.set(best.slug, chat)
    saveThread(this.projectDir, best.slug, chat.threadId)
    log.info(`[chat] video moi gan vao ${best.slug}`)
  }

  private emitSoon(chat: Chat): void {
    if (chat.emitTimer) return
    chat.emitTimer = setTimeout(() => this.emitNow(chat), 60)
  }
  private emitNow(chat: Chat): void {
    if (chat.emitTimer) clearTimeout(chat.emitTimer)
    chat.emitTimer = undefined
    this.emit('changed', this.state(chat))
  }
}

/** Cau lenh cua app (bat dau bang $skill) hien gon tren giao dien: bo dong goi skill. */
function displayText(text: string): string {
  return text.replace(/^\$[a-z0-9-]+\s*\n?/, '').trim()
}

/** Doi item trong lich su sang dong chat; lenh lien nhau gom lai. */
export function historyItems(items: ThreadItem[]): ChatItem[] {
  const out: ChatItem[] = []
  for (const it of items) {
    if (it.type === 'userMessage') {
      const text = it.content
        .map((c) => (c.type === 'text' ? c.text : ''))
        .join('\n')
        .trim()
      if (text) out.push({ kind: 'user', id: it.id, text: displayText(text) })
    } else if (it.type === 'agentMessage') {
      if (it.text.trim()) out.push({ kind: 'ai', id: it.id, text: it.text })
    } else if (it.type === 'commandExecution' || it.type === 'fileChange') {
      const label = it.type === 'fileChange' ? 'suaFile' : statusLabelFor(it.command)
      const last = out[out.length - 1]
      if (last?.kind === 'status') {
        last.label = label
        last.count += 1
      } else out.push({ kind: 'status', id: it.id, label, count: 1, state: 'done' })
    }
  }
  return out
}
