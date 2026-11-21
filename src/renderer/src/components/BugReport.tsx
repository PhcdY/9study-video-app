import { useEffect, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import type { BugStatus, ErrorShot } from '../../../shared/bugs'
import { api, fileUrl, useFeedback } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const t = copy.bug

const STATUS_TONE: Record<BugStatus, string> = {
  moi: 'bg-credit-nen text-credit',
  dangXem: 'bg-cham-nhat text-cham',
  daXuLy: 'bg-xong-nen text-xong'
}

export function BugStatusBadge({ status }: { status: BugStatus }): React.JSX.Element {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', STATUS_TONE[status])}>
      {t.status[status]}
    </span>
  )
}

/** O gui bao loi trong Cai dat > Ho tro: mo ta, anh app tu chup luc loi, gui vao thu muc chung. */
export function BugReportPanel({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [fb] = useFeedback()
  const [desc, setDesc] = useState('')
  const [shots, setShots] = useState<ErrorShot[] | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'fail' | 'saving'>('idle')
  const [zip, setZip] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    void api.invoke('bugs:shots').then((s) => {
      setShots(s)
      // Anh moi nhat chon san
      if (s[0]) setPicked(new Set([s[0].id]))
    })
  }, [])
  const hasDir = !!fb?.dir

  const toggle = (id: string): void => {
    const s = new Set(picked)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setPicked(s)
  }
  const send = async (): Promise<void> => {
    setState('sending')
    const res = await api.invoke('bugs:send', { desc, shotIds: [...picked] })
    setState(res.ok ? 'sent' : 'fail')
  }
  const saveZip = async (): Promise<void> => {
    setState('saving')
    setZip(await api.invoke('app:bugReport'))
    setState('idle')
  }

  if (state === 'sent')
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-xong/25 bg-xong-nen px-5 py-4">
        <span className="flex-1 text-[15px] font-semibold text-xong">{t.sent}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {copy.version.close}
        </Button>
      </div>
    )

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-vien bg-nen px-5 py-[18px]">
      <label htmlFor="bao-loi-mo-ta" className="text-[15px] font-bold">
        {t.descLabel} <span className="font-normal text-phu">{t.optional}</span>
      </label>
      <textarea
        id="bao-loi-mo-ta"
        rows={3}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={t.descPh}
        className="box-border w-full resize-none rounded-[10px] border-[1.5px] border-vien-dam bg-white px-3 py-2.5 text-[15px] outline-none focus:border-cham"
      />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="p-0 pb-2 text-sm font-bold">{t.shotsTitle}</legend>
        {shots === null ? null : shots.length === 0 ? (
          <span className="text-[13px] text-phu">{t.noShots}</span>
        ) : (
          <div className="flex flex-wrap gap-3">
            {shots.map((s) => {
              const on = picked.has(s.id)
              return (
                <label key={s.id} className="flex w-[200px] cursor-pointer flex-col gap-1.5">
                  <span
                    className={cn(
                      'relative block aspect-video overflow-hidden rounded-lg bg-white',
                      on ? 'border-2 border-cham' : 'border border-vien-dam opacity-75'
                    )}
                  >
                    <img
                      src={fileUrl(s.file, s.at)}
                      alt={t.shotAlt(t.time(s.at))}
                      className="size-full object-cover object-top"
                      draggable={false}
                    />
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(s.id)}
                      aria-label={t.shotPick(t.time(s.at))}
                      className="absolute top-1.5 right-1.5 m-0 size-[18px] accent-cham"
                    />
                  </span>
                  <span className="truncate text-xs text-phu" title={s.label}>
                    {t.time(s.at)} · “{s.label}”
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </fieldset>

      <div className="flex items-start gap-2.5 text-[13px] leading-normal text-phu">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>{hasDir ? t.privacy : t.noDir}</span>
      </div>

      {state === 'fail' && (
        <div role="alert" className="rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-sm">
          {t.fail}
        </div>
      )}
      {zip !== undefined && (
        <p className={cn('m-0 text-sm font-semibold', zip ? 'text-xong' : 'text-loi')}>
          {zip ? copy.settings.bugReportDone(zip) : copy.settings.bugReportFail}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button disabled={!hasDir || state === 'sending'} onClick={() => void send()}>
          {state === 'sending' && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {state === 'sending' ? t.sending : t.send}
        </Button>
        <Button variant="ghost" size="md" onClick={onClose}>
          {copy.settings.cancel}
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="ml-auto text-cham"
          disabled={state === 'saving'}
          onClick={() => void saveZip()}
        >
          {state === 'saving' && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {t.saveDesktop}
        </Button>
      </div>
    </div>
  )
}

/** Bao loi may nay da gui, kem trang thai nguoi phu trach dat. */
export function MyBugs(): React.JSX.Element | null {
  const [fb] = useFeedback()
  const mine = (fb?.bugs ?? []).filter((b) => b.machine === fb?.me)
  if (!mine.length) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="pb-1 text-[15px] font-bold">{t.mine(mine.length)}</span>
      {mine.slice(0, 6).map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-3 border-b border-[#EEF1F8] py-2.5 text-sm last:border-b-0"
        >
          <span className="min-w-0 flex-1 truncate">{b.desc || t.noDesc}</span>
          <span className="text-phu tabular-nums">{t.when(b.createdAt)}</span>
          <BugStatusBadge status={b.state.status} />
        </div>
      ))}
    </div>
  )
}
