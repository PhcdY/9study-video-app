import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  label
}: {
  value: number
  className?: string
  label?: string
}): React.JSX.Element {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
      className={cn('h-2 rounded-full bg-vien', className)}
    >
      <div
        className="h-full rounded-full bg-xanh transition-[width] duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  )
}
