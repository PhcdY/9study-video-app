import { useEffect, useState } from 'react'
import { CheckCircle2, FolderOpen, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import type { VersionInfo } from '../../../shared/app'
import type { StepState } from '../../../shared/types'
import { api, useSetup, useUsage } from '@/lib/api'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, Input, Page, PageTitle, SettingRow } from '@/components/ui/layout'
import { cn } from '@/lib/utils'

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
  const [active, setActive] = useState('thu-muc')
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

  const sections: { id: string; title: string }[] = [
    { id: 'thu-muc', title: t.folders },
    { id: 'giong-doc', title: t.voice },
    { id: 'tro-ly', title: t.ai },
    { id: 'phien-ban', title: t.versions },
    { id: 'ho-tro', title: t.support }
  ]
  const go = (id: string): void => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const isDrive = /my drive|drive của tôi/i.test(snap.outputDir)

  return (
    <Page>
      <PageTitle>{t.title}</PageTitle>
      <div className="flex flex-wrap items-start gap-8">
        <nav
          aria-label="Mục cài đặt"
          className="sticky top-20 flex max-w-[220px] flex-[1_1_200px] flex-col gap-1"
        >
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => go(sec.id)}
              aria-current={active === sec.id ? 'true' : undefined}
              className={cn(
                'flex h-11 cursor-pointer items-center rounded-[10px] px-3 text-left text-[15px]',
                active === sec.id
                  ? 'bg-cham-nhat font-bold text-cham'
                  : 'font-semibold text-navy hover:bg-white'
              )}
            >
              {sec.title}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-5">
          <SettingsCard id="thu-muc" title={t.folders}>
            <SettingRow label={t.project} value={snap.projectDir} desc={t.projectDesc}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void api.invoke('shell:openPath', snap.projectDir)}
              >
                <FolderOpen aria-hidden className="size-4" /> {t.open}
              </Button>
            </SettingRow>
            <SettingRow
              label={t.output}
              value={snap.outputDir || '—'}
              desc={isDrive ? t.outputDrive : undefined}
              descTone="ok"
            >
              {snap.outputDir && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void api.invoke('shell:openPath', snap.outputDir)}
                >
                  <FolderOpen aria-hidden className="size-4" /> {t.open}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => void changeOutput()}>
                {t.change}
              </Button>
            </SettingRow>
          </SettingsCard>

          <SettingsCard id="giong-doc" title={t.voice}>
            <SettingRow
              label={t.key}
              value={snap.vivibeKeyMasked}
              desc={snap.vivibeKeyMasked ? t.keyLocal : t.keyNone}
            >
              {!editKey && (
                <Button variant="outline" size="sm" onClick={() => setEditKey(true)}>
                  {snap.vivibeKeyMasked ? t.changeKey : t.addKey}
                </Button>
              )}
            </SettingRow>
            {editKey && (
              <div className="flex flex-wrap items-center gap-2 pb-4">
                <label className="sr-only" htmlFor="key-moi">
                  {t.key}
                </label>
                <Input
                  id="key-moi"
                  type="password"
                  autoComplete="off"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={copy.steps.keyGiong.placeholder}
                  className="h-10 min-w-[260px] flex-1"
                />
                <Button size="sm" disabled={!key.trim()} onClick={saveKey}>
                  {t.save}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditKey(false)}>
                  {t.cancel}
                </Button>
              </div>
            )}
            {keyStep?.status === 'running' && <Working />}
            {keyStep?.status === 'error' && keyStep.error && (
              <Alert>{copy.errors[keyStep.error]}</Alert>
            )}
          </SettingsCard>

          <SettingsCard id="tro-ly" title={t.ai}>
            <SettingRow
              label={t.signedIn(snap.account?.email ?? '', snap.account?.plan)}
              desc={
                usage
                  ? `${copy.usage.pill(usage.remainingPercent)}${usage.resetsAt ? ` · ${copy.usage.resets(usage.resetsAt)}` : ''}`
                  : undefined
              }
            >
              {!confirmLogout && (
                <Button variant="outline" size="sm" onClick={() => setConfirmLogout(true)}>
                  {t.logout}
                </Button>
              )}
            </SettingRow>
            {confirmLogout && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-vien bg-nen px-4 py-3">
                <span className="flex-1 text-sm">{t.logoutConfirm}</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void api.invoke('account:logout')}
                >
                  {t.logout}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmLogout(false)}>
                  {t.cancel}
                </Button>
              </div>
            )}
          </SettingsCard>

          <SettingsCard id="phien-ban" title={t.versions}>
            <SettingRow
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
                <Button variant="accent" size="sm" onClick={onOpenUpdate}>
                  {t.viewUpdate}
                </Button>
              )}
            </SettingRow>
            <SettingRow label={t.appName(appVersion)} />
          </SettingsCard>

          <SettingsCard id="ho-tro" title={t.support}>
            <div className="flex flex-col gap-3 py-4">
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
                  <p className="m-0 text-sm font-semibold text-xong">
                    {t.bugReportDone(report.path)}
                  </p>
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
                          className={`size-4 shrink-0 ${c.ok ? 'text-xong' : warn ? 'text-credit' : 'text-loi'}`}
                        />
                        {copy.checks[c.id]}
                        {(c.id === 'oDia' || c.id === 'oC') && c.value
                          ? `: ${copy.gb(c.value)}`
                          : ''}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </SettingsCard>
        </div>
      </div>
    </Page>
  )
}

/** The cai dat: tieu de 19/700, cac hang ngan bang vach mo (theo thiet ke). */
function SettingsCard({
  id,
  title,
  children
}: {
  id: string
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Card className="px-7 pt-2 pb-1">
      <div id={id} className="scroll-mt-20 pt-[18px] pb-1.5">
        <CardTitle>{title}</CardTitle>
      </div>
      {children}
    </Card>
  )
}

function Working(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 pb-4 text-sm text-phu">
      <Loader2 aria-hidden className="size-4 animate-spin text-xanh" /> {t.working}
    </div>
  )
}

function Alert({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div role="alert" className="mb-4 rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-sm">
      {children}
    </div>
  )
}
