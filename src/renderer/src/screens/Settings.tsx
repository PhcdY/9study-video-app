import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Loader2,
  TriangleAlert,
  XCircle
} from 'lucide-react'
import { ChangelogBody } from '@/components/UpdateDialog'
import { VivibeSettingsBlock } from '@/components/VivibeUsage'
import { BugReportPanel, MyBugs } from '@/components/BugReport'
import type { AppUpdateCheck, DiskUsage, VersionInfo } from '../../../shared/app'
import { VOICES, VOICE_GROUPS, suggestedVoice } from '../../../shared/prompt'
import type { StepState } from '../../../shared/types'
import {
  api,
  useAiModels,
  useAppUpdate,
  useAppUpdateCheck,
  useFeedbackDirCheck,
  useFeedback,
  usePrefs,
  useRestartToUpdate,
  useSetup,
  useUsage
} from '@/lib/api'
import { BusyWarning } from '@/components/UpdatePill'
import { AiPicker } from '@/components/AiPicker'
import { LegacySettings } from '@/components/Legacy'
import { FeedbackDirBadge, FeedbackDirGuide, FeedbackDirWarning } from '@/components/FeedbackDir'
import { headline } from '../../../shared/feedback-rules'
import { copy } from '@/lib/copy'
import { ErrorSnap } from '@/components/ErrorSnap'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, Input, Page, PageTitle, Select, SettingRow } from '@/components/ui/layout'
import { cn } from '@/lib/utils'

const t = copy.settings

export function SettingsScreen({
  version,
  onOpenUpdate,
  onVersionChanged,
  onOpenChat,
  onOpenGuide
}: {
  version: VersionInfo | null
  onOpenUpdate: () => void
  onVersionChanged: () => void
  onOpenChat: (key: string) => void
  onOpenGuide: () => void
}): React.JSX.Element {
  const snap = useSetup()
  const usage = useUsage()
  const [appVersion, setAppVersion] = useState('')
  const [editKey, setEditKey] = useState(false)
  const [key, setKey] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showBug, setShowBug] = useState(false)
  const [active, setActive] = useState('thu-muc')
  const [prefs, savePrefs] = usePrefs()
  const aiModels = useAiModels()
  const appUpdate = useAppUpdate()
  const appCheck = useAppUpdateCheck()
  const fbDir = useFeedbackDirCheck()
  const [guide, setGuide] = useState(false)
  const restart = useRestartToUpdate()
  const [fb] = useFeedback()
  const [showSent, setShowSent] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [disk, setDisk] = useState<DiskUsage | null>(null)
  const [cleaning, setCleaning] = useState<'drafts' | 'temp' | null>(null)
  const [confirmClean, setConfirmClean] = useState<'drafts' | 'temp' | null>(null)
  // Ban dang mo xem mo ta; ban dang doi sang (xac nhan / dang doi / xong / loi)
  const [openV, setOpenV] = useState<string | null>(null)
  const [openSent, setOpenSent] = useState<string | null>(null)
  const [sw, setSw] = useState<{ v: string; state: 'confirm' | 'busy' | 'done' | 'fail' } | null>(
    null
  )
  useEffect(() => {
    void api.invoke('voice:speed').then(setSpeed)
    void api.invoke('disk:usage').then(setDisk)
  }, [])
  useEffect(() => void api.invoke('app:version').then(setAppVersion), [])
  // Cuon toi muc nao thi to dam muc do o cot trai
  useEffect(() => {
    const onScroll = (): void => {
      const ids = ['thu-muc', 'giong-doc', 'tro-ly', 'phien-ban', 'o-dia', 'gop-y', 'ho-tro']
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) cur = id
      }
      // Cuon het trang: muc cuoi
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = ids.at(-1)!
      setActive(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
  const switchTo = async (v: string): Promise<void> => {
    setSw({ v, state: 'busy' })
    const res = await api.invoke('version:update', v)
    if (res.ok) {
      setSw({ v, state: 'done' })
      onVersionChanged()
    } else if (res.code === 'nhoAi') onOpenChat(res.chatKey)
    else setSw({ v, state: 'fail' })
  }
  const clean = async (which: 'drafts' | 'temp'): Promise<void> => {
    setConfirmClean(null)
    setCleaning(which)
    setDisk(await api.invoke('disk:clean', which))
    setCleaning(null)
  }

  const sections: { id: string; title: string }[] = [
    { id: 'thu-muc', title: t.folders },
    { id: 'giong-doc', title: t.voice },
    { id: 'tro-ly', title: t.ai },
    { id: 'phien-ban', title: t.versions },
    { id: 'o-dia', title: t.disk },
    { id: 'gop-y', title: t.feedback },
    { id: 'ho-tro', title: t.support }
  ]
  const go = (id: string): void => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const mine = (fb?.items ?? []).filter((it) => it.machine === fb?.me)
  const mineFixed = mine.filter((it) => it.state.status === 'daSua').length
  const mineWaiting = mine.filter(
    (it) => it.state.status === 'moi' || it.state.status === 'dangSua'
  ).length

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
              {sec.id === 'gop-y' && fbDir && fbDir.status !== 'dung' && (
                <span aria-hidden className="ml-2 size-2 rounded-full bg-[#E08A1E]" />
              )}
            </button>
          ))}
        </nav>
        {guide && <FeedbackDirGuide onClose={() => setGuide(false)} />}

        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-5">
          <SettingsCard id="thu-muc" title={t.folders}>
            <SettingRow label={t.project} value={snap.projectDir}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void api.invoke('shell:openPath', snap.projectDir)}
              >
                <FolderOpen aria-hidden className="size-4" /> {t.open}
              </Button>
            </SettingRow>
            <SettingRow label={t.output} value={snap.outputDir || '—'} descTone="ok">
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
            <LegacySettings projectDir={snap.projectDir} />
          </SettingsCard>

          <SettingsCard id="giong-doc" title={t.voice}>
            <SettingRow
              label={
                <span className="flex flex-wrap items-center gap-2">
                  {t.key}
                  {snap.vivibeKeyMasked && keyStep?.status === 'done' && (
                    <span className="rounded-full bg-xong-nen px-2.5 py-0.5 text-xs font-bold text-xong">
                      {t.keyOk}
                    </span>
                  )}
                </span>
              }
              value={snap.vivibeKeyMasked}
              desc={snap.vivibeKeyMasked ? undefined : t.keyNone}
            >
              {!editKey && snap.vivibeKeyMasked && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={keyStep?.status === 'running'}
                  onClick={() => void api.invoke('setup:run', 'keyGiong')}
                >
                  {t.recheckKey}
                </Button>
              )}
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
            <div className="flex flex-col gap-3 border-b border-[#EEF1F8] py-4">
              <div className="flex flex-col gap-1">
                <div className="text-[15px] font-bold">{t.defaultVoice}</div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                {VOICE_GROUPS.map((g) => {
                  const cur = suggestedVoice(g.subjects[0], prefs?.defaultVoices)
                  return (
                    <label key={g.id} className="flex flex-col gap-1.5">
                      <span className="text-[13px] font-semibold text-phu">
                        {t.voiceGroups[g.id]}
                      </span>
                      <Select
                        value={cur}
                        onChange={(e) =>
                          void savePrefs({
                            defaultVoices: { ...prefs?.defaultVoices, [g.id]: e.target.value }
                          })
                        }
                        className="h-10 text-sm"
                      >
                        {[...new Set([...VOICES.map((x) => x.id), cur])].map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </Select>
                    </label>
                  )
                })}
              </div>
            </div>
            {speed !== null && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
                  <label htmlFor="spd" className="text-[15px] font-bold">
                    {t.speed}
                  </label>
                </div>
                <div className="flex flex-[0_1_280px] items-center gap-3">
                  <input
                    id="spd"
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.05}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    onPointerUp={() => void api.invoke('voice:setSpeed', speed)}
                    onKeyUp={() => void api.invoke('voice:setSpeed', speed)}
                    className="flex-1 accent-cham"
                  />
                  <span className="w-12 text-[15px] font-bold">{t.speedValue(speed)}</span>
                </div>
              </div>
            )}
            <div className="border-t border-[#EEF1F8]">
              <VivibeSettingsBlock />
            </div>
          </SettingsCard>

          <SettingsCard id="tro-ly" title={t.ai}>
            <AccountRow
              email={snap.account?.email}
              plan={snap.account?.plan}
              action={
                !confirmLogout && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmLogout(true)}>
                    {t.logout}
                  </Button>
                )
              }
            />
            <div className="flex flex-col gap-3 border-b border-[#EEF1F8] pt-1 pb-4">
              <span className="text-[15px] font-bold">{copy.usage.title}</span>
              {usage ? (
                usage.windows.map((w, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="w-32 text-sm font-semibold text-navy">
                      {copy.usage.windowLong(w.minutes)}
                    </span>
                    <span className="h-2 w-48 overflow-hidden rounded-full bg-vien" aria-hidden>
                      <span
                        className={cn(
                          'block h-full rounded-full',
                          w.usedPercent >= 90
                            ? 'bg-loi'
                            : w.usedPercent >= 70
                              ? 'bg-[#E08A1E]'
                              : 'bg-xanh'
                        )}
                        style={{ width: `${w.usedPercent}%` }}
                      />
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {copy.usage.used(w.usedPercent)}
                    </span>
                    {w.resetsAt && (
                      <span className="text-[13px] text-phu">{copy.usage.resets(w.resetsAt)}</span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-phu">{copy.usage.unknown}</span>
              )}
            </div>
            <div className="flex flex-col gap-2 border-b border-[#EEF1F8] pt-4 pb-4">
              <span className="text-[15px] font-bold">{copy.ai.settingsTitle}</span>
              {aiModels.length ? (
                <>
                  <span className="text-[13px] text-phu">{copy.ai.settingsHint}</span>
                  <AiPicker
                    variant="field"
                    models={aiModels}
                    value={prefs?.defaultAi ?? {}}
                    onChange={(choice) => void savePrefs({ defaultAi: choice })}
                  />
                </>
              ) : (
                <span className="text-[13px] text-phu">{copy.ai.settingsEmpty}</span>
              )}
            </div>
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
            <fieldset className="m-0 flex flex-col gap-1 border-0 border-b border-[#EEF1F8] p-0 pb-4">
              <legend className="float-left w-full pt-4 pb-1 text-[15px] font-bold">
                {t.askTitle}
              </legend>
              {(['tonCredit', 'moiLenh'] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-start gap-3 py-1.5">
                  <input
                    type="radio"
                    name="ask"
                    checked={(prefs?.askPolicy ?? 'tonCredit') === v}
                    onChange={() => void savePrefs({ askPolicy: v })}
                    className="m-0 mt-[3px] size-[18px] accent-cham"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {v === 'tonCredit' ? t.askCredit : t.askAll}
                      {v === 'tonCredit' && (
                        <span className="ml-2 rounded-full bg-xong-nen px-2 py-px align-[1px] text-xs font-bold text-xong">
                          {t.askCreditTag}
                        </span>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <CheckRow
              checked={prefs?.autoCompact !== false}
              onChange={(v) => void savePrefs({ autoCompact: v })}
              label={t.autoCompact}
            />
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
            {!!version?.history.length && (
              <div className="flex flex-col gap-2 border-b border-[#EEF1F8] py-4">
                <span className="text-[15px] font-bold">{t.allVersions}</span>
                <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                  {version.history.map((e) => {
                    const mine = Number(version.current ?? version.base ?? 0)
                    const isCur = !version.branch && e.version === version.current
                    const isOpen = openV === e.version
                    const busy = sw?.state === 'busy'
                    return (
                      <li key={e.version} className="rounded-[10px] border border-vien bg-white">
                        <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenV(isOpen ? null : e.version)}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1 text-left hover:text-cham"
                          >
                            <ChevronRight
                              aria-hidden
                              className={cn(
                                'size-4 shrink-0 text-phu transition-transform',
                                isOpen && 'rotate-90'
                              )}
                            />
                            <span className="font-bold">{t.versionName(e.version)}</span>
                            {e.date && (
                              <span className="text-[13px] text-phu">{t.versionDate(e.date)}</span>
                            )}
                            {isCur && (
                              <span className="rounded-full bg-xong-nen px-2 py-px text-xs font-bold text-xong">
                                {t.inUse}
                              </span>
                            )}
                            {!isCur && e.version === version.latest && (
                              <span className="rounded-full bg-cham-nhat px-2 py-px text-xs font-bold text-cham">
                                {t.newest}
                              </span>
                            )}
                          </button>
                          {!isCur && sw?.v !== e.version && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => setSw({ v: e.version, state: 'confirm' })}
                            >
                              {Number(e.version) < mine ? t.goBack(e.version) : t.goUp(e.version)}
                            </Button>
                          )}
                        </div>
                        {isOpen && (
                          <div className="border-t border-vien px-4 py-3">
                            <ChangelogBody entry={e} />
                          </div>
                        )}
                        {sw?.v === e.version && (
                          <div className="flex flex-wrap items-center gap-3 border-t border-vien bg-nen px-4 py-3">
                            {sw.state === 'confirm' && (
                              <>
                                <span className="flex-1 text-sm">{t.switchConfirm(e.version)}</span>
                                <Button size="sm" onClick={() => void switchTo(e.version)}>
                                  {Number(e.version) < mine
                                    ? t.goBack(e.version)
                                    : t.goUp(e.version)}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSw(null)}>
                                  {t.cancel}
                                </Button>
                              </>
                            )}
                            {sw.state === 'busy' && (
                              <span className="flex items-center gap-2 text-sm text-phu">
                                <Loader2 aria-hidden className="size-4 animate-spin text-xanh" />
                                {t.working}
                              </span>
                            )}
                            {sw.state === 'done' && (
                              <span className="text-sm font-semibold text-xong">
                                {t.switchDone(e.version)}
                              </span>
                            )}
                            {sw.state === 'fail' && (
                              <span role="alert" className="text-sm text-loi">
                                {t.switchFail}
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {appUpdate ? (
              <>
                <SettingRow
                  label={
                    <span className="flex flex-wrap items-center gap-2.5">
                      {t.appName(appVersion)}
                      <span className="rounded-full bg-cham-nhat px-2.5 py-0.5 text-xs font-bold text-cham">
                        {copy.appUpdate.ready(appUpdate.version)}
                      </span>
                    </span>
                  }
                  desc={
                    <a
                      href={appUpdate.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cham no-underline hover:underline"
                    >
                      {copy.appUpdate.whatsNewIn(appUpdate.version)}
                    </a>
                  }
                >
                  {!restart.busy && (
                    <Button size="sm" onClick={() => void restart.ask()}>
                      {copy.appUpdate.restart}
                    </Button>
                  )}
                </SettingRow>
                {restart.busy && (
                  <div className="flex flex-col gap-2.5 pb-4">
                    <BusyWarning titles={restart.busy} />
                    <div className="flex gap-2.5">
                      <Button size="sm" onClick={restart.cancel}>
                        {copy.appUpdate.later}
                      </Button>
                      <Button size="sm" variant="outline" onClick={restart.confirm}>
                        {copy.appUpdate.restartAnyway}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <AppCheckRow label={t.appName(appVersion)} {...appCheck} />
            )}
            <CheckRow
              checked={prefs?.autoUpdateApp !== false}
              onChange={(v) => void savePrefs({ autoUpdateApp: v })}
              label={t.autoUpdate}
            />
          </SettingsCard>

          <SettingsCard id="o-dia" title={t.disk}>
            {(['drafts', 'temp'] as const).map((which) => (
              <SettingRow
                key={which}
                label={
                  which === 'drafts'
                    ? t.drafts(copy.feedback.size(disk?.drafts ?? 0))
                    : t.temp(copy.feedback.size(disk?.temp ?? 0))
                }
                desc={
                  which === 'temp' && disk?.cFreeGb !== undefined && disk.cFreeGb < 10 ? (
                    <span className="font-semibold text-credit">
                      {t.lowC(Math.floor(disk.cFreeGb))}
                    </span>
                  ) : undefined
                }
              >
                {confirmClean === which ? (
                  <>
                    <span className="text-sm">{t.cleanConfirm}</span>
                    <Button variant="danger" size="sm" onClick={() => void clean(which)}>
                      {t.clean}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClean(null)}>
                      {t.cancel}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !disk || (which === 'drafts' ? disk.drafts : disk.temp) === 0 || !!cleaning
                    }
                    onClick={() => setConfirmClean(which)}
                  >
                    {cleaning === which && <Loader2 aria-hidden className="size-4 animate-spin" />}
                    {cleaning === which ? t.cleaning : t.clean}
                  </Button>
                )}
              </SettingRow>
            ))}
          </SettingsCard>

          <SettingsCard id="gop-y" title={t.feedback}>
            {fbDir && <FeedbackDirWarning check={fbDir} onFix={() => setGuide(true)} />}
            <SettingRow
              label={
                <span className="flex flex-wrap items-center gap-2.5">
                  {t.feedbackDir}
                  {fbDir && <FeedbackDirBadge check={fbDir} />}
                </span>
              }
              value={prefs?.feedbackDirInUse ?? '—'}
              desc={prefs?.feedbackDirInUse ? undefined : t.feedbackDirNone}
            >
              {prefs?.maintainer &&
                fbDir?.dir &&
                !fbDir.marked &&
                (fbDir.status === 'dung' || fbDir.status === 'khongPhaiCuaDoi') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void api.invoke('feedback:markTeam')}
                  >
                    {copy.gopYCheck.mark}
                  </Button>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void api.invoke('app:openTeamFolder')}
              >
                {copy.steps.gopY.open}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void api.invoke('feedback:pickDir')}
              >
                {prefs?.feedbackDirInUse ? t.change : t.pick}
              </Button>
            </SettingRow>
            <SettingRow label={t.authorName}>
              <label className="sr-only" htmlFor="ten-ctv">
                {t.authorName}
              </label>
              <Input
                id="ten-ctv"
                value={name ?? prefs?.authorName ?? ''}
                placeholder={t.authorNamePh}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (name !== null) void savePrefs({ authorName: name.trim() })
                }}
                className="h-10 w-56"
              />
            </SettingRow>
            <SettingRow label={t.sent(mine.length)} desc={t.sentSummary(mineFixed, mineWaiting)}>
              {mine.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowSent((v) => !v)}>
                  {showSent ? t.hide : t.view}
                </Button>
              )}
            </SettingRow>
            {showSent && (
              <ul className="m-0 mb-4 flex list-none flex-col rounded-[10px] border border-vien p-0">
                {mine.map((it) => {
                  const fixed = it.state.status === 'daSua'
                  const open = openSent === it.id
                  const notes = it.state.changelog ?? []
                  const v = it.state.fixedIn
                  const canUp =
                    !!v &&
                    !!version?.current &&
                    Number(version.current) < Number(v) &&
                    !!version.history?.some((h) => h.version === v)
                  return (
                    <li key={it.id} className="border-b border-[#EEF1F8] last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={fixed ? open : undefined}
                        disabled={!fixed}
                        onClick={() => setOpenSent(open ? null : it.id)}
                        className={cn(
                          'flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left',
                          fixed && 'cursor-pointer hover:bg-nen'
                        )}
                      >
                        {fixed && (
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              'size-4 shrink-0 text-phu transition-transform',
                              open && 'rotate-90'
                            )}
                          />
                        )}
                        <span className="flex min-w-0 flex-[1_1_240px] flex-col">
                          <span className="text-sm font-semibold">{headline(it.desc)}</span>
                          <span className="text-xs text-phu">{it.title}</span>
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-bold',
                            fixed
                              ? 'bg-xong-nen text-xong'
                              : it.state.status === 'dangSua'
                                ? 'bg-cham-nhat text-cham'
                                : 'bg-[#F1F3FA] text-phu'
                          )}
                        >
                          {fixed && v
                            ? copy.feedback.fixedIn(v)
                            : copy.feedback.status[it.state.status]}
                        </span>
                      </button>
                      {fixed && open && (
                        <div className="flex flex-col gap-2.5 border-t border-vien bg-nen py-3.5 pr-4 pl-11">
                          {it.state.summary && (
                            <span className="text-[15px] leading-normal">{it.state.summary}</span>
                          )}
                          {notes.length > 0 && (
                            <ul className="m-0 flex list-disc flex-col gap-1 pl-[18px] text-sm leading-normal text-[#3d4466]">
                              {notes.map((l, i) => (
                                <li key={i}>{l}</li>
                              ))}
                            </ul>
                          )}
                          {canUp && v && (
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Button
                                size="sm"
                                disabled={sw?.v === v && sw.state === 'busy'}
                                onClick={() => void switchTo(v)}
                              >
                                {sw?.v === v && sw.state === 'busy' ? (
                                  <Loader2 aria-hidden className="size-4 animate-spin" />
                                ) : null}
                                {t.goUp(v)}
                              </Button>
                              <span className="text-[13px] text-phu">
                                {sw?.v === v && sw.state === 'fail'
                                  ? t.switchFail
                                  : t.usingVersion(version!.current!)}
                              </span>
                            </div>
                          )}
                          {v && sw?.v === v && sw.state === 'done' && (
                            <span className="text-[13px] font-semibold text-xong">
                              {t.switchDone(v)}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <CheckRow
              checked={!!prefs?.alwaysFullVideo}
              onChange={(v) => void savePrefs({ alwaysFullVideo: v })}
              label={t.fullVideo}
            />
            <CheckRow
              checked={!!prefs?.maintainer}
              onChange={(v) => void savePrefs({ maintainer: v })}
              label={t.maintainer}
            />
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
                  aria-expanded={showBug}
                  className={cn(showBug && 'border-cham bg-cham-nhat text-cham')}
                  onClick={() => setShowBug((v) => !v)}
                >
                  {t.bugReport}
                </Button>
                <Button variant="outline" size="md" onClick={onOpenGuide}>
                  {t.guide}
                </Button>
              </div>
              {showBug && <BugReportPanel onClose={() => setShowBug(false)} />}
              <MyBugs />
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

/** Tai khoan ChatGPT: chu cai dau, email, ten goi (vd ChatGPT Plus). */
function AccountRow({
  email,
  plan,
  action
}: {
  email?: string
  plan?: string
  action?: React.ReactNode
}): React.JSX.Element {
  const initials =
    (email?.split('@')[0] ?? '')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 2)
      .toUpperCase() || 'AI'
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F8] py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
        {initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold">{email || copy.usage.chatgpt}</span>
        <span className="flex items-center gap-2 text-[13px] text-phu">
          {t.account}
          <span className="rounded-full bg-cham-nhat px-2 py-px text-xs font-bold text-cham">
            {copy.usage.plan(plan)}
          </span>
        </span>
      </div>
      {action}
    </div>
  )
}

/** Hang "App NiniStudio · x" khi chua co ban moi tai xong: nut "Tim ban moi", dang tim / dang tai / da moi nhat / loi. */
function AppCheckRow({
  label,
  status,
  shown,
  check
}: {
  label: string
  status: AppUpdateCheck | null
  shown: boolean
  check: () => Promise<void>
}): React.JSX.Element {
  const c = copy.appUpdate
  const s = shown ? status?.state : undefined
  if (status?.state === 'downloading')
    return (
      <SettingRow
        label={
          <span className="flex flex-wrap items-center gap-2.5">
            {label}
            <span className="flex items-center gap-1.5 rounded-full bg-cham-nhat px-2.5 py-0.5 text-xs font-bold text-cham">
              <Loader2 aria-hidden className="size-3 animate-spin" />
              {c.downloading(status.version, status.percent)}
            </span>
          </span>
        }
        desc={c.downloadingDesc}
      />
    )
  return (
    <SettingRow
      label={label}
      desc={
        s === 'latest' ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="size-4" />
            {c.latest}
          </span>
        ) : s === 'error' ? (
          <span role="alert" className="font-semibold text-loi">
            {c.checkFail}
            <ErrorSnap id="app-update-check" label={c.checkFail} />
          </span>
        ) : undefined
      }
      descTone={s === 'latest' ? 'ok' : 'muted'}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={s === 'checking'}
        onClick={() => void check()}
      >
        {s === 'checking' && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {s === 'checking' ? c.checking : s === 'error' ? c.retry : c.check}
      </Button>
    </SettingRow>
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

/** Hang bat / tat: o tick + tieu de dam + mo ta (theo thiet ke). */
function CheckRow({
  checked,
  onChange,
  label,
  desc
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  desc?: string
}): React.JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-b border-[#EEF1F8] py-4 last:border-b-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="m-0 mt-0.5 size-5 shrink-0 accent-cham"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{label}</span>
        {desc && <span className="text-[13px] text-phu">{desc}</span>}
      </span>
    </label>
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
