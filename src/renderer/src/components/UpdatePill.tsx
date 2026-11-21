import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, TriangleAlert } from 'lucide-react'
import type { AppUpdate } from '../../../shared/app'
import { api } from '@/lib/api'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'

const c = copy.appUpdate

export function BusyWarning({ titles }: { titles: string[] }): React.JSX.Element {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] bg-credit-nen px-3.5 py-3 text-sm leading-normal">
      <TriangleAlert aria-hidden className="mt-0.5 size-[18px] shrink-0 text-credit" />
      <span>{c.busy(titles)}</span>
    </div>
  )
}

/** Nut "Cap nhat app" tren thanh dau khi ban moi da tai xong; bam mo khung co gi moi. */
export function UpdatePill({ update }: { update: AppUpdate }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string[]>([])
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    void api.invoke('app:busyWork').then(setBusy)
    const close = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const restart = (): void => void api.invoke('app:restartToUpdate')
  const notes = update.notes.slice(0, 3)

  return (
    <div ref={box} className="relative" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#c9cefa] bg-cham-nhat py-0 pr-3.5 pl-3 text-[13px] font-bold text-cham hover:bg-[#e2e5fd]"
      >
        <ArrowDownToLine aria-hidden className="size-4" />
        {c.pill}
      </button>

      {open && (
        <section
          role="dialog"
          aria-labelledby="cap-nhat-app"
          className="absolute top-12 right-0 z-40 box-border flex w-[400px] flex-col gap-4 rounded-2xl border border-vien bg-white px-[22px] pt-[22px] pb-[18px] shadow-[0_18px_44px_rgba(14,16,70,0.16)]"
        >
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cham-nhat text-cham">
              <ArrowDownToLine aria-hidden className="size-[22px]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <h2 id="cap-nhat-app" className="m-0 text-[17px] font-extrabold">
                {c.title(update.version)}
              </h2>
              <span className="text-[13px] text-phu">{c.sub(update.current)}</span>
            </div>
          </div>

          {busy.length > 0 ? (
            <BusyWarning titles={busy} />
          ) : (
            notes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold tracking-[0.06em] text-phu uppercase">
                  {c.whatsNew}
                </span>
                <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[18px] text-sm leading-[1.45]">
                  {notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <a
                  href={update.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-semibold text-cham no-underline hover:underline"
                >
                  {c.seeAll}
                </a>
              </div>
            )
          )}

          <div className="flex flex-col gap-2.5 border-t border-[#eef1f8] pt-3.5">
            {busy.length > 0 ? (
              <div className="flex gap-2.5">
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  {c.later}
                </Button>
                <Button variant="outline" onClick={restart}>
                  {c.restartAnyway}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <Button className="flex-1" onClick={restart}>
                  {c.restartNow}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {c.later}
                </Button>
              </div>
            )}
            <span className="text-[13px] leading-[1.45] text-phu">{c.note}</span>
          </div>
        </section>
      )}
    </div>
  )
}
