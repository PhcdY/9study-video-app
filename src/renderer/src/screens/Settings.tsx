import { useEffect, useState } from 'react'
import { CheckCircle2, FolderOpen, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import type { VersionInfo } from '../../../shared/app'
import type { StepState } from '../../../shared/types'
import { api, useSetup, useUsage } from '@/lib/api'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'

const t = copy.settings

export function SettingsScreen({
  version,
  onOpenUpdate
}: {
  version: VersionInfo | null
  onOpenUpdate: () => void
}): React.JSX.Element {
  const snap = useSetup()
  const usage = useUsage()
  const [appVersion, setAppVersion] = useState('')
  const [editKey, setEditKey] = useState(false)
  const [key, setKey] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [report, setReport] = useState<'idle' | 'busy' | { path: string | null }>('idle')
  useEffect(() => void api.invoke('app:version').then(setAppVersion), [])

  if (!snap) return <main className="flex-1" />
  const step = (id: 'keyGiong' | 'noiLuu' | 'kiemTra'): StepState | undefined =>
    snap.steps.find((s) => s.id === id)
  const keyStep = step('keyGiong')
  const checking = step('kiemTra')?.status === 'running'

  const changeOutput = async (): Promise<void> => {
    const dir = await api.invoke('dialog:pickFolder', snap.outputDir || snap.suggestedOutputDir)
    if (dir) void api.invoke('setup:run', 'noiLuu', { dir })
  }
  const saveKey = (): void => {
    void api.invoke('setup:run', 'keyGiong', { key })
    setEditKey(false)
    setKey('')
  }
  const bugReport = async (): Promise<void> => {
    setReport('busy')
    setReport({ path: await api.invoke('app:bugReport') })
  }

  return (
    <main className="mx-auto box-border flex w-full max-w-[880px] flex-1 flex-col gap-6 p-8">
      <h1 className="m-0 text-[28px] font-extrabold">{t.title}</h1>

      <Section title={t.folders}>
        <Row label={t.project} value={snap.projectDir} desc={t.projectDesc}>
          <Button
            variant="outline"
            size="md"
            onClick={() => void api.invoke('shell:openPath', snap.projectDir)}
          >
            <FolderOpen aria-hidden className="size-4" /> {t.open}
          </Button>
        </Row>
        <Row
          label={t.output}
          value={snap.outputDir || '—'}
          desc={/my drive|drive của tôi/i.test(snap.outputDir) ? t.outputDrive : undefined}
        >
          {snap.outputDir && (
            <Button
              variant="outline"
              size="md"
              onClick={() => void api.invoke('shell:openPath', snap.outputDir)}
            >
              <FolderOpen aria-hidden className="size-4" /> {t.open}
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={() => void changeOutput()}>
            {t.change}
          </Button>
        </Row>
      </Section>

      <Section title={t.voice}>
        <Row
          label={t.key}
          value={snap.vivibeKeyMasked}
          desc={snap.vivibeKeyMasked ? t.keyLocal : t.keyNone}
        >
          {!editKey && (
            <Button variant="outline" size="md" onClick={() => setEditKey(true)}>
              {snap.vivibeKeyMasked ? t.changeKey : t.addKey}
            </Button>
          )}
        </Row>
        {editKey && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="key-moi">
              {t.key}
            </label>
            <input
              id="key-moi"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={copy.steps.keyGiong.placeholder}
              className="h-11 min-w-[280px] flex-1 rounded-lg border border-vien-dam px-3 text-[15px] outline-none focus:border-cham"
            />
            <Button size="md" disabled={!key.trim()} onClick={saveKey}>
              {t.save}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setEditKey(false)}>
              {t.cancel}
            </Button>
          </div>
        )}
        {keyStep?.status === 'running' && <Working />}
        {keyStep?.status === 'error' && keyStep.error && (
          <Alert>{copy.errors[keyStep.error]}</Alert>
        )}
      </Section>

      <Section title={t.ai}>
        <Row
          label={t.signedIn(snap.account?.email ?? '', snap.account?.plan)}
          desc={
            usage
              ? `${copy.usage.pill(usage.remainingPercent)}${usage.resetsAt ? ` · ${copy.usage.resets(usage.resetsAt)}` : ''}`
              : undefined
          }
        >
          {confirmLogout ? (
            <>
              <span className="text-sm text-phu">{t.logoutConfirm}</span>
              <Button variant="outline" size="md" onClick={() => void api.invoke('account:logout')}>
                {t.logout}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setConfirmLogout(false)}>
                {t.cancel}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="md" onClick={() => setConfirmLogout(true)}>
              {t.logout}
            </Button>
          )}
        </Row>
      </Section>

      <Section title={t.versions}>
        <Row
          label={`${t.toolkit} · ${copy.version.current(version?.current ?? version?.base, version?.branch)}`}
          desc={
            !version
              ? undefined
              : version.offline
                ? copy.version.offline
                : version.updateAvailable && version.latest
                  ? copy.version.hasNew(version.latest)
                  : copy.version.upToDate
          }
        >
          {version?.updateAvailable && (
            <Button size="md" onClick={onOpenUpdate}>
              {t.viewUpdate}
            </Button>
          )}
        </Row>
        <Row label={t.appName(appVersion)} />
      </Section>

      <Section title={t.support}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="md"
            disabled={checking}
            onClick={() => void api.invoke('setup:run', 'kiemTra')}
          >
            {checking && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {checking ? t.rechecking : t.recheck}
          </Button>
          <Button
            variant="outline"
            size="md"
            disabled={report === 'busy'}
            onClick={() => void bugReport()}
          >
            {report === 'busy' && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {t.bugReport}
          </Button>
        </div>
        <p className="m-0 text-[13px] leading-normal text-phu">{t.bugReportDesc}</p>
        {typeof report === 'object' &&
          (report.path ? (
            <p className="m-0 text-sm font-semibold text-xong">{t.bugReportDone(report.path)}</p>
          ) : (
            <Alert>{t.bugReportFail}</Alert>
          ))}
        {snap.checks.length > 0 && !checking && (
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {snap.checks.map((c) => {
              const warn = !c.ok && c.warnOnly
              const Icon = c.ok ? CheckCircle2 : warn ? TriangleAlert : XCircle
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <Icon
                    aria-hidden
                    className={`size-4 ${c.ok ? 'text-xong' : warn ? 'text-credit' : 'text-loi'}`}
                  />
                  {copy.checks[c.id]}
                  {(c.id === 'oDia' || c.id === 'oC') && c.value ? `: ${copy.gb(c.value)}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </main>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-vien bg-white px-6 py-5">
      <h2 className="m-0 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

function Row({
  label,
  value,
  desc,
  children
}: {
  label: string
  value?: string
  desc?: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        {value && (
          <span className="truncate font-mono text-sm" title={value}>
            {value}
          </span>
        )}
        {desc && <span className="text-[13px] text-phu">{desc}</span>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

function Working(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm text-phu">
      <Loader2 aria-hidden className="size-4 animate-spin text-xanh" /> {t.working}
    </div>
  )
}

function Alert({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div role="alert" className="rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-sm">
      {children}
    </div>
  )
}
