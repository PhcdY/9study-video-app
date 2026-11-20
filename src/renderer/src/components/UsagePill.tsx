import { useUsage } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'

/** "Luot AI con X%" o thanh dau; duoi 20% thi doi mau canh bao. */
export function UsagePill({ onClick }: { onClick?: () => void }): React.JSX.Element | null {
  const u = useUsage()
  if (!u) return null
  const low = u.remainingPercent < 20
  const title = [u.resetsAt ? copy.usage.resets(u.resetsAt) : '', low ? copy.usage.low : '']
    .filter(Boolean)
    .join('. ')
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px]',
        low ? 'border-[#F2C38B] bg-[#FFF8EF] text-credit' : 'border-vien text-phu hover:bg-nen'
      )}
    >
      <span>
        {copy.usage.pill(u.remainingPercent).replace(/\d+%$/, '')}
        <b className={low ? 'text-credit' : 'text-navy'}>{u.remainingPercent}%</b>
      </span>
      {u.resetsAt && (
        <span className="hidden text-xs xl:inline">· {copy.usage.resets(u.resetsAt)}</span>
      )}
    </button>
  )
}
