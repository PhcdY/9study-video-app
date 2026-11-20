import { useEffect, useMemo, useState } from 'react'
import { FolderOpen, Play, X } from 'lucide-react'
import type { FeedbackItem, FeedbackStatus } from '../../../shared/feedback'
import {
  batchName,
  branchName,
  guessTarget,
  headline,
  mmss,
  nextVersion,
  spotLabel
} from '../../../shared/feedback-rules'
import { subjectName } from '../../../shared/prompt'
import type { VersionInfo } from '../../../shared/app'
import { api, fileUrl, useFeedback } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/layout'

const t = copy.inbox
const f = copy.feedback
type Tab = 'moi' | 'dangSua' | 'xong'
const tabOf = (s: FeedbackStatus): Tab => (s === 'moi' || s === 'dangSua' ? s : 'xong')

/** "2 giờ", "Hôm qua", "18/11". */
function when(ms: number): string {
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))} phút`
  if (h < 24) return `${h} giờ`
  if (h < 48) return 'Hôm qua'
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
const classOf = (it: FeedbackItem): string =>
  `${subjectName(it.subject)}${it.lop ? ` ${it.lop}` : ''}`
const sizeOf = (it: FeedbackItem): number => it.files.reduce((s, x) => s + x.size, 0)
/** Cho sua du kien, ngan gon: "dung-video", "phonetic_dict.json", "mon/van.md". */
const shortTarget = (p: string): string =>
  p
    .replace(/^\.agents\/skills\//, '')
    .replace(/^\.agents\//, '')
    .replace(/^scripts\//, '')

/** Hop thu gop y cho nguoi bao tri: danh sach + chi tiet, tick nhieu de gop thanh mot lan sua. */
export function InboxScreen({
  version,
  onOpenChat
}: {
  version: VersionInfo | null
  onOpenChat: (key: string) => void
}): React.JSX.Element {
  const [list] = useFeedback()
  const [tab, setTab] = useState<Tab>('moi')
  const [current, setCurrent] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const items = useMemo(() => list?.items ?? [], [list])
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { moi: 0, dangSua: 0, xong: 0 }
    for (const it of items) c[tabOf(it.state.status)]++
    return c
  }, [items])
  const shown = items.filter((it) => tabOf(it.state.status) === tab)
  const cur = items.find((it) => it.id === current) ?? shown[0]
  const next = nextVersion(version?.latest ?? version?.current)

  // Ban da phat hanh: lan sua dua vao ban do tu chuyen "Da sua trong ban N"
  const released = Number(version?.latest ?? version?.current)
  useEffect(() => {
    if (!Number.isFinite(released)) return
    const done = items.filter(
      (it) =>
        it.state.status === 'dangSua' &&
        it.state.batch?.target &&
        Number(it.state.batch.target) <= released
    )
    for (const it of done)
      void api.invoke('feedback:setState', [it.id], {
        status: 'daSua',
        fixedIn: it.state.batch!.target,
        batch: it.state.batch
      })
  }, [items, released])

  const toggle = (id: string, on: boolean): void => {
    const s = new Set(picked)
    if (on) s.add(id)
    else s.delete(id)
    setPicked(s)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-wrap">
      <nav
        aria-label="Danh sách góp ý"
        className="box-border flex max-w-[360px] min-w-0 flex-[1_1_320px] flex-col border-r border-vien bg-white"
      >
        {picked.size > 0 && (
          <div className="flex items-center gap-2.5 bg-navy px-4 py-2.5 text-white">
            <span className="flex-1 text-[13px] font-bold">{t.picked(picked.size)}</span>
            <button
              type="button"
              onClick={() => setPicked(new Set())}
              className="h-[30px] cursor-pointer rounded-md border border-white/35 px-2.5 text-xs font-semibold"
            >
              {t.unpick}
            </button>
          </div>
        )}
        <div className="flex gap-1 border-b border-[#EEF1F8] px-4 py-3.5">
          {(['moi', 'dangSua', 'xong'] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                'h-8 cursor-pointer rounded-md px-2.5 text-[13px] font-semibold',
                tab === k
                  ? picked.size
                    ? 'bg-[#F1F3FA] font-bold text-navy'
                    : 'bg-navy text-white'
                  : 'text-phu hover:text-navy'
              )}
            >
              {t.tabs[k]} · {counts[k]}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!list?.dir && <p className="m-0 px-4 py-4 text-[13px] text-phu">{t.noDir}</p>}
          {list?.dir && shown.length === 0 && (
            <p className="m-0 px-4 py-4 text-[13px] text-phu">{t.empty}</p>
          )}
          {shown.map((it) => {
            const sel = !picked.size && cur?.id === it.id
            const head = headline(it.desc)
            return (
              <div
                key={it.id}
                className={cn(
                  'flex gap-3 border-b border-[#EEF1F8] px-4 py-3',
                  sel || picked.has(it.id) ? 'bg-nen' : 'bg-white',
                  sel && 'shadow-[inset_3px_0_0_var(--color-cham)]'
                )}
              >
                <input
                  type="checkbox"
                  aria-label={t.pick(head)}
                  checked={picked.has(it.id)}
                  onChange={(e) => toggle(it.id, e.target.checked)}
                  className="m-0 mt-0.5 size-[18px] shrink-0 accent-cham"
                />
                <button
                  type="button"
                  aria-current={sel ? 'true' : undefined}
                  onClick={() => {
                    setCurrent(it.id)
                    setPicked(new Set())
                  }}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm font-bold">{head}</span>
                    <span className="text-xs whitespace-nowrap text-phu">{when(it.createdAt)}</span>
                  </span>
                  <span className="text-xs text-phu">
                    {it.author} · {classOf(it)} · {it.title}
                  </span>
                  <span className="flex gap-1.5">
                    <Tag>{f.kindsShort[it.kind]}</Tag>
                    {it.scope === 'chung' && <Tag tone="credit">{t.general}</Tag>}
                  </span>
                </button>
              </div>
            )
          })}
          {shown.length > 0 && (
            <p className="m-0 px-4 py-3 text-xs leading-normal text-phu">{t.tickHint}</p>
          )}
        </div>
      </nav>

      <main className="box-border flex min-w-0 flex-[999_1_600px] flex-col gap-4 overflow-y-auto p-6">
        {picked.size > 0 ? (
          <Batch
            items={items.filter((it) => picked.has(it.id))}
            next={next}
            onRemove={(id) => toggle(id, false)}
            onDone={(key) => {
              setPicked(new Set())
              if (key) onOpenChat(key)
            }}
          />
        ) : cur ? (
          <Detail
            key={cur.id}
            it={cur}
            next={next}
            onFix={() => setPicked(new Set([cur.id]))}
            onOpenChat={onOpenChat}
          />
        ) : null}
      </main>
    </div>
  )
}

function Tag({
  children,
  tone
}: {
  children: React.ReactNode
  tone?: 'credit'
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'rounded px-[7px] py-0.5 text-[11px] font-bold',
        tone === 'credit' ? 'bg-credit-nen text-[#8A4600]' : 'bg-[#F1F3FA] text-[#3D4466]'
      )}
    >
      {children}
    </span>
  )
}

function Detail({
  it,
  next,
  onFix,
  onOpenChat
}: {
  it: FeedbackItem
  next?: string
  onFix: () => void
  onOpenChat: (key: string) => void
}): React.JSX.Element {
  const label = spotLabel(it.spot)
  const head = headline(it.desc)
  const status = it.state.status === 'daSua' ? `daSua:${it.state.fixedIn ?? ''}` : it.state.status
  const branch = it.state.batch?.branch ?? branchName([it.subject], head)
  const taughtLines = (it.taught ?? '').split(/\r?\n/).slice(0, 40)
  const taughtCount = taughtLines.filter((l) => /^\+\+\+ /.test(l)).length
  const fixedIn = it.state.fixedIn ?? next

  const setStatus = (v: string): void => {
    const [st, ver] = v.split(':') as [FeedbackStatus, string | undefined]
    void api.invoke('feedback:setState', [it.id], {
      status: st,
      fixedIn: st === 'daSua' ? ver || undefined : undefined,
      batch: it.state.batch
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <h1 className="m-0 text-xl font-bold">{head}</h1>
          <p className="m-0 text-[13px] text-phu">
            {[
              t.sentBy(it.author, when(it.createdAt)),
              `"${it.title}"`,
              classOf(it),
              it.toolkitVersion && t.version(it.toolkitVersion),
              t.app(it.appVersion),
              it.voice && t.voice(it.voice)
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <label className="sr-only" htmlFor="st">
          {t.statusLabel}
        </label>
        <Select
          id="st"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-auto text-[13px] font-semibold"
        >
          <option value="moi">{f.status.moi}</option>
          <option value="dangSua">{f.status.dangSua}</option>
          {fixedIn && <option value={`daSua:${fixedIn}`}>{f.fixedIn(fixedIn)}</option>}
          {!fixedIn && <option value="daSua:">{f.status.daSua}</option>}
          <option value="khongSua">{f.status.khongSua}</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-[999_1_420px] overflow-hidden rounded-xl bg-navy">
          {it.paths.doan ? (
            <video controls src={fileUrl(it.paths.doan)} className="aspect-video w-full bg-black" />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-white/70">
              {t.noClip}
            </div>
          )}
          <div className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-white">
            {it.spot.time !== undefined && <span>{mmss(it.spot.time)}</span>}
            <span className="flex-1" />
            {it.paths.caVideo && (
              <button
                type="button"
                onClick={() => void api.invoke('shell:openPath', it.paths.caVideo!)}
                className="cursor-pointer text-xs font-semibold text-white underline"
              >
                {t.fullVideo}
              </button>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
          {it.paths.storyboard && (
            <div className="overflow-hidden rounded-xl border border-vien bg-white">
              <img
                src={fileUrl(it.paths.storyboard)}
                alt={t.storyboard(label)}
                className="block aspect-video w-full border-b border-[#EEF1F8] bg-[#FBFCFF] object-contain"
              />
              <div className="px-3 py-2 text-xs text-phu">{t.storyboard(label)}</div>
            </div>
          )}
          {it.paths.audio && <AudioRow src={it.paths.audio} speak={it.spot.speak} it={it} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-2 rounded-xl border border-vien bg-white px-4 py-3.5">
          <h2 className="m-0 text-[13px] font-bold text-phu">{t.wrote(it.author)}</h2>
          <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">{it.desc}</p>
          <p className="m-0 text-xs text-phu">
            {t.meta(
              f.kindsShort[it.kind],
              it.scope === 'chung' ? t.scopeChung : t.scopeVideo,
              f.size(sizeOf(it))
            )}
          </p>
        </section>
        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-2 rounded-xl border border-vien bg-white px-4 py-3.5">
          <h2 className="m-0 text-[13px] font-bold text-phu">{t.taught(it.author, taughtCount)}</h2>
          {it.taught ? (
            <pre className="m-0 max-h-60 overflow-auto rounded-lg bg-nen px-3 py-2.5 font-[Consolas,monospace] text-xs leading-relaxed whitespace-pre-wrap">
              {taughtLines.map((l, i) => (
                <span
                  key={i}
                  className={cn(
                    'block',
                    /^\+(?!\+\+)/.test(l) && 'text-xong',
                    /^-(?!--)/.test(l) && 'text-loi',
                    /^(\+\+\+|diff |index |---)/.test(l) && 'font-bold text-navy'
                  )}
                >
                  {l || ' '}
                </span>
              ))}
            </pre>
          ) : (
            <p className="m-0 text-[13px] text-phu">{t.taughtNone}</p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {it.state.status === 'dangSua' && it.state.batch ? (
          <Button size="sm" onClick={() => onOpenChat(`he-gopy-${it.state.batch!.branch}`)}>
            {t.openChat}
          </Button>
        ) : (
          <Button size="sm" onClick={onFix}>
            {t.toFix}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => void api.invoke('shell:openPath', it.dir)}>
          <FolderOpen aria-hidden className="size-4" /> {t.openFolder}
        </Button>
        <span className="flex-[1_1_260px] text-right text-xs text-phu">{t.toFixHint(branch)}</span>
      </div>
    </>
  )
}

function AudioRow({
  src,
  speak,
  it
}: {
  src: string
  speak?: string
  it: FeedbackItem
}): React.JSX.Element {
  const [el, setEl] = useState<HTMLAudioElement | null>(null)
  const [dur, setDur] = useState<number | null>(null)
  const id =
    it.spot.beat && it.spot.line ? `${it.spot.beat}-l${String(it.spot.line).padStart(2, '0')}` : ''
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-vien bg-white px-3 py-2.5">
      <button
        type="button"
        aria-label={`Nghe câu ${id}`}
        onClick={() => void el?.play()}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cham"
      >
        <Play aria-hidden className="size-3 fill-white text-white" />
      </button>
      <div className="flex min-w-0 flex-col">
        <span className="text-[13px] font-semibold">
          {id}.mp3{dur ? ` · ${dur.toFixed(1).replace('.', ',')} giây` : ''}
        </span>
        {speak && <span className="text-xs text-phu">“{speak}”</span>}
      </div>
      <audio
        ref={setEl}
        src={fileUrl(src)}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
      />
    </div>
  )
}

function Batch({
  items,
  next,
  onRemove,
  onDone
}: {
  items: FeedbackItem[]
  next?: string
  onRemove: (id: string) => void
  onDone: (chatKey: string | null) => void
}): React.JSX.Element {
  const heads = items.map((it) => headline(it.desc, 40))
  const autoName = batchName(heads)
  const [name, setName] = useState(autoName)
  const [nameEdited, setNameEdited] = useState(false)
  const [branch, setBranch] = useState('')
  const [branchEdited, setBranchEdited] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const shownName = nameEdited ? name : autoName
  const autoBranch = branchName(
    items.map((it) => it.subject),
    shownName
  )
  const shownBranch = branchEdited ? branch : autoBranch

  const authors = [...new Set(items.map((it) => it.author))]
  const kinds = new Set(items.map((it) => it.kind)).size
  const targets = items.map((it) => guessTarget(it.kind, it.subject))
  const total = items.reduce((s, it) => s + sizeOf(it), 0)

  const go = async (openNow: boolean): Promise<void> => {
    setBusy(true)
    const key = await api.invoke('feedback:fix', {
      ids: items.map((it) => it.id),
      name: shownName,
      branch: shownBranch,
      target: next,
      openNow
    })
    setBusy(false)
    if (openNow) onDone(key)
    else setSaved(true)
  }

  return (
    <div className="flex max-w-[860px] flex-col gap-[18px]">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-xl font-bold">{t.batchTitle(items.length)}</h1>
        <p className="m-0 text-[13px] text-phu">
          {t.batchSub(authors.join(t.and), kinds, new Set(targets).size)}
        </p>
      </div>

      <section aria-label="Góp ý trong lần sửa" className="rounded-xl border border-vien bg-white">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-[#EEF1F8] px-4 py-3"
          >
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
              <span className="text-sm font-bold">{headline(it.desc)}</span>
              <span className="text-xs text-phu">
                {it.author} · {classOf(it)} · {f.kindsShort[it.kind]}
              </span>
            </div>
            <span className="rounded border border-vien bg-nen px-2 py-[3px] font-[Consolas,monospace] text-xs text-[#3D4466]">
              {shortTarget(targets[i])}
            </span>
            <button
              type="button"
              aria-label={t.remove(headline(it.desc))}
              onClick={() => onRemove(it.id)}
              className="flex size-[30px] cursor-pointer items-center justify-center rounded-md hover:bg-nen"
            >
              <X aria-hidden className="size-3.5 text-phu" />
            </button>
          </div>
        ))}
        <div className="px-4 py-2.5 text-xs text-phu">{t.guessHint}</div>
      </section>

      <section className="grid grid-cols-2 gap-3.5 rounded-xl border border-vien bg-white p-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor="ten" className="text-[13px] font-bold">
            {t.batchName}
          </label>
          <Input
            id="ten"
            value={shownName}
            onChange={(e) => {
              setName(e.target.value)
              setNameEdited(true)
            }}
            className="h-10 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nh" className="text-[13px] font-bold">
            {t.branch}
          </label>
          <Input
            id="nh"
            value={shownBranch}
            onChange={(e) => {
              setBranch(e.target.value)
              setBranchEdited(true)
            }}
            className="h-10 font-[Consolas,monospace] text-[13px]"
          />
          <span className="text-xs text-phu">{t.branchHint}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ban" className="text-[13px] font-bold">
            {t.target}
          </label>
          <Select id="ban" className="h-10 text-sm" disabled={!next}>
            {next && <option>{t.targetOpt(next)}</option>}
          </Select>
          {next && <span className="text-xs text-phu">{t.targetHint(items.length, next)}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-[13px] font-bold text-phu">{t.codexGets}</h2>
        <ul className="m-0 flex list-disc flex-col gap-1 pl-[18px] text-sm leading-normal">
          <li>{t.gets1(items.length, f.size(total))}</li>
          <li>{t.gets2}</li>
          <li>{t.gets3}</li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" disabled={busy || !shownBranch} onClick={() => void go(true)}>
          {t.openCodex(items.length)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || !shownBranch}
          onClick={() => void go(false)}
        >
          {t.saveLater}
        </Button>
        <span className={cn('text-xs', saved ? 'font-semibold text-xong' : 'text-phu')}>
          {saved ? t.saved : t.saveHint(items.length)}
        </span>
      </div>
    </div>
  )
}
