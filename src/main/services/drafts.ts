// Video moi dang do: nguoi dung bam "Bat dau viet kich ban" nhung AI chua tao thu muc video
// (vd bam Dung ngay). Luu lai de hien trong Video cua toi va lam tiep duoc.
import path from 'node:path'
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { app } from 'electron'
import type { NewVideoInput } from '../../shared/video'
import { parseNewVideoPrompt } from '../../shared/prompt'

export interface Draft {
  title: string
  subject: string
  lop?: number
  loai?: string
  createdAt: number
  /** Yeu cau goc gui AI: gui lai neu lan dau chua kip tao cuoc tro chuyen */
  prompt: string
}

type Store = Record<string, Record<string, Draft>>
const file = (): string => path.join(app.getPath('userData'), 'drafts.json')

function readStore(): Store {
  try {
    return JSON.parse(readFileSync(file(), 'utf8')) as Store
  } catch {
    return {}
  }
}
function writeStore(s: Store): void {
  writeFileSync(file() + '.tmp', JSON.stringify(s, null, 2))
  renameSync(file() + '.tmp', file())
}

export function readDrafts(projectDir: string): Record<string, Draft> {
  return readStore()[projectDir] ?? {}
}

export function saveDraft(
  projectDir: string,
  key: string,
  input: NewVideoInput,
  prompt: string
): void {
  const s = readStore()
  s[projectDir] = {
    ...(s[projectDir] ?? {}),
    [key]: {
      title: input.bai.trim() || 'Video mới',
      subject: input.subject,
      lop: input.lop,
      loai: input.loai === 'hienTuong' ? 'hien-tuong' : 'bai-hoc',
      createdAt: Date.now(),
      prompt
    }
  }
  writeStore(s)
}

export function dropDrafts(projectDir: string, keys: string[]): void {
  if (!keys.length) return
  const s = readStore()
  const mine = { ...(s[projectDir] ?? {}) }
  for (const k of keys) delete mine[k]
  s[projectDir] = mine
  writeStore(s)
}

/** Tim file ghi cuoc tro chuyen cua Codex (CODEX_HOME/sessions/.../rollout-...-<thread>.jsonl). */
function findRollout(root: string, threadId: string): string | undefined {
  if (!existsSync(root)) return undefined
  for (const d of readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, d.name)
    if (d.isDirectory()) {
      const hit = findRollout(p, threadId)
      if (hit) return hit
    } else if (d.name.endsWith(`${threadId}.jsonl`)) return p
  }
  return undefined
}

/**
 * Video moi dung giua chung tu ban app cu (chua luu thong tin bai): doc yeu cau dau tien
 * trong file ghi cuoc tro chuyen de lay lai mon, lop, ten bai. Tim thay thi luu lai.
 */
export function recoverDraft(
  projectDir: string,
  key: string,
  threadId: string,
  codexHome: string
): Draft | null {
  const file = findRollout(path.join(codexHome, 'sessions'), threadId)
  if (!file) return null
  let prompt = ''
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.includes('"role":"user"')) continue
    try {
      const o = JSON.parse(line) as {
        payload?: { role?: string; content?: { type?: string; text?: string }[] }
      }
      const text = (o.payload?.content ?? []).map((c) => c.text ?? '').join('\n')
      if (text.includes('$viet-kich-ban')) {
        prompt = text
        break
      }
    } catch {
      // dong hong: bo qua
    }
  }
  const info = parseNewVideoPrompt(prompt)
  if (!info) return null
  const draft: Draft = {
    title: info.title || 'Video mới',
    subject: info.subject,
    lop: info.lop,
    loai: info.loai,
    createdAt: Number(key.slice(4)) || Date.now(),
    prompt
  }
  const s = readStore()
  s[projectDir] = { ...(s[projectDir] ?? {}), [key]: draft }
  writeStore(s)
  return draft
}
