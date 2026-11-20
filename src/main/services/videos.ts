// Dieu phoi man Video cua toi + man mot video: danh sach video, theo doi thu muc, phien chat, Studio.
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import type {
  AudioLine,
  ChipId,
  Lesson,
  NewVideoInput,
  ScriptData,
  VideosSnapshot
} from '../../shared/video'
import { STAGE_CHANGING_CHIPS, chipPrompt, composeNewVideoPrompt } from '../../shared/prompt'
import { getSettings } from './settings'
import { childEnv, exe } from './runtime'
import { run } from './process'
import {
  listAudio,
  listLessons,
  outputBase,
  readScript,
  sampleSlugsFrom,
  scanVideos
} from './project'
import { CodexSession, slugsWithChat } from './codex/session'
import { StudioService } from './studio'
import { latestNumericTag } from './rules'
import log from '../log'

export class VideosService extends EventEmitter {
  private samples?: Set<string>
  private version?: string
  private watcher?: FSWatcher
  private watchTimer?: NodeJS.Timeout
  private session?: CodexSession
  private studio?: StudioService
  private dirOfSession = ''

  get projectDir(): string {
    return getSettings().projectDir ?? ''
  }

  /** Video mau + ban bo cong cu: hoi git mot lan moi phien. */
  private async loadRepoFacts(): Promise<void> {
    if (this.samples) return
    const dir = this.projectDir
    const files: string[] = []
    const tags: string[] = []
    const env = childEnv(dir)
    await run(exe.git(), ['ls-files', '--', 'src/videos'], {
      cwd: dir,
      env,
      onLine: (l) => files.push(l)
    })
    await run(exe.git(), ['tag', '--points-at', 'HEAD'], {
      cwd: dir,
      env,
      onLine: (l) => tags.push(l)
    })
    this.samples = sampleSlugsFrom(files)
    this.version = latestNumericTag(tags) ?? undefined
  }

  async list(): Promise<VideosSnapshot> {
    const dir = this.projectDir
    if (!dir) return { videos: [], outputDir: '' }
    await this.loadRepoFacts().catch((e) => log.warn(`[videos] doc git loi: ${String(e)}`))
    this.ensureWatch()
    return {
      videos: scanVideos(dir, this.samples ?? new Set(), slugsWithChat(dir)),
      toolkitVersion: this.version,
      outputDir: outputBase(dir)
    }
  }

  script(slug: string): ScriptData | null {
    return readScript(this.projectDir, slug)
  }
  audio(slug: string): AudioLine[] {
    return listAudio(this.projectDir, slug)
  }
  lessons(subject: string, lop: number): Lesson[] {
    return listLessons(this.projectDir, subject, lop)
  }

  /** Thu muc giao dien duoc mo file (app-file://). */
  allowedRoots(): string[] {
    const dir = this.projectDir
    return dir ? [dir, outputBase(dir)] : []
  }

  // ---------- theo doi thu muc ----------

  private ensureWatch(): void {
    const root = path.join(this.projectDir, 'src', 'videos')
    if (this.watcher || !existsSync(root)) return
    try {
      this.watcher = watch(root, { recursive: true }, () => this.changedSoon())
    } catch (e) {
      log.warn(`[videos] khong theo doi duoc thu muc: ${String(e)}`)
    }
  }

  changedSoon(): void {
    if (this.watchTimer) clearTimeout(this.watchTimer)
    this.watchTimer = setTimeout(() => {
      void this.list().then((snap) => this.emit('changed', snap))
    }, 600)
  }

  // ---------- chat ----------

  chat(): CodexSession {
    const dir = this.projectDir
    if (!this.session || this.dirOfSession !== dir) {
      this.session?.stop()
      this.session = new CodexSession(dir)
      this.dirOfSession = dir
      this.session.on('changed', (s) => this.emit('chat', s))
      this.session.on('turnDone', () => {
        this.changedSoon()
        this.emit('turnDone')
      })
    }
    return this.session
  }

  async create(input: NewVideoInput): Promise<string> {
    const key = `moi-${Date.now()}`
    void this.chat().send(key, composeNewVideoPrompt(input))
    return key
  }

  async chip(key: string, chip: ChipId, slug: string): Promise<void> {
    const s = this.chat()
    await s.open(key)
    if (STAGE_CHANGING_CHIPS.includes(chip)) await s.compact(key)
    await s.send(key, chipPrompt(chip, slug))
  }

  /** Doi ban khi co file bo cong cu bi sua: nho skill phien-ban lam, giu bai cua nguoi dung. */
  handoffUpdate(target: string): string {
    const key = 'he-phien-ban'
    void this.chat().send(
      key,
      `$phien-ban
Cập nhật bộ công cụ lên bản ${target}. Giữ nguyên bài và các góp ý tôi đã dạy AI. Nếu có chỗ phải chọn thì hỏi tôi bằng lời dễ hiểu.`
    )
    return key
  }

  /** Bo cong cu vua doi ban: doc lai danh sach video, ban, va bat lai Studio khi can. */
  toolkitChanged(): void {
    this.samples = undefined
    this.studio?.stop()
    this.studio = undefined
    this.changedSoon()
  }

  studioUrl(): Promise<string> {
    if (!this.studio) this.studio = new StudioService(this.projectDir)
    return this.studio.start()
  }

  stopAll(): void {
    this.session?.stop()
    this.studio?.stop()
    this.watcher?.close()
  }
}
