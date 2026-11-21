import { useState } from 'react'
import type { VivibeUsage } from '../../../shared/vivibe'
import { useVivibe } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'

const v = copy.vivibe
const num = (n: number): string => n.toLocaleString('vi-VN')

/** Thanh chia hai phan: dang dung trong video (xanh) / khong dung (cam). */
function SplitBar({ u, thin }: { u: VivibeUsage; thin?: boolean }): React.JSX.Element {
  const usedPct = u.sent ? (u.used / u.sent) * 100 : 0
  return (
    <div
      aria-hidden
      className={cn('flex overflow-hidden rounded-full bg-vien', thin ? 'h-2' : 'h-3')}
    >
      <span className="bg-xong" style={{ width: `${usedPct}%` }} />
      <span className="bg-[#E08A1E]" style={{ width: `${u.sent ? 100 - usedPct : 0}%` }} />
    </div>
  )
}

function Legend({ u, compact }: { u: VivibeUsage; compact?: boolean }): React.JSX.Element {
  const row = (color: string, label: string, n: number, hint?: string): React.JSX.Element => (
    <span className={cn('flex items-center gap-2', compact && 'justify-between')}>
      <span className="flex items-center gap-2">
        <span className={cn('size-2.5 rounded-[3px]', color)} />
        {label}
        {!compact && <b className="tabular-nums">{num(n)}</b>}
        {hint && <span className="text-phu">{hint}</span>}
      </span>
      {compact && <b className="tabular-nums">{num(n)}</b>}
    </span>
  )
  return (
    <div
      className={cn(
        'flex text-sm',
        compact ? 'flex-col gap-1.5 text-[13px]' : 'flex-wrap gap-x-6 gap-y-1'
      )}
    >
      {row('bg-xong', v.used, u.used)}
      {row('bg-[#E08A1E]', v.unused, u.unused, compact ? undefined : v.unusedHint)}
    </div>
  )
}

/** Muc Vivibe trong o Usage o thanh dau. */
export function VivibePopoverSection(): React.JSX.Element | null {
  const u = useVivibe()
  if (!u) return null
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.06em] text-phu">{v.popTitle}</span>
        <span className="text-xs text-phu">{v.monthName(u.month)}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <b className="text-2xl font-extrabold tabular-nums">{num(u.sent)}</b>
        <span className="text-sm text-phu">{v.charsSent}</span>
      </div>
      {u.sent > 0 && (
        <>
          <SplitBar u={u} thin />
          <Legend u={u} compact />
        </>
      )}
    </div>
  )
}

/** Phan "Da dung" trong Cai dat > Giong doc Vivibe. */
export function VivibeSettingsBlock(): React.JSX.Element {
  const [month, setMonth] = useState<string | undefined>(undefined)
  const u = useVivibe(month)
  if (!u) return <div className="py-4" />
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-bold">{v.title}</span>
        {u.months.length > 1 && (
          <select
            aria-label={v.pickMonth}
            value={u.month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 cursor-pointer rounded-lg border border-vien-dam bg-white px-2.5 text-sm"
          >
            {u.months.map((m) => (
              <option key={m} value={m}>
                {v.monthName(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-vien px-[18px] py-4">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <b className="text-[26px] font-extrabold tabular-nums">{num(u.sent)}</b>
          <span className="text-sm text-phu">
            {v.sentIn(v.monthName(u.month), num(u.prevSent))}
          </span>
        </div>
        {u.sent > 0 ? (
          <>
            <SplitBar u={u} />
            <Legend u={u} />
          </>
        ) : (
          <span className="text-sm text-phu">{v.none}</span>
        )}
      </div>

      {u.videos.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-vien">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-phu">
                <th scope="col" className="border-b border-vien px-4 py-2.5 font-bold">
                  {v.colVideo}
                </th>
                <th
                  scope="col"
                  className="w-[110px] border-b border-vien px-4 py-2.5 text-right font-bold"
                >
                  {v.colSent}
                </th>
                <th
                  scope="col"
                  className="w-[120px] border-b border-vien px-4 py-2.5 text-right font-bold"
                >
                  {v.colUsed}
                </th>
                <th
                  scope="col"
                  className="w-[120px] border-b border-vien px-4 py-2.5 text-right font-bold"
                >
                  {v.colUnused}
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {u.videos.map((x) => (
                <tr key={x.slug + x.lastAt}>
                  <td className="border-b border-[#EEF1F8] px-4 py-2.5">
                    <b className="font-semibold">{x.title}</b>{' '}
                    {x.dropped ? (
                      <span className="rounded-full bg-credit-nen px-2 py-px text-[11px] font-bold text-credit">
                        {v.dropped}
                      </span>
                    ) : (
                      <span className="text-xs text-phu">· {v.runs(x.runs)}</span>
                    )}
                  </td>
                  <td className="border-b border-[#EEF1F8] px-4 py-2.5 text-right">
                    {num(x.sent)}
                  </td>
                  <td className="border-b border-[#EEF1F8] px-4 py-2.5 text-right font-bold text-xong">
                    {num(x.used)}
                  </td>
                  <td
                    className={cn(
                      'border-b border-[#EEF1F8] px-4 py-2.5 text-right',
                      x.unused ? 'font-bold text-credit' : 'text-phu'
                    )}
                  >
                    {num(x.unused)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 text-[13px] leading-normal text-phu">{v.how}</p>
    </div>
  )
}
