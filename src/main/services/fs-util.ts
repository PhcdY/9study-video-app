// Thao tac thu muc an toan tren Windows.
import path from 'node:path'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'

/**
 * Tao thu muc neu chua co. Khong goi mkdir tren thu muc da co: Node tren Windows bao EPERM
 * khi mkdir goc o dia (`D:\`) ke ca voi recursive.
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/**
 * Ghi duoc vao thu muc that khong: ghi thu mot file nho roi xoa.
 * (accessSync W_OK tren Windows chi xem co chi doc, khong biet quyen that.)
 */
export function canWriteTo(dir: string): boolean {
  try {
    ensureDir(dir)
    const probe = path.join(dir, `.9study-ghi-thu-${process.pid}-${Date.now()}`)
    writeFileSync(probe, 'ok')
    unlinkSync(probe)
    return true
  } catch {
    return false
  }
}
