// Tai khoan ChatGPT va sandbox Windows cua Codex. Dung chung mot app-server cho viec tai khoan.
import { shell } from 'electron'
import { CodexClient } from './client'
import type { GetAccountResponse } from './protocol/v2/GetAccountResponse'
import type { LoginAccountResponse } from './protocol/v2/LoginAccountResponse'
import type { WindowsSandboxReadinessResponse } from './protocol/v2/WindowsSandboxReadinessResponse'
import type { GetAccountRateLimitsResponse } from './protocol/v2/GetAccountRateLimitsResponse'
import type { RateLimitSnapshot } from './protocol/v2/RateLimitSnapshot'
import type { Usage } from '../../../shared/app'
import log from '../../log'

let client: CodexClient | undefined
let lastAuthUrl: string | undefined

async function getClient(): Promise<CodexClient> {
  if (!client) {
    client = new CodexClient()
    client.once('exit', () => (client = undefined))
  }
  await client.start()
  return client
}

export function stopAccountClient(): void {
  client?.stop()
}

export async function readAccount(): Promise<{ email: string; plan: string } | null> {
  const c = await getClient()
  const res = (await c.request('account/read', { refreshToken: false })) as GetAccountResponse
  if (res.account?.type !== 'chatgpt') return null
  return { email: res.account.email ?? '', plan: String(res.account.planType) }
}

/** Mo trang dang nhap trong trinh duyet mac dinh, cho den khi nguoi dung dang nhap xong. */
export async function loginChatGpt(signal?: AbortSignal): Promise<void> {
  const c = await getClient()
  const res = (await c.request('account/login/start', { type: 'chatgpt' })) as LoginAccountResponse
  if (res.type !== 'chatgpt') throw new Error(`kieu dang nhap la: ${res.type}`)
  lastAuthUrl = res.authUrl
  // shell.openExternal, khong qua `cmd /c start`: cmd cat link tai dau `&` (bai hoc Moc 0)
  await shell.openExternal(res.authUrl)
  const loginId = res.loginId
  try {
    const done = await c.waitFor(
      'account/login/completed',
      (p) => !p.loginId || p.loginId === loginId,
      15 * 60_000,
      signal
    )
    if (!done.success) throw new Error(`dang nhap that bai: ${done.error ?? '-'}`)
  } catch (e) {
    await c.request('account/login/cancel', { loginId }).catch(() => undefined)
    throw e
  } finally {
    lastAuthUrl = undefined
  }
}

export async function reopenLoginPage(): Promise<void> {
  if (lastAuthUrl) await shell.openExternal(lastAuthUrl)
}

export async function sandboxReadiness(): Promise<WindowsSandboxReadinessResponse['status']> {
  const c = await getClient()
  const res = (await c.request(
    'windowsSandbox/readiness',
    undefined
  )) as WindowsSandboxReadinessResponse
  return res.status
}

/**
 * Chuan bi sandbox Windows de AI chay lenh an toan ma khong phai hoi tung lenh.
 * Che do khong can quyen admin. Loi thi chi ghi log: AI van chay duoc, chi hoi nhieu hon.
 */
export async function prepareSandbox(projectDir: string): Promise<boolean> {
  const c = await getClient()
  if ((await sandboxReadiness()) === 'ready') return true
  try {
    const wait = c.waitFor('windowsSandbox/setupCompleted', () => true, 5 * 60_000)
    await c.request('windowsSandbox/setupStart', { mode: 'unelevated', cwd: projectDir })
    const done = await wait
    if (!done.success) log.warn(`[sandbox] chuan bi that bai: ${done.error}`)
  } catch (e) {
    log.warn(`[sandbox] loi: ${String(e)}`)
  }
  return (await sandboxReadiness()) === 'ready'
}

/** Luot ChatGPT con lai: lay cua so dung nhieu nhat (ngan han hoac dai han). */
export function usageFrom(snap: RateLimitSnapshot | null | undefined): Usage | null {
  if (!snap) return null
  const windows = [snap.primary, snap.secondary].filter((w): w is NonNullable<typeof w> => !!w)
  if (!windows.length) return null
  const worst = windows.reduce((a, b) => (b.usedPercent > a.usedPercent ? b : a))
  return {
    windows: windows
      .map((w) => ({
        minutes: w.windowDurationMins,
        usedPercent: Math.max(0, Math.min(100, Math.round(w.usedPercent))),
        resetsAt: w.resetsAt ? w.resetsAt * 1000 : undefined
      }))
      .sort((a, b) => (a.minutes ?? 0) - (b.minutes ?? 0)),
    remainingPercent: Math.max(0, Math.min(100, Math.round(100 - worst.usedPercent))),
    resetsAt: worst.resetsAt ? worst.resetsAt * 1000 : undefined,
    plan: snap.planType ?? undefined
  }
}

export async function readUsage(): Promise<Usage | null> {
  try {
    const c = await getClient()
    const res = (await c.request(
      'account/rateLimits/read',
      undefined
    )) as GetAccountRateLimitsResponse
    return usageFrom(res.rateLimitsByLimitId?.codex ?? res.rateLimits)
  } catch (e) {
    log.warn(`[luot] khong doc duoc: ${String(e)}`)
    return null
  }
}

export async function logout(): Promise<void> {
  const c = await getClient()
  await c.request('account/logout', undefined)
}
