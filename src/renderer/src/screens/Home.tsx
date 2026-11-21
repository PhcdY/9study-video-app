import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Film, Plus, Search, Trash2 } from 'lucide-react'
import type { AiStatus, VideoInfo, VideoStage } from '../../../shared/video'
import { SUBJECTS, subjectName } from '../../../shared/prompt'
import { api, fileUrl, useAiStatuses, useVideos } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, Eyebrow, Page } from '@/components/ui/layout'
import { FeedbackDirBanner } from '@/components/FeedbackDir'

const STAGES: VideoStage[] = ['kichBan', 'duyetHinh', 'giongDoc']

function sub(v: VideoInfo): string {
  return [`${subjectName(v.subject)}${v.lop ? ` ${v.lop}` : ''}`, copy.home.loai(v.loai)]
    .filter(Boolean)
    .join(' · ')
}

export function HomeScreen({
  onOpen,
  onNew
}: {
  onOpen: (key: string) => void
  onNew: () => void
}): React.JSX.Element {
  const snap = useVideos()
  const ai = useAiStatuses()
  const [q, setQ] = useState('')
  const [mon, setMon] = useState('')
  const own = useMemo(() => snap?.videos.filter((v) => !v.sample) ?? [], [snap])
  const samples = useMemo(() => snap?.videos.filter((v) => v.sample) ?? [], [snap])
  const shown = own.filter(
    (v) =>
      (!mon || v.subject === mon) &&
      (!q.trim() || `${v.title} ${v.bai ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  )
  const latest = own[0]

  return (
    <Page className="gap-8">
      <FeedbackDirBanner />
      {latest && (
        <section aria-labelledby="lam-tiep" className="flex flex-col gap-3">
          <Eyebrow id="lam-tiep">{copy.home.continueTitle}</Eyebrow>
          <Card className="flex flex-wrap items-center gap-5 p-4">
            <Thumb v={latest} large />
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-phu">{sub(latest)}</span>
                <button
                  type="button"
                  onClick={() => onOpen(latest.slug)}
                  className="cursor-pointer p-0 text-left text-xl leading-snug font-bold text-navy hover:text-cham"
                >
                  {latest.title}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <AiBadge status={aiOf(ai, latest)} />
                {aiOf(ai, latest) && (
                  <span aria-hidden className="text-vien-dam">
                    ·
                  </span>
                )}
                <span className={cn('font-semibold', stepTone(latest))}>{stepText(latest)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Button size="md" onClick={() => onOpen(latest.slug)}>
                {copy.home.continueBtn} <ArrowRight aria-hidden className="size-4" />
              </Button>
              <span className="text-xs text-phu">{copy.home.updatedAt(latest.updatedAt)}</span>
            </div>
          </Card>
        </section>
      )}

      <section aria-labelledby="tat-ca" className="flex flex-col gap-3">
        <div className="flex min-h-[38px] flex-wrap items-center gap-2.5">
          <div className="flex-grow">
            <Eyebrow id="tat-ca">{copy.home.allTitle(own.length)}</Eyebrow>
          </div>
          {/* Chua co bai thi khong can tim / loc; nut Lam video moi nam o o trong ben duoi */}
          {own.length > 0 && (
            <>
              <label className="box-border flex h-[38px] w-[220px] items-center gap-2 rounded-lg border border-vien-dam bg-white px-3 focus-within:border-cham">
                <Search aria-hidden className="size-4 shrink-0 text-phu" />
                <span className="sr-only">{copy.home.search}</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={copy.home.search}
                  className="min-w-0 flex-grow border-none bg-transparent text-sm outline-none placeholder:text-mo"
                />
              </label>
              <label className="sr-only" htmlFor="loc-mon">
                {copy.home.allSubjects}
              </label>
              <select
                id="loc-mon"
                value={mon}
                onChange={(e) => setMon(e.target.value)}
                className="h-[38px] cursor-pointer rounded-lg border border-vien-dam bg-white px-2.5 text-sm font-medium outline-none focus:border-cham"
              >
                <option value="">{copy.home.allSubjects}</option>
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="h-[38px] rounded-lg" onClick={onNew}>
                <Plus aria-hidden className="size-4" /> {copy.home.newVideo}
              </Button>
            </>
          )}
        </div>

        {own.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-dashed border-vien-dam px-8 py-14 text-center">
            <Film aria-hidden className="size-9 text-mo" strokeWidth={1.6} />
            <div className="text-lg font-bold">{copy.home.emptyTitle}</div>
            <p className="m-0 max-w-[440px] text-[15px] leading-relaxed text-phu">
              {copy.home.emptyDesc}
            </p>
            <Button size="md" className="mt-2" onClick={onNew}>
              <Plus aria-hidden className="size-4" /> {copy.home.newVideo}
            </Button>
          </Card>
        ) : (
          <VideoTable videos={shown} ai={ai} onOpen={onOpen} />
        )}
      </section>

      {samples.length > 0 && (
        <details className="group rounded-xl border border-vien bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0 flex-1" title={copy.home.samplesHint}>
              <Eyebrow>{copy.home.samplesTitle(samples.length)}</Eyebrow>
            </div>
            <ChevronDown
              aria-hidden
              className="size-5 shrink-0 text-phu transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-vien">
            <VideoTable videos={samples} ai={ai} onOpen={onOpen} flat />
          </div>
        </details>
      )}
    </Page>
  )
}

/** Trang thai AI cua bai; bai da xuat ma khong chay gi thi de trong. */
function aiOf(ai: Record<string, AiStatus>, v: VideoInfo): AiStatus | undefined {
  const st = ai[v.slug] ?? 'dung'
  return v.stage === 'daXuat' && !v.draft && st === 'dung' ? undefined : st
}

function stepText(v: VideoInfo): string {
  if (v.draft) return copy.home.noScript
  if (v.stage === 'daXuat') return copy.home.exported
  return copy.home.step(STAGES.indexOf(v.stage) + 1, copy.stage[v.stage])
}

const stepTone = (v: VideoInfo): string =>
  v.draft ? 'text-phu' : v.stage === 'daXuat' ? 'text-xong' : 'text-navy'

const AI_TONE: Record<AiStatus, { text: string; dot: string }> = {
  dang: { text: 'text-xong', dot: 'bg-xong animate-[nhip_1.4s_ease-out_infinite]' },
  cho: { text: 'text-credit', dot: 'bg-[#E8A417]' },
  dung: { text: 'text-phu', dot: 'bg-[#B4BCCF]' },
  loi: { text: 'text-loi', dot: 'bg-loi' }
}

function AiBadge({ status }: { status?: AiStatus }): React.JSX.Element | null {
  if (!status) return null
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', AI_TONE[status].text)}>
      <span aria-hidden className={cn('size-[9px] shrink-0 rounded-full', AI_TONE[status].dot)} />
      {copy.home.ai[status]}
    </span>
  )
}

/** Ba vach tien do (xong / dang o buoc nay / chua toi) va chu "Buoc 2/3 · Duyet hinh". */
function StepBar({ v }: { v: VideoInfo }): React.JSX.Element {
  const at = v.draft ? -1 : v.stage === 'daXuat' ? 3 : STAGES.indexOf(v.stage)
  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="flex gap-1">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={cn(
              'h-1.5 w-11 rounded',
              i < at ? 'bg-xong' : i === at ? 'bg-cham' : 'bg-vien'
            )}
          />
        ))}
      </div>
      <span className={cn('font-semibold', stepTone(v))}>{stepText(v)}</span>
    </div>
  )
}

/** Hinh thu nho: anh storyboard that; chua co storyboard thi o mau voi bieu tuong phim. */
function Thumb({ v, large }: { v: VideoInfo; large?: boolean }): React.JSX.Element {
  const box = cn(
    'flex shrink-0 items-center justify-center overflow-hidden border border-vien bg-[#FBFCFF]',
    large ? 'aspect-video w-56 rounded-lg' : 'h-9 w-16 rounded-md'
  )
  if (v.thumb)
    return (
      <div aria-hidden className={box}>
        <img
          src={fileUrl(v.thumb, v.updatedAt)}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      </div>
    )
  return (
    <div aria-hidden className={box}>
      <Film className={cn('text-mo', large ? 'size-8' : 'size-4')} strokeWidth={1.6} />
    </div>
  )
}

function VideoTable({
  videos,
  ai,
  onOpen,
  flat
}: {
  videos: VideoInfo[]
  ai: Record<string, AiStatus>
  onOpen: (key: string) => void
  flat?: boolean
}): React.JSX.Element {
  return (
    <div className={cn('overflow-x-auto bg-white', !flat && 'rounded-xl border border-vien')}>
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-phu">
            <th scope="col" className="border-b border-vien px-4 py-2.5">
              {copy.home.colLesson}
            </th>
            <th scope="col" className="w-[110px] border-b border-vien px-4 py-2.5">
              {copy.home.colSubject}
            </th>
            <th scope="col" className="w-[230px] border-b border-vien px-4 py-2.5">
              {copy.home.colStep}
            </th>
            <th scope="col" className="w-[160px] border-b border-vien px-4 py-2.5">
              {copy.home.colStatus}
            </th>
            <th scope="col" className="w-[120px] border-b border-vien px-4 py-2.5 text-right">
              {copy.home.colUpdated}
            </th>
            <th scope="col" className="w-12 border-b border-vien px-2 py-2.5">
              <span className="sr-only">{copy.home.colActions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.slug} className="group hover:bg-nen">
              <td className="border-b border-[#EEF1F8] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Thumb v={v} />
                  <div className="flex min-w-0 flex-col gap-px">
                    <button
                      type="button"
                      onClick={() => onOpen(v.slug)}
                      className="cursor-pointer p-0 text-left font-bold text-navy hover:text-cham"
                    >
                      {v.title}
                    </button>
                    <span className="text-xs text-phu">
                      {[copy.home.lop(v.lop), v.bai].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
              </td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5">{subjectName(v.subject)}</td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5">
                <StepBar v={v} />
              </td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5">
                {/* Video mau: chi hien khi co viec (khong ghi "Da dung" cho ca danh sach) */}
                <AiBadge status={flat && aiOf(ai, v) === 'dung' ? undefined : aiOf(ai, v)} />
              </td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5 text-right text-phu tabular-nums">
                {copy.home.shortDate(v.updatedAt)}
              </td>
              <td className="border-b border-[#EEF1F8] px-2 py-2.5 text-right">
                {v.draft && <DropDraft v={v} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Bo video moi dang do: nut thung rac hien khi re chuot vao hang, bam thi hoi lai trong o nho. */
function DropDraft({ v }: { v: VideoInfo }): React.JSX.Element {
  // Vi tri o hoi lai (co dinh theo man hinh de khung bang khong cat mat)
  const [at, setAt] = useState<{ top: number; right: number } | null>(null)
  const open = !!at
  const setOpen = (v: boolean): void => {
    const r = btn.current?.getBoundingClientRect()
    setAt(v && r ? { top: r.bottom + 6, right: window.innerWidth - r.right } : null)
  }
  const box = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setAt(null)
    }
    const away = (): void => setAt(null)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', away, true)
    window.addEventListener('resize', away)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', away, true)
      window.removeEventListener('resize', away)
    }
  }, [open])
  return (
    <div
      ref={box}
      className="relative inline-flex"
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <button
        type="button"
        aria-label={copy.home.dropLabel(v.title)}
        ref={btn}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex size-8 cursor-pointer items-center justify-center rounded-lg text-phu transition-opacity hover:bg-loi-nen hover:text-loi focus-visible:opacity-100',
          open ? 'bg-loi-nen text-loi opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
      {at && (
        <div
          role="dialog"
          aria-label={copy.home.dropTitle}
          style={{ top: at.top, right: at.right }}
          className="fixed z-50 flex w-64 flex-col gap-3 rounded-xl border border-vien bg-white p-4 text-left shadow-[0_12px_32px_rgba(14,16,70,0.16)]"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-navy">{copy.home.dropTitle}</span>
            <span className="text-[13px] leading-snug text-phu">{copy.home.dropDesc}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {copy.home.dropCancel}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void api.invoke('videos:dropDraft', v.slug)}
            >
              {copy.home.drop}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
