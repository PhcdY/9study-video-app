import { useEffect, useState } from 'react'
import type { Api, SetupSnapshot } from '../../../shared/types'
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
