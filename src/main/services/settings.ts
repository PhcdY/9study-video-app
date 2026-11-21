// Cai dat cua app (khong phai cua repo video): luu JSON trong thu muc du lieu cua app.
import { app } from 'electron'
import path from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import type { SetupStepId } from '../../shared/types'
import type { Prefs } from '../../shared/app'
import type { LegacyResult } from '../../shared/legacy'

export interface Settings extends Prefs {
  projectDir?: string
  skipped: SetupStepId[]
  /** Buoc kiem tra may da qua it nhat mot lan */
  machineChecked?: boolean
  /** Ma ngau nhien cua may, de nhan ra "gop y cua toi" */
  machineId?: string
  /** Bo cong cu cu nguoi dung chon o buoc 1 (nhan du lieu o buoc 2) */
  legacySource?: string
  legacyPending?: boolean
  legacyResult?: LegacyResult
}

const file = (): string => path.join(app.getPath('userData'), 'settings.json')
let cache: Settings | undefined

export function getSettings(): Settings {
  if (cache) return cache
  try {
    cache = existsSync(file())
      ? { skipped: [], ...JSON.parse(readFileSync(file(), 'utf8')) }
      : { skipped: [] }
  } catch {
    cache = { skipped: [] }
  }
  return cache as Settings
}

export function updateSettings(patch: Partial<Settings>): Settings {
  cache = { ...getSettings(), ...patch }
  writeFileSync(file() + '.tmp', JSON.stringify(cache, null, 2))
  renameSync(file() + '.tmp', file())
  return cache
}
