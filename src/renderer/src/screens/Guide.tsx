import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, Lightbulb, Maximize2, Rows3, Search, X } from 'lucide-react'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import shotsMeta from '@/assets/guide/shots.json'

const g = copy.guide

type GroupId = keyof typeof g.groups
interface Step {
  t: string
  d: string
  /** Anh chup app (src/renderer/src/assets/guide/<shot>.webp) */
  shot?: string
  /** Chu tren khung khoanh cho can bam */
  mark?: string
  tip?: string
}
interface Section {
  id: string
  group: string
  title: string
  lead?: string
  steps: Step[]
}
interface Rect {
  x: number
  y: number
  w: number
  h: number
}
interface ShotMeta {
  w: number
  h: number
  mark?: Rect | null
}

const SECTIONS = g.sections as Section[]
const GROUPS = Object.keys(g.groups) as GroupId[]
const META = shotsMeta as Record<string, ShotMeta>
const IMAGES = import.meta.glob('../assets/guide/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const imageOf = (id?: string): string | undefined =>
  id ? IMAGES[`../assets/guide/${id}.webp`] : undefined

type View = 'cards' | 'read'
const VIEW_KEY = 'huong-dan.kieu-xem'
function loadView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'read' ? 'read' : 'cards'
  } catch {
    return 'cards'
  }
}

/** Bo dau, chu thuong: tim "dang nhap" ra "Đăng nhập". */
const fold = (s: string): string =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

const minutes = (s: Section): number => {
  const words = [s.lead ?? '', ...s.steps.flatMap((x) => [x.t, x.d, x.tip ?? ''])]
    .join(' ')
    .split(/\s+/).length
  return Math.max(1, Math.round(words / 180))
}

const stepId = (s: Section, i: number): string => `${s.id}-b${i + 1}`

/** Huong dan: muc luc ben trai, tim kiem, hai kieu xem (the / doc mot trang), anh chup app that. */
export function GuideScreen(): React.JSX.Element {
  const [view, setViewState] = useState<View>(loadView)
  const setView = (v: View): void => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // khong luu duoc thi lan sau ve mac dinh
    }
  }
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(SECTIONS[1]?.id ?? SECTIONS[0].id)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [zoom, setZoom] = useState<{ shot: string; mark?: string } | null>(null)

  const q = fold(query.trim())
  const shown = useMemo(() => {
    if (!q) return SECTIONS
    return SECTIONS.map((s) => {
      // Uu tien dung buoc co chu can tim; khong buoc nao co thi tim o ten muc
      const steps = s.steps.filter((x) => fold(`${x.t} ${x.d} ${x.tip ?? ''}`).includes(q))
      if (steps.length) return { ...s, steps }
      return fold(`${s.title} ${s.lead ?? ''}`).includes(q) ? s : null
    }).filter((s): s is Section => !!s)
  }, [q])
  const resultCount = shown.reduce((n, s) => n + s.steps.length, 0)

  // Doc mot trang: muc dang doc theo vi tri cuon
  const observed = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (view !== 'read' || !observed.current) return
    const root = observed.current
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
        if (!vis.length) return
        const top = vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const el = top.target as HTMLElement
        if (el.dataset.section) setActive(el.dataset.section)
        if (el.dataset.step) {
          setActiveStep(el.dataset.step)
          setActive(el.dataset.step.replace(/-b\d+$/, ''))
        }
      },
      { rootMargin: '-72px 0px -65% 0px' }
    )
    root.querySelectorAll('[data-section],[data-step]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [view, shown])

  const go = (id: string): void => {
    setActive(id)
    if (view === 'read')
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0 })
  }

  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0]
  const cardSections = q ? shown : [current]

  return (
    <div className="mx-auto box-border flex w-full max-w-[1280px] flex-1 gap-9 px-8 pt-7 pb-16">
      <nav
        aria-label={g.title}
        className="sticky top-[84px] flex max-h-[calc(100vh-100px)] w-[230px] shrink-0 flex-col gap-3.5 self-start overflow-y-auto"
      >
        <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[#c9d2ea] bg-white px-3 focus-within:border-cham">
          <Search aria-hidden className="size-4 shrink-0 text-phu" />
          <span className="sr-only">{g.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={g.search}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label={g.clear}
              onClick={() => setQuery('')}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-phu hover:bg-nen"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )}
        </label>
        <div className="flex flex-col gap-0.5">
          {GROUPS.map((gid) => {
            const items = shown.filter((s) => s.group === gid)
            if (!items.length) return null
            return (
              <div key={gid} className="flex flex-col gap-0.5">
                <span className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-[0.07em] text-phu uppercase">
                  {g.groups[gid]}
                </span>
                {items.map((s) => {
                  const on = s.id === active && (!q || view === 'read')
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={on ? 'true' : undefined}
                      onClick={() => go(s.id)}
                      className={cn(
                        'cursor-pointer rounded-lg px-3 py-2 text-left text-sm',
                        on ? 'bg-cham-nhat font-bold text-cham' : 'font-medium hover:bg-white'
                      )}
                    >
                      {s.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {q ? (
              <>
                <span className="text-[13px] font-semibold text-cham">{g.title}</span>
                <h1 className="m-0 text-[28px] leading-tight font-extrabold">
                  {g.results(resultCount)}
                </h1>
              </>
            ) : view === 'cards' ? (
              <>
                <span className="text-[13px] font-semibold text-cham">
                  {g.groups[current.group as GroupId]} · {g.stepCount(current.steps.length)}
                </span>
                <h1 className="m-0 text-[28px] leading-tight font-extrabold">{current.title}</h1>
              </>
            ) : (
              <h1 className="m-0 text-[28px] leading-tight font-extrabold">{g.title}</h1>
            )}
          </div>
          <div
            role="radiogroup"
            aria-label={g.viewLabel}
            className="flex gap-1 rounded-[10px] border border-vien bg-white p-1"
          >
            {(['cards', 'read'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'flex h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px]',
                  view === v ? 'bg-cham-nhat font-bold text-cham' : 'font-semibold text-phu'
                )}
              >
                {v === 'cards' ? (
                  <LayoutGrid aria-hidden className="size-[15px]" />
                ) : (
                  <Rows3 aria-hidden className="size-[15px]" />
                )}
                {g.views[v]}
              </button>
            ))}
          </div>
        </div>

        {q && shown.length === 0 && <p className="m-0 text-[15px] text-phu">{g.noResult(query)}</p>}

        {view === 'cards' ? (
          cardSections.map((s) => (
            <section key={s.id} aria-label={s.title} className="flex flex-col gap-4">
              {q ? (
                <h2 className="m-0 mt-2 text-lg font-bold">{s.title}</h2>
              ) : (
                s.lead && <p className="m-0 max-w-[760px] text-[15px] text-[#3d4466]">{s.lead}</p>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] items-start gap-[18px]">
                {s.steps.map((step, i) => (
                  <StepCard
                    key={step.t}
                    n={q ? undefined : i + 1}
                    step={step}
                    onZoom={() => step.shot && setZoom({ shot: step.shot, mark: step.mark })}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div ref={observed} className="flex max-w-[760px] flex-col gap-12">
            {shown.map((s) => (
              <article
                key={s.id}
                id={s.id}
                data-section={s.id}
                className="flex scroll-mt-20 flex-col gap-4 text-base leading-[1.65]"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-semibold text-cham">
                    {g.groups[s.group as GroupId]} · {g.readTime(minutes(s))}
                  </span>
                  <h2 className="m-0 text-2xl leading-tight font-extrabold">{s.title}</h2>
                </div>
                {s.lead && <p className="m-0 text-[#3d4466]">{s.lead}</p>}
                {s.steps.map((step, i) => (
                  <div
                    key={step.t}
                    id={stepId(s, i)}
                    data-step={stepId(s, i)}
                    className="flex scroll-mt-20 flex-col gap-3"
                  >
                    <h3 className="m-0 mt-1 flex items-center gap-2.5 text-lg font-bold">
                      <Num n={i + 1} />
                      {step.t}
                    </h3>
                    <p className="m-0">{step.d}</p>
                    {step.shot && imageOf(step.shot) && (
                      <figure className="m-0 flex flex-col gap-2">
                        <ShotFull
                          shot={step.shot}
                          mark={step.mark}
                          onZoom={() => setZoom({ shot: step.shot!, mark: step.mark })}
                        />
                      </figure>
                    )}
                    {step.tip && <Tip text={step.tip} />}
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
      </main>

      {view === 'read' && !q && (
        <aside
          aria-label={g.onThisPage}
          className="sticky top-[84px] hidden w-[190px] shrink-0 flex-col gap-2 self-start pt-[52px] text-[13px] min-[1150px]:flex"
        >
          <span className="text-[11px] font-bold tracking-[0.07em] text-phu uppercase">
            {g.onThisPage}
          </span>
          {current.steps.map((step, i) => {
            const id = stepId(current, i)
            const on = activeStep === id
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={cn(
                  'border-l-2 py-0.5 pl-2.5 no-underline',
                  on ? 'border-cham font-bold text-cham' : 'border-vien text-phu hover:text-navy'
                )}
              >
                {i + 1} · {step.t}
              </a>
            )
          })}
        </aside>
      )}

      {zoom && <Lightbox shot={zoom.shot} mark={zoom.mark} onClose={() => setZoom(null)} />}
    </div>
  )
}

function Num({ n, className }: { n: number; className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full bg-cham text-sm font-extrabold text-white',
        className
      )}
    >
      {n}
    </span>
  )
}

function Tip({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 rounded-[10px] bg-cham-nhat px-3.5 py-3 text-[15px] leading-normal">
      <Lightbulb aria-hidden className="mt-0.5 size-5 shrink-0 text-cham" />
      <span>
        <span className="sr-only">{g.tip}: </span>
        {text}
      </span>
    </div>
  )
}

const pct = (a: number, b: number): string => `${(a / b) * 100}%`

/** Khung cam khoanh cho can bam, toa do theo % cua vung anh. */
function Ring({ m, region, label }: { m: Rect; region: Rect; label?: string }): React.JSX.Element {
  const pad = 6
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-[10px] border-[3px] border-[#e08a1e]"
        style={{
          left: pct(m.x - pad - region.x, region.w),
          top: pct(m.y - pad - region.y, region.h),
          width: pct(m.w + pad * 2, region.w),
          height: pct(m.h + pad * 2, region.h)
        }}
      />
      {label && (
        <span
          aria-hidden
          className="pointer-events-none absolute -translate-y-full rounded-lg bg-[#e08a1e] px-2.5 py-1 text-[13px] font-bold whitespace-nowrap text-white shadow"
          style={{
            left: pct(Math.max(0, m.x - pad - region.x), region.w),
            top: `calc(${pct(m.y - pad - region.y, region.h)} - 6px)`
          }}
        >
          {label}
        </span>
      )}
    </>
  )
}

/** Vung cat quanh cho khoanh (16:9) de anh nho tren the van doc duoc. */
function cropOf(meta: ShotMeta): Rect {
  const { w: W, h: H, mark: m } = meta
  const ratio = 9 / 16
  if (!m) {
    const h = Math.min(H, W * ratio)
    return { x: 0, y: 0, w: h / ratio, h }
  }
  let w = Math.min(W, Math.max(m.w * 2.6, (m.h * 2.6) / ratio, W * 0.42))
  let h = w * ratio
  if (h > H) {
    h = H
    w = h / ratio
  }
  const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi)
  return {
    x: clamp(m.x + m.w / 2 - w / 2, 0, W - w),
    y: clamp(m.y + m.h / 2 - h / 2, 0, H - h),
    w,
    h
  }
}

function StepCard({
  n,
  step,
  onZoom
}: {
  n?: number
  step: Step
  onZoom: () => void
}): React.JSX.Element {
  const src = imageOf(step.shot)
  const meta = step.shot ? META[step.shot] : undefined
  const region = meta ? cropOf(meta) : null
  const pic = !!(src && meta && region)
  return (
    <article className="flex flex-col overflow-hidden rounded-[14px] border border-vien bg-white">
      {pic && (
        <div className="relative aspect-video overflow-hidden border-b border-vien bg-[#eef1f8]">
          <button
            type="button"
            aria-label={`${g.zoom}: ${step.t}`}
            onClick={onZoom}
            className="group absolute inset-0 cursor-zoom-in"
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute max-w-none"
              style={{
                width: pct(meta!.w, region!.w),
                left: `-${pct(region!.x, region!.w)}`,
                top: `-${pct(region!.y, region!.h)}`
              }}
            />
            {meta!.mark && <Ring m={meta!.mark} region={region!} />}
            <span className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-lg bg-white/90 text-navy opacity-0 shadow transition-opacity group-hover:opacity-100">
              <Maximize2 aria-hidden className="size-4" />
            </span>
          </button>
          {n !== undefined && <Num n={n} className="absolute bottom-2.5 left-3 shadow" />}
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
        <h3 className="m-0 flex items-start gap-2.5 text-base leading-7 font-bold">
          {!pic && n !== undefined && <Num n={n} />}
          {step.t}
        </h3>
        <p className="m-0 text-sm leading-normal text-[#3d4466]">{step.d}</p>
        {step.tip && (
          <p className="m-0 flex items-start gap-1.5 text-[13px] leading-normal text-phu">
            <Lightbulb aria-hidden className="mt-0.5 size-3.5 shrink-0 text-cham" />
            {step.tip}
          </p>
        )}
      </div>
    </article>
  )
}

function ShotFull({
  shot,
  mark,
  onZoom
}: {
  shot: string
  mark?: string
  onZoom?: () => void
}): React.JSX.Element | null {
  const src = imageOf(shot)
  const meta = META[shot]
  if (!src || !meta) return null
  const region = { x: 0, y: 0, w: meta.w, h: meta.h }
  const body = (
    <>
      <img
        src={src}
        alt=""
        draggable={false}
        className="block w-full rounded-lg shadow-[0_4px_14px_rgba(14,16,70,0.08)]"
      />
      {meta.mark && <Ring m={meta.mark} region={region} label={mark} />}
    </>
  )
  return (
    <div className="rounded-xl border border-vien bg-[#eef1f8] p-4">
      {onZoom ? (
        <button
          type="button"
          aria-label={g.zoom}
          onClick={onZoom}
          className="relative block w-full cursor-zoom-in"
        >
          {body}
        </button>
      ) : (
        <div className="relative">{body}</div>
      )}
    </div>
  )
}

function Lightbox({
  shot,
  mark,
  onClose
}: {
  shot: string
  mark?: string
  onClose: () => void
}): React.JSX.Element {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={g.zoom}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-8"
    >
      <div className="relative w-full max-w-[1200px]" onClick={(e) => e.stopPropagation()}>
        <ShotFull shot={shot} mark={mark} />
        <button
          ref={closeRef}
          type="button"
          aria-label={g.close}
          onClick={onClose}
          className="absolute -top-3 -right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-navy shadow-lg"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  )
}
