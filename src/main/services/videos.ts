// Dieu phoi man Video cua toi + man mot video: danh sach video, theo doi thu muc, phien chat, Studio.
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import type {
  AiStatus,
  AudioLine,
  VideoInfo,
  ChipId,
  Lesson,
  NewVideoInput,
  ScriptData,
  VideosSnapshot
} from '../../shared/video'
import { STAGE_CHANGING_CHIPS, chipPrompt, composeNewVideoPrompt } from '../../shared/prompt'
import { getSettings } from './settings'
import { childEnv, codexHome, exe } from './runtime'
import { run } from './process'
import {
  listAudio,
  listLessons,
  outputBase,
  readScript,
  sampleSlugsFrom,
  scanVideos
} from './project'
import {
  CodexSession,
  boundThreads,
  forgetThread,
  slugsWithChat,
  threadOf,
  unboundNewChats
} from './codex/session'
import { dropDrafts, readDrafts, recoverDraft, saveDraft } from './drafts'
import { recordVoiceRun } from './vivibe-usage'
import type { VoiceRunInfo } from '../../shared/vivibe'
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
    const videos = [
      ...scanVideos(dir, this.samples ?? new Set(), slugsWithChat(dir)),
      ...this.drafts()
    ]
    videos.sort((a, b) => Number(a.sample) - Number(b.sample) || b.updatedAt - a.updatedAt)
    return {
      videos,
      toolkitVersion: this.version,
      outputDir: outputBase(dir)
    }
  }

  /** Video moi dang do (AI chua tao thu muc video). Video da co thu muc thi bo khoi danh sach nay. */
  private drafts(): VideoInfo[] {
    const dir = this.projectDir
    const all = readDrafts(dir)
    const bound = boundThreads(dir)
    const done = Object.keys(all).filter((k) => {
      const t = threadOf(dir, k)
      return !!t && bound.has(t)
    })
    dropDrafts(dir, done)
    const list: VideoInfo[] = Object.entries(all)
      .filter(([k]) => !done.includes(k))
      .map(([key, d]) => ({
        slug: key,
        title: d.title,
        subject: d.subject,
        lop: d.lop,
        loai: d.loai,
        stage: 'kichBan' as const,
        sample: false,
        updatedAt: d.createdAt,
        hasChat: true,
        draft: true
      }))
    // Video moi dung giua chung tu ban app cu (chua luu thong tin bai): van hien de lam tiep
    for (const key of unboundNewChats(dir)) {
      if (all[key]) continue
      const thread = threadOf(dir, key)
      const d = thread ? recoverDraft(dir, key, thread, codexHome()) : null
      list.push({
        slug: key,
        title: d?.title ?? 'Video mới (chưa có tên)',
        subject: d?.subject ?? '',
        lop: d?.lop,
        loai: d?.loai,
        stage: 'kichBan',
        sample: false,
        updatedAt: Number(key.slice(4)) || 0,
        hasChat: true,
        draft: true
      })
    }
    return list
  }

  /** Lam tiep video moi dang do: chua co cuoc tro chuyen thi gui lai yeu cau goc. */
  async resumeDraft(key: string): Promise<void> {
    const d = readDrafts(this.projectDir)[key]
    const s = this.chat()
    await s.open(key)
    if (!threadOf(this.projectDir, key)) return d ? s.send(key, d.prompt) : undefined
    return s.send(
      key,
      'Làm tiếp việc đang dở: viết kịch bản cho bài này theo yêu cầu ở đầu cuộc trò chuyện. Nếu đã tạo thư mục video thì làm tiếp trên đó.'
    )
  }

  dropDraft(key: string): void {
    dropDrafts(this.projectDir, [key])
    forgetThread(this.projectDir, key)
    this.changedSoon()
  }

  /** Ban bo cong cu dang dung (tag so tren commit hien tai). */
  async toolkitVersion(): Promise<string | undefined> {
    await this.loadRepoFacts().catch(() => undefined)
    return this.version
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

  /** Trang thai AI tung bai (khong khoi dong Codex neu chua chay). */
  aiStatuses(): Record<string, AiStatus> {
    return this.session?.statuses() ?? {}
  }

  /** Ten cac bai AI dang lam viec (khong khoi dong Codex neu chua chay). */
  async busyTitles(): Promise<string[]> {
    const keys = this.session?.busyKeys() ?? []
    if (!keys.length) return []
    const list = (await this.list()).videos
    return keys.map((k) => list.find((v) => v.slug === k)?.title ?? k)
  }

  chat(): CodexSession {
    const dir = this.projectDir
    if (!this.session || this.dirOfSession !== dir) {
      this.session?.stop()
      this.session = new CodexSession(dir)
      this.dirOfSession = dir
      this.session.on('changed', (s) => this.emit('chat', s))
      this.session.on('voiceRun', (run: VoiceRunInfo) => {
        try {
          recordVoiceRun(dir, run)
          this.emit('vivibe')
        } catch (e) {
          log.warn(`[vivibe] khong ghi duoc so ky tu: ${String(e)}`)
        }
      })
      this.session.on('turnDone', () => {
        this.changedSoon()
        this.emit('turnDone')
      })
    }
    return this.session
  }

  async create(input: NewVideoInput): Promise<string> {
    const key = `moi-${Date.now()}`
    const prompt = composeNewVideoPrompt(input)
    // Luu ngay: bam Dung truoc khi AI tao thu muc thi van thay video trong danh sach de lam tiep
    saveDraft(this.projectDir, key, input, prompt)
    void this.chat().send(key, prompt)
    this.changedSoon()
    return key
  }

  async chip(key: string, chip: ChipId, slug: string): Promise<void> {
    const s = this.chat()
    await s.open(key)
    // Sang buoc moi: don bo nho AI cho do ton luot (tat duoc trong Cai dat)
    if (STAGE_CHANGING_CHIPS.includes(chip) && getSettings().autoCompact !== false)
      await s.compact(key)
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
