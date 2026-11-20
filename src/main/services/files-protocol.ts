// Giao thuc app-file:// de giao dien mo anh storyboard, audio, video thanh pham.
// Chi cho doc file nam trong cac thu muc duoc phep (thu muc du an, noi luu video).
import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import log from '../log'

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
    return net.fetch(pathToFileURL(file).toString(), { headers: req.headers })
  })
}
