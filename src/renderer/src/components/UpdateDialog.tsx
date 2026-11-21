import { useEffect, useState } from 'react'
import { ArrowUpCircle, Check, Loader2, ShieldCheck, X } from 'lucide-react'
import type { ChangelogEntry, UpdateResult, UpdateStep, VersionInfo } from '../../../shared/app'
import { api } from '@/lib/api'
import { ErrorSnap } from '@/components/ErrorSnap'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/workspace/Markdown'

const t = copy.version

/** Dai thong bao "Ban N da san sang" o dau man Video cua toi. */
export function UpdateBanner({
  info,
  onOpen
}: {
  info: VersionInfo
  onOpen: () => void
}): React.JSX.Element | null {
  const [hidden, setHidden] = useState(false)
  if (!info.updateAvailable || !info.latest || hidden) return null
  // Dai thong bao chi mot dong chu thuong: bo dau ** cua Markdown
  const summary = info.notes[0]?.summary?.replace(/\*\*|`/g, '')
  return (
    <div role="status" className="border-b border-vien bg-white">
      <div className="mx-auto box-border flex max-w-[1180px] flex-wrap items-center gap-x-3.5 gap-y-2 px-8 py-2.5">
        <ArrowUpCircle aria-hidden className="size-[18px] text-cham" />
        <span className="min-w-0 flex-[1_1_360px] text-sm">
          <b>{t.banner(info.latest)}</b> {summary && <span className="text-phu">{summary}</span>}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="cursor-pointer px-1 py-2 text-sm font-bold text-cham hover:text-cham-dam"
        >
          {t.bannerAction}
        </button>
        <button
          type="button"
          aria-label={t.dismiss}
          onClick={() => setHidden(true)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-nen"
        >
          <X aria-hidden className="size-4 text-phu" />
        </button>
      </div>
    </div>
  )
}

/** Hop cap nhat bo cong cu: co gi moi, cap nhat tu dong hoac nho AI. */
export function UpdateDialog({
  info,
  onClose,
  onHandoff,
  onUpdated
}: {
  info: VersionInfo
  onClose: () => void
  onHandoff: (chatKey: string) => void
  onUpdated: () => void
}): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [steps, setSteps] = useState<Partial<Record<UpdateStep, 'running' | 'done'>>>({})
  const [result, setResult] = useState<UpdateResult | null>(null)
  useEffect(
    () => api.on('version:progress', (p) => setSteps((s) => ({ ...s, [p.step]: p.status }))),
    []
  )

  // Giu nguyen ban luc mo hop: sau khi cap nhat thong tin tai lai, tieu de khong doi thanh "Ban 3 -> Ban 3"
  const [latest] = useState(info.latest ?? '')
  const [from] = useState(info.current ?? info.base ?? '?')
  const entry = info.notes[0]
  const main = entry?.groups[0]
  const otherGroups = (entry?.groups.length ?? 1) - 1

  const go = async (): Promise<void> => {
    setBusy(true)
    setResult(null)
    const res = await api.invoke('version:update', latest)
    setBusy(false)
    if (!res.ok && res.code === 'nhoAi') return onHandoff(res.chatKey)
    setResult(res)
    if (res.ok) onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,16,70,0.40)] px-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cap-nhat-tieu-de"
        className="box-border flex max-h-full w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-[0_20px_48px_rgba(14,16,70,0.22)]"
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className="flex flex-grow flex-col gap-1">
            <h1 id="cap-nhat-tieu-de" className="m-0 text-xl font-bold">
              {t.dialogTitle}
            </h1>
            <p className="m-0 text-sm text-phu">
              {t.fromTo(from, latest)}
              {t.released(entry?.date)}
            </p>
          </div>
          <button
            type="button"
            aria-label={t.close}
            onClick={onClose}
            disabled={busy}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-nen"
          >
            <X aria-hidden className="size-4 text-phu" />
          </button>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5">
          {entry?.summary && (
            <div className="text-[15px] leading-normal">
              <Markdown text={entry.summary} />
            </div>
          )}
          {main?.moi.length ? <Notes title={t.whatsNew} items={main.moi} /> : null}
          {main?.sua.length ? <Notes title={t.fixes} items={main.sua} /> : null}
          {otherGroups > 0 && (
            <p className="m-0 text-[13px] text-phu">
              {t.moreGroups(otherGroups)}:{' '}
              {entry?.groups
                .slice(1)
                .map((g) => g.name)
                .join(', ')}
            </p>
          )}
          {info.needAppVersion ? (
            <div
              role="alert"
              className="rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-sm"
            >
              {t.needApp(info.needAppVersion)}
            </div>
          ) : !info.safe ? (
            <div className="rounded-lg border border-vien-dam bg-nen px-4 py-3 text-sm leading-normal">
              {t.needAi}
            </div>
          ) : null}
          <div className="flex items-start gap-2.5 border-t border-[#EEF1F8] pt-3.5">
            <ShieldCheck aria-hidden className="mt-0.5 size-[18px] shrink-0 text-phu" />
            <p className="m-0 text-[13px] leading-relaxed text-phu">
              <b className="text-navy">{t.kept}</b> {t.keptDesc}
            </p>
          </div>
          {(busy || result) && (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {(Object.keys(t.steps) as UpdateStep[]).map((s) => (
                <li key={s} className="flex items-center gap-2">
                  {steps[s] === 'done' ? (
                    <Check aria-hidden className="size-4 text-xong" />
                  ) : steps[s] === 'running' ? (
                    <Loader2 aria-hidden className="size-4 animate-spin text-xanh" />
                  ) : (
                    <span className="size-4" />
                  )}
                  {t.steps[s]}
                </li>
              ))}
            </ul>
          )}
          {result && !result.ok && result.code !== 'nhoAi' && (
            <div
              role="alert"
              className="rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-sm"
            >
              {t.errors[result.code]}
              <ErrorSnap id={`update-${result.code}`} label={t.errors[result.code]} />
            </div>
          )}
          {result?.ok && (
            <div className="flex items-center gap-2 text-[15px] font-semibold text-xong">
              <Check aria-hidden className="size-5" /> {t.done(result.version)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF1F8] px-6 py-3.5">
          {result?.ok ? (
            <Button size="md" onClick={onClose}>
              {t.close}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>
                {t.later}
              </Button>
              <Button size="md" disabled={busy || !!info.needAppVersion} onClick={() => void go()}>
                {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
                {busy ? t.updating : info.safe ? t.update : t.updateWithAi}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Mo ta day du mot ban: tom tat + tung nhom (chung, tung mon). */
export function ChangelogBody({ entry }: { entry: ChangelogEntry }): React.JSX.Element {
  const empty = !entry.summary && !entry.groups.some((g) => g.moi.length || g.sua.length)
  return (
    <div className="flex flex-col gap-3">
      {entry.summary && (
        <div className="text-sm leading-normal">
          <Markdown text={entry.summary} />
        </div>
      )}
      {entry.groups
        .filter((g) => g.moi.length || g.sua.length)
        .map((g) => (
          <div key={g.name} className="flex flex-col gap-2">
            <h3 className="m-0 text-sm font-bold text-navy">{g.name}</h3>
            {g.moi.length ? <Notes title={t.whatsNew} items={g.moi} /> : null}
            {g.sua.length ? <Notes title={t.fixes} items={g.sua} /> : null}
          </div>
        ))}
      {empty && <p className="m-0 text-sm text-phu">{t.noNotes}</p>}
    </div>
  )
}

function Notes({ title, items }: { title: string; items: string[] }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="m-0 text-[13px] font-bold text-phu">{title}</h2>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[18px] text-sm leading-normal">
        {items.map((it, i) => (
          <li key={i}>
            <Markdown text={it} />
          </li>
        ))}
      </ul>
    </div>
  )
}
