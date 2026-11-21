// Nhan du lieu cu cua nguoi da lam video bang bo cong cu truoc khi co app:
// video trong thu muc cu, key Vivibe trong .env, tro chuyen Codex (~/.codex) va Claude Code (~/.claude),
// va cac lan tao giong doc tim thay trong tro chuyen do (de cong credit Vivibe da dung).
// Chi DOC thu muc cu va lich su cu; khong xoa, khong sua gi o do.
import { app } from 'electron'
import os from 'node:os'
import path from 'node:path'
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { cp, copyFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import {
  chatTitle,
  claudeProjectName,
  guessSlug,
  isHumanText,
  sameDir,
  voiceRunOf,
  type LegacyChat,
  type LegacyMessage,
  type LegacyScan,
  type LegacySource,
  type LegacyVoiceRun
} from '../../shared/legacy'
import { readEnvFile, writeEnvValues } from './env-file'
import { scanVideos, sampleSlugsFrom } from './project'
import { childEnv, exe } from './runtime'
import { run } from './process'
import log from '../log'

const MAX_MSG = 4000
const MAX_MSGS = 600

interface Parsed {
  chat: LegacyChat
  messages: LegacyMessage[]
  runs: LegacyVoiceRun[]
}

export interface ScanFull {
  scan: LegacyScan
  parsed: Parsed[]
}

// ---------- doc tung dong file lon ----------

async function eachLine(file: string, fn: (line: string) => void): Promise<void> {
  const rl = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })
  for await (const line of rl) if (line) fn(line)
}

function walkJsonl(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walkJsonl(p))
    else if (e.name.endsWith('.jsonl')) out.push(p)
  }
  return out
}

const textOf = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content
          .map((c) => (c && typeof c === 'object' && 'text' in c ? String(c.text ?? '') : ''))
          .join('\n')
      : ''

const cut = (s: string): string => (s.length > MAX_MSG ? `${s.slice(0, MAX_MSG)}…` : s)

// ---------- Codex ----------

/** Thu muc lich su Codex ngoai app (Codex CLI / Codex Desktop). */
function codexHomes(): string[] {
  const homes = [path.join(os.homedir(), '.codex')]
  const env = process.env.CODEX_HOME
  if (env && !homes.some((h) => sameDir(h, env))) homes.push(env)
  return homes.filter((h) => existsSync(path.join(h, 'sessions')))
}

async function parseCodex(file: string, dir: string, slugs: Set<string>): Promise<Parsed | null> {
  let meta: { id?: string; cwd?: string; timestamp?: string } | null = null
  const messages: LegacyMessage[] = []
  const runs: LegacyVoiceRun[] = []
  const texts: string[] = []
  let first = 0
  let last = 0
  let skip = false
  await eachLine(file, (line) => {
    if (skip) return
    if (!meta) {
      try {
        const j = JSON.parse(line)
        if (j.type !== 'session_meta') return
        meta = j.payload
        const cwd = String(j.payload?.cwd ?? '')
        if (
          !sameDir(cwd, dir) &&
          !cwd.toLowerCase().startsWith(`${dir.toLowerCase()}\\.claude\\worktrees`)
        )
          skip = true
      } catch {
        skip = true
      }
      return
    }
    if (!line.includes('"item_completed"')) return
    let j: { timestamp?: string; payload?: { item?: Record<string, unknown> } }
    try {
      j = JSON.parse(line)
    } catch {
      return
    }
    const it = j.payload?.item
    if (!it) return
    const at = Date.parse(j.timestamp ?? '') || 0
    first ||= at
    last = at || last
    if (it.type === 'UserMessage' || it.type === 'AgentMessage') {
      const text = textOf(it.content)
      texts.push(text)
      if (it.type === 'UserMessage' && !isHumanText(text)) return
      if (messages.length < MAX_MSGS)
        messages.push({ role: it.type === 'UserMessage' ? 'user' : 'ai', text: cut(text), at })
    } else if (it.type === 'CommandExecution') {
      const cmd = Array.isArray(it.command)
        ? String(it.command.at(-1) ?? '')
        : String(it.command ?? '')
      texts.push(cmd)
      if (!cmd.includes('vivibe_tts')) return
      const r = voiceRunOf(cmd, String(it.aggregated_output ?? ''))
      if (r) runs.push({ ...r, at, src: `codex-${String(it.id)}` })
    }
  })
  const m = meta as { id?: string } | null
  if (skip || !m?.id || messages.length === 0) return null
  const firstUser = messages.find((x) => x.role === 'user')?.text ?? ''
  return {
    chat: {
      id: `codex-${m.id}`,
      source: 'codex',
      title: chatTitle(firstUser || 'Trò chuyện với Codex'),
      startedAt: first,
      endedAt: last,
      slug: guessSlug(texts, slugs),
      messages: messages.length,
      file,
      threadId: m.id
    },
    messages,
    runs
  }
}

// ---------- Claude Code ----------

function claudeDirs(dir: string): string[] {
  const root = path.join(os.homedir(), '.claude', 'projects')
  if (!existsSync(root)) return []
  const name = claudeProjectName(dir)
  return readdirSync(root)
    .filter((d) => d === name || d.startsWith(`${name}--claude-worktrees-`))
    .map((d) => path.join(root, d))
}

async function parseClaude(file: string, slugs: Set<string>): Promise<Parsed | null> {
  const messages: LegacyMessage[] = []
  const runs: LegacyVoiceRun[] = []
  const texts: string[] = []
  const commands = new Map<string, string>()
  let title = ''
  let sessionId = ''
  let first = 0
  let last = 0
  await eachLine(file, (line) => {
    if (line.startsWith('{"type":"custom-title"')) {
      try {
        title = JSON.parse(line).customTitle ?? title
      } catch {
        // bo qua
      }
      return
    }
    // Chi doc dong tin nhan (bo dong ghi yeu cau API, anh chup file...)
    if (!line.startsWith('{"parentUuid"')) return
    let j: {
      type?: string
      isSidechain?: boolean
      isMeta?: boolean
      timestamp?: string
      sessionId?: string
      message?: { content?: unknown }
    }
    try {
      j = JSON.parse(line)
    } catch {
      return
    }
    if (j.type !== 'user' && j.type !== 'assistant') return
    sessionId ||= j.sessionId ?? ''
    const at = Date.parse(j.timestamp ?? '') || 0
    first ||= at
    last = at || last
    const content = j.message?.content
    if (j.type === 'assistant' && Array.isArray(content)) {
      for (const c of content as Record<string, unknown>[]) {
        if (c.type === 'text' && !j.isSidechain) {
          const t = String(c.text ?? '')
          texts.push(t)
          if (t.trim() && messages.length < MAX_MSGS)
            messages.push({ role: 'ai', text: cut(t), at })
        } else if (c.type === 'tool_use') {
          const cmd = String((c.input as { command?: string } | undefined)?.command ?? '')
          if (cmd) texts.push(cmd)
          if (cmd.includes('vivibe_tts')) commands.set(String(c.id), cmd)
        }
      }
    } else if (j.type === 'user') {
      if (
        typeof content === 'string' ||
        (Array.isArray(content) && content.every((c) => c?.type === 'text'))
      ) {
        const t = textOf(content)
        if (j.isSidechain || j.isMeta || !isHumanText(t)) return
        texts.push(t)
        if (messages.length < MAX_MSGS) messages.push({ role: 'user', text: cut(t), at })
      } else if (Array.isArray(content)) {
        for (const c of content as Record<string, unknown>[]) {
          if (c.type !== 'tool_result') continue
          const cmd = commands.get(String(c.tool_use_id))
          if (!cmd) continue
          commands.delete(String(c.tool_use_id))
          const r = voiceRunOf(cmd, textOf(c.content))
          if (r) runs.push({ ...r, at, src: `claude-${String(c.tool_use_id)}` })
        }
      }
    }
  })
  if (messages.length === 0) return null
  const id = sessionId || path.basename(file, '.jsonl')
  const firstUser = messages.find((x) => x.role === 'user')?.text ?? ''
  return {
    chat: {
      id: `claude-${id}`,
      source: 'claude',
      title: chatTitle(title || firstUser || 'Trò chuyện với Claude Code'),
      startedAt: first,
      endedAt: last,
      slug: guessSlug(texts, slugs),
      messages: messages.length
    },
    messages,
    runs
  }
}

// ---------- quet ----------

function dirSize(dir: string): number {
  let total = 0
  const walk = (d: string): void => {
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name === 'node_modules') continue
      const p = path.join(d, e.name)
      try {
        if (e.isDirectory()) walk(p)
        else total += statSync(p).size
      } catch {
        // file dang bi khoa
      }
    }
  }
  walk(dir)
  return total
}

/** Thu muc co dau cach / co dau / trong OneDrive thi nen chep sang thu muc moi. */
export function needsCopy(dir: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /\s/.test(dir) || /[^\x00-\x7F]/.test(dir) || /\\onedrive/i.test(dir)
}

const cache = new Map<string, ScanFull>()

/** Quet thu muc cu. target: thu muc app se dung (chep sang neu khac thu muc cu). */
export async function scanLegacy(
  dir: string,
  target: string,
  onProgress?: (done: number, total: number) => void
): Promise<ScanFull> {
  const hit = cache.get(dir)
  if (hit) return { ...hit, scan: { ...hit.scan, target, needsCopy: !sameDir(dir, target) } }

  const ls: string[] = []
  await run(exe.git(), ['ls-files', '--', 'src/videos'], {
    cwd: dir,
    env: childEnv(dir),
    onLine: (l) => ls.push(l.trim())
  })
  const videos = scanVideos(dir, sampleSlugsFrom(ls), new Set())
  const slugs = new Set(videos.map((v) => v.slug))
  const own = videos.filter((v) => !v.sample)

  const codexFiles = codexHomes().flatMap((h) => walkJsonl(path.join(h, 'sessions')))
  const claudeFiles = claudeDirs(dir).flatMap((d) =>
    readdirSync(d)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => path.join(d, f))
  )
  const total = codexFiles.length + claudeFiles.length
  let done = 0
  const parsed: Parsed[] = []
  for (const f of codexFiles) {
    try {
      const p = await parseCodex(f, dir, slugs)
      if (p) parsed.push(p)
    } catch (e) {
      log.warn(`[du lieu cu] doc loi ${f}: ${String(e)}`)
    }
    onProgress?.(++done, total)
  }
  for (const f of claudeFiles) {
    try {
      const p = await parseClaude(f, slugs)
      if (p) parsed.push(p)
    } catch (e) {
      log.warn(`[du lieu cu] doc loi ${f}: ${String(e)}`)
    }
    onProgress?.(++done, total)
  }
  parsed.sort((a, b) => b.chat.startedAt - a.chat.startedAt)

  const seen = new Set<string>()
  const runs = parsed.flatMap((p) => p.runs).filter((r) => !seen.has(r.src) && seen.add(r.src))
  const full: ScanFull = {
    scan: {
      dir,
      videos: videos.length,
      ownVideos: own.length,
      unfinished: own.filter((v) => v.stage !== 'daXuat').length,
      sizeBytes: dirSize(dir),
      hasKey: !!readEnvFile(path.join(dir, '.env')).get('VIVIBE_API_KEY'),
      chats: parsed.map((p) => p.chat),
      voice: {
        runs: runs.length,
        chars: runs.reduce((s, r) => s + r.chars, 0),
        since: runs.length ? Math.min(...runs.map((r) => r.at)) : undefined
      },
      target,
      needsCopy: !sameDir(dir, target)
    },
    parsed
  }
  cache.set(dir, full)
  log.info(
    `[du lieu cu] ${dir}: ${videos.length} video, ${parsed.length} tro chuyen, ${runs.length} lan tao giong`
  )
  return full
}

// ---------- luu tro chuyen cu ----------

const store = (): string => {
  const d = path.join(app.getPath('userData'), 'tro-chuyen-cu')
  mkdirSync(d, { recursive: true })
  return d
}
type Index = Record<string, LegacyChat[]>
const indexFile = (): string => path.join(store(), 'index.json')
function readIndex(): Index {
  try {
    return JSON.parse(readFileSync(indexFile(), 'utf8'))
  } catch {
    return {}
  }
}
function writeIndex(i: Index): void {
  writeFileSync(indexFile(), JSON.stringify(i, null, 2))
}
const safeId = (id: string): string => id.replace(/[^A-Za-z0-9_-]/g, '_')

/** Tro chuyen cu cua mot du an; slug = '' lay tro chuyen chung (khong gan video). */
export function legacyChats(projectDir: string, slug?: string): LegacyChat[] {
  const all = readIndex()[path.resolve(projectDir)] ?? []
  if (slug === undefined) return all
  return all.filter((c) => (c.slug ?? '') === slug)
}

export function legacyTranscript(id: string): LegacyMessage[] {
  try {
    return JSON.parse(readFileSync(path.join(store(), `${safeId(id)}.json`), 'utf8'))
  } catch {
    return []
  }
}

/** Them mot cuoc vao danh sach tro chuyen cu (vd cuoc trong app bi thay khi mo tiep cuoc Codex cu). */
export function addLegacyChat(
  projectDir: string,
  chat: LegacyChat,
  messages?: LegacyMessage[]
): void {
  const i = readIndex()
  const key = path.resolve(projectDir)
  i[key] = [chat, ...(i[key] ?? []).filter((c) => c.id !== chat.id)]
  writeIndex(i)
  if (messages)
    writeFileSync(path.join(store(), `${safeId(chat.id)}.json`), JSON.stringify(messages))
}

export function removeLegacyChat(projectDir: string, id: string): void {
  const i = readIndex()
  const key = path.resolve(projectDir)
  i[key] = (i[key] ?? []).filter((c) => c.id !== id)
  writeIndex(i)
}

/** Ghi cac tro chuyen da quet vao kho cua app. Tra ve so cuoc da ghi. */
export function saveChats(projectDir: string, parsed: Parsed[]): number {
  const i = readIndex()
  const key = path.resolve(projectDir)
  const have = new Set((i[key] ?? []).map((c) => c.id))
  let n = 0
  for (const p of parsed) {
    writeFileSync(path.join(store(), `${safeId(p.chat.id)}.json`), JSON.stringify(p.messages))
    if (!have.has(p.chat.id)) n++
  }
  const ids = new Set(parsed.map((p) => p.chat.id))
  i[key] = [...parsed.map((p) => p.chat), ...(i[key] ?? []).filter((c) => !ids.has(c.id))].sort(
    (a, b) => b.startedAt - a.startedAt
  )
  writeIndex(i)
  return n
}

// ---------- chep ----------

/** Chep ca bo cong cu (tru node_modules: buoc Cai thu vien se cai lai). */
export async function copyRepo(
  from: string,
  to: string,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal
): Promise<void> {
  let total = 0
  const count = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules') continue
      if (e.isDirectory()) count(path.join(d, e.name))
      else total++
    }
  }
  count(from)
  let done = 0
  let lastPct = -1
  await mkdir(to, { recursive: true })
  await cp(from, to, {
    recursive: true,
    errorOnExist: false,
    force: false,
    filter: (src) => {
      if (signal.aborted) throw new Error('da huy')
      if (path.basename(src) === 'node_modules') return false
      try {
        if (!statSync(src).isDirectory()) {
          done++
          const pct = Math.floor((done / Math.max(1, total)) * 100)
          if (pct !== lastPct) {
            lastPct = pct
            onProgress(done, total)
          }
        }
      } catch {
        // file vua mat
      }
      return true
    }
  })
}

/** Chep cac video chua co sang thu muc dang dung (nhan tu Cai dat, khong chep ca bo cong cu). */
export async function copyMissingVideos(from: string, to: string): Promise<number> {
  const src = path.join(from, 'src', 'videos')
  if (!existsSync(src)) return 0
  let n = 0
  for (const d of readdirSync(src, { withFileTypes: true })) {
    if (!d.isDirectory() || !existsSync(path.join(src, d.name, 'script.json'))) continue
    if (existsSync(path.join(to, 'src', 'videos', d.name))) continue
    for (const rel of [
      ['src', 'videos', d.name],
      ['public', 'audio', d.name],
      ['public', d.name]
    ]) {
      const a = path.join(from, ...rel)
      if (existsSync(a)) await cp(a, path.join(to, ...rel), { recursive: true, force: false })
    }
    n++
  }
  return n
}

/** Lay key Vivibe tu .env cu neu thu muc dang dung chua co. */
export function copyKey(from: string, to: string): boolean {
  const key = readEnvFile(path.join(from, '.env')).get('VIVIBE_API_KEY')
  if (!key) return false
  if (readEnvFile(path.join(to, '.env')).get('VIVIBE_API_KEY')) return true
  writeEnvValues(path.join(to, '.env'), { VIVIBE_API_KEY: key })
  return true
}

/** Chep file ghi tro chuyen Codex cu vao CODEX_HOME cua app de mo tiep duoc. */
export async function bringCodexRollout(file: string, codexHome: string): Promise<void> {
  const rel = path.relative(path.join(file, '..', '..', '..', '..'), file)
  const dest = path.join(codexHome, 'sessions', rel)
  if (existsSync(dest)) return
  await mkdir(path.dirname(dest), { recursive: true })
  await copyFile(file, dest)
}

export type { LegacySource }
