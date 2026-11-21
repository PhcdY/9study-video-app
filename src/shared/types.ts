// Kieu dung chung cho phan loi (main), cau noi (preload) va giao dien (renderer).
import type {
  DiskUsage,
  Prefs,
  PrefsSnapshot,
  UpdateProgress,
  AppUpdate,
  UpdateResult,
  Usage,
  VersionInfo
} from './app'
import type {
  BatchInput,
  FeedbackDraft,
  FeedbackInput,
  FeedbackList,
  FeedbackState,
  FeedbackDirCheck
} from './feedback'
import type {
  AiStatus,
  ApprovalDecision,
  AudioLine,
  ChatState,
  ChipId,
  Lesson,
  NewVideoInput,
  ScriptData,
  StoryFrame,
  SubjectId,
  RemoveVideoResult,
  VideosSnapshot
} from './video'
import type { VivibeUsage } from './vivibe'
import type { FixDetail } from './fix-notes'
import type { LegacyChat, LegacyMessage, LegacyOptions, LegacyResult, LegacyScan } from './legacy'
import type { AddImageResult, BugSendInput, BugStatus, ErrorShot } from './bugs'
import type { AiChoice, AiModelOption } from './ai-model'

export type SetupStepId =
  | 'thuMuc'
  | 'taiDuAn'
  | 'caiThuVien'
  | 'dangNhap'
  | 'keyGiong'
  | 'googleDrive'
  | 'noiLuu'
  | 'gopY'
  | 'kiemTra'

export const SETUP_ORDER: SetupStepId[] = [
  'thuMuc',
  'taiDuAn',
  'caiThuVien',
  'dangNhap',
  'keyGiong',
  'googleDrive',
  'noiLuu',
  'gopY',
  'kiemTra'
]

/** Buoc co the bo qua, lam sau trong Cai dat. */
export const OPTIONAL_STEPS: SetupStepId[] = ['keyGiong', 'googleDrive', 'gopY']

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
  | 'taiDriveLoi'
  | 'driveKhongHopLe'
  | 'chuaThayGopY'
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
  | 'taiDrive'
  | 'caiDrive'
  | 'dangNhapDrive'
  | 'chepBoCongCu'
  | 'nhanTroChuyen'
  | 'congCredit'

export const STEP_TASKS: Partial<Record<SetupStepId, TaskId[]>> = {
  taiDuAn: ['taiBoCongCu', 'layDanhSachBan', 'chuyenBanMoi'],
  caiThuVien: ['taiThuVien', 'caiThuVien', 'taiTrinhDuyet'],
  dangNhap: ['dangNhap', 'cheDoAnToan'],
  googleDrive: ['taiDrive', 'caiDrive', 'dangNhapDrive']
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
  /** Dang nhan du lieu cu tu thu muc nay (buoc 2), va ket qua khi xong */
  legacy?: { source: string; pending: boolean; result?: LegacyResult; seen: boolean }
  account?: { email: string; plan: string }
  vivibeKeyMasked?: string
  checks: MachineCheck[]
  allDone: boolean
}

export interface SetupInput {
  dir?: string
  key?: string
  /** Buoc 1: chon bo cong cu cu da co tren may (se nhan du lieu cu o buoc 2) */
  fromExisting?: boolean
  /** Buoc 2: nhan du lieu cu voi cac lua chon nay */
  legacy?: LegacyOptions
  /** Buoc 2: bat dau moi, khong nhan du lieu cu */
  noLegacy?: boolean
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
  /** Ban app moi da tai xong (null neu chua co) */
  'app:update': { args: []; ret: AppUpdate | null }
  /** Ten cac bai AI dang lam viec (de canh bao truoc khi khoi dong lai) */
  'app:busyWork': { args: []; ret: string[] }
  'app:version': { args: []; ret: string }
  /** Mo thu muc gop y chung cua doi tren trinh duyet (link co dinh trong app) */
  'app:openTeamFolder': { args: []; ret: void }
  'videos:list': { args: []; ret: VideosSnapshot }
  'videos:script': { args: [slug: string]; ret: ScriptData | null }
  'videos:audio': { args: [slug: string]; ret: AudioLine[] }
  'videos:storyFrames': { args: [slug: string]; ret: StoryFrame[] }
  'videos:lessons': { args: [subject: SubjectId, lop: number]; ret: Lesson[] }
  /** Tao cuoc tro chuyen moi va gui yeu cau viet kich ban; tra ve khoa cuoc tro chuyen */
  'videos:create': { args: [input: NewVideoInput]; ret: string }
  /** Video moi dang do: lam tiep / bo */
  'videos:resumeDraft': { args: [key: string]; ret: void }
  'videos:dropDraft': { args: [key: string]; ret: void }
  /** Xoa han mot video cua nguoi dung va moi thu lien quan (vao Thung rac) */
  'videos:remove': { args: [slug: string]; ret: RemoveVideoResult }
  'chat:open': { args: [key: string]; ret: ChatState }
  'chat:send': { args: [key: string, text: string]; ret: void }
  'chat:chip': { args: [key: string, chip: ChipId, slug: string]; ret: void }
  'chat:interrupt': { args: [key: string]; ret: void }
  /** Doi model / muc suy nghi cua mot cuoc tro chuyen (ap dung tu tin nhan sau) */
  'chat:setAi': { args: [key: string, choice: AiChoice]; ret: void }
  /** Model tai khoan dang dang nhap dung duoc; [] neu chua lay duoc */
  'ai:models': { args: []; ret: AiModelOption[] }
  /** Quet thu muc bo cong cu cu (mac dinh: thu muc dang nhan o buoc 2) */
  'legacy:scan': { args: [dir?: string]; ret: LegacyScan | null }
  /** Thu muc bo cong cu cu khac tren may (de nhan tu Cai dat) */
  'legacy:findDirs': { args: []; ret: string[] }
  /** Nhan du lieu cu vao thu muc dang dung (tu Cai dat, khong chep ca bo cong cu) */
  'legacy:import': { args: [dir: string, opts: LegacyOptions]; ret: LegacyResult | null }
  /** Tro chuyen cu cua video (slug) hoac tro chuyen chung (slug = '') */
  'legacy:chats': { args: [slug: string]; ret: LegacyChat[] }
  'legacy:transcript': { args: [id: string]; ret: LegacyMessage[] }
  /** Mo tiep cuoc Codex cu trong video; false neu Codex khong mo lai duoc */
  'legacy:resume': { args: [key: string, id: string]; ret: boolean }
  /** Da xem man "Da nhan du lieu cu" o buoc 2, sang buoc tiep */
  'legacy:ack': { args: []; ret: void }
  /** Chuyen thu muc cu (da chep du) vao Thung rac; Windows hoi lai truoc */
  'legacy:trashSource': { args: []; ret: { ok: boolean } }
  /** Trang thai AI theo slug / khoa cuoc tro chuyen */
  'chat:statuses': { args: []; ret: Record<string, AiStatus> }
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
  /** Thu muc gop y chung co dung la cua doi trong Google Drive */
  'feedback:checkDir': { args: []; ret: FeedbackDirCheck }
  /** Nguoi bao tri danh dau thu muc dang dung la thu muc chung cua doi */
  'feedback:markTeam': { args: []; ret: FeedbackDirCheck }
  /** Da sua gi trong lan sua cua gop y (nhat ky phien ban, bai hoc, file doi); may nguoi bao tri */
  'feedback:fixDetail': { args: [id: string]; ret: FixDetail | null }
  /** Toc do doc chung (scripts/tts_config.json); null neu bo cong cu chua co */
  'voice:speed': { args: []; ret: number | null }
  'voice:setSpeed': { args: [speed: number]; ret: void }
  'disk:usage': { args: []; ret: DiskUsage }
  /** Credit Vivibe da dung theo thang ("YYYY-MM"; bo trong = thang nay) */
  'vivibe:usage': { args: [month?: string]; ret: VivibeUsage }
  /** Giao dien vua hien thong bao loi: app chup cua so (key: moi loi mot lan) */
  'app:errorShown': { args: [key: string, label: string]; ret: void }
  /** Anh app tu chup luc loi, moi nhat truoc */
  'bugs:shots': { args: []; ret: ErrorShot[] }
  /** CTV them anh tu may (chon file, dan, keo tha) vao o bao loi */
  'bugs:addImage': { args: [name: string, mime: string, data: Uint8Array]; ret: AddImageResult }
  'bugs:removeImage': { args: [id: string]; ret: void }
  'bugs:send': {
    args: [input: BugSendInput]
    ret: { ok: true } | { ok: false; code: 'chuaCoThuMuc' | 'loi' }
  }
  'bugs:setState': { args: [id: string, status: BugStatus]; ret: void }
  /** Mo cuoc tro chuyen voi tro ly AI de doc bao loi; tra ve khoa cuoc tro chuyen */
  'bugs:askAi': { args: [id: string]; ret: string | null }
  'disk:clean': { args: [which: 'drafts' | 'temp']; ret: DiskUsage }
}

/** Su kien (main -> renderer). */
export interface EventMap {
  'setup:changed': SetupSnapshot
  'app:updateReady': AppUpdate
  'videos:changed': VideosSnapshot
  'chat:changed': ChatState
  'version:progress': UpdateProgress
  'usage:changed': Usage | null
  'feedback:changed': FeedbackList
  'prefs:changed': PrefsSnapshot
  /** Vua tao giong xong: doc lai so credit Vivibe */
  'vivibe:changed': null
  'chat:statuses': Record<string, AiStatus>
  'legacy:progress': { done: number; total: number }
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
