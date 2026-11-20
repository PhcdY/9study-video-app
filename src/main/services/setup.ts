// 7 buoc cai dat lan dau. Moi buoc co check() (da xong chua) va run() (lam), bao tien trinh qua snapshot.
import { EventEmitter } from 'node:events'
import path from 'node:path'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statfsSync,
  accessSync,
  constants
} from 'node:fs'
import {
  OPTIONAL_STEPS,
  SETUP_ORDER,
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
  DRIVE_FOLDER_NAMES,
  countLockPackages,
  gitCloneProgress,
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

function findGoogleDrive(): string | null {
  for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
    for (const name of DRIVE_FOLDER_NAMES) {
      const p = `${letter}:\\${name}`
      try {
        if (existsSync(p)) return p
      } catch {
        // o khong san sang
      }
    }
  }
  return null
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
      this.states.set(id, { id, status })
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
        return !!dir && isVideoRepo(dir)
      case 'caiThuVien':
        // Da cai (boi app hay boi nguoi dung tu `npm install`) va da co trinh duyet render
        return !!dir && librariesInstalled(dir) && renderBrowserInstalled(dir)
      case 'dangNhap':
        this.account = (await readAccount()) ?? undefined
        return !!this.account
      case 'keyGiong':
        return !!dir && !!readEnvFile(this.envFile).get('VIVIBE_API_KEY')
      case 'noiLuu':
        return !!dir && !!readEnvFile(this.envFile).get('OUTPUT_DIR')
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
    this.set(id, { status: 'running', progress: 0, detail: undefined, error: undefined })
    try {
      await this.doStep(id, input, ctrl.signal)
      if (getSettings().skipped.includes(id))
        updateSettings({ skipped: getSettings().skipped.filter((s) => s !== id) })
      this.set(id, { status: 'done', progress: 100 }, true)
      // Doc lai cac buoc sau: viec nao may da co san (bo cong cu, thu vien, key...) thi tu qua
      await this.refresh()
    } catch (e) {
      const code: ErrorCode =
        e instanceof StepError ? e.code : ctrl.signal.aborted ? 'khongRo' : 'khongRo'
      log.error(`[setup] buoc ${id} loi (${code}): ${e instanceof Error ? e.message : String(e)}`)
      this.set(
        id,
        {
          status: ctrl.signal.aborted ? 'ready' : 'error',
          error: ctrl.signal.aborted ? undefined : code
        },
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

  private progress(id: SetupStepId, progress: number, detail?: string): void {
    const cur = this.states.get(id)!
    if (cur.progress === progress && cur.detail === detail) return
    this.set(id, { progress, detail })
  }

  private async doStep(id: SetupStepId, input: SetupInput, signal: AbortSignal): Promise<void> {
    switch (id) {
      case 'thuMuc':
        return this.stepThuMuc(input.dir ?? this.snapshot().suggestedProjectDir)
      case 'taiDuAn':
        return this.stepTaiDuAn(signal)
      case 'caiThuVien':
        return this.stepCaiThuVien(signal)
      case 'dangNhap':
        return this.stepDangNhap(signal)
      case 'keyGiong':
        return this.stepKeyGiong(input.key ?? '', signal)
      case 'noiLuu':
        return this.stepNoiLuu(input.dir ?? this.snapshot().suggestedOutputDir)
      case 'kiemTra':
        return this.stepKiemTra()
    }
  }

  private stepThuMuc(dir: string): void {
    const existing = isVideoRepo(dir)
    const bad = validateProjectDir(dir, { existing })
    if (bad) throw new StepError(bad)
    const parent = path.dirname(dir)
    try {
      mkdirSync(parent, { recursive: true })
      accessSync(parent, constants.W_OK)
    } catch (e) {
      throw new StepError('khongGhiDuoc', String(e))
    }
    // Thu muc co file: chi nhan khi do chinh la bo cong cu
    if (!existing && existsSync(dir) && readdirSync(dir).length > 0) {
      throw new StepError('thuMucCoSan')
    }
    // Bo co san thi da chiem cho roi, chi can du cho cho video
    if (freeGb(dir) < (existing ? 5 : MIN_FREE_GB)) throw new StepError('khongDuCho')
    updateSettings({ projectDir: path.resolve(dir) })
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
    if (isVideoRepo(dir)) return
    if (existsSync(dir) && readdirSync(dir).length > 0) throw new StepError('thuMucCoSan')
    mkdirSync(path.dirname(dir), { recursive: true })
    const res = await this.git(
      ['clone', '--progress', '--branch', VIDEO_REPO_BRANCH, VIDEO_REPO_URL, dir],
      signal,
      (l) => {
        const p = gitCloneProgress(l)
        if (p !== null) this.progress('taiDuAn', Math.round(p * 0.9))
      },
      path.dirname(dir)
    )
    if (signal.aborted) throw new Error('da huy')
    if (res.code !== 0)
      throw new StepError(looksLikeNetworkError(res.tail) ? 'mang' : 'khongRo', res.tail.join('\n'))
    await this.git(['config', 'core.longpaths', 'true'], signal)
    this.progress('taiDuAn', 92)
    const fetched = await this.git(['fetch', '--tags', '--quiet'], signal)
    if (fetched.code !== 0)
      throw new StepError(
        looksLikeNetworkError(fetched.tail) ? 'mang' : 'khongRo',
        fetched.tail.join('\n')
      )
    const tags: string[] = []
    await this.git(['tag', '--list'], signal, (l) => tags.push(l))
    const tag = latestNumericTag(tags)
    if (tag) {
      const sw = await this.git(['switch', '--detach', `refs/tags/${tag}`], signal)
      if (sw.code !== 0) throw new StepError('khongRo', sw.tail.join('\n'))
      log.info(`[setup] da chuyen sang ban ${tag}`)
    }
  }

  private async stepCaiThuVien(signal: AbortSignal): Promise<void> {
    const dir = this.projectDir
    const env = childEnv(dir)
    const total =
      countLockPackages(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')) || 400
    let fetched = 0
    const t0 = Date.now()
    // Tien trinh: max(dem goi tu log npm, uoc theo thoi gian ~150 s), toi da 85% cho npm ci
    const timer = setInterval(() => {
      const byTime = Math.min(80, ((Date.now() - t0) / 150_000) * 80)
      const byCount = Math.min(85, (fetched / total) * 85)
      this.progress('caiThuVien', Math.round(Math.max(byTime, byCount)), 'thuVien')
    }, 1000)
    try {
      const res = await run(exe.npm(), ['ci', '--loglevel=http', '--no-fund', '--no-audit'], {
        cwd: dir,
        env,
        signal,
        onLine: (l) => {
          if (isNpmFetchLine(l)) fetched++
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
    this.progress('caiThuVien', 88, 'trinhDuyet')
    const br = await run(exe.npx(), ['remotion', 'browser', 'ensure'], {
      cwd: dir,
      env,
      signal,
      onLine: (l) => {
        const m = /(\d+)%/.exec(l)
        if (m) this.progress('caiThuVien', 88 + Math.round(Number(m[1]) * 0.11), 'trinhDuyet')
      }
    })
    if (signal.aborted) throw new Error('da huy')
    if (br.code !== 0)
      throw new StepError(
        looksLikeNetworkError(br.tail) ? 'mang' : 'taiTrinhDuyetLoi',
        br.tail.join('\n')
      )
  }

  private async stepDangNhap(signal: AbortSignal): Promise<void> {
    this.account = (await readAccount()) ?? undefined
    if (!this.account) {
      this.progress('dangNhap', 10, 'choDangNhap')
      try {
        await loginChatGpt(signal)
      } catch (e) {
        if (signal.aborted) throw e
        throw new StepError('dangNhapLoi', String(e))
      }
      this.account = (await readAccount()) ?? undefined
      if (!this.account)
        throw new StepError('dangNhapLoi', 'dang nhap xong nhung khong doc duoc tai khoan')
    }
    this.progress('dangNhap', 70, 'hopCat')
    const ok = await prepareSandbox(this.projectDir)
    log.info(`[setup] sandbox san sang: ${ok}`)
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
    try {
      mkdirSync(dir, { recursive: true })
      accessSync(dir, constants.W_OK)
    } catch (e) {
      throw new StepError('khongGhiDuoc', String(e))
    }
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
