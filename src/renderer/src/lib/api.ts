import { useEffect, useState } from 'react'
import type { Api, SetupSnapshot } from '../../../shared/types'
import type { ChatState, VideosSnapshot } from '../../../shared/video'
import type { Prefs, PrefsSnapshot, Usage, VersionInfo } from '../../../shared/app'
import type { FeedbackList } from '../../../shared/feedback'
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

export function useUpdateReady(): string | null {
  const [v, setV] = useState<string | null>(null)
  useEffect(() => api.on('app:updateReady', (p) => setV(p.version)), [])
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
