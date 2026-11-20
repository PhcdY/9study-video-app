// Doc / ghi file .env cua repo video. Giu nguyen dong cu va chu thich; khong bao gio log gia tri.
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'

export function parseEnv(text: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i <= 0) continue
    const key = line.slice(0, i).trim()
    let val = line.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    map.set(key, val)
  }
  return map
}

/** Dat gia tri cho cac khoa; dong da co thi thay tai cho, chua co thi them cuoi file. */
export function setEnvValues(text: string, values: Record<string, string>): string {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text === '' ? [] : text.split(/\r?\n/)
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  const pending = new Map(Object.entries(values))
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(lines[i])
    if (m && pending.has(m[1])) {
      lines[i] = `${m[1]}=${pending.get(m[1])}`
      pending.delete(m[1])
    }
  }
  for (const [k, v] of pending) lines.push(`${k}=${v}`)
  return lines.join(eol) + eol
}

export function readEnvFile(file: string): Map<string, string> {
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : new Map()
}

export function writeEnvValues(file: string, values: Record<string, string>): void {
  for (const v of Object.values(values))
    if (/[\r\n]/.test(v)) throw new Error('gia tri .env khong duoc xuong dong')
  const before = existsSync(file) ? readFileSync(file, 'utf8') : ''
  writeFileSync(file + '.tmp', setEnvValues(before, values), 'utf8')
  renameSync(file + '.tmp', file)
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 4)}••••${key.slice(-4)}`
}
