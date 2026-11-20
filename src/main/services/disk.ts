// O dia: dung luong anh nhap / storyboard va file tam (tao lai duoc), nut don, canh bao o C.
import path from 'node:path'
import { existsSync, readdirSync, rmSync, statSync, statfsSync } from 'node:fs'
import type { DiskUsage } from '../../shared/app'
import { cacheRoot } from './runtime'
import { outputBase } from './project'
import log from '../log'

function sizeOf(p: string): number {
  try {
    const st = statSync(p)
    if (!st.isDirectory()) return st.size
    return readdirSync(p).reduce((a, f) => a + sizeOf(path.join(p, f)), 0)
  } catch {
    return 0
  }
}

function freeGb(root: string): number | undefined {
  try {
    const s = statfsSync(root)
    return (s.bavail * s.bsize) / 1024 ** 3
  } catch {
    return undefined
  }
}

const draftsDir = (projectDir: string): string => path.join(outputBase(projectDir), '_lam-viec')
const tempDir = (projectDir: string): string => path.join(cacheRoot(projectDir), 'tmp')

export function diskUsage(projectDir: string): DiskUsage {
  if (!projectDir) return { drafts: 0, temp: 0, cFreeGb: freeGb('C:/') }
  return {
    drafts: sizeOf(draftsDir(projectDir)),
    temp: sizeOf(tempDir(projectDir)),
    cFreeGb: freeGb('C:/')
  }
}

/** Xoa noi dung ben trong (giu thu muc). Khong dung toi video thanh pham. */
export function cleanDisk(projectDir: string, which: 'drafts' | 'temp'): DiskUsage {
  const dir = which === 'drafts' ? draftsDir(projectDir) : tempDir(projectDir)
  if (projectDir && existsSync(dir))
    for (const f of readdirSync(dir)) {
      try {
        rmSync(path.join(dir, f), { recursive: true, force: true })
      } catch (e) {
        // File dang duoc dung (vd dang xuat video): bo qua
        log.warn(`[o dia] khong xoa duoc ${f}: ${String(e)}`)
      }
    }
  log.info(`[o dia] da don ${which}`)
  return diskUsage(projectDir)
}
