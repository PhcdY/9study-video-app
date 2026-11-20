// Chi dung khi phat trien: xem giao dien trong trinh duyet thuong (khong co phan loi Electron).
// Chon trang thai bang ?state=coSan|thuMuc|taiDuAn|caiThuVien|dangNhap|keyGiong|noiLuu|kiemTra|loi|xong
import {
  SETUP_ORDER,
  type Api,
  type EventMap,
  type SetupSnapshot,
  type StepState
} from '../../../shared/types'

function fixture(state: string): SetupSnapshot {
  const at =
    state === 'loi' || state === 'taiDuAnCoSan'
      ? 1
      : state === 'xong'
        ? 7
        : state === 'caiThuVienCoSan'
          ? 2
          : Math.max(0, SETUP_ORDER.indexOf(state as never))
  const steps: StepState[] = SETUP_ORDER.map((id, i) => ({
    id,
    status: i < at ? 'done' : i === at ? 'ready' : 'locked'
  }))
  if (state === 'taiDuAnCoSan') Object.assign(steps[1], { status: 'ready' })
  if (state === 'taiDuAn')
    Object.assign(steps[1], {
      status: 'running',
      progress: 15,
      tasks: [
        {
          id: 'taiBoCongCu',
          status: 'running',
          progress: 45,
          amount: { done: 3.4, unit: 'mb' },
          speedMbps: 2.1
        },
        { id: 'layDanhSachBan', status: 'waiting' },
        { id: 'chuyenBanMoi', status: 'waiting' }
      ]
    })
  if (state === 'caiThuVien')
    Object.assign(steps[2], {
      status: 'running',
      progress: 54,
      tasks: [
        { id: 'taiThuVien', status: 'done', amount: { done: 346, total: 346, unit: 'goi' } },
        { id: 'caiThuVien', status: 'done' },
        {
          id: 'taiTrinhDuyet',
          status: 'running',
          progress: 62,
          amount: { done: 55.4, total: 89.4, unit: 'mb' }
        }
      ]
    })
  if (state === 'caiThuVienCoSan')
    Object.assign(steps[2], {
      status: 'running',
      progress: 70,
      tasks: [
        { id: 'taiThuVien', status: 'skipped' },
        { id: 'caiThuVien', status: 'skipped' },
        {
          id: 'taiTrinhDuyet',
          status: 'running',
          progress: 10,
          amount: { done: 8.9, total: 89.4, unit: 'mb' }
        }
      ]
    })
  if (state === 'dangNhap')
    Object.assign(steps[3], { status: 'running', progress: 10, detail: 'choDangNhap' })
  if (state === 'loi') Object.assign(steps[1], { status: 'error', error: 'mang' })
  if (state === 'kiemTra') Object.assign(steps[6], { status: 'error', error: 'mayChuaSan' })
  if (state === 'xong') steps.forEach((s) => (s.status = 'done'))
  return {
    steps,
    projectDir: at > 0 ? 'D:\\9Study\\VideoAI' : '',
    outputDir: '',
    suggestedProjectDir: 'D:\\9Study\\VideoAI',
    suggestedOutputDir: 'G:\\My Drive\\9Study Video',
    driveFound: true,
    existingRepos:
      state === 'coSan' || state === 'taiDuAnCoSan'
        ? [
            { dir: 'D:\\Video AI', ready: true },
            { dir: 'D:\\test\\Video AI', ready: false }
          ]
        : [],
    account: at > 3 ? { email: 'ctv@example.com', plan: 'plus' } : undefined,
    checks:
      state === 'kiemTra'
        ? [
            { id: 'oDia', ok: true, value: '197' },
            { id: 'oC', ok: false, warnOnly: true, value: '2' },
            { id: 'node', ok: true },
            { id: 'python', ok: true },
            { id: 'git', ok: true },
            { id: 'troLy', ok: false },
            { id: 'trinhDuyet', ok: true },
            { id: 'hopCat', ok: false, warnOnly: true }
          ]
        : [],
    allDone: state === 'xong'
  }
}

export function createMockApi(): Api {
  const state = new URLSearchParams(location.search).get('state') ?? 'thuMuc'
  let snap = fixture(state)
  const subs = new Set<(s: SetupSnapshot) => void>()
  const emit = (): void => subs.forEach((cb) => cb(snap))
  return {
    async invoke(channel, ...args) {
      if (channel === 'setup:get') return snap as never
      if (channel === 'setup:run') {
        const id = args[0] as StepState['id']
        snap = {
          ...snap,
          steps: snap.steps.map((s) =>
            s.id === id ? { ...s, status: 'running', progress: 30 } : s
          )
        }
        emit()
        setTimeout(() => {
          const i = SETUP_ORDER.indexOf(id)
          snap = fixture(SETUP_ORDER[i + 1] ?? 'xong')
          emit()
        }, 1200)
      }
      if (channel === 'dialog:pickFolder') return 'E:\\Khac\\VideoAI' as never
      if (channel === 'app:version') return '0.1.0-dev' as never
      return undefined as never
    },
    on(channel, cb) {
      if (channel !== 'setup:changed') return () => undefined
      const f = cb as (p: EventMap['setup:changed']) => void
      subs.add(f)
      return () => subs.delete(f)
    }
  }
}
