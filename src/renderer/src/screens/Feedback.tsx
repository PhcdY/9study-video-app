import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, Crosshair, Loader2, X } from 'lucide-react'
import type {
  AttachId,
  FeedbackDraft,
  FeedbackKind,
  FeedbackScope,
  FeedbackSpot
} from '../../../shared/feedback'
import { spotLabel } from '../../../shared/feedback-rules'
import { subjectName } from '../../../shared/prompt'
import { api, fileUrl, usePrefs } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/layout'

const f = copy.feedback
const KINDS: FeedbackKind[] = ['hinh', 'giong', 'noiDung', 'loiApp']

export interface FeedbackTarget {
  slug: string
  time?: number
  beatLine?: string
  kind?: FeedbackKind
}

/** Gop y cho doi (CTV): trai la video + cho loi, phai la form. Theo thiet ke Feedback. */
export function FeedbackScreen({
  target,
  onClose
}: {
  target: FeedbackTarget
  onClose: () => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<FeedbackDraft | null>(null)
  const [spot, setSpot] = useState<FeedbackSpot>({})
  const [kind, setKind] = useState<FeedbackKind>(target.kind ?? 'hinh')
  const [scope, setScope] = useState<FeedbackScope>('chung')
  const [desc, setDesc] = useState('')
  const [attach, setAttach] = useState<Set<AttachId>>(new Set())
  const [picking, setPicking] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'fail' | 'noDir' | 'needDesc'>(
    'idle'
  )
  const [prefs] = usePrefs()
  const videoRef = useRef<HTMLVideoElement>(null)

  const load = (time?: number, beatLine?: string): void => {
    void api.invoke('feedback:draft', target.slug, time, beatLine).then((d) => {
      if (!d) return
      setDraft(d)
      setSpot(d.spot)
      setAttach(new Set(d.attachments.filter((a) => a.available && a.checked).map((a) => a.id)))
    })
  }
  useEffect(() => {
    load(target.time, target.beatLine)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.slug])

  const total = useMemo(
    () =>
      (draft?.attachments ?? [])
        .filter((a) => attach.has(a.id))
        .reduce((s, a) => s + (a.size ?? 0), 0),
    [draft, attach]
  )

  const send = async (): Promise<void> => {
    if (!desc.trim()) return setState('needDesc')
    setState('sending')
    const res = await api.invoke('feedback:create', {
      slug: target.slug,
      spot,
      kind,
      scope,
      desc,
      attach: [...attach]
    })
    if (res.ok) setState('sent')
    else setState(res.code === 'chuaCoThuMuc' ? 'noDir' : 'fail')
  }

  const pickDir = async (): Promise<void> => {
    const p = await api.invoke('feedback:pickDir')
    if (p?.feedbackDirInUse) {
      setDraft((d) => (d ? { ...d, feedbackDir: p.feedbackDirInUse } : d))
      setState('idle')
    }
  }

  const label = spotLabel(spot)
  const dir = draft?.feedbackDir ?? prefs?.feedbackDirInUse

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="box-border flex min-h-14 flex-wrap items-center gap-x-4 gap-y-3 border-b border-vien bg-white px-6 py-2">
        <button
          type="button"
          aria-label={f.back}
          onClick={onClose}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-vien hover:bg-nen"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col">
          <span className="truncate text-[15px] font-bold">{draft?.title ?? '…'}</span>
          <span className="text-xs text-phu">
            {draft
              ? `${subjectName(draft.subject)}${draft.lop ? ` ${draft.lop}` : ''} · ${copy.workspace.tabs.thanhPham}`
              : ''}
          </span>
        </div>
        {draft?.finalMp4 && (
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-xong">
            <span className="size-2 rounded-full bg-[#12A150]" />
            {copy.stageStatus.daXuat}
          </span>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-wrap overflow-y-auto">
        <section
          aria-label={copy.workspace.tabs.thanhPham}
          className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 p-6"
        >
          {draft?.finalMp4 ? (
            <div className="flex flex-col overflow-hidden rounded-xl bg-navy">
              <video
                ref={videoRef}
                controls
                src={fileUrl(draft.finalMp4)}
                className="aspect-video w-full bg-black"
                onLoadedMetadata={(e) => {
                  if (target.time !== undefined) e.currentTarget.currentTime = target.time
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-vien-dam bg-white px-5 py-6 text-[15px] text-phu">
              {f.noVideo}
            </div>
          )}

          <div className="flex flex-col gap-1.5 rounded-xl border border-vien bg-white px-4 py-3.5">
            <div className="text-xs font-bold text-phu">{label ? f.at(label) : f.spotNone}</div>
            {spot.speak && (
              <div className="text-[15px] leading-normal">
                <span className="text-phu">{f.speak}</span> {spot.speak}
              </div>
            )}
            {spot.text && (
              <div className="text-[15px] leading-normal">
                <span className="text-phu">{f.onScreen}</span> {spot.text}
              </div>
            )}
          </div>

          {(picking || !draft?.finalMp4) && draft && (
            <div className="flex flex-col gap-2 rounded-xl border border-vien bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="flex-1 text-[13px] text-phu">{f.pickHint}</span>
                {draft.finalMp4 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      load(videoRef.current?.currentTime ?? 0)
                      setPicking(false)
                    }}
                  >
                    <Crosshair aria-hidden className="size-4" /> {f.pickHere}
                  </Button>
                )}
              </div>
              <ul className="m-0 flex max-h-72 list-none flex-col overflow-y-auto p-0">
                {draft.lines.map((l) => {
                  const id = `${l.beat}-l${String(l.line).padStart(2, '0')}`
                  const on = spot.beat === l.beat && spot.line === l.line
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          load(undefined, id)
                          setPicking(false)
                        }}
                        className={cn(
                          'flex w-full cursor-pointer gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-nen',
                          on && 'bg-cham-nhat'
                        )}
                      >
                        <span className="w-16 shrink-0 text-xs font-bold text-phu">{id}</span>
                        <span className="leading-snug">{l.speak}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <aside
          aria-labelledby="gy"
          className="box-border flex max-w-[460px] min-w-0 flex-[1_1_400px] flex-col border-l border-vien bg-white"
        >
          <div className="flex items-start gap-2.5 px-6 pt-5">
            <div className="flex flex-1 flex-col gap-1">
              <h1 id="gy" className="m-0 text-[19px] font-bold">
                {f.title}
              </h1>
              <p className="m-0 text-[13px] leading-normal text-phu">{f.lead}</p>
            </div>
            <button
              type="button"
              aria-label={f.close}
              onClick={onClose}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-nen"
            >
              <X aria-hidden className="size-4 text-phu" />
            </button>
          </div>

          {state === 'sent' ? (
            <div className="flex flex-col gap-4 px-6 py-6">
              <div className="flex items-start gap-3 rounded-xl bg-xong-nen px-4 py-3.5 text-[15px] text-xong">
                <Check aria-hidden className="mt-0.5 size-5 shrink-0" />
                <span>{f.sent}</span>
              </div>
              <Button size="md" variant="outline" className="self-start" onClick={onClose}>
                {f.back}
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-[18px] px-6 py-[18px]"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold">{f.spot}</span>
                <span className="rounded-md bg-[#F1F3FA] px-2.5 py-1 text-[13px] font-semibold">
                  {label || f.spotNone}
                </span>
                <button
                  type="button"
                  onClick={() => setPicking((p) => !p)}
                  className="cursor-pointer text-[13px] font-semibold text-cham hover:text-cham-dam"
                >
                  {f.pickAgain}
                </button>
              </div>

              <fieldset className="m-0 border-0 p-0">
                <legend className="pb-2 text-[13px] font-bold">{f.kind}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map((k) => (
                    <label
                      key={k}
                      className={cn(
                        'flex h-[34px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold',
                        kind === k
                          ? 'border-cham bg-cham-nhat text-cham-dam'
                          : 'border-vien-dam bg-white text-navy'
                      )}
                    >
                      <input
                        type="radio"
                        name="kind"
                        checked={kind === k}
                        onChange={() => setKind(k)}
                        className="m-0 accent-cham"
                      />
                      {f.kinds[k]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="mt" className="text-[13px] font-bold">
                  {f.desc}
                </label>
                <Textarea
                  id="mt"
                  rows={3}
                  value={desc}
                  placeholder={f.descPh}
                  onChange={(e) => {
                    setDesc(e.target.value)
                    if (state === 'needDesc') setState('idle')
                  }}
                  className="text-sm"
                />
                {state === 'needDesc' && <span className="text-[13px] text-loi">{f.needDesc}</span>}
              </div>

              <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
                <legend className="pb-2 text-[13px] font-bold">{f.scope}</legend>
                {(['chung', 'video'] as const).map((sc) => (
                  <label key={sc} className="flex cursor-pointer gap-2.5 text-sm">
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === sc}
                      onChange={() => setScope(sc)}
                      className="m-0 mt-[3px] accent-cham"
                    />
                    <span>
                      <b>{sc === 'chung' ? f.scopeChung : f.scopeVideo}</b>{' '}
                      <span className="text-phu">
                        · {sc === 'chung' ? f.scopeChungHint : f.scopeVideoHint}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="m-0 border-0 p-0">
                <legend className="pb-2 text-[13px] font-bold">{f.attach}</legend>
                <div className="rounded-lg border border-vien">
                  {(draft?.attachments ?? [])
                    .filter((a) => a.available)
                    .map((a) => (
                      <label
                        key={a.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-[#EEF1F8] px-3 py-[9px] text-[13px] last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={attach.has(a.id)}
                          onChange={(e) => {
                            const next = new Set(attach)
                            if (e.target.checked) next.add(a.id)
                            else next.delete(a.id)
                            setAttach(next)
                          }}
                          className="m-0 size-4 accent-cham"
                        />
                        <span className="flex-1">
                          {a.id === 'dayAi'
                            ? f.attachNames.dayAi(a.count ?? 0)
                            : f.attachNames[a.id]}
                        </span>
                        {a.size ? <span className="text-phu">{f.size(a.size)}</span> : null}
                      </label>
                    ))}
                  {!draft && (
                    <div className="flex items-center gap-2 px-3 py-3 text-[13px] text-phu">
                      <Loader2 aria-hidden className="size-4 animate-spin" /> {f.loading}
                    </div>
                  )}
                </div>
              </fieldset>

              {dir ? (
                <p className="m-0 text-xs leading-normal text-phu">
                  {f.total(f.size(total))} <b className="text-navy">9Study_GopY</b>. {f.safe}
                </p>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg bg-credit-nen px-3 py-2.5 text-[13px]">
                  <b className="text-credit">{f.needDir}</b>
                  <span className="text-phu">{f.needDirHint}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onClick={() => void pickDir()}
                  >
                    {f.pickDir}
                  </Button>
                </div>
              )}

              {state === 'fail' && (
                <div className="rounded-lg bg-loi-nen px-3 py-2.5 text-[13px] text-loi">
                  {f.fail}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  {f.cancel}
                </Button>
                <Button type="submit" size="sm" disabled={state === 'sending' || !dir}>
                  {state === 'sending' ? (
                    <>
                      <Loader2 aria-hidden className="size-4 animate-spin" /> {f.sending}
                    </>
                  ) : state === 'fail' ? (
                    f.retry
                  ) : (
                    f.send
                  )}
                </Button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}
