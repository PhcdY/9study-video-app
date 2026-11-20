import { useEffect, useState } from 'react'
import { FolderOpen, Loader2, Play } from 'lucide-react'
import type { AudioLine, ScriptData, VideoInfo } from '../../../../shared/video'
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

/** Storyboard do skill xuat ra (trang HTML anh nhung san). */
export function StoryboardTab({ video }: { video?: VideoInfo }): React.JSX.Element {
  if (!video?.storyboardHtml) return <Empty>{w.noStoryboard}</Empty>
  return (
    <iframe
      title={copy.workspace.tabs.storyboard}
      src={fileUrl(video.storyboardHtml, video.updatedAt)}
      sandbox="allow-scripts"
      className="min-h-[640px] w-full flex-1 rounded-xl border border-vien bg-white"
    />
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

/** Nghe tung cau giong doc (public/audio/<slug>/). */
export function AudioTab({
  slug,
  version
}: {
  slug?: string
  version?: number
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
      <div className="overflow-hidden rounded-xl border border-vien bg-white">
        {lines.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center gap-3.5 border-b border-[#EEF1F8] px-4 py-3"
          >
            <span className="w-20 text-xs font-bold text-phu">{l.id}</span>
            <span className="min-w-[240px] flex-1 text-[15px] leading-snug">{l.speak}</span>
            <audio controls preload="none" src={fileUrl(l.file, version)} className="h-9" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Video thanh pham. */
export function FinalTab({ video }: { video?: VideoInfo }): React.JSX.Element {
  if (!video?.finalMp4) return <Empty>{w.noFinal}</Empty>
  const mp4 = video.finalMp4
  return (
    <div className="flex flex-col gap-3">
      <video
        controls
        src={fileUrl(mp4, video.updatedAt)}
        className="w-full rounded-xl border border-vien bg-black"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="md" onClick={() => void api.invoke('shell:showItem', mp4)}>
          <FolderOpen aria-hidden className="size-4" /> {w.openFolder}
        </Button>
        <span className="min-w-0 truncate font-mono text-xs text-phu" title={mp4}>
          {mp4}
        </span>
      </div>
    </div>
  )
}
