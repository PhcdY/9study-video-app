import { useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Film, Plus, Search } from 'lucide-react'
import type { VideoInfo, VideoStage } from '../../../shared/video'
import { SUBJECTS, subjectName } from '../../../shared/prompt'
import { api, fileUrl, useVideos } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, Eyebrow, Page } from '@/components/ui/layout'

const STAGES: VideoStage[] = ['kichBan', 'duyetHinh', 'giongDoc']

const stageTone: Record<VideoStage, { text: string; dot: string }> = {
  kichBan: { text: 'text-cham', dot: 'bg-cham' },
  duyetHinh: { text: 'text-cham', dot: 'bg-cham' },
  giongDoc: { text: 'text-credit', dot: 'bg-[#E08A1E]' },
  daXuat: { text: 'text-xong', dot: 'bg-[#12A150]' }
}

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
              <StageTrail stage={latest.stage} />
              <p className="m-0 text-sm leading-normal">
                {latest.draft ? copy.home.draftNext : copy.home.nextStep[latest.stage]}
              </p>
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
          <VideoTable videos={shown} onOpen={onOpen} />
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
            <VideoTable videos={samples} onOpen={onOpen} flat />
          </div>
        </details>
      )}
    </Page>
  )
}

function StageTrail({ stage }: { stage: VideoStage }): React.JSX.Element {
  const at = stage === 'daXuat' ? 3 : STAGES.indexOf(stage)
  return (
    <ol
      aria-label="Tiến độ"
      className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[13px]"
    >
      {STAGES.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden className="text-vien-dam">
              /
            </span>
          )}
          <span
            aria-current={i === at ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1',
              i < at && 'font-semibold text-xong',
              i === at && 'font-bold text-cham',
              i > at && 'text-phu'
            )}
          >
            {i < at && <Check aria-hidden className="size-3.5" strokeWidth={2.6} />}
            {copy.stage[s]}
          </span>
        </li>
      ))}
    </ol>
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
  onOpen,
  flat
}: {
  videos: VideoInfo[]
  onOpen: (key: string) => void
  flat?: boolean
}): React.JSX.Element {
  return (
    <div className={cn('overflow-x-auto bg-white', !flat && 'rounded-xl border border-vien')}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-phu">
            <th scope="col" className="border-b border-vien px-4 py-2.5">
              {copy.home.colLesson}
            </th>
            <th scope="col" className="w-[110px] border-b border-vien px-4 py-2.5">
              {copy.home.colSubject}
            </th>
            <th scope="col" className="w-[220px] border-b border-vien px-4 py-2.5">
              {copy.home.colStage}
            </th>
            <th scope="col" className="w-[120px] border-b border-vien px-4 py-2.5 text-right">
              {copy.home.colUpdated}
            </th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.slug} className="hover:bg-nen">
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
                {v.draft ? (
                  <span className="inline-flex items-center gap-2 font-semibold text-credit">
                    <span className="size-2 rounded-full bg-[#E08A1E]" />
                    {copy.home.draftStatus}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 font-semibold',
                      stageTone[v.stage].text
                    )}
                  >
                    <span className={cn('size-2 rounded-full', stageTone[v.stage].dot)} />
                    {copy.stageStatus[v.stage]}
                  </span>
                )}
              </td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5 text-right text-phu">
                {v.draft ? <DropDraft v={v} /> : copy.home.shortDate(v.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Bo video moi dang do: bam "Bo" roi "Bo luon?" de chac chan. */
function DropDraft({ v }: { v: VideoInfo }): React.JSX.Element {
  const [sure, setSure] = useState(false)
  return (
    <span className="inline-flex items-center gap-2">
      {!sure && copy.home.shortDate(v.updatedAt)}
      <button
        type="button"
        aria-label={copy.home.dropLabel(v.title)}
        onClick={() => (sure ? void api.invoke('videos:dropDraft', v.slug) : setSure(true))}
        onBlur={() => setSure(false)}
        className={cn(
          'cursor-pointer text-[13px] font-semibold',
          sure ? 'text-loi' : 'text-phu hover:text-loi'
        )}
      >
        {sure ? copy.home.dropConfirm : copy.home.drop}
      </button>
    </span>
  )
}
