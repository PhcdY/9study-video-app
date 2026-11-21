import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import type { FeedbackDirCheck } from '../../../shared/feedback'
import { api, useFeedbackDirCheck } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const t = copy.gopYCheck

const whyText = (c: FeedbackDirCheck): string =>
  c.status === 'dung' ? t.done : t.why[c.status](c.dir)

/** O canh bao trong Cai dat khi thu muc gop y chua dung, nut "Sua giup toi" mo khung huong dan. */
export function FeedbackDirWarning({
  check,
  onFix
}: {
  check: FeedbackDirCheck
  onFix: () => void
}): React.JSX.Element | null {
  if (check.status === 'dung') return null
  return (
    <div
      role="alert"
      className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border border-[#f3c98b] bg-credit-nen px-4 py-3.5"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-credit" />
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
        <b className="text-[15px]">{t.warnTitle}</b>
        <span className="text-sm break-words text-[#3d4466]">{whyText(check)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onFix}>
          {t.fix}
        </Button>
      </div>
    </div>
  )
}

/** Nhan nho canh dong thu muc: "Da ket noi" / "Chua dung". */
export function FeedbackDirBadge({ check }: { check: FeedbackDirCheck }): React.JSX.Element {
  const ok = check.status === 'dung'
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        ok ? 'bg-xong-nen text-xong' : 'bg-credit-nen text-credit'
      )}
    >
      {ok ? t.ok : t.wrong}
    </span>
  )
}

type StepState = 'xong' | 'dang' | 'cho'

function StepBox({
  n,
  state,
  title,
  children
}: {
  n: number
  state: StepState
  title: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3.5 py-3',
        state === 'dang' ? 'border-[1.5px] border-cham bg-[#fbfcff]' : 'border border-vien'
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {state === 'xong' ? (
          <CheckCircle2 aria-hidden className="size-5 text-xong" />
        ) : state === 'dang' ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-cham text-xs font-extrabold text-white">
            {n}
          </span>
        ) : (
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-vien-dam text-[11px] font-bold text-phu">
            {n}
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <b className={cn('text-[15px]', state === 'cho' && 'text-phu')}>{title}</b>
        {children}
      </div>
    </div>
  )
}

/** Khung huong dan ket noi thu muc gop y cua doi: tu kiem tra lai, tu tich tung buoc. */
export function FeedbackDirGuide({ onClose }: { onClose: () => void }): React.JSX.Element {
  const check = useFeedbackDirCheck(true)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [installing, setInstalling] = useState(false)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const s1 = !!check?.drive
  const s2 = s1 && !!check?.dir && (check.status === 'dung' || check.status === 'khongPhaiCuaDoi')
  const s3 = check?.status === 'dung'
  const st = (done: boolean, prevDone: boolean): StepState =>
    done ? 'xong' : prevDone ? 'dang' : 'cho'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ket-noi-gop-y"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 px-4 py-16"
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="relative box-border flex w-full max-w-[620px] flex-col gap-[18px] rounded-[18px] border border-vien bg-white px-7 py-6 shadow-[0_24px_60px_rgba(14,16,70,0.22)]"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label={t.close}
          onClick={onClose}
          className="absolute top-4 right-4 flex size-9 cursor-pointer items-center justify-center rounded-lg text-phu hover:bg-nen"
        >
          <X aria-hidden className="size-4" />
        </button>
        <div className="flex flex-col gap-1 pr-10">
          <h2 id="ket-noi-gop-y" className="m-0 text-[21px] font-extrabold">
            {t.title}
          </h2>
          <span className="text-sm text-[#3d4466]">{t.sub}</span>
        </div>

        {!check ? (
          <Loader2 aria-hidden className="size-5 animate-spin text-phu" />
        ) : (
          <div className="flex flex-col gap-2.5">
            <StepBox n={1} state={st(s1, true)} title={t.s1}>
              <span className="text-[13px] text-phu">{s1 ? t.s1Ok(check.drive!) : t.s1No}</span>
              {!s1 && (
                <Button
                  size="sm"
                  className="self-start"
                  disabled={installing}
                  onClick={() => {
                    setInstalling(true)
                    void api.invoke('setup:run', 'googleDrive')
                  }}
                >
                  {installing && <Loader2 aria-hidden className="size-4 animate-spin" />}
                  {t.installDrive}
                </Button>
              )}
            </StepBox>
            <StepBox n={2} state={st(s2, s1)} title={t.s2}>
              {s1 && !s2 && (
                <>
                  <ol className="m-0 flex flex-col gap-1 pl-[18px] text-sm leading-normal">
                    {t.s2Lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ol>
                  <Button
                    size="sm"
                    className="self-start"
                    onClick={() => void api.invoke('app:openTeamFolder')}
                  >
                    {copy.steps.gopY.open}
                  </Button>
                </>
              )}
            </StepBox>
            <StepBox n={3} state={st(s3, s2)} title={t.s3}>
              <span className="text-[13px] break-words text-phu">
                {s3
                  ? check.dir
                  : check.status === 'khongPhaiCuaDoi'
                    ? t.s3NotTeam
                    : t.s3Wait(check.drive)}
              </span>
            </StepBox>
          </div>
        )}

        {s3 && (
          <p
            role="status"
            className="m-0 flex items-center gap-2 text-[15px] font-semibold text-xong"
          >
            <CheckCircle2 aria-hidden className="size-5" /> {t.done}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => void api.invoke('feedback:pickDir')}>
            {t.pickManual}
          </Button>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </section>
    </div>
  )
}

const SNOOZE_KEY = 'nhac-gop-y-sau'
const SNOOZE_MS = 3 * 24 * 3600 * 1000
function snoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}

/** Dai nhac o trang Video cho nguoi chua ket noi dung (vd da bam "Lam sau" luc cai). */
export function FeedbackDirBanner(): React.JSX.Element | null {
  const check = useFeedbackDirCheck()
  const [hidden, setHidden] = useState(snoozed)
  const [open, setOpen] = useState(false)
  if (!check || check.status === 'dung' || hidden)
    return open ? <FeedbackDirGuide onClose={() => setOpen(false)} /> : null
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f3c98b] border-l-4 border-l-[#e08a1e] bg-white px-4 py-3">
        <AlertTriangle aria-hidden className="size-[18px] shrink-0 text-credit" />
        <span className="min-w-0 flex-[1_1_320px] text-sm">
          <b>{t.banner}</b> {t.bannerSub}
        </span>
        <Button size="sm" onClick={() => setOpen(true)}>
          {t.connect}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            try {
              localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
            } catch {
              // khong luu duoc thi chi an trong lan mo nay
            }
            setHidden(true)
          }}
        >
          {t.later}
        </Button>
      </div>
      {open && <FeedbackDirGuide onClose={() => setOpen(false)} />}
    </>
  )
}
