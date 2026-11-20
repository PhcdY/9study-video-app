// Kieu dung chung cho phan loi (main), cau noi (preload) va giao dien (renderer).

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

export interface StepState {
  id: SetupStepId
  status: StepStatus
  /** 0-100 khi dang chay viec dai */
  progress?: number
  /** Dong trang thai ngan (tieng Viet), vd "Dang tai du an... 45%" */
  detail?: string
  error?: ErrorCode
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
}

/** Su kien (main -> renderer). */
export interface EventMap {
  'setup:changed': SetupSnapshot
  'app:updateReady': { version: string }
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
