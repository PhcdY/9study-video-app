// Giao thuc app-file:// de giao dien mo anh storyboard, audio, video thanh pham.
// Chi cho doc file nam trong cac thu muc duoc phep (thu muc du an, noi luu video).
import { net, protocol } from 'electron'
import path from 'node:path'
import { createReadStream, statSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import log from '../log'

const MEDIA: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4'
}

/** "bytes=100-199" -> [100, 199]; sai thi null. */
export function parseRange(h: string | null, size: number): [number, number] | null {
  const m = h ? /^bytes=(\d*)-(\d*)$/.exec(h.trim()) : null
  if (!m || (m[1] === '' && m[2] === '')) return null
  let start: number
  let end: number
  if (m[1] === '') {
    // "bytes=-500": 500 byte cuoi
    start = Math.max(0, size - Number(m[2]))
    end = size - 1
  } else {
    start = Number(m[1])
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1)
  }
  return start <= end && start < size ? [start, end] : null
}

/** Video / audio: tra tung doan (206) de tua duoc; net.fetch(file://) khong ho tro Range. */
function mediaResponse(file: string, type: string, range: string | null): Response {
  const size = statSync(file).size
  const r = parseRange(range, size)
  const [start, end] = r ?? [0, size - 1]
  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Content-Length': String(end - start + 1)
  }
  if (r) headers['Content-Range'] = `bytes ${start}-${end}/${size}`
  return new Response(body, { status: r ? 206 : 200, headers })
}

export const SCHEME = 'app-file'

/** Goi truoc app ready. */
export function registerFileScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }
  ])
}

/** Duong dan nam trong mot thu muc goc (khong thoat ra ngoai bang ..). */
export function isInside(file: string, root: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(file))
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

/** Goi sau app ready. `roots()` tra ve cac thu muc duoc phep tai thoi diem doc. */
export function handleFileScheme(roots: () => string[]): void {
  protocol.handle(SCHEME, (req) => {
    // app-file://f/<duong dan da encodeURIComponent>
    const file = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ''))
    const allowed = roots().filter(Boolean)
    if (!path.isAbsolute(file) || !allowed.some((r) => isInside(file, r))) {
      log.warn(`[app-file] chan: ${file}`)
      return new Response('khong cho phep', { status: 403 })
    }
    const type = MEDIA[path.extname(file).toLowerCase()]
    if (type) {
      try {
        return mediaResponse(file, type, req.headers.get('range'))
      } catch {
        return new Response('khong doc duoc', { status: 404 })
      }
    }
    return net.fetch(pathToFileURL(file).toString(), { headers: req.headers })
  })
}
