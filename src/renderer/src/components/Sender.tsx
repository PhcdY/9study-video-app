import { copy } from '@/lib/copy'

/** Nguoi gui (gop y, bao loi): chu cai dau trong vong tron, ten dam, duoi la luc gui. */
export function Sender({ name, at }: { name: string; at: number }): React.JSX.Element {
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '?'
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cham-nhat text-sm font-bold text-cham"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-col">
        <b className="truncate text-sm text-navy">{name}</b>
        <span className="text-xs text-phu">{copy.sender.at(at)}</span>
      </span>
    </div>
  )
}
