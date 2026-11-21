// 9 buoc cai dat lan dau. Moi buoc co check() (da xong chua) va run() (lam), bao tien trinh qua snapshot.
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { existsSync, mkdirSync, readdirSync, readFileSync, statfsSync } from 'node:fs'
import { canWriteTo, ensureDir } from './fs-util'
import {
  OPTIONAL_STEPS,
  SETUP_ORDER,
  STEP_TASKS,
  type TaskId,
  type TaskState,
  type ErrorCode,
  type ExistingRepo,
  type MachineCheck,
  type SetupInput,
  type SetupSnapshot,
  type SetupStepId,
  type StepState
} from '../../shared/types'
import { getSettings, updateSettings } from './settings'
import { childEnv, exe } from './runtime'
import { run, type RunResult } from './process'
import {
  countLockPackages,
  gitCloneProgress,
  gitTransfer,
  remotionDownload,
  isNpmFetchLine,
  latestNumericTag,
  looksLikeNetworkError,
  validateProjectDir
} from './rules'
import { maskKey, readEnvFile, writeEnvValues } from './env-file'
import {
  defaultSearchRoots,
  findVideoRepos,
  isVideoRepo,
  librariesInstalled,
  renderBrowserInstalled
} from './detect'
import { loginChatGpt, prepareSandbox, readAccount, sandboxReadiness } from './codex/account'
import {
  downloadDriveSetup,
  findGoogleDrive,
  isSignedByGoogle,
  openDriveSetup
} from './google-drive'
import { FEEDBACK_FOLDER, feedbackDir } from './feedback'
import { copyRepo, needsCopy, saveChats, scanLegacy } from './legacy'
import { importVoiceRuns } from './vivibe-usage'
import type { LegacyOptions } from '../../shared/legacy'
import log from '../log'

export const VIDEO_REPO_URL = 'https://github.com/PhcdY/remotion_claudecode.git'
export const VIDEO_REPO_BRANCH = 'main-codex'
const MIN_FREE_GB = 15

class StepError extends Error {
  constructor(
    public readonly code: ErrorCode,
    detail?: string
  ) {
    super(detail ?? code)
  }
}

function freeGb(p: string): number {
  try {
    const root = path.parse(path.resolve(p)).root
    const s = statfsSync(root)
    return (s.bavail * s.bsize) / 1024 ** 3
  } catch {
    return Infinity
  }
}

function defaultProjectDir(): string {
  return existsSync('D:\\') ? 'D:\\9Study\\VideoAI' : 'C:\\9Study\\VideoAI'
}

export class SetupService extends EventEmitter {
  private states = new Map<SetupStepId, StepState>()
  private controllers = new Map<SetupStepId, AbortController>()
  private account?: { email: string; plan: string }
  private checks: MachineCheck[] = []
  private driveDir: string | null = null
  /** Bo cong cu da co san tren may (nguoi dung tung tai ve, vd bang VS Code) */
  private existingRepos: ExistingRepo[] = []

  constructor() {
    super()
    for (const id of SETUP_ORDER) this.states.set(id, { id, status: 'locked' })
    // Buoc cho nguoi dung lam ngoai app (cai Drive, them loi tat thu muc gop y): tu thay khi xong
    setInterval(() => this.watchOutside(), 5000).unref()
  }

  private watchOutside(): void {
    const waiting = (id: SetupStepId): boolean => {
      const s = this.states.get(id)!.status
      return s === 'ready' || s === 'error'
    }
    let changed = false
    if (waiting('googleDrive') && findGoogleDrive()) {
      this.set('googleDrive', { status: 'done', progress: 100 }, true)
      changed = true
    }
    const fb = feedbackDir()
    if (waiting('gopY') && fb && existsSync(fb)) {
      updateSettings({ feedbackDir: fb })
      this.set('gopY', { status: 'done', progress: 100 }, true)
      changed = true
    }
    if (changed) void this.refresh()
  }

  get projectDir(): string {
    return getSettings().projectDir ?? ''
  }
  private get envFile(): string {
    return path.join(this.projectDir, '.env')
  }

  // ---------- trang thai ----------

  snapshot(): SetupSnapshot {
    const env = this.projectDir ? readEnvFile(this.envFile) : new Map<string, string>()
    const key = env.get('VIVIBE_API_KEY')
    const steps = SETUP_ORDER.map((id) => ({ ...this.states.get(id)! }))
    return {
      steps,
      projectDir: this.projectDir,
      outputDir: env.get('OUTPUT_DIR') ?? '',
      suggestedProjectDir: this.projectDir || defaultProjectDir(),
      suggestedOutputDir: this.driveDir
        ? path.join(this.driveDir, '9Study Video')
        : path.join(path.dirname(this.projectDir || defaultProjectDir()), 'VideoXuat'),
      driveFound: !!this.driveDir,
      existingRepos: this.existingRepos,
      legacy: getSettings().legacySource
        ? {
            source: getSettings().legacySource!,
            pending: !!getSettings().legacyPending,
            result: getSettings().legacyResult
          }
        : undefined,
      account: this.account,
      vivibeKeyMasked: key ? maskKey(key) : undefined,
      checks: this.checks,
      allDone: steps.every((s) => s.status === 'done' || s.status === 'skipped')
    }
  }

  private set(id: SetupStepId, patch: Partial<StepState>, replace = false): void {
    const cur = this.states.get(id)!
    this.states.set(id, replace ? { id, status: cur.status, ...patch } : { ...cur, ...patch })
    this.relock()
    this.emit('changed', this.snapshot())
  }

  /** Buoc mo khi moi buoc truoc no (tru buoc tuy chon) da xong / bo qua. */
  private relock(): void {
    let open = true
    for (const id of SETUP_ORDER) {
      const s = this.states.get(id)!
      if (s.status === 'locked' && open) s.status = 'ready'
      else if (!open && (s.status === 'ready' || s.status === 'error')) s.status = 'locked'
      const passed =
        s.status === 'done' ||
        s.status === 'skipped' ||
        (OPTIONAL_STEPS.includes(id) && s.status !== 'running')
      if (!passed) open = false
    }
  }

  private refreshing?: Promise<SetupSnapshot>

  /** Doc lai trang thai that tu may (lan mo app). Khong chay viec dai. Goi trung nhau thi dung chung mot lan doc. */
  refresh(): Promise<SetupSnapshot> {
    this.refreshing ??= this.doRefresh().finally(() => (this.refreshing = undefined))
    return this.refreshing
  }

  private async doRefresh(): Promise<SetupSnapshot> {
    this.driveDir = findGoogleDrive()
    // Chua chon thu muc thi do xem may da co bo cong cu chua, de dung lai thay vi tai moi
    // (ca khi da chon thu muc nhung chua tai gi vao do)
    const needRepo = !this.projectDir || !isVideoRepo(this.projectDir)
    this.existingRepos = !needRepo
      ? []
      : findVideoRepos(defaultSearchRoots())
          .filter((dir) => path.resolve(dir) !== path.resolve(this.projectDir || '.'))
          .map((dir) => ({ dir, ready: librariesInstalled(dir) && renderBrowserInstalled(dir) }))
          .sort((a, b) => Number(b.ready) - Number(a.ready))
    if (this.existingRepos.length)
      log.info(
        `[setup] tim thay bo cong cu co san: ${this.existingRepos.map((r) => r.dir).join(', ')}`
      )
    const skipped = getSettings().skipped
    for (const id of SETUP_ORDER) {
      if (this.states.get(id)!.status === 'running') continue
      let done = false
      try {
        done = await this.check(id)
      } catch (e) {
        log.warn(`[setup] check ${id} loi: ${String(e)}`)
      }
      const status = done ? 'done' : skipped.includes(id) ? 'skipped' : 'locked'
      // Giu danh sach cac phan da lam (de xem lai da tai nhung gi)
      const prevTasks = this.states.get(id)!.tasks
      this.states.set(id, { id, status, tasks: done ? prevTasks : undefined })
    }
    this.relock()
    const snap = this.snapshot()
    this.emit('changed', snap)
    return snap
  }

  private async check(id: SetupStepId): Promise<boolean> {
    const dir = this.projectDir
    switch (id) {
      case 'thuMuc':
        return !!dir && validateProjectDir(dir, { existing: isVideoRepo(dir) }) === null
      case 'taiDuAn':
        // Dang cho nguoi dung chon nhan du lieu cu: chua xong
        return !!dir && isVideoRepo(dir) && !getSettings().legacyPending
      case 'caiThuVien':
        // Da cai (boi app hay boi nguoi dung tu `npm install`) va da co trinh duyet render
        return !!dir && librariesInstalled(dir) && renderBrowserInstalled(dir)
      case 'dangNhap':
        this.account = (await readAccount()) ?? undefined
        return !!this.account
      case 'keyGiong':
        return !!dir && !!readEnvFile(this.envFile).get('VIVIBE_API_KEY')
      case 'googleDrive':
        return !!findGoogleDrive()
      case 'noiLuu':
        return !!dir && !!readEnvFile(this.envFile).get('OUTPUT_DIR')
      case 'gopY': {
        const fb = feedbackDir()
        return !!fb && existsSync(fb)
      }
      case 'kiemTra':
        return !!getSettings().machineChecked
    }
  }

  // ---------- chay buoc ----------

  async runStep(id: SetupStepId, input: SetupInput = {}): Promise<void> {
    const st = this.states.get(id)!
    if (st.status === 'running' || st.status === 'locked') return
    const ctrl = new AbortController()
    this.controllers.set(id, ctrl)
    this.set(id, {
      status: 'running',
      progress: 0,
      detail: undefined,
      error: undefined,
      tasks: STEP_TASKS[id]?.map((t) => ({ id: t, status: 'waiting' }))
    })
    try {
      await this.doStep(id, input, ctrl.signal)
      if (getSettings().skipped.includes(id))
        updateSettings({ skipped: getSettings().skipped.filter((s) => s !== id) })
      this.set(id, { status: 'done', progress: 100, tasks: this.states.get(id)!.tasks }, true)
      // Doc lai cac buoc sau: viec nao may da co san (bo cong cu, thu vien, key...) thi tu qua
      await this.refresh()
    } catch (e) {
      const code: ErrorCode =
        e instanceof StepError ? e.code : ctrl.signal.aborted ? 'khongRo' : 'khongRo'
      log.error(`[setup] buoc ${id} loi (${code}): ${e instanceof Error ? e.message : String(e)}`)
      const tasks = this.states
        .get(id)!
        .tasks?.map((t) => (t.status === 'running' ? { ...t, status: 'error' as const } : t))
      this.set(
        id,
        ctrl.signal.aborted ? { status: 'ready' } : { status: 'error', error: code, tasks },
        true
      )
    } finally {
      this.controllers.delete(id)
    }
  }

  cancel(id: SetupStepId): void {
    this.controllers.get(id)?.abort()
  }

  skip(id: SetupStepId): void {
    if (!OPTIONAL_STEPS.includes(id)) return
    updateSettings({ skipped: [...new Set([...getSettings().skipped, id])] })
    this.set(id, { status: 'skipped' }, true)
  }

  /** Cap nhat mot phan cua buoc; tien trinh chung cua buoc = trung binh cac phan. */
  private task(id: SetupStepId, taskId: TaskId, patch: Partial<TaskState>): void {
    const cur = this.states.get(id)!
    if (!cur.tasks) return
    const tasks = cur.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            ...patch,
            ...(patch.status === 'done' || patch.status === 'skipped' ? { progress: 100 } : {})
          }
        : t
    )
    const weight = (t: TaskState): number =>
      t.status === 'done' || t.status === 'skipped'
        ? 100
        : t.status === 'running'
          ? (t.progress ?? 0)
          : 0
    const progress = Math.round(tasks.reduce((a, t) => a + weight(t), 0) / tasks.length)
    this.set(id, { tasks, progress })
  }

  private progress(id: SetupStepId, progress: number, detail?: string): void {
    const cur = this.states.get(id)!
    if (cur.progress === progress && cur.detail === detail) return
    this.set(id, { progress, detail })
  }

  private async doStep(id: SetupStepId, input: SetupInput, signal: AbortSignal): Promise<void> {
    switch (id) {
      case 'thuMuc':
        return input.fromExisting && input.dir
          ? this.stepThuMucCu(input.dir)
          : this.stepThuMuc(input.dir ?? this.snapshot().suggestedProjectDir)
      case 'taiDuAn':
        if (getSettings().legacyPending) {
          if (input.legacy) return this.stepNhanDuLieuCu(input.legacy, signal)
          if (input.noLegacy) updateSettings({ legacyPending: false, legacySource: undefined })
        }
        return this.stepTaiDuAn(signal)
      case 'caiThuVien':
        return this.stepCaiThuVien(signal)
      case 'dangNhap':
        return this.stepDangNhap(signal)
      case 'keyGiong':
        // Khong dua key moi: kiem tra lai key da luu (nut "Kiem tra lai" trong Cai dat)
        return this.stepKeyGiong(
          input.key ?? readEnvFile(this.envFile).get('VIVIBE_API_KEY') ?? '',
          signal
        )
      case 'googleDrive':
        return this.stepGoogleDrive(signal)
      case 'noiLuu':
        return this.stepNoiLuu(input.dir ?? this.snapshot().suggestedOutputDir)
      case 'gopY':
        return this.stepGopY(input.dir)
      case 'kiemTra':
        return this.stepKiemTra()
    }
  }

  /** Tai bo cai Google Drive, kiem chu ky Google, mo bo cai, cho nguoi dung cai va dang nhap. */
  private async stepGoogleDrive(signal: AbortSignal): Promise<void> {
    const id = 'googleDrive'
    if (findGoogleDrive()) {
      for (const t of ['taiDrive', 'caiDrive', 'dangNhapDrive'] as const)
        this.task(id, t, { status: 'skipped' })
      return
    }
    this.task(id, 'taiDrive', { status: 'running', progress: 0 })
    let file: string
    try {
      file = await downloadDriveSetup(this.projectDir, signal, (done, total) =>
        this.task(id, 'taiDrive', {
          progress: total ? Math.round((done / total) * 100) : undefined,
          amount: { done: Math.round(done), total: total && Math.round(total), unit: 'mb' }
        })
      )
    } catch (e) {
      if (signal.aborted) throw e
      throw new StepError('mang', String(e))
    }
    if (!(await isSignedByGoogle(file)))
      throw new StepError('driveKhongHopLe', 'bo cai khong co chu ky Google LLC')
    this.task(id, 'taiDrive', { status: 'done' })
    this.task(id, 'caiDrive', { status: 'running' })
    const err = await openDriveSetup(file)
    if (err) throw new StepError('taiDriveLoi', err)
    this.task(id, 'caiDrive', { status: 'done' })
    // Drive chi hien o (vd G:\My Drive) sau khi cai xong va dang nhap Google
    this.task(id, 'dangNhapDrive', { status: 'running' })
    const until = Date.now() + 30 * 60_000
    while (!findGoogleDrive()) {
      if (signal.aborted) throw new Error('huy')
      if (Date.now() > until) throw new StepError('taiDriveLoi', 'cho Drive qua 30 phut')
      await new Promise((r) => setTimeout(r, 3000))
    }
    this.task(id, 'dangNhapDrive', { status: 'done' })
  }

  /** Thu muc gop y chung: tu tim trong Drive (sau khi them loi tat), hoac nguoi dung tu chon. */
  private stepGopY(dir?: string): void {
    if (dir) {
      const target = /9Study_GopY$/i.test(dir) ? dir : path.join(dir, FEEDBACK_FOLDER)
      try {
        mkdirSync(target, { recursive: true })
      } catch {
        throw new StepError('khongGhiDuoc', `khong tao duoc ${target}`)
      }
      updateSettings({ feedbackDir: target })
      return
    }
    const found = feedbackDir()
    if (!found || !existsSync(found)) throw new StepError('chuaThayGopY')
    updateSettings({ feedbackDir: found })
  }

  private stepThuMuc(dir: string): void {
    const existing = isVideoRepo(dir)
    const bad = validateProjectDir(dir, { existing })
    if (bad) throw new StepError(bad)
    // Bo co san: ghi thu vao chinh no. Thu muc moi: ghi thu vao thu muc cha (co the la goc o, vd D:\)
    const target = existing ? dir : path.dirname(dir)
    if (!canWriteTo(target)) throw new StepError('khongGhiDuoc', `khong ghi duoc vao ${target}`)
    // Thu muc co file: chi nhan khi do chinh la bo cong cu
    if (!existing && existsSync(dir) && readdirSync(dir).length > 0) {
      throw new StepError('thuMucCoSan')
    }
    // Bo co san thi da chiem cho roi, chi can du cho cho video
    if (freeGb(dir) < (existing ? 5 : MIN_FREE_GB)) throw new StepError('khongDuCho')
    updateSettings({ projectDir: path.resolve(dir) })
  }

  /** Buoc 1, chon bo cong cu cu: thu muc co dau cach / co dau thi buoc 2 chep sang thu muc moi. */
  private stepThuMucCu(source: string): void {
    if (!isVideoRepo(source)) throw new StepError('khongRo', `khong phai bo cong cu: ${source}`)
    let target = source
    if (needsCopy(source)) {
      // Thu muc mac dinh da co gi (vd bo cong cu khac) thi dung VideoAI2, VideoAI3...
      const base = defaultProjectDir()
      target = base
      for (let i = 2; existsSync(target) && readdirSync(target).length > 0; i++)
        target = `${base}${i}`
      if (!canWriteTo(path.dirname(target)))
        throw new StepError('khongGhiDuoc', `khong ghi duoc vao ${path.dirname(target)}`)
      if (freeGb(path.dirname(target)) < MIN_FREE_GB) throw new StepError('khongDuCho')
    }
    updateSettings({
      projectDir: path.resolve(target),
      legacySource: path.resolve(source),
      legacyPending: true,
      legacyResult: undefined
    })
  }

  /** Buoc 2, nhan du lieu cu: chep bo cong cu (neu can), ghi tro chuyen cu, cong credit Vivibe. */
  private async stepNhanDuLieuCu(opts: LegacyOptions, signal: AbortSignal): Promise<void> {
    const source = getSettings().legacySource!
    const target = this.projectDir
    this.set('taiDuAn', {
      tasks: (['chepBoCongCu', 'nhanTroChuyen', 'congCredit'] as const).map((t) => ({
        id: t,
        status: 'waiting'
      }))
    })
    const full = await scanLegacy(source, target)

    if (path.resolve(source) !== path.resolve(target) && !isVideoRepo(target)) {
      this.task('taiDuAn', 'chepBoCongCu', { status: 'running', progress: 0 })
      await copyRepo(
        source,
        target,
        (done, total) =>
          this.task('taiDuAn', 'chepBoCongCu', {
            progress: Math.floor((done / Math.max(1, total)) * 100)
          }),
        signal
      )
      this.task('taiDuAn', 'chepBoCongCu', { status: 'done' })
    } else this.task('taiDuAn', 'chepBoCongCu', { status: 'skipped' })

    let chats = 0
    if (opts.chats) {
      this.task('taiDuAn', 'nhanTroChuyen', { status: 'running' })
      chats = saveChats(target, full.parsed)
      this.task('taiDuAn', 'nhanTroChuyen', { status: 'done' })
    } else this.task('taiDuAn', 'nhanTroChuyen', { status: 'skipped' })

    let chars = 0
    if (opts.voice) {
      this.task('taiDuAn', 'congCredit', { status: 'running' })
      const runs = full.parsed.flatMap((p) => p.runs)
      chars = importVoiceRuns(target, runs)
      this.task('taiDuAn', 'congCredit', { status: 'done' })
    } else this.task('taiDuAn', 'congCredit', { status: 'skipped' })

    updateSettings({
      legacyPending: false,
      legacyResult: {
        videos: full.scan.ownVideos,
        chats: opts.chats ? full.scan.chats.length : 0,
        chars,
        key: !!readEnvFile(path.join(target, '.env')).get('VIVIBE_API_KEY')
      }
    })
    log.info(`[du lieu cu] da nhan tu ${source}: ${chats} tro chuyen moi, ${chars} ky tu Vivibe`)
  }

  private git(
    args: string[],
    signal: AbortSignal,
    onLine?: (l: string) => void,
    cwd = this.projectDir
  ): Promise<RunResult> {
    return run(exe.git(), ['-c', 'core.longpaths=true', ...args], {
      cwd,
      env: childEnv(this.projectDir),
      signal,
      onLine
    })
  }

  private async stepTaiDuAn(signal: AbortSignal): Promise<void> {
    const dir = this.projectDir
    // Bo cong cu da co san: khong dong vao (co the dang co bai do dang tren nhanh khac).
    // Doi ban ve sau di qua luong cap nhat an toan (Moc 3), khong phai o day.
    if (isVideoRepo(dir)) {
      for (const t of ['taiBoCongCu', 'layDanhSachBan', 'chuyenBanMoi'] as const)
        this.task('taiDuAn', t, { status: 'skipped' })
      return
    }
    if (existsSync(dir) && readdirSync(dir).length > 0) throw new StepError('thuMucCoSan')
    ensureDir(path.dirname(dir))

    this.task('taiDuAn', 'taiBoCongCu', { status: 'running', progress: 0 })
    let amount: TaskState['amount']
    let speedMbps: number | undefined
    const res = await this.git(
      ['clone', '--progress', '--branch', VIDEO_REPO_BRANCH, VIDEO_REPO_URL, dir],
      signal,
      (l) => {
        const tr = gitTransfer(l)
        if (tr) {
          amount = { done: tr.mb, unit: 'mb' }
          speedMbps = tr.speedMbps ?? speedMbps
        }
        const p = gitCloneProgress(l)
        if (p !== null) this.task('taiDuAn', 'taiBoCongCu', { progress: p, amount, speedMbps })
      },
      path.dirname(dir)
    )
    if (signal.aborted) throw new Error('da huy')
    if (res.code !== 0)
      throw new StepError(looksLikeNetworkError(res.tail) ? 'mang' : 'khongRo', res.tail.join('\n'))
    this.task('taiDuAn', 'taiBoCongCu', { status: 'done', amount, speedMbps: undefined })
    await this.git(['config', 'core.longpaths', 'true'], signal)

    this.task('taiDuAn', 'layDanhSachBan', { status: 'running' })
    const fetched = await this.git(['fetch', '--tags', '--quiet'], signal)
    if (fetched.code !== 0)
      throw new StepError(
        looksLikeNetworkError(fetched.tail) ? 'mang' : 'khongRo',
        fetched.tail.join('\n')
      )
    const tags: string[] = []
    await this.git(['tag', '--list'], signal, (l) => tags.push(l))
    this.task('taiDuAn', 'layDanhSachBan', { status: 'done' })

    const tag = latestNumericTag(tags)
    if (!tag) {
      this.task('taiDuAn', 'chuyenBanMoi', { status: 'skipped' })
      return
    }
    this.task('taiDuAn', 'chuyenBanMoi', { status: 'running', version: tag })
    const sw = await this.git(['switch', '--detach', `refs/tags/${tag}`], signal)
    if (sw.code !== 0) throw new StepError('khongRo', sw.tail.join('\n'))
    this.task('taiDuAn', 'chuyenBanMoi', { status: 'done', version: tag })
    log.info(`[setup] da chuyen sang ban ${tag}`)
  }

  private async stepCaiThuVien(signal: AbortSignal): Promise<void> {
    const dir = this.projectDir
    const env = childEnv(dir)

    if (librariesInstalled(dir)) {
      this.task('caiThuVien', 'taiThuVien', { status: 'skipped' })
      this.task('caiThuVien', 'caiThuVien', { status: 'skipped' })
    } else {
      const total =
        countLockPackages(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')) || 350
      let fetched = 0
      let lastFetch = Date.now()
      let phase: 'tai' | 'cai' = 'tai'
      this.task('caiThuVien', 'taiThuVien', {
        status: 'running',
        progress: 0,
        amount: { done: 0, total, unit: 'goi' }
      })
      // npm khong bao khi nao tai xong: tai gan du goi, hoac 6 giay khong tai them, thi coi la dang cai
      const toInstallPhase = (): void => {
        if (phase === 'cai') return
        phase = 'cai'
        this.task('caiThuVien', 'taiThuVien', {
          status: 'done',
          amount: { done: Math.min(fetched, total), total, unit: 'goi' }
        })
        this.task('caiThuVien', 'caiThuVien', { status: 'running' })
      }
      const timer = setInterval(() => {
        if (phase === 'tai' && fetched > total * 0.5 && Date.now() - lastFetch > 6000)
          toInstallPhase()
      }, 1000)
      try {
        const res = await run(exe.npm(), ['ci', '--loglevel=http', '--no-fund', '--no-audit'], {
          cwd: dir,
          env,
          signal,
          onLine: (l) => {
            if (!isNpmFetchLine(l) || phase === 'cai') return
            fetched++
            lastFetch = Date.now()
            this.task('caiThuVien', 'taiThuVien', {
              progress: Math.min(99, Math.round((fetched / total) * 100)),
              amount: { done: Math.min(fetched, total), total, unit: 'goi' }
            })
            if (fetched >= total) toInstallPhase()
          }
        })
        if (signal.aborted) throw new Error('da huy')
        if (res.code !== 0)
          throw new StepError(
            looksLikeNetworkError(res.tail) ? 'mang' : 'caiThuVienLoi',
            res.tail.join('\n')
          )
      } finally {
        clearInterval(timer)
      }
      toInstallPhase()
      this.task('caiThuVien', 'caiThuVien', { status: 'done' })
    }

    if (renderBrowserInstalled(dir)) {
      this.task('caiThuVien', 'taiTrinhDuyet', { status: 'skipped' })
      return
    }
    this.task('caiThuVien', 'taiTrinhDuyet', { status: 'running', progress: 0 })
    const br = await run(exe.npx(), ['remotion', 'browser', 'ensure'], {
      cwd: dir,
      env,
      signal,
      onLine: (l) => {
        const d = remotionDownload(l)
        if (d)
          this.task('caiThuVien', 'taiTrinhDuyet', {
            progress: d.pct,
            amount: d.done !== undefined ? { done: d.done, total: d.total, unit: 'mb' } : undefined
          })
      }
    })
    if (signal.aborted) throw new Error('da huy')
    if (br.code !== 0)
      throw new StepError(
        looksLikeNetworkError(br.tail) ? 'mang' : 'taiTrinhDuyetLoi',
        br.tail.join('\n')
      )
    this.task('caiThuVien', 'taiTrinhDuyet', { status: 'done' })
  }

  private async stepDangNhap(signal: AbortSignal): Promise<void> {
    this.account = (await readAccount()) ?? undefined
    if (this.account) {
      this.task('dangNhap', 'dangNhap', { status: 'skipped' })
    } else {
      this.task('dangNhap', 'dangNhap', { status: 'running' })
      this.progress('dangNhap', this.states.get('dangNhap')!.progress ?? 0, 'choDangNhap')
      try {
        await loginChatGpt(signal)
      } catch (e) {
        if (signal.aborted) throw e
        throw new StepError('dangNhapLoi', String(e))
      }
      this.account = (await readAccount()) ?? undefined
      if (!this.account)
        throw new StepError('dangNhapLoi', 'dang nhap xong nhung khong doc duoc tai khoan')
      this.task('dangNhap', 'dangNhap', { status: 'done' })
    }
    this.progress('dangNhap', this.states.get('dangNhap')!.progress ?? 50, 'hopCat')
    this.task('dangNhap', 'cheDoAnToan', { status: 'running' })
    const ok = await prepareSandbox(this.projectDir)
    log.info(`[setup] sandbox san sang: ${ok}`)
    // Chua bat duoc thi van lam video binh thuong, AI chi hoi nhieu hon
    this.task('dangNhap', 'cheDoAnToan', { status: ok ? 'done' : 'skipped' })
  }

  private async stepKeyGiong(key: string, signal: AbortSignal): Promise<void> {
    const k = key.trim()
    if (!k) throw new StepError('keyTrong')
    if (/\s/.test(k)) throw new StepError('keySai')
    this.progress('keyGiong', 30, 'kiemTraKey')
    // Goi thu: liet ke giong cua tai khoan. Key di qua bien moi truong, khong qua tham so lenh.
    const res = await run(exe.py(), ['scripts/vivibe_tts.py', '--list-voices'], {
      cwd: this.projectDir,
      env: childEnv(this.projectDir, { VIVIBE_API_KEY: k }),
      signal,
      secrets: [k]
    })
    if (signal.aborted) throw new Error('da huy')
    if (res.code !== 0)
      throw new StepError(looksLikeNetworkError(res.tail) ? 'mang' : 'keySai', res.tail.join('\n'))
    writeEnvValues(this.envFile, { VIVIBE_API_KEY: k })
  }

  private stepNoiLuu(dir: string): void {
    if (!canWriteTo(dir)) throw new StepError('khongGhiDuoc', `khong ghi duoc vao ${dir}`)
    writeEnvValues(this.envFile, { OUTPUT_DIR: path.resolve(dir) })
  }

  private async stepKiemTra(): Promise<void> {
    const dir = this.projectDir
    const env = childEnv(dir)
    const version = async (cmd: string, args: string[]): Promise<string | undefined> => {
      const out: string[] = []
      const r = await run(cmd, args, { cwd: dir, env, onLine: (l) => out.push(l) })
      return r.code === 0 ? out.join(' ').trim() : undefined
    }
    const free = freeGb(dir)
    const freeC = freeGb('C:\\')
    const [node, python, git, codex] = await Promise.all([
      version(exe.node(), ['-v']),
      version(exe.py(), ['-V']),
      version(exe.git(), ['--version']),
      version(exe.codex(), ['--version'])
    ])
    const browserOk = existsSync(path.join(dir, 'node_modules', '.remotion'))
    let sandbox = 'notConfigured'
    try {
      sandbox = await sandboxReadiness()
    } catch {
      // Codex khong chay duoc: da bao o dong troLy
    }
    this.checks = [
      { id: 'oDia', ok: free >= 5, value: `${Math.floor(free)}` },
      { id: 'oC', ok: freeC >= 3, warnOnly: true, value: `${Math.floor(freeC)}` },
      { id: 'node', ok: !!node, value: node },
      { id: 'python', ok: !!python, value: python },
      { id: 'git', ok: !!git, value: git },
      { id: 'troLy', ok: !!codex, value: codex },
      { id: 'trinhDuyet', ok: browserOk, warnOnly: true },
      { id: 'hopCat', ok: sandbox === 'ready', warnOnly: true }
    ]
    const hardFail = this.checks.some((c) => !c.ok && !c.warnOnly)
    if (hardFail) throw new StepError('mayChuaSan')
    updateSettings({ machineChecked: true })
  }
}
