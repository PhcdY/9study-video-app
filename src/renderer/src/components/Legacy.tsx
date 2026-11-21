import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import type {
  LegacyChat,
  LegacyMessage,
  LegacyOptions,
  LegacyResult,
  LegacyScan
} from '../../../shared/legacy'
import { api, useLegacyScan } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/workspace/Markdown'

const t = copy.legacy

function Row({
  title,
  sub,
  badge,
  ok,
  checked,
  onChange
}: {
  title: string
  sub: string
  badge?: string
  ok?: boolean
  checked?: boolean
  onChange?: (v: boolean) => void
}): React.JSX.Element {
  const box = onChange ? (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="m-0 mt-0.5 size-5 shrink-0 accent-cham"
    />
  ) : (
    <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-xong" />
  )
  return (
    <label
      className={cn(
        'flex items-start gap-3.5 border-b border-[#eef1f8] px-[18px] py-[15px] last:border-b-0',
        onChange && 'cursor-pointer hover:bg-nen'
      )}
    >
      {box}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <b className="text-[15px]">{title}</b>
        <span className="text-[13px] leading-[1.45] text-phu">{sub}</span>
      </span>
      {badge && (
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold',
            ok ? 'bg-xong-nen text-xong' : 'bg-cham-nhat text-cham'
          )}
        >
          {badge}
        </span>
      )}
    </label>
  )
}

/**
 * Danh sach du lieu cu tim thay, nguoi dung chon nhan gi.
 * mode 'setup': ca bo cong cu duoc chep / dung luon (video va key luon nhan).
 * mode 'settings': chi nhan them vao thu muc dang dung.
 */
export function LegacyChoices({
  scan,
  progress,
  mode,
  busy,
  onTake,
  children
}: {
  scan: LegacyScan | null | undefined
  progress: { done: number; total: number } | null
  mode: 'setup' | 'settings'
  busy?: boolean
  onTake: (opts: LegacyOptions) => void
  children?: React.ReactNode
}): React.JSX.Element {
  const [opts, setOpts] = useState<LegacyOptions>({
    videos: true,
    key: true,
    chats: true,
    voice: true
  })
  const set = (k: keyof LegacyOptions) => (v: boolean) => setOpts((o) => ({ ...o, [k]: v }))

  if (scan === undefined)
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-vien px-[18px] py-4">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Loader2 aria-hidden className="size-4 animate-spin text-cham" /> {t.scanning}
        </span>
        {progress && progress.total > 0 && (
          <span className="text-[13px] text-phu">{t.scanned(progress.done, progress.total)}</span>
        )}
      </div>
    )
  if (scan === null)
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[15px] text-loi">{t.scanFail}</p>
        {children}
      </div>
    )

  const codex = scan.chats.filter((c) => c.source === 'codex').length
  const claude = scan.chats.length - codex
  const empty = !scan.ownVideos && !scan.hasKey && !scan.chats.length && !scan.voice.runs
  const setupMode = mode === 'setup'

  return (
    <div className="flex flex-col gap-5">
      {empty ? (
        <p className="m-0 text-[15px] text-phu">{t.nothing}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-vien">
          {scan.ownVideos > 0 && (
            <Row
              title={setupMode ? t.videos(scan.ownVideos) : t.copyVideos}
              sub={t.videosSub(scan.unfinished)}
              badge={setupMode ? t.size(scan.sizeBytes) : t.videos(scan.ownVideos)}
              checked={opts.videos}
              onChange={setupMode ? undefined : set('videos')}
            />
          )}
          {scan.hasKey && (
            <Row
              title={t.key}
              sub={t.keySub}
              badge={t.keyHave}
              ok
              checked={opts.key}
              onChange={setupMode ? undefined : set('key')}
            />
          )}
          {scan.chats.length > 0 && (
            <Row
              title={t.chats(scan.chats.length)}
              sub={t.chatsSub(codex, claude)}
              checked={opts.chats}
              onChange={set('chats')}
            />
          )}
          {scan.voice.runs > 0 && (
            <Row
              title={t.voice}
              sub={t.voiceSub(scan.voice.runs, scan.voice.since)}
              badge={t.chars(scan.voice.chars)}
              checked={opts.voice}
              onChange={set('voice')}
            />
          )}
        </div>
      )}

      {setupMode && scan.needsCopy && (
        <div className="flex items-start gap-3 rounded-[10px] bg-credit-nen px-3.5 py-3 text-sm leading-[1.45]">
          <AlertTriangle aria-hidden className="mt-0.5 size-[18px] shrink-0 text-credit" />
          <span>{t.copyWarn(scan.target)}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button size={setupMode ? 'lg' : 'md'} disabled={busy} onClick={() => onTake(opts)}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {t.take}
        </Button>
        {children}
      </div>
    </div>
  )
}

export function LegacyResultTiles({ result }: { result: LegacyResult }): React.JSX.Element {
  const tile = (big: string, label: string): React.JSX.Element => (
    <div className="rounded-[10px] bg-nen px-3.5 py-3">
      <b className="text-[22px]">{big}</b>
      <div className="text-[13px] text-phu">{label}</div>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tile(String(result.videos), t.tileVideos)}
      {tile(String(result.chats), t.tileChats)}
      {tile(result.chars.toLocaleString('vi-VN'), t.tileChars)}
      {tile(result.key ? t.keyHave : t.keyNone, t.tileKey)}
    </div>
  )
}

const ddmm = (ms: number): string => {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Danh sach tro chuyen cu (gap mo duoc). */
export function LegacyChatList({
  chats,
  label,
  current,
  onView,
  onResume,
  resuming
}: {
  chats: LegacyChat[]
  label: string
  current?: string
  onView: (c: LegacyChat) => void
  onResume?: (c: LegacyChat) => void
  resuming?: string | null
}): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  if (!chats.length) return null
  return (
    <div className="border-b border-vien">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm font-bold hover:bg-nen"
      >
        <ChevronDown
          aria-hidden
          className={cn('size-4 text-phu transition-transform', !open && '-rotate-90')}
        />
        {label}
      </button>
      {open && (
        <ul className="m-0 flex max-h-64 list-none flex-col overflow-y-auto px-2 pb-2">
          {chats.map((c) => (
            <li
              key={c.id}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2',
                current === c.id ? 'bg-cham-nhat' : 'hover:bg-nen'
              )}
            >
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                  c.source === 'codex' ? 'bg-xong-nen text-xong' : 'bg-[#f1f3fa] text-[#3d4466]'
                )}
              >
                {t.source[c.source]}
              </span>
              <button
                type="button"
                onClick={() => onView(c)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm"
                title={c.title}
              >
                {c.title}
              </button>
              <span className="shrink-0 text-xs text-phu tabular-nums">{ddmm(c.startedAt)}</span>
              {onResume && c.source === 'codex' && c.threadId && (
                <button
                  type="button"
                  disabled={!!resuming}
                  onClick={() => onResume(c)}
                  className="shrink-0 cursor-pointer text-[13px] font-bold text-cham disabled:opacity-50"
                >
                  {resuming === c.id ? t.resuming : t.resume}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Xem lai mot cuoc tro chuyen cu (chi doc). */
export function LegacyTranscript({ chat }: { chat: LegacyChat }): React.JSX.Element {
  const [msgs, setMsgs] = useState<LegacyMessage[] | null>(null)
  useEffect(() => {
    let on = true
    void api.invoke('legacy:transcript', chat.id).then((m) => on && setMsgs(m))
    return () => {
      on = false
    }
  }, [chat.id])
  return (
    <div className="flex flex-col gap-3">
      <div className="self-center rounded-full bg-[#f1f3fa] px-3 py-1 text-xs font-semibold text-phu">
        {t.viewOnly(t.source[chat.source], ddmm(chat.startedAt))}
      </div>
      {msgs === null && (
        <Loader2 aria-hidden className="size-5 animate-spin self-center text-phu" />
      )}
      {msgs?.map((m, i) =>
        m.role === 'user' ? (
          <div
            key={i}
            className="max-w-[85%] self-end rounded-xl bg-cham-nhat px-3.5 py-2.5 text-sm leading-normal break-words whitespace-pre-wrap"
          >
            {m.text}
          </div>
        ) : (
          <div key={i} className="max-w-[92%] min-w-0 text-sm leading-[1.55] break-words">
            <Markdown text={m.text} />
          </div>
        )
      )}
    </div>
  )
}

/** Cai dat › Thu muc: nhan du lieu tu bo cong cu cu khac, va xem tro chuyen cu chung. */
export function LegacySettings({ projectDir }: { projectDir: string }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [dirs, setDirs] = useState<string[]>([])
  const [dir, setDir] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<LegacyResult | null>(null)
  const [general, setGeneral] = useState<LegacyChat[]>([])
  const [viewing, setViewing] = useState<LegacyChat | null>(null)
  const { scan, progress } = useLegacyScan(dir || undefined, open && !!dir)

  useEffect(() => {
    void api.invoke('legacy:chats', '').then(setGeneral)
  }, [projectDir, result])
  useEffect(() => {
    if (!open) return
    let on = true
    void api.invoke('legacy:findDirs').then((d) => {
      if (!on) return
      setDirs(d)
      setDir((cur) => cur || d[0] || '')
    })
    return () => {
      on = false
    }
  }, [open])

  const browse = async (): Promise<void> => {
    const p = await api.invoke('dialog:pickFolder', dir || projectDir)
    if (p) {
      setDirs((d) => (d.includes(p) ? d : [p, ...d]))
      setDir(p)
      setResult(null)
    }
  }
  const take = async (opts: LegacyOptions): Promise<void> => {
    setBusy(true)
    setResult(await api.invoke('legacy:import', dir, opts))
    setBusy(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#EEF1F8] py-4 last:border-b-0">
        <div className="min-w-0 flex-[1_1_280px] text-[15px] font-bold">{t.settingsRow}</div>
        {!open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t.settingsOpen}
          </Button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-b border-[#EEF1F8] pt-1 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="thu-muc-cu">
              {t.settingsPick}
            </label>
            <select
              id="thu-muc-cu"
              value={dir}
              onChange={(e) => {
                setDir(e.target.value)
                setResult(null)
              }}
              className="h-10 min-w-0 flex-[1_1_320px] rounded-lg border-[1.5px] border-vien-dam bg-white px-2.5 text-sm"
            >
              {!dirs.length && <option value="">{t.settingsPick}</option>}
              {dirs.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void browse()}>
              {t.settingsBrowse}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t.close}
            </Button>
          </div>
          {dir &&
            (result ? (
              <div className="flex flex-col gap-3">
                <b className="flex items-center gap-2 text-[15px] text-xong">
                  <CheckCircle2 aria-hidden className="size-5" /> {t.doneTitle}
                </b>
                <LegacyResultTiles result={result} />
              </div>
            ) : (
              <LegacyChoices
                scan={scan}
                progress={progress}
                mode="settings"
                busy={busy}
                onTake={(o) => void take(o)}
              />
            ))}
        </div>
      )}
      {general.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-vien">
          <LegacyChatList
            chats={general}
            label={t.generalChats(general.length)}
            current={viewing?.id}
            onView={setViewing}
          />
          {viewing && (
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto bg-[#fbfcff] p-4">
              <LegacyTranscript chat={viewing} />
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setViewing(null)}
              >
                {t.close}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
