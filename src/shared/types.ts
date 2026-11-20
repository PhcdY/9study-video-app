// Kieu dung chung cho phan loi (main), cau noi (preload) va giao dien (renderer).
import type { Prefs, PrefsSnapshot, UpdateProgress, UpdateResult, Usage, VersionInfo } from './app'
import type {
  BatchInput,
  FeedbackDraft,
  FeedbackInput,
  FeedbackList,
  FeedbackState
} from './feedback'
import type {
  ApprovalDecision,
  AudioLine,
  ChatState,
  ChipId,
  Lesson,
  NewVideoInput,
  ScriptData,
  SubjectId,
  VideosSnapshot
} from './video'

export type SetupStepId =
  'thuMuc' | 'taiDuAn' | 'caiThuVien' | 'dangNhap' | 'keyGiong' | 'noiLuu' | 'kiemTra'

export const SETUP_ORDER: SetupStepId[] = [
  'thuMuc',
  'taiDuAn',
  'caiThuVien',
  'dangNhap',
  'keyGiong',
  'noiLuu',
  'kiemTra'
]

/** Buoc co the bo qua, lam sau trong Cai dat. */
export const OPTIONAL_STEPS: SetupStepId[] = ['keyGiong']

export type StepStatus = 'locked' | 'ready' | 'running' | 'done' | 'skipped' | 'error'

/** Ma loi. Giao dien doi ma -> cau tieng Viet trong copy.ts; chuoi loi tho chi ghi log. */
export type ErrorCode =
  | 'mang'
  | 'thuMucCoDau'
  | 'thuMucCoDauCach'
  | 'thuMucOneDrive'
  | 'thuMucHeThong'
  | 'thuMucCoSan'
  | 'khongGhiDuoc'
  | 'khongDuCho'
  | 'caiThuVienLoi'
  | 'taiTrinhDuyetLoi'
  | 'dangNhapLoi'
  | 'keySai'
  | 'keyTrong'
  | 'mayChuaSan'
  | 'khongRo'

/** Tung phan cua mot buoc dai (vd tai bo cong cu, cai thu vien), hien rieng tren giao dien. */
export type TaskId =
  | 'taiBoCongCu'
  | 'layDanhSachBan'
  | 'chuyenBanMoi'
  | 'taiThuVien'
  | 'caiThuVien'
  | 'taiTrinhDuyet'
  | 'dangNhap'
  | 'cheDoAnToan'

export const STEP_TASKS: Partial<Record<SetupStepId, TaskId[]>> = {
  taiDuAn: ['taiBoCongCu', 'layDanhSachBan', 'chuyenBanMoi'],
  caiThuVien: ['taiThuVien', 'caiThuVien', 'taiTrinhDuyet'],
  dangNhap: ['dangNhap', 'cheDoAnToan']
}

export type TaskStatus = 'waiting' | 'running' | 'done' | 'skipped' | 'error'

export interface TaskState {
  id: TaskId
  status: TaskStatus
  /** 0-100; khong co thi giao dien hien vong quay */
  progress?: number
  /** Da xong bao nhieu / tong bao nhieu (giao dien tu dinh dang theo don vi) */
  amount?: { done: number; total?: number; unit: 'mb' | 'goi' }
  /** Toc do tai, MB/giay */
  speedMbps?: number
  /** Ban vua chuyen sang (vd "3") */
  version?: string
}

export interface StepState {
  id: SetupStepId
  status: StepStatus
  /** 0-100 khi dang chay viec dai */
  progress?: number
  /** Dong trang thai ngan (tieng Viet), vd "Dang tai du an... 45%" */
  detail?: string
  error?: ErrorCode
  /** Cac phan cua buoc (chi buoc dai) */
  tasks?: TaskState[]
}

export interface MachineCheck {
  id: 'oDia' | 'oC' | 'node' | 'python' | 'git' | 'troLy' | 'trinhDuyet' | 'hopCat'
  ok: boolean
  /** true: chi canh bao, khong chan */
  warnOnly?: boolean
  value?: string
}

export interface ExistingRepo {
  dir: string
  /** Da cai du thu vien va trinh duyet xuat video */
  ready: boolean
}

export interface SetupSnapshot {
  steps: StepState[]
  projectDir: string
  outputDir: string
  /** Goi y cho buoc chon thu muc / noi luu video */
  suggestedProjectDir: string
  suggestedOutputDir: string
  driveFound: boolean
  /** Bo cong cu da co san tren may (chi do khi chua chon thu muc), bo day du nhat dung dau */
  existingRepos: ExistingRepo[]
  account?: { email: string; plan: string }
  vivibeKeyMasked?: string
  checks: MachineCheck[]
  allDone: boolean
}

export interface SetupInput {
  dir?: string
  key?: string
}

/** Kenh goi (renderer -> main), moi kenh mot cap tham so / ket qua. */
export interface InvokeMap {
  'setup:get': { args: []; ret: SetupSnapshot }
  'setup:run': { args: [id: SetupStepId, input?: SetupInput]; ret: void }
  'setup:skip': { args: [id: SetupStepId]; ret: void }
  'setup:cancel': { args: [id: SetupStepId]; ret: void }
  'dialog:pickFolder': { args: [defaultPath: string]; ret: string | null }
  'app:openLoginPage': { args: []; ret: void }
  'app:restartToUpdate': { args: []; ret: void }
  'app:version': { args: []; ret: string }
  'videos:list': { args: []; ret: VideosSnapshot }
  'videos:script': { args: [slug: string]; ret: ScriptData | null }
  'videos:audio': { args: [slug: string]; ret: AudioLine[] }
  'videos:lessons': { args: [subject: SubjectId, lop: number]; ret: Lesson[] }
  /** Tao cuoc tro chuyen moi va gui yeu cau viet kich ban; tra ve khoa cuoc tro chuyen */
  'videos:create': { args: [input: NewVideoInput]; ret: string }
  'chat:open': { args: [key: string]; ret: ChatState }
  'chat:send': { args: [key: string, text: string]; ret: void }
  'chat:chip': { args: [key: string, chip: ChipId, slug: string]; ret: void }
  'chat:interrupt': { args: [key: string]; ret: void }
  'chat:approve': {
    args: [key: string, itemId: string, decision: ApprovalDecision]
    ret: void
  }
  'studio:start': { args: []; ret: { url: string } | { error: true } }
  'shell:showItem': { args: [path: string]; ret: void }
  'dialog:pickFiles': { args: []; ret: string[] }
  'shell:openPath': { args: [path: string]; ret: void }
  'version:get': { args: []; ret: VersionInfo }
  'version:update': { args: [target: string]; ret: UpdateResult }
  'account:usage': { args: []; ret: Usage | null }
  'account:logout': { args: []; ret: void }
  'app:bugReport': { args: []; ret: string | null }
  'prefs:get': { args: []; ret: PrefsSnapshot }
  'prefs:set': { args: [patch: Prefs]; ret: PrefsSnapshot }
  'feedback:draft': {
    args: [slug: string, time?: number, beatLine?: string]
    ret: FeedbackDraft | null
  }
  'feedback:create': {
    args: [input: FeedbackInput]
    ret: { ok: true; dir: string } | { ok: false; code: 'chuaCoThuMuc' | 'loi' }
  }
  'feedback:list': { args: []; ret: FeedbackList }
  'feedback:setState': {
    args: [ids: string[], patch: Omit<FeedbackState, 'updatedAt'>]
    ret: void
  }
  /** Gom gop y thanh mot lan sua; openNow thi mo Codex va tra ve khoa cuoc tro chuyen */
  'feedback:fix': { args: [input: BatchInput]; ret: string | null }
  'feedback:pickDir': { args: []; ret: PrefsSnapshot | null }
}

/** Su kien (main -> renderer). */
export interface EventMap {
  'setup:changed': SetupSnapshot
  'app:updateReady': { version: string }
  'videos:changed': VideosSnapshot
  'chat:changed': ChatState
  'version:progress': UpdateProgress
  'usage:changed': Usage | null
  'feedback:changed': FeedbackList
  'prefs:changed': PrefsSnapshot
}

export type InvokeChannel = keyof InvokeMap
export type EventChannel = keyof EventMap

export interface Api {
  invoke<K extends InvokeChannel>(
    channel: K,
    ...args: InvokeMap[K]['args']
  ): Promise<InvokeMap[K]['ret']>
  on<K extends EventChannel>(channel: K, cb: (payload: EventMap[K]) => void): () => void
}
