import { useMemo, useState } from 'react'
import { ArrowRight, Check, Film, Plus, Search } from 'lucide-react'
import type { VideoInfo, VideoStage } from '../../../shared/video'
import { SUBJECTS, subjectName } from '../../../shared/prompt'
import { useVideos } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
    <main className="mx-auto box-border flex w-full max-w-[1180px] flex-1 flex-col gap-8 p-8">
      {latest && (
        <section aria-labelledby="lam-tiep" className="flex flex-col gap-3">
          <h2 id="lam-tiep" className="m-0 text-[13px] font-bold tracking-wider text-phu uppercase">
            {copy.home.continueTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-5 rounded-xl border border-vien bg-white p-4">
            <Thumb v={latest} large />
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-phu">{sub(latest)}</span>
                <button
                  type="button"
                  onClick={() => onOpen(latest.slug)}
                  className="cursor-pointer p-0 text-left text-xl font-bold text-navy hover:text-cham"
                >
                  {latest.title}
                </button>
              </div>
              <StageTrail stage={latest.stage} />
              <p className="m-0 text-sm leading-normal">{copy.home.nextStep[latest.stage]}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Button size="md" onClick={() => onOpen(latest.slug)}>
                {copy.home.continueBtn} <ArrowRight aria-hidden className="size-4" />
              </Button>
              <span className="text-xs text-phu">{copy.home.updatedAt(latest.updatedAt)}</span>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="tat-ca" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2
            id="tat-ca"
            className="m-0 flex-grow text-[13px] font-bold tracking-wider text-phu uppercase"
          >
            {copy.home.allTitle(own.length)}
          </h2>
          <label className="box-border flex h-[38px] w-[220px] items-center gap-2 rounded-lg border border-vien-dam bg-white px-3">
            <Search aria-hidden className="size-4 text-phu" />
            <span className="sr-only">{copy.home.search}</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={copy.home.search}
              className="min-w-0 flex-grow border-none bg-transparent text-sm outline-none"
            />
          </label>
          <label className="sr-only" htmlFor="loc-mon">
            {copy.home.allSubjects}
          </label>
          <select
            id="loc-mon"
            value={mon}
            onChange={(e) => setMon(e.target.value)}
            className="h-[38px] rounded-lg border border-vien-dam bg-white px-2.5 text-sm font-medium"
          >
            <option value="">{copy.home.allSubjects}</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button size="md" onClick={onNew}>
            <Plus aria-hidden className="size-4" /> {copy.home.newVideo}
          </Button>
        </div>

        {own.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-vien-dam bg-white px-8 py-12 text-center">
            <Film aria-hidden className="size-8 text-mo" />
            <div className="text-lg font-bold">{copy.home.emptyTitle}</div>
            <p className="m-0 max-w-[460px] text-[15px] leading-relaxed text-phu">
              {copy.home.emptyDesc}
            </p>
            <Button onClick={onNew}>
              <Plus aria-hidden className="size-4" /> {copy.home.newVideo}
            </Button>
          </div>
        ) : (
          <VideoTable videos={shown} onOpen={onOpen} />
        )}
      </section>

      {samples.length > 0 && (
        <details className="group rounded-xl border border-vien bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-phu">
            {copy.home.samplesTitle(samples.length)}
            <span className="ml-2 font-normal">{copy.home.samplesHint}</span>
          </summary>
          <div className="border-t border-vien">
            <VideoTable videos={samples} onOpen={onOpen} flat />
          </div>
        </details>
      )}

      {snap && (
        <footer className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-phu">
          <span>{copy.home.toolkit(snap.toolkitVersion)}</span>
          {snap.outputDir && <span>{copy.home.savedAt(snap.outputDir)}</span>}
        </footer>
      )}
    </main>
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

function Thumb({ v, large }: { v: VideoInfo; large?: boolean }): React.JSX.Element {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-vien bg-[#FBFCFF] font-extrabold text-cham',
        large ? 'aspect-video w-56 text-2xl' : 'h-9 w-16 rounded-md text-xs'
      )}
    >
      {subjectName(v.subject).split(' ')[0]}
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
                <span
                  className={cn(
                    'inline-flex items-center gap-2 font-semibold',
                    stageTone[v.stage].text
                  )}
                >
                  <span className={cn('size-2 rounded-full', stageTone[v.stage].dot)} />
                  {copy.stageStatus[v.stage]}
                </span>
              </td>
              <td className="border-b border-[#EEF1F8] px-4 py-2.5 text-right text-phu">
                {copy.home.shortDate(v.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
