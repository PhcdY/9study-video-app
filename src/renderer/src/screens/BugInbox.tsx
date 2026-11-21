import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { bugAiPrompt, type BugItem, type BugStatus } from '../../../shared/bugs'
import { api, fileUrl } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BugStatusBadge } from '@/components/BugReport'
import { Sender } from '@/components/Sender'

const t = copy.bug
const STATUSES: BugStatus[] = ['moi', 'dangXem', 'daXuLy']

/** Hop thu bao loi app cho nguoi bao tri: danh sach ben trai, chi tiet ben phai. */
export function BugInbox({
  bugs,
  onOpenChat
}: {
  bugs: BugItem[]
  onOpenChat: (key: string) => void
}): React.JSX.Element {
  const [current, setCurrent] = useState<string | null>(null)
  const cur = bugs.find((b) => b.id === current) ?? bugs[0]
  if (!bugs.length)
    return <div className="flex flex-1 items-center justify-center text-phu">{t.empty}</div>

  return (
    <div className="flex min-h-0 flex-1 flex-wrap gap-5">
      <ul
        aria-label={t.listLabel}
        className="m-0 box-border flex max-w-[400px] min-w-0 flex-[1_1_320px] list-none flex-col self-start overflow-hidden rounded-xl border border-vien bg-white p-0"
      >
        {bugs.map((b) => {
          const on = b.id === cur?.id
          return (
            <li key={b.id} className="border-b border-[#EEF1F8] last:border-b-0">
              <button
                type="button"
                aria-current={on ? 'true' : undefined}
                onClick={() => setCurrent(b.id)}
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-1 px-4 py-3.5 text-left',
                  // Giong danh sach gop y: dong dang chon nen nhat + vach cham ben trai
                  on ? 'bg-nen shadow-[inset_3px_0_0_var(--color-cham)]' : 'hover:bg-nen'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      b.state.status === 'moi' ? 'bg-cham' : 'bg-transparent'
                    )}
                  />
                  <b
                    className={cn(
                      'min-w-0 flex-1 truncate text-[15px]',
                      b.state.status !== 'moi' && 'font-semibold'
                    )}
                  >
                    {b.desc || t.noDesc}
                  </b>
                </span>
                <span className="flex items-center gap-2 pl-4 text-[13px] text-phu">
                  <span className="min-w-0 flex-1 truncate">
                    {t.meta(b.author, t.when(b.createdAt))}
                  </span>
                  {b.state.status !== 'moi' && <BugStatusBadge status={b.state.status} />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {cur && <BugDetail key={cur.id} bug={cur} onOpenChat={onOpenChat} />}
    </div>
  )
}

function Tile({
  label,
  value,
  warn
}: {
  label: string
  value: string
  warn?: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-[10px] border px-3 py-2.5',
        warn ? 'border-[#FDE0BD] bg-credit-nen text-credit' : 'border-vien'
      )}
    >
      <span className={cn('text-xs', !warn && 'text-phu')}>{label}</span>
      <b className="text-[15px]">{value}</b>
    </div>
  )
}

function BugDetail({
  bug,
  onOpenChat
}: {
  bug: BugItem
  onOpenChat: (key: string) => void
}): React.JSX.Element {
  const setStatus = (s: BugStatus): void => void api.invoke('bugs:setState', bug.id, s)
  return (
    <article className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-4 rounded-xl border border-vien bg-white px-6 py-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 className="m-0 text-xl font-bold">{bug.desc || t.noDesc}</h2>
          <Sender name={bug.author} at={bug.createdAt} />
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-phu">
          {t.statusLabel}
          <select
            value={bug.state.status}
            onChange={(e) => setStatus(e.target.value as BugStatus)}
            className="h-9 cursor-pointer rounded-lg border border-vien-dam bg-white px-2 text-sm text-navy"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile label={t.tileApp} value={bug.appVersion} />
        <Tile label={t.tileKit} value={t.tileKitValue(bug.toolkitVersion)} />
        <Tile
          label={t.tileC}
          value={bug.cFreeGb === undefined ? '?' : copy.gb(String(bug.cFreeGb))}
          warn={bug.cFreeGb !== undefined && bug.cFreeGb < 10}
        />
        <Tile label={t.tileErrors} value={t.times(bug.errorCount)} />
      </div>

      {bug.shotPaths.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">{t.shots}</span>
          <div className="flex flex-wrap gap-3">
            {bug.shotPaths.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => void api.invoke('shell:openPath', p)}
                className="flex w-[240px] cursor-pointer flex-col gap-1 text-left"
              >
                <img
                  src={fileUrl(p)}
                  alt={t.shotAlt(t.time(bug.shots[i]?.at ?? bug.createdAt))}
                  className="aspect-video w-full rounded-lg border border-vien object-cover object-top"
                  draggable={false}
                />
                <span className="truncate text-xs text-phu">
                  {t.time(bug.shots[i]?.at ?? bug.createdAt)} · {bug.shots[i]?.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.lastErrors}</span>
        {bug.lastErrors.length ? (
          <pre className="m-0 rounded-[10px] bg-navy px-3.5 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#DFE4FF]">
            {bug.lastErrors.join('\n')}
          </pre>
        ) : (
          <span className="text-sm text-phu">{t.noErrors}</span>
        )}
      </div>

      <AskAi bug={bug} onOpenChat={onOpenChat} />

      <div className="mt-auto flex flex-wrap gap-2.5">
        {bug.logFile && (
          <Button
            variant="outline"
            size="md"
            onClick={() => void api.invoke('shell:openPath', bug.logFile!)}
          >
            {t.openLog}
          </Button>
        )}
        <Button
          variant="outline"
          size="md"
          onClick={() => void api.invoke('shell:openPath', bug.dir)}
        >
          {t.openFolder}
        </Button>
        {bug.state.status !== 'daXuLy' && (
          <Button className="ml-auto" onClick={() => setStatus('daXuLy')}>
            {t.markDone}
          </Button>
        )}
      </div>
    </article>
  )
}

/** Nho AI xu ly: tro ly trong app (chan doan) hoac chep loi nho cho Claude Code / ChatGPT (sua ma app). */
function AskAi({
  bug,
  onOpenChat
}: {
  bug: BugItem
  onOpenChat: (key: string) => void
}): React.JSX.Element {
  const a = t.ai
  const text = bugAiPrompt(bug, 'ngoai')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(id)
  }, [copied])
  const open = async (): Promise<void> => {
    setBusy(true)
    const key = await api.invoke('bugs:askAi', bug.id)
    setBusy(false)
    if (key) onOpenChat(key)
  }
  const copyText = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const card = (title: string, sub: string, btn: React.ReactNode): React.JSX.Element => (
    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5 rounded-xl border border-vien px-4 py-3.5">
      <b className="text-[15px]">{title}</b>
      <span className="text-[13px] leading-[1.45] text-phu">{sub}</span>
      <div className="mt-auto">{btn}</div>
    </div>
  )
  return (
    <section className="flex flex-col gap-3.5 rounded-[14px] border-[1.5px] border-[#c9cefa] bg-white px-5 py-[18px]">
      <h3 className="m-0 flex items-center gap-2.5 text-base font-bold">
        <Sparkles aria-hidden className="size-5 text-cham" /> {a.title}
      </h3>
      <div className="flex flex-wrap gap-3">
        {card(
          a.inApp,
          a.inAppSub,
          <Button size="sm" disabled={busy} onClick={() => void open()}>
            {a.open}
          </Button>
        )}
        {card(
          a.ext,
          a.extSub,
          <Button size="sm" variant="outline" onClick={() => void copyText()}>
            {a.copy}
          </Button>
        )}
      </div>
      <pre className="m-0 max-h-[130px] overflow-hidden rounded-[10px] bg-nen px-3.5 py-3 font-mono text-xs leading-[1.55] whitespace-pre-wrap text-[#3d4466]">
        {text}
      </pre>
      {copied && (
        <p role="status" className="m-0 text-[13px] font-semibold text-xong">
          {a.copied}
        </p>
      )}
    </section>
  )
}
