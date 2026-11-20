import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Hand,
  Loader2,
  Sparkles,
  TriangleAlert,
  XCircle
} from 'lucide-react'
import type { SetupSnapshot, SetupStepId, StepState } from '../../../../shared/types'
import { OPTIONAL_STEPS } from '../../../../shared/types'
import { copy } from '@/lib/copy'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Props {
  snap: SetupSnapshot
  step: StepState
  index: number
}

export function StepPanel({ snap, step, index }: Props): React.JSX.Element {
  const t = copy.steps[step.id]
  const running = step.status === 'running'
  const appDoes =
    step.id === 'noiLuu'
      ? snap.driveFound
        ? copy.steps.noiLuu.appDoesDrive
        : copy.steps.noiLuu.appDoesLocal
      : 'appDoes' in t
        ? t.appDoes
        : ''

  return (
    <main className="box-border flex min-w-0 max-w-[720px] flex-[999_1_560px] flex-col gap-6 rounded-xl border border-vien bg-white px-10 py-9">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-cham">
          {copy.stepOf(index + 1, snap.steps.length)}
        </div>
        <h1 className="m-0 text-[28px] font-extrabold">{t.title}</h1>
        <p className="m-0 text-base leading-relaxed text-phu">{t.desc}</p>
      </div>

      <div className="flex flex-col gap-4">
        <Role
          icon={<Sparkles aria-hidden className="size-5 text-phu" />}
          tint="bg-nen"
          label={copy.appDoes}
          labelClass="text-phu"
          text={appDoes}
        />
        <Role
          icon={<Hand aria-hidden className="size-5 text-cham" />}
          tint="bg-cham-nhat"
          label={copy.youDo}
          labelClass="text-cham"
          text={t.youDo}
        />
      </div>

      {step.status === 'error' && step.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[10px] border border-loi/30 bg-loi-nen px-4 py-3.5"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-loi" />
          <div className="text-[15px] leading-normal text-navy">{copy.errors[step.error]}</div>
        </div>
      )}

      <StepBody snap={snap} step={step} />

      {running && step.progress !== undefined && step.id !== 'dangNhap' && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{runningLabel(step)}</span>
            <span className="text-phu">{step.progress}%</span>
          </div>
          <Progress value={step.progress} label={runningLabel(step)} />
          <div className="text-[13px] text-phu">{copy.canLeave}</div>
        </div>
      )}
    </main>
  )
}

function runningLabel(step: StepState): string {
  if (step.id === 'caiThuVien' && step.detail)
    return copy.steps.caiThuVien.detail[step.detail] ?? copy.steps.caiThuVien.running
  const t = copy.steps[step.id]
  return 'running' in t ? t.running : ''
}

function Role({
  icon,
  tint,
  label,
  labelClass,
  text
}: {
  icon: React.ReactNode
  tint: string
  label: string
  labelClass: string
  text: string
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3.5">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${tint}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className={`text-[13px] font-semibold ${labelClass}`}>{label}</div>
        <div className="text-base leading-normal">{text}</div>
      </div>
    </div>
  )
}

function run(id: SetupStepId, input?: { dir?: string; key?: string }): void {
  void api.invoke('setup:run', id, input)
}

function StepBody({ snap, step }: { snap: SetupSnapshot; step: StepState }): React.JSX.Element {
  switch (step.id) {
    case 'thuMuc':
      return (
        <FolderStep
          step={step}
          initial={snap.projectDir || snap.suggestedProjectDir}
          labels={copy.steps.thuMuc}
        />
      )
    case 'noiLuu':
      return (
        <FolderStep
          step={step}
          initial={snap.outputDir || snap.suggestedOutputDir}
          labels={copy.steps.noiLuu}
        />
      )
    case 'keyGiong':
      return <KeyStep step={step} masked={snap.vivibeKeyMasked} />
    case 'dangNhap':
      return <LoginStep step={step} email={snap.account?.email} />
    case 'kiemTra':
      return <CheckStep snap={snap} step={step} />
    default:
      return <SimpleStep step={step} />
  }
}

function Actions({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

function DoneLine({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-[15px] font-semibold text-xong">
      <CheckCircle2 aria-hidden className="size-5" /> {text}
    </div>
  )
}

function SimpleStep({ step }: { step: StepState }): React.JSX.Element {
  const t = copy.steps[step.id]
  if (step.status === 'running')
    return (
      <Actions>
        <Button
          variant="outline"
          size="md"
          onClick={() => void api.invoke('setup:cancel', step.id)}
        >
          {copy.cancel}
        </Button>
      </Actions>
    )
  if (step.status === 'done') return <DoneLine text="Đã xong" />
  return (
    <Actions>
      <Button onClick={() => run(step.id)}>
        {step.status === 'error' ? copy.retry : t.primary}
      </Button>
    </Actions>
  )
}

function FolderStep({
  step,
  initial,
  labels
}: {
  step: StepState
  initial: string
  labels: { primary: string; secondary: string; fieldLabel: string }
}): React.JSX.Element {
  const [dir, setDir] = useState(initial)
  const pick = async (): Promise<void> => {
    const p = await api.invoke('dialog:pickFolder', dir)
    if (p) setDir(p)
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-semibold text-phu">{labels.fieldLabel}</div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="min-w-0 flex-1 truncate rounded-lg border border-vien-dam bg-nen px-4 py-3 font-mono text-[15px]"
            title={dir}
          >
            {dir}
          </div>
          <Button
            variant="outline"
            size="md"
            disabled={step.status === 'running'}
            onClick={() => void pick()}
          >
            {labels.secondary}
          </Button>
        </div>
      </div>
      <Actions>
        <Button disabled={step.status === 'running'} onClick={() => run(step.id, { dir })}>
          {step.status === 'running' ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : null}
          {step.status === 'done' && dir === initial ? 'Đã xong' : labels.primary}
        </Button>
      </Actions>
    </div>
  )
}

function KeyStep({ step, masked }: { step: StepState; masked?: string }): React.JSX.Element {
  const [key, setKey] = useState('')
  const t = copy.steps.keyGiong
  const busy = step.status === 'running'
  return (
    <div className="flex flex-col gap-4">
      {masked && <DoneLine text={t.saved(masked)} />}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-phu">{t.fieldLabel}</span>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t.placeholder}
          className="h-12 rounded-lg border border-vien-dam bg-white px-4 text-[15px] outline-none focus:border-cham"
        />
      </label>
      <Actions>
        <Button disabled={busy || !key.trim()} onClick={() => run('keyGiong', { key })}>
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {busy ? t.running : t.primary}
        </Button>
        {OPTIONAL_STEPS.includes('keyGiong') && step.status !== 'done' && (
          <Button
            variant="ghost"
            size="md"
            disabled={busy}
            onClick={() => void api.invoke('setup:skip', 'keyGiong')}
          >
            {copy.skip}
          </Button>
        )}
        <a
          href="https://vivibe.app/docs/api-keys"
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-3 text-[15px] font-semibold text-cham hover:text-cham-dam"
        >
          {t.whereToGet}
        </a>
      </Actions>
    </div>
  )
}

function LoginStep({ step, email }: { step: StepState; email?: string }): React.JSX.Element {
  const t = copy.steps.dangNhap
  if (step.status === 'done') return <DoneLine text={t.signedIn(email ?? '')} />
  if (step.status === 'running') {
    const waiting = step.detail === 'choDangNhap'
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-[10px] border border-dashed border-vien-dam bg-nen px-[18px] py-4">
          <Loader2 aria-hidden className="size-5 animate-spin text-xanh" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[15px] font-semibold">
              {waiting ? t.waiting : step.detail === 'hopCat' ? t.safeMode : t.running}
            </div>
            {waiting && <div className="text-[13px] text-phu">{t.waitingSub}</div>}
          </div>
        </div>
        {waiting && (
          <Actions>
            <Button onClick={() => void api.invoke('app:openLoginPage')}>
              {t.reopen} <ExternalLink aria-hidden className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => void api.invoke('setup:cancel', 'dangNhap')}
            >
              {copy.cancel}
            </Button>
          </Actions>
        )}
      </div>
    )
  }
  return (
    <Actions>
      <Button onClick={() => run('dangNhap')}>
        {step.status === 'error' ? copy.retry : t.primary}{' '}
        <ExternalLink aria-hidden className="size-4" />
      </Button>
      <a
        href="https://chatgpt.com/"
        target="_blank"
        rel="noreferrer"
        className="px-2.5 py-3 text-[15px] font-semibold text-cham hover:text-cham-dam"
      >
        {t.noAccount}
      </a>
    </Actions>
  )
}

function CheckStep({ snap, step }: { snap: SetupSnapshot; step: StepState }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {snap.checks.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {snap.checks.map((c) => {
            const warn = !c.ok && c.warnOnly
            const Icon = c.ok ? CheckCircle2 : warn ? TriangleAlert : XCircle
            const color = c.ok ? 'text-xong' : warn ? 'text-credit' : 'text-loi'
            return (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-vien px-4 py-3"
              >
                <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${color}`} />
                <div className="flex flex-col gap-0.5">
                  <div className="text-[15px] font-semibold">
                    {copy.checks[c.id]}
                    {(c.id === 'oDia' || c.id === 'oC') && c.value ? `: ${copy.gb(c.value)}` : ''}
                  </div>
                  {warn && copy.checkWarn[c.id] && (
                    <div className="text-[13px] text-phu">{copy.checkWarn[c.id]}</div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <SimpleStep step={step} />
    </div>
  )
}
