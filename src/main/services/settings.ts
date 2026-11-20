// Cai dat cua app (khong phai cua repo video): luu JSON trong thu muc du lieu cua app.
import { app } from 'electron'
import path from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import type { SetupStepId } from '../../shared/types'

export interface Settings {
  projectDir?: string
  skipped: SetupStepId[]
  /** Buoc kiem tra may da qua it nhat mot lan */
  machineChecked?: boolean
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
