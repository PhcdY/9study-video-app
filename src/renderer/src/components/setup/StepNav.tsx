import { Check, Lock, SkipForward } from 'lucide-react'
import { OPTIONAL_STEPS, type StepState } from '../../../../shared/types'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function StepNav({
  steps,
  current,
  onSelect
}: {
  steps: StepState[]
  current: number
  onSelect: (i: number) => void
}): React.JSX.Element {
  const done = steps.filter((s) => s.status === 'done' || s.status === 'skipped').length
  return (
    <nav
      aria-label="Các bước cài đặt"
      className="flex max-w-[300px] flex-[1_1_260px] flex-col gap-1"
    >
      <div className="px-3 pb-3 text-sm font-semibold text-phu">
        {copy.progress(done, steps.length)}
      </div>
      <Progress
        value={(done / steps.length) * 100}
        className="mx-3 mb-4 h-1.5"
        label={copy.progress(done, steps.length)}
      />
      {steps.map((s, i) => {
        const isCurrent = i === current
        const clickable = s.status !== 'locked'
        return (
          <button
            key={s.id}
            type="button"
            disabled={!clickable}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => onSelect(i)}
            className={cn(
              'flex h-12 items-center gap-3 rounded-lg px-3 text-left text-[15px] text-phu',
              isCurrent && 'bg-cham-nhat font-bold text-cham',
              clickable && !isCurrent && 'cursor-pointer hover:bg-white',
              !clickable && 'cursor-default'
            )}
          >
            <StepIcon state={s} index={i} current={isCurrent} />
            <span>{copy.steps[s.id].nav}</span>
            {OPTIONAL_STEPS.includes(s.id) && (
              <span className="rounded-full bg-nen-nhan px-2 py-0.5 text-xs font-semibold text-phu">
                {copy.optional}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

function StepIcon({
  state,
  index,
  current
}: {
  state: StepState
  index: number
  current: boolean
}): React.JSX.Element {
  if (state.status === 'done')
    return <Check aria-hidden className="size-5 text-xong" strokeWidth={2.4} />
  if (state.status === 'skipped') return <SkipForward aria-hidden className="size-5 text-mo" />
  if (state.status === 'locked') return <Lock aria-hidden className="size-5 text-mo" />
  return (
    <span
      className={cn(
        'flex size-[22px] items-center justify-center rounded-full text-xs font-bold',
        current
          ? 'bg-cham text-white'
          : state.status === 'error'
            ? 'bg-loi text-white'
            : 'bg-vien text-navy'
      )}
    >
      {index + 1}
    </span>
  )
}
