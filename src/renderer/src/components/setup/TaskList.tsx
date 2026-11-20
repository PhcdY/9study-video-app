import { Check, Circle, Loader2, SkipForward, XCircle } from 'lucide-react'
import { STEP_TASKS, type StepState, type TaskState } from '../../../../shared/types'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

/** Danh sach tung phan cua mot buoc dai: truoc khi chay la "nhung gi app se lam", khi chay co tien trinh tung phan. */
export function TaskList({ step }: { step: StepState }): React.JSX.Element | null {
  const plan = STEP_TASKS[step.id]
  if (!plan) return null
  const tasks: TaskState[] =
    step.tasks ?? plan.map((id) => ({ id, status: step.status === 'done' ? 'done' : 'waiting' }))
  const started = step.status === 'running' || !!step.tasks
  return (
    <section className="flex flex-col gap-2" aria-label={started ? copy.doing : copy.willDo}>
      <div className="text-sm font-semibold text-phu">{started ? copy.doing : copy.willDo}</div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} stepId={step.id} />
        ))}
      </ol>
    </section>
  )
}

function TaskRow({ task, stepId }: { task: TaskState; stepId: string }): React.JSX.Element {
  const t = copy.tasks[task.id]
  const running = task.status === 'running'
  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-lg border px-4 py-3',
        running ? 'border-xanh/40 bg-nen' : 'border-vien bg-white'
      )}
    >
      <div className="flex items-center gap-3">
        <TaskIcon status={task.status} />
        <span className={cn('flex-1 text-[15px]', running ? 'font-semibold' : 'font-medium')}>
          {t.label}
        </span>
        <span className="text-right text-[13px] text-phu">{describe(task, stepId)}</span>
      </div>
      {running && task.progress !== undefined && (
        <Progress value={task.progress} label={t.label} className="ml-8 h-1.5" />
      )}
    </li>
  )
}

function TaskIcon({ status }: { status: TaskState['status'] }): React.JSX.Element {
  switch (status) {
    case 'running':
      return <Loader2 aria-hidden className="size-5 shrink-0 animate-spin text-xanh" />
    case 'done':
      return <Check aria-hidden className="size-5 shrink-0 text-xong" strokeWidth={2.4} />
    case 'skipped':
      return <SkipForward aria-hidden className="size-5 shrink-0 text-xong" />
    case 'error':
      return <XCircle aria-hidden className="size-5 shrink-0 text-loi" />
    default:
      return <Circle aria-hidden className="size-5 shrink-0 text-mo" />
  }
}

/** Chu ben phai moi dong: so lieu dang tai, hoac goi y dung luong khi chua chay. */
function describe(task: TaskState, stepId: string): string {
  const s = copy.taskStatus
  if (task.status === 'skipped')
    return task.id === 'cheDoAnToan' && stepId === 'dangNhap' ? s.sandboxOff : s.skipped
  if (task.status === 'error') return s.error
  if (task.status === 'waiting') return copy.tasks[task.id].hint
  const parts: string[] = []
  if (task.version) parts.push(s.version(task.version))
  if (task.amount) {
    const fmt = task.amount.unit === 'mb' ? copy.mb : copy.goi
    parts.push(
      task.amount.total !== undefined
        ? `${fmt(task.amount.done)} / ${fmt(task.amount.total)}`
        : fmt(task.amount.done)
    )
  }
  if (task.status === 'running' && task.speedMbps) parts.push(copy.speed(task.speedMbps))
  if (task.status === 'running' && task.progress !== undefined) parts.push(`${task.progress}%`)
  return parts.join(' · ')
}
