import { useEffect, useRef, useState } from 'react'
import type { UsageWindow } from '../../../shared/app'
import { useSetup, useUsage } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'

const u = copy.usage

/** Mau theo muc da dung: con nhieu xanh, sap het cam, het do. */
function tone(used: number): { bar: string; text: string } {
  if (used >= 90) return { bar: 'bg-loi', text: 'text-loi' }
  if (used >= 70) return { bar: 'bg-[#E08A1E]', text: 'text-credit' }
  return { bar: 'bg-xanh', text: 'text-navy' }
}

function MiniBar({ w }: { w: UsageWindow }): React.JSX.Element {
  const t = tone(w.usedPercent)
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs text-phu">{u.windowShort(w.minutes)}</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-vien" aria-hidden>
        <span
          className={cn('block h-full rounded-full', t.bar)}
          style={{ width: `${w.usedPercent}%` }}
        />
      </span>
      <b className={cn('text-xs tabular-nums', t.text)}>{w.usedPercent}%</b>
    </span>
  )
}

/** Thanh dau: "Usage" + tung han muc (5 gio, tuan) + chu cai tai khoan. Bam de xem chi tiet. */
export function UsagePill({
  onOpenSettings
}: {
  onOpenSettings?: () => void
}): React.JSX.Element | null {
  const usage = useUsage()
  const snap = useSetup()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const email = snap?.account?.email ?? ''
  const initials =
    (email.split('@')[0] || 'AI')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 2)
      .toUpperCase() || 'AI'
  if (!usage && !snap?.account) return null

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={u.title}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 cursor-pointer items-center gap-3 rounded-full border border-vien bg-white py-0 pr-1.5 pl-3.5 hover:bg-nen"
      >
        <span className="text-[13px] font-bold text-navy">{u.title}</span>
        {usage?.windows.map((w, i) => (
          <MiniBar key={i} w={w} />
        ))}
        <span className="flex size-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
          {initials}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={u.title}
          className="absolute top-12 right-0 z-40 flex w-[320px] flex-col gap-4 rounded-xl border border-vien bg-white p-4 shadow-[0_12px_32px_rgba(14,16,70,0.16)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{email || u.chatgpt}</span>
              <span className="text-xs text-phu">{u.plan(usage?.plan)}</span>
            </div>
          </div>
          {usage?.windows.map((w, i) => {
            const t = tone(w.usedPercent)
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{u.windowLong(w.minutes)}</span>
                  <span className={cn('font-bold tabular-nums', t.text)}>
                    {u.used(w.usedPercent)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-vien" aria-hidden>
                  <div
                    className={cn('h-full rounded-full', t.bar)}
                    style={{ width: `${w.usedPercent}%` }}
                  />
                </div>
                {w.resetsAt && <span className="text-xs text-phu">{u.resets(w.resetsAt)}</span>}
              </div>
            )
          })}
          {!usage && <span className="text-sm text-phu">{u.unknown}</span>}
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
              className="cursor-pointer self-start text-sm font-semibold text-cham hover:text-cham-dam"
            >
              {u.manage}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
