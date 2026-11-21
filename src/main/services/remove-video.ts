// Xoa mot video cua nguoi dung: go dang ky trong src/Root.tsx va liet ke moi file cua bai.
// Khong dung toi electron de chay duoc trong bai thu; chuyen vao Thung rac lam o videos.ts.
import path from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import type { ScriptData } from '../../shared/video'
import { finalDir, outputBase, workDir } from './project'

const IDENT = /^[A-Za-z_$][\w$]*$/
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Slug la ten mot thu muc, khong phai duong dan (chan "..", "a/b"). */
export const isSafeSlug = (slug: string): boolean =>
  !!slug && !slug.startsWith('.') && /^[^<>:"/\\|?*\s]+$/.test(slug)

/** Ten bien ma mot cau import dua vao: `A`, `{ B, C as D }`, `* as E`. */
export function importedNames(clause: string): string[] {
  const c = clause.replace(/^type\s+/, '').trim()
  const names: string[] = []
  const ns = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(c)
  if (ns) names.push(ns[1])
  const braces = /\{([^}]*)\}/.exec(c)
  if (braces)
    for (const part of braces[1].split(',')) {
      const p = part.trim().replace(/^type\s+/, '')
      const local = /\sas\s+([A-Za-z_$][\w$]*)$/.exec(p)?.[1] ?? p
      if (IDENT.test(local)) names.push(local)
    }
  const def = /^([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(c)
  if (def) names.push(def[1])
  return names
}

interface Span {
  start: number
  end: number
  tag: string
  text: string
}

/** Cac the JSX tu dong (<X ... />), bo qua chu trong {} va trong ngoac kep. */
function selfClosing(src: string): Span[] {
  const out: Span[] = []
  const re = /<([A-Z][\w$.]*)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    let i = re.lastIndex
    let depth = 0
    let quote = ''
    for (; i < src.length; i++) {
      const ch = src[i]
      if (quote) {
        if (ch === quote && src[i - 1] !== '\\') quote = ''
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (depth === 0 && ch === '>') break
    }
    if (i >= src.length) break
    if (src[i - 1] === '/')
      out.push({ start: m.index, end: i + 1, tag: m[1], text: src.slice(m.index, i + 1) })
  }
  return out
}

/** Doan can cat de bo `span` cung ca dong cua no; null neu tren dong con chu khac (vd `{x && <A />}`). */
function wholeLines(src: string, s: { start: number; end: number }): [number, number] | null {
  const lineStart = src.lastIndexOf('\n', s.start - 1) + 1
  const nl = src.indexOf('\n', s.end)
  const lineEnd = nl === -1 ? src.length : nl
  const before = src.slice(lineStart, s.start)
  const after = src.slice(s.end, lineEnd).replace(/^;/, '')
  if (before.trim() || after.trim()) return null
  return [lineStart, nl === -1 ? src.length : nl + 1]
}

/**
 * Go video `slug` khoi src/Root.tsx: bo cau import tu ./videos/<slug>/ va cac the dung ten do.
 * Tra ve noi dung moi (giu nguyen neu bai chua dang ky); null neu khong go sach duoc
 * (con cho nao nhac toi bai) — khi do khong sua gi de Studio khong bi hong.
 */
export function unregisterVideo(src: string, slug: string): string | null {
  const from = `["']\\./videos/${escapeRe(slug)}(?:/[^"']*)?["']`
  const importRe = new RegExp(
    `^[ \\t]*import\\s+([^;'"]*?)\\s+from\\s+${from}[ \\t]*;?[ \\t]*(?:\\r?\\n|$)`,
    'gm'
  )
  const names: string[] = []
  let next = src.replace(importRe, (_all, clause: string) => {
    names.push(...importedNames(clause))
    return ''
  })
  const uses = (text: string): boolean =>
    names.some((n) => new RegExp(`(?<![\\w$])${escapeRe(n)}(?![\\w$])`).test(text))
  if (names.length) {
    const cut: [number, number][] = []
    for (const el of selfClosing(next)) {
      if (!(names.includes(el.tag) || uses(el.text))) continue
      if (cut.some(([a, b]) => el.start >= a && el.end <= b)) continue
      const range = wholeLines(next, el)
      if (!range) return null
      cut.push(range)
    }
    for (const [a, b] of cut.sort((x, y) => y[0] - x[0])) next = next.slice(0, a) + next.slice(b)
  }
  if (uses(next)) return null
  if (new RegExp(`videos/${escapeRe(slug)}(?=["'/])`).test(next)) return null
  return next
}

/** Moi thu muc / file cua video trong du an va noi luu video (chi nhung cai dang co). */
export function videoPaths(
  projectDir: string,
  slug: string,
  id: string,
  script: ScriptData | null
): string[] {
  const list = [
    path.join(projectDir, 'src', 'videos', slug),
    path.join(projectDir, 'public', 'audio', slug),
    workDir(projectDir, id),
    workDir(projectDir, slug)
  ]
  if (script) {
    // Video thanh pham: <id>.mp4 + .srt .vtt .timeline.json trong thu muc bai (chung voi bai khac cung ten)
    const dir = finalDir(projectDir, script, id)
    if (dir !== workDir(projectDir, id) && existsSync(dir))
      for (const f of readdirSync(dir)) if (f.startsWith(`${id}.`)) list.push(path.join(dir, f))
  }
  const base = path.resolve(outputBase(projectDir))
  return [...new Set(list.map((p) => path.resolve(p)))].filter(
    (p) => existsSync(p) && p !== base && p !== path.resolve(projectDir)
  )
}
