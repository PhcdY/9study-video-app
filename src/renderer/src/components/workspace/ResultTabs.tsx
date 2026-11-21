import { useEffect, useRef, useState } from 'react'
import {
  Check,
  FolderOpen,
  Loader2,
  MessageSquareWarning,
  MousePointerClick,
  Play,
  RefreshCw
} from 'lucide-react'
import type { AudioLine, ScriptData, StoryFrame, VideoInfo } from '../../../../shared/video'
import { isPicked, type Pick } from '../../../../shared/picks'
import { cn } from '@/lib/utils'
import { api, fileUrl } from '@/lib/api'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'
import { Markdown } from './Markdown'

const w = copy.workspace

function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-vien-dam bg-white px-6 py-10 text-center text-[15px] leading-relaxed text-phu">
      {children}
    </div>
  )
}

/** Bang kich ban doc tu script.json: canh, loi doc, chu tren hinh. */
export function ScriptTab({
  slug,
  version
}: {
  slug?: string
  version?: number
}): React.JSX.Element {
  const [script, setScript] = useState<ScriptData | null>(null)
  useEffect(() => {
    if (!slug) return
    let alive = true
    void api.invoke('videos:script', slug).then((s) => alive && setScript(s))
    return () => {
      alive = false
    }
  }, [slug, version])
  if (!slug || !script?.beats?.length) return <Empty>{w.noScript}</Empty>
  return (
    <div className="flex flex-col gap-4">
      {script.beats.map((b) => (
        <section key={b.id} className="overflow-hidden rounded-xl border border-vien bg-white">
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-vien bg-nen px-4 py-2.5">
            <span className="text-xs font-bold text-phu">{b.id}</span>
            <span className="text-sm font-bold">
              {[w.scene(b.scene), b.section].filter(Boolean).join(' · ')}
            </span>
            {b.keyword && (
              <span className="text-sm text-cham">
                <Markdown text={b.keyword} />
              </span>
            )}
          </header>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-phu">
                <th scope="col" className="w-14 px-4 py-2">
                  {w.colLine}
                </th>
                <th scope="col" className="px-4 py-2">
                  {w.colSpeak}
                </th>
                <th scope="col" className="w-[38%] px-4 py-2">
                  {w.colText}
                </th>
              </tr>
            </thead>
            <tbody>
              {(b.lines ?? []).map((l, i) => (
                <tr key={i} className="border-t border-[#EEF1F8] align-top">
                  <td className="px-4 py-2 text-phu">{i + 1}</td>
                  <td className="px-4 py-2 leading-normal">{l.speak}</td>
                  <td className="px-4 py-2">{l.text ? <Markdown text={l.text} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

/** Bam anh / cau: bam thuong chon mot, giu Ctrl (Shift) de chon nhieu. */
export type OnPick = (p: Pick, many: boolean) => void
const manyKey = (e: React.MouseEvent): boolean => e.ctrlKey || e.metaKey || e.shiftKey
const plainSpeak = (s?: string): string => (s ?? '').replace(/<\/?en>/g, '')

function PickHint({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p className="m-0 flex items-center gap-2 text-sm text-phu">
      <MousePointerClick aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  )
}

/**
 * Storyboard: app tu xep anh tung cau (anh PNG trong thu muc storyboard) de bam chon duoc.
 * Thu muc khong co anh tung cau thi hien trang HTML skill xuat ra nhu cu.
 */
export function StoryboardTab({
  video,
  slug,
  onRefresh,
  picks,
  onPick,
  onFeedback
}: {
  video?: VideoInfo
  slug?: string
  /** Nho AI xuat lai storyboard day du; undefined khi AI dang lam */
  onRefresh?: () => void
  picks: Pick[]
  onPick: OnPick
  /** Gop y cho doi ve mot anh */
  onFeedback?: (beatLine: string) => void
}): React.JSX.Element {
  const [frames, setFrames] = useState<StoryFrame[] | null>(null)
  const version = video?.updatedAt
  useEffect(() => {
    if (!slug) return
    let alive = true
    void api.invoke('videos:storyFrames', slug).then((f) => alive && setFrames(f))
    return () => {
      alive = false
    }
  }, [slug, version])
  if (!video?.storyboardHtml && !frames?.length) return <Empty>{w.noStoryboard}</Empty>
  const beats: { id: string; head: StoryFrame; items: StoryFrame[] }[] = []
  for (const f of frames ?? []) {
    const last = beats[beats.length - 1]
    if (last?.id === f.beatId) last.items.push(f)
    else beats.push({ id: f.beatId, head: f, items: [f] })
  }
  return (
    <div className="flex flex-1 flex-col gap-3">
      {video?.storyboardStale && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-credit/30 bg-credit-nen px-4 py-3 text-[15px] text-credit"
        >
          <span className="min-w-0 flex-[1_1_260px]">
            {onRefresh ? w.storyboardStale : w.storyboardStaleBusy}
          </span>
          {onRefresh && (
            <Button size="sm" onClick={onRefresh}>
              <RefreshCw aria-hidden className="size-4" /> {copy.chat.chips.xuatLaiStoryboard}
            </Button>
          )}
        </div>
      )}
      {frames === null ? null : frames.length === 0 && video?.storyboardHtml ? (
        <iframe
          title={copy.workspace.tabs.storyboard}
          src={fileUrl(video.storyboardHtml, video.updatedAt)}
          sandbox="allow-scripts"
          className="min-h-[640px] w-full flex-1 rounded-xl border border-vien bg-white"
        />
      ) : (
        <>
          <PickHint>{w.pickHintStoryboard}</PickHint>
          {beats.map((b) => (
            <section key={b.id} className="flex flex-col gap-2.5">
              <h2 className="m-0 flex flex-wrap items-baseline gap-x-2 text-base font-bold">
                <span>
                  {[w.scene(b.head.scene) || b.id, b.head.section].filter(Boolean).join(' · ')}
                </span>
                {b.head.keyword && (
                  <span className="text-sm font-semibold text-cham">
                    <Markdown text={b.head.keyword} />
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
                {b.items.map((f) => (
                  <FrameCard
                    key={f.id}
                    frame={f}
                    selected={isPicked(picks, 'hinh', f.id)}
                    onPick={onPick}
                    onFeedback={onFeedback}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

function FrameCard({
  frame: f,
  selected,
  onPick,
  onFeedback
}: {
  frame: StoryFrame
  selected: boolean
  onPick: OnPick
  onFeedback?: (beatLine: string) => void
}): React.JSX.Element {
  const speak = plainSpeak(f.speak)
  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${f.label}: ${speak}`}
        onClick={(e) =>
          onPick({ kind: 'hinh', id: f.id, label: f.label, speak, image: f.file }, manyKey(e))
        }
        className={cn(
          'flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 bg-white p-0 text-left',
          selected
            ? 'border-cham shadow-[0_0_0_4px_var(--color-cham-nhat)]'
            : 'border-vien hover:border-vien-dam'
        )}
      >
        <span className="relative block w-full border-b border-nen-nhan bg-[#FBFCFF]">
          <img
            src={fileUrl(f.file, f.version)}
            alt=""
            loading="lazy"
            className="block aspect-video w-full object-contain"
          />
          {selected && (
            <span className="absolute top-2 left-2 flex h-[26px] items-center gap-1 rounded-full bg-cham pr-2.5 pl-1.5 text-xs font-bold text-white">
              <Check aria-hidden className="size-3.5" strokeWidth={2.6} /> {w.picked}
            </span>
          )}
        </span>
        <span className="flex flex-col gap-1 px-3 pt-2.5 pb-3">
          <span className={cn('text-xs font-bold', selected ? 'text-cham' : 'text-phu')}>
            {f.label}
          </span>
          <span className="pr-8 text-[13px] leading-snug">{speak}</span>
        </span>
      </button>
      {onFeedback && (
        <button
          type="button"
          aria-label={w.feedbackFrame(f.label)}
          title={copy.feedback.open}
          onClick={() => onFeedback(f.id)}
          className="absolute right-2 bottom-2 flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 hover:bg-nen"
        >
          <MessageSquareWarning aria-hidden className="size-[15px] text-phu" />
        </button>
      )}
    </div>
  )
}

/** Remotion Studio nhung trong app. */
export function StudioTab({ compositionId }: { compositionId?: string }): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'starting' | 'error' | { url: string }>('idle')
  const start = async (): Promise<void> => {
    setState('starting')
    const res = await api.invoke('studio:start')
    setState('url' in res ? { url: res.url } : 'error')
  }
  if (typeof state === 'object')
    return (
      <div className="flex flex-1 flex-col gap-2">
        {!compositionId && <div className="text-[13px] text-phu">{w.studioHint}</div>}
        <iframe
          title={w.tabs.chuyenDong}
          src={compositionId ? `${state.url}/${encodeURIComponent(compositionId)}` : state.url}
          className="min-h-[640px] w-full flex-1 rounded-xl border border-vien bg-white"
        />
      </div>
    )
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-vien-dam bg-white px-6 py-10 text-center">
      {state === 'starting' ? (
        <div className="flex items-center gap-2 text-[15px] text-phu">
          <Loader2 aria-hidden className="size-5 animate-spin text-xanh" /> {w.studioStarting}
        </div>
      ) : (
        <>
          {state === 'error' && <div className="text-[15px] text-loi">{w.studioError}</div>}
          <Button onClick={() => void start()}>
            <Play aria-hidden className="size-4" /> {state === 'error' ? w.retry : w.studioStart}
          </Button>
        </>
      )}
    </div>
  )
}

/** Nghe tung cau giong doc (public/audio/<slug>/); bam vao cau de nho AI sua giong cau do. */
export function AudioTab({
  slug,
  version,
  picks,
  onPick,
  onWrong
}: {
  slug?: string
  version?: number
  picks: Pick[]
  onPick: OnPick
  /** Gop y cho doi ve cau nay */
  onWrong?: (beatLine: string) => void
}): React.JSX.Element {
  const [lines, setLines] = useState<AudioLine[]>([])
  useEffect(() => {
    if (!slug) return
    let alive = true
    void api.invoke('videos:audio', slug).then((l) => alive && setLines(l))
    return () => {
      alive = false
    }
  }, [slug, version])
  if (!lines.length) return <Empty>{w.noAudio}</Empty>
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-phu">{w.audioCount(lines.length)}</div>
      <PickHint>{w.pickHintAudio}</PickHint>
      <div className="overflow-hidden rounded-xl border border-vien bg-white">
        {lines.map((l) => {
          const label = l.label ?? l.id
          const speak = plainSpeak(l.speak)
          const selected = isPicked(picks, 'giong', l.id)
          return (
            <div
              key={l.id}
              className={cn(
                'flex flex-wrap items-center gap-3 border-b border-nen-nhan py-2 pr-3 pl-2',
                selected && 'bg-[#F3F4FF] shadow-[inset_0_0_0_2px_var(--color-cham)]'
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={(e) => onPick({ kind: 'giong', id: l.id, label, speak }, manyKey(e))}
                className="flex min-h-12 min-w-[240px] flex-1 cursor-pointer flex-col gap-0.5 rounded-lg border-none bg-transparent px-2 py-1.5 text-left hover:bg-nen"
              >
                <span className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold', selected ? 'text-cham' : 'text-phu')}>
                    {label}
                  </span>
                  {selected && (
                    <span className="inline-flex h-[22px] items-center gap-0.5 rounded-full bg-cham pr-2 pl-1 text-[11px] font-bold text-white">
                      <Check aria-hidden className="size-3" strokeWidth={2.8} /> {w.picked}
                    </span>
                  )}
                </span>
                <span className="text-[15px] leading-snug">{speak}</span>
              </button>
              <audio controls preload="none" src={fileUrl(l.file, version)} className="h-9" />
              {onWrong && (
                <Button variant="ghost" size="sm" onClick={() => onWrong(l.id)}>
                  {w.readWrong}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Video thanh pham. */
export function FinalTab({
  video,
  onFeedback
}: {
  video?: VideoInfo
  /** "Gop y tai day": giay dang xem */
  onFeedback?: (time: number) => void
}): React.JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)
  if (!video?.finalMp4) return <Empty>{w.noFinal}</Empty>
  const mp4 = video.finalMp4
  return (
    <div className="flex flex-col gap-3">
      <video
        ref={ref}
        controls
        src={fileUrl(mp4, video.updatedAt)}
        className="w-full rounded-xl border border-vien bg-black"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="md" onClick={() => void api.invoke('shell:showItem', mp4)}>
          <FolderOpen aria-hidden className="size-4" /> {w.openFolder}
        </Button>
        {onFeedback && (
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              ref.current?.pause()
              onFeedback(ref.current?.currentTime ?? 0)
            }}
          >
            <MessageSquareWarning aria-hidden className="size-4" /> {copy.feedback.here}
          </Button>
        )}
        <span className="min-w-0 truncate text-[13px] text-phu" title={mp4}>
          {mp4}
        </span>
      </div>
    </div>
  )
}
