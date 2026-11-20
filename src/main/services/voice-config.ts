// Toc do doc chung: truong "speed" trong scripts/tts_config.json cua bo cong cu.
import path from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export const TTS_CONFIG = 'scripts/tts_config.json'

/** Doi so "speed" dau tien trong file, giu nguyen phan con lai (it thay doi nhat). */
export function setSpeedText(text: string, speed: number): string {
  const v = Math.round(speed * 100) / 100
  return /("speed"\s*:\s*)-?[\d.]+/.test(text)
    ? text.replace(/("speed"\s*:\s*)-?[\d.]+/, `$1${v % 1 === 0 ? v.toFixed(1) : String(v)}`)
    : text
}

export function speedFromText(text: string): number | null {
  const m = /"speed"\s*:\s*(-?[\d.]+)/.exec(text)
  return m ? Number(m[1]) : null
}

export function readSpeed(projectDir: string): number | null {
  const f = path.join(projectDir, TTS_CONFIG)
  return existsSync(f) ? speedFromText(readFileSync(f, 'utf8')) : null
}

export function writeSpeed(projectDir: string, speed: number): void {
  const f = path.join(projectDir, TTS_CONFIG)
  if (!existsSync(f)) return
  const clamped = Math.min(1.3, Math.max(0.7, speed))
  writeFileSync(f, setSpeedText(readFileSync(f, 'utf8'), clamped), 'utf8')
}
