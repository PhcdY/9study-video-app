import { useEffect, useState } from 'react'
import type { Api, SetupSnapshot } from '../../../shared/types'
import type { AiStatus, ChatState, VideosSnapshot } from '../../../shared/video'
import type { LegacyScan } from '../../../shared/legacy'
import type { AppUpdate, Prefs, PrefsSnapshot, Usage, VersionInfo } from '../../../shared/app'
import type { FeedbackDirCheck, FeedbackList } from '../../../shared/feedback'
import type { VivibeUsage } from '../../../shared/vivibe'
import { createMockApi } from './mock-api'

// Ngoai Electron (xem giao dien trong trinh duyet khi phat trien) thi dung du lieu gia
export const api: Api = window.api ?? (import.meta.env.DEV ? createMockApi() : window.api)

/** Trang thai cai dat, cap nhat theo su kien tu phan loi. */
export function useSetup(): SetupSnapshot | null {
  const [snap, setSnap] = useState<SetupSnapshot | null>(null)
  useEffect(() => {
    const off = api.on('setup:changed', setSnap)
    void api.invoke('setup:get').then(setSnap)
    return off
  }, [])
  return snap
}

/** Ban app moi da tai xong (null neu chua co). */
export function useAppUpdate(): AppUpdate | null {
  const [v, setV] = useState<AppUpdate | null>(null)
  useEffect(() => {
    const off = api.on('app:updateReady', setV)
    void api.invoke('app:update').then((u) => u && setV(u))
    return off
  }, [])
  return v
}

/** Danh sach video, tu cap nhat khi AI tao / sua file. */
export function useVideos(): VideosSnapshot | null {
  const [snap, setSnap] = useState<VideosSnapshot | null>(null)
  useEffect(() => {
    const off = api.on('videos:changed', setSnap)
    void api.invoke('videos:list').then(setSnap)
    return off
  }, [])
  return snap
}

/** Cuoc tro chuyen cua mot video (khoa = slug, hoac khoa tam cua video moi). */
export function useChat(key: string): ChatState | null {
  const [chat, setChat] = useState<ChatState | null>(null)
  useEffect(() => {
    let alive = true
    const off = api.on('chat:changed', (s) => {
      if (s.key === key || (s.slug && s.slug === key)) setChat({ ...s, items: [...s.items] })
    })
    void api.invoke('chat:open', key).then((s) => alive && setChat(s))
    return () => {
      alive = false
      off()
    }
  }, [key])
  return chat
}

/** Duong dan file tren may -> URL de giao dien mo (phan loi chi cho mo trong thu muc du an / noi luu video). */
export function fileUrl(p: string, bust?: number): string {
  return `app-file://f/${encodeURIComponent(p)}${bust ? `?v=${bust}` : ''}`
}

/** Luot ChatGPT con lai; cap nhat sau moi luot AI. */
export function useUsage(): Usage | null {
  const [u, setU] = useState<Usage | null>(null)
  useEffect(() => {
    const off = api.on('usage:changed', setU)
    void api.invoke('account:usage').then(setU)
    return off
  }, [])
  return u
}

/** Phien ban bo cong cu (hoi GitHub mot lan khi mo man). */
export function useVersion(): [VersionInfo | null, () => void] {
  const [v, setV] = useState<VersionInfo | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    void api.invoke('version:get').then((x) => alive && setV(x))
    return () => {
      alive = false
    }
  }, [n])
  return [v, () => setN((x) => x + 1)]
}

/** Cai dat nguoi dung (thu muc gop y, ten, che do nguoi bao tri...). */
export function usePrefs(): [
  PrefsSnapshot | null,
  (patch: Prefs) => Promise<void>,
  (p: PrefsSnapshot) => void
] {
  const [p, setP] = useState<PrefsSnapshot | null>(null)
  useEffect(() => {
    const off = api.on('prefs:changed', setP)
    void api.invoke('prefs:get').then(setP)
    return off
  }, [])
  const save = async (patch: Prefs): Promise<void> => {
    setP((cur) => (cur ? { ...cur, ...patch } : cur))
    setP(await api.invoke('prefs:set', patch))
  }
  return [p, save, setP]
}

/** Moi gop y trong thu muc chung, tu cap nhat khi Drive dong bo ve. */
export function useFeedback(): [FeedbackList | null, () => void] {
  const [list, setList] = useState<FeedbackList | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const off = api.on('feedback:changed', setList)
    void api.invoke('feedback:list').then(setList)
    return off
  }, [tick])
  return [list, () => setTick((t) => t + 1)]
}

/** Credit Vivibe da dung theo thang; tu doc lai khi vua tao giong xong. */
export function useVivibe(month?: string): VivibeUsage | null {
  const [u, setU] = useState<VivibeUsage | null>(null)
  useEffect(() => {
    const load = (): void => void api.invoke('vivibe:usage', month).then(setU)
    load()
    return api.on('vivibe:changed', load)
  }, [month])
  return u
}

/** Khoi dong lai de cai ban moi; AI dang lam thi hoi lai truoc. */
export function useRestartToUpdate(): {
  busy: string[] | null
  ask: () => Promise<void>
  confirm: () => void
  cancel: () => void
} {
  const [busy, setBusy] = useState<string[] | null>(null)
  return {
    busy,
    ask: async () => {
      const titles = await api.invoke('app:busyWork')
      if (titles.length) setBusy(titles)
      else void api.invoke('app:restartToUpdate')
    },
    confirm: () => void api.invoke('app:restartToUpdate'),
    cancel: () => setBusy(null)
  }
}

/** Trang thai AI tung bai (theo slug / khoa cuoc tro chuyen). */
export function useAiStatuses(): Record<string, AiStatus> {
  const [s, setS] = useState<Record<string, AiStatus>>({})
  useEffect(() => {
    const off = api.on('chat:statuses', setS)
    void api.invoke('chat:statuses').then(setS)
    return off
  }, [])
  return s
}

/** Quet thu muc bo cong cu cu (kem tien do doc tro chuyen). undefined = dang quet, null = loi. */
export function useLegacyScan(
  dir?: string,
  enabled = true
): {
  scan: LegacyScan | null | undefined
  progress: { done: number; total: number } | null
} {
  const key = dir ?? ''
  const [res, setRes] = useState<{ key: string; scan: LegacyScan | null } | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let on = true
    const off = api.on('legacy:progress', (p) => on && setProgress(p))
    void api.invoke('legacy:scan', dir).then((s) => on && setRes({ key, scan: s }))
    return () => {
      on = false
      off()
    }
  }, [dir, enabled, key])
  return { scan: res && res.key === key ? res.scan : undefined, progress }
}

/** Thu muc gop y chung co dung khong; poll = kiem tra lai moi vai giay (khi dang huong dan sua). */
export function useFeedbackDirCheck(poll = false): FeedbackDirCheck | null {
  const [c, setC] = useState<FeedbackDirCheck | null>(null)
  useEffect(() => {
    let on = true
    const load = (): void => {
      void api.invoke('feedback:checkDir').then((r) => on && setC(r))
    }
    load()
    const off1 = api.on('feedback:changed', load)
    const off2 = api.on('prefs:changed', load)
    const id = poll ? setInterval(load, 3000) : undefined
    return () => {
      on = false
      off1()
      off2()
      if (id) clearInterval(id)
    }
  }, [poll])
  return c
}
