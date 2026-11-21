// Chup anh app that cho trang Huong dan (src/renderer/src/assets/guide/<id>.webp + shots.json).
//
// Cach chay (may nguoi phat trien, truoc khi ra ban):
//   1. npx electron-vite build
//   2. Mo app thu co du lieu mau, bat cong go loi:
//        NINESTUDY_USER_DATA=<thu muc du lieu thu> npx electron . --remote-debugging-port=9222
//      App phai da cai xong, dang o trang Video, co video mau "tiem-can" (co storyboard, giong, thanh pham),
//      bat che do nguoi bao tri va co it nhat mot gop y "Da sua".
//   3. node scripts/chup-huong-dan.mjs            (chup het)
//      node scripts/chup-huong-dan.mjs home new   (chup vai anh)
//
// Truoc moi anh, script thay email, duong dan may dev bang chu mau de anh khong lo thong tin rieng.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'renderer',
  'src',
  'assets',
  'guide'
)
const W = 1280
const H = 800
const SCALE = 1.5

const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const page = targets.find((t) => t.type === 'page' && !t.url.startsWith('devtools'))
if (!page) throw new Error('Khong thay cua so app. Mo app voi --remote-debugging-port=9222.')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++seq
    pending.set(i, resolve)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
const js = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: `(async () => { ${expr} })()`,
    awaitPromise: true,
    returnByValue: true
  })
  if (r.result?.exceptionDetails)
    throw new Error(r.result.exceptionDetails.exception?.description ?? 'loi JS')
  return r.result?.result?.value
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Ham dung trong trang: tim nut theo chu, cho, khung cua phan tu
await js(`
  window.__g = {
    find(text, sel = 'button, a, [role=tab], summary, label') {
      const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null)
      return els.find((e) => e.innerText.trim() === text) || els.find((e) => e.innerText.trim().startsWith(text))
    },
    click(text, sel) {
      const el = this.find(text, sel)
      if (!el) throw new Error('khong thay: ' + text)
      el.click()
    },
    rect(el) {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
    },
    type(el, value) {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    mask() {
      // Chu viet tat tren avatar lay tu email: doi thanh "BN"
      const email = (document.body.innerText.match(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/) || [''])[0]
      const ini = email && email !== 'ban@gmail.com' ? email.slice(0, 2).toUpperCase() : ''
      const swap = (s) => (ini && s.trim() === ini ? s.replace(ini, 'BN') : s)
        .replace(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/g, 'ban@gmail.com')
        .replace(/[A-Z]:\\\\[^\\s"]*?\\\\9Study_GopY/gi, 'G:\\\\My Drive\\\\9Study_GopY')
        .replace(/[A-Z]:\\\\9study-video-app\\\\spikes\\\\output\\\\video-repo/gi, 'D:\\\\9Study\\\\VideoAI')
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const v = swap(n.nodeValue)
        if (v !== n.nodeValue) n.nodeValue = v
      }
    }
  }
`)
const click = (text, sel) =>
  js(`__g.click(${JSON.stringify(text)}${sel ? `, ${JSON.stringify(sel)}` : ''})`)
const nav = async (text) => {
  // Man lam video / gop y khong co thanh dau: bam nut quay lai truoc
  for (let i = 0; i < 3; i++) {
    const has = await js(`return !!document.querySelector('header nav')`)
    if (has) break
    await js(`
      const b = document.querySelector('[aria-label="Quay lại video"], [aria-label="Về Video của tôi"]')
      if (b) b.click()`)
    await sleep(800)
  }
  await js(`
    const b = [...document.querySelectorAll('header nav button')].find((e) => e.innerText.trim().startsWith(${JSON.stringify(text)}))
    if (!b) throw new Error('khong thay muc ${text}')
    b.click()`)
  await sleep(700)
}
const toTop = () =>
  js(
    `window.scrollTo(0, 0); document.querySelectorAll('*').forEach((e) => { if (e.scrollTop) e.scrollTop = 0 })`
  )
/** Cuon phan tu len dau (duoi thanh dau 56px) */
const scrollTo = (selector, offset = 72) =>
  js(`
    const el = document.querySelector(${JSON.stringify(selector)})
    if (!el) throw new Error('khong thay ${selector}')
    el.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -${offset})`)
const escape = () =>
  js(
    `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`
  )
const openSample = async (title) => {
  await nav('Video')
  await toTop()
  const open = await js(`return !!__g.find(${JSON.stringify(title)})`)
  if (!open) await click('VIDEO MẪU')
  await sleep(300)
  await click(title)
  await sleep(1500)
}
const tab = async (text) => {
  await click(text, '[role=tab], button')
  await sleep(1200)
}

/** Danh sach anh: prep dua app ve dung man, mark tra ve khung can khoanh (hoac null). */
const SHOTS = {
  // Man cai dat lan dau: chi chup duoc khi app chua cai xong (vd bo "machineChecked" trong settings.json)
  setup: {
    prep: async () => {
      if (await js(`return !!document.querySelector('header nav')`))
        throw new Error('app da cai xong, khong co man cai dat lan dau')
    },
    mark: `return __g.rect(document.querySelector('nav'))`
  },
  home: {
    prep: async () => {
      await nav('Video')
      await toTop()
    },
    mark: `return __g.rect(__g.find('Làm video mới'))`
  },
  new: {
    prep: async () => {
      await nav('Video')
      await click('Làm video mới')
      await sleep(800)
      await js(`
        const i = [...document.querySelectorAll('input')].find((e) => e.offsetParent && /bài|tên/i.test(e.placeholder + (e.labels?.[0]?.innerText ?? '')))
        if (i) __g.type(i, 'Bài 3. Đường tiệm cận của đồ thị hàm số')`)
      await js(
        `__g.find('Bắt đầu viết kịch bản').scrollIntoView({ block: 'end' }); window.scrollBy(0, 24)`
      )
      await sleep(300)
    },
    mark: `return __g.rect(__g.find('Bắt đầu viết kịch bản'))`,
    after: async () => {
      await click('Huỷ').catch(() => nav('Video'))
    }
  },
  script: {
    prep: async () => {
      await openSample('Nhanh đến mấy cũng không tới 60?')
      await tab('Kịch bản')
    },
    mark: `return __g.rect(document.querySelector('textarea'))`
  },
  storyboard: {
    prep: () => tab('Storyboard'),
    mark: `return __g.rect(__g.find('Storyboard', '[role=tab], button'))`
  },
  motion: {
    prep: () => tab('Xem chuyển động'),
    mark: `return __g.rect(__g.find('Mở bản xem chuyển động'))`
  },
  audio: {
    prep: () => tab('Nghe thử'),
    mark: `return __g.rect(__g.find('Đọc sai'))`
  },
  final: {
    prep: () => tab('Thành phẩm'),
    mark: `return __g.rect(__g.find('Thành phẩm', '[role=tab], button'))`
  },
  feedback: {
    prep: async () => {
      await click('Góp ý cho đội')
      await sleep(1800)
    },
    mark: `return __g.rect(__g.find('Gửi góp ý'))`,
    after: async () => {
      await escape()
      await nav('Video').catch(() => {})
    }
  },
  usage: {
    prep: async () => {
      await nav('Video')
      await toTop()
      await js(
        `[...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Usage')).click()`
      )
      await sleep(600)
    },
    mark: `return __g.rect([...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Usage')))`,
    // Bam lai nut Usage de dong khung dang ghim
    after: async () => {
      await js(
        `[...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Usage')).click()`
      )
      await sleep(500)
      if (await js(`return !!__g.find('Xem trong Cài đặt')`)) await escape()
      await sleep(300)
    }
  },
  settingsVoice: {
    prep: async () => {
      await nav('Cài đặt')
      await scrollTo('#giong-doc')
    },
    mark: `return null`
  },
  settingsVersion: {
    prep: () => scrollTo('#phien-ban'),
    mark: `return null`
  },
  settingsFeedback: {
    prep: () => scrollTo('#gop-y'),
    mark: `return __g.rect(__g.find('Mở thư mục của đội'))`
  },
  settingsName: {
    prep: async () => {
      await nav('Cài đặt')
      await scrollTo('#gop-y')
    },
    mark: `return __g.rect(document.getElementById('ten-ctv'))`
  },
  sent: {
    prep: async () => {
      await scrollTo('#gop-y')
      if (await js(`return !!__g.find('Xem')`)) await click('Xem')
      await sleep(300)
      await js(`
        const b = document.querySelector('li > button[aria-expanded="false"]:not([disabled])')
        if (b) b.click()`)
      await sleep(300)
      await js(
        `document.querySelector('li > button[aria-expanded="true"]').scrollIntoView({ block: 'center' })`
      )
    },
    mark: `return __g.rect(document.querySelector('li > button[aria-expanded="true"]').parentElement)`
  },
  bug: {
    prep: async () => {
      await scrollTo('#ho-tro')
      if (!(await js(`return !!__g.find('Gửi cho người phụ trách')`))) await click('Gửi báo lỗi')
      await sleep(500)
      await js(`
        const t = document.querySelector('#ho-tro ~ * textarea, textarea')
        if (t) __g.type(t, 'Bấm Xuất video thì app báo lỗi, thử lại vẫn vậy.')`)
      await js(`__g.find('Gửi cho người phụ trách').scrollIntoView({ block: 'center' })`)
      await sleep(300)
    },
    mark: `return __g.rect(__g.find('Gửi cho người phụ trách'))`,
    after: () => click('Huỷ').catch(() => {})
  },
  inbox: {
    prep: async () => {
      await nav('Góp ý')
      await click('Góp ý về video').catch(() => {})
      await click('Xong')
      await sleep(1800)
    },
    mark: `return __g.rect(document.querySelector('#da-sua')?.closest('section'))`
  }
}

const only = process.argv.slice(2)
const metaFile = path.join(OUT, 'shots.json')
mkdirSync(OUT, { recursive: true })
const readMeta = () => {
  try {
    return JSON.parse(readFileSync(metaFile, 'utf8'))
  } catch {
    return {}
  }
}
const meta = readMeta()

await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: SCALE,
  mobile: false
})
await sleep(600)
try {
  for (const [id, s] of Object.entries(SHOTS)) {
    if (only.length && !only.includes(id)) continue
    try {
      await s.prep()
      await sleep(500)
      await js(`__g.mask()`)
      const mark = await js(s.mark)
      const r = await send('Page.captureScreenshot', {
        format: 'webp',
        quality: 82,
        captureBeyondViewport: false
      })
      if (!r.result?.data) throw new Error('khong chup duoc')
      writeFileSync(path.join(OUT, `${id}.webp`), Buffer.from(r.result.data, 'base64'))
      meta[id] = { w: W, h: H, mark: mark && mark.w > 0 ? mark : null }
      console.log(`da chup ${id}${mark ? ' (co khoanh)' : ''}`)
      await s.after?.()
    } catch (e) {
      console.log(`BO QUA ${id}: ${e.message}`)
    }
  }
} finally {
  await send('Emulation.clearDeviceMetricsOverride')
  const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(metaFile, `${JSON.stringify(sorted, null, 2)}\n`)
  ws.close()
}
