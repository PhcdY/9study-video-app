import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Lock, X } from 'lucide-react'
import type { AddImageResult, BugStatus, ErrorShot } from '../../../shared/bugs'
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
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        STATUS_TONE[status]
      )}
    >
      {t.status[status]}
    </span>
  )
}

/** File anh trong lan dan / keo tha (bo qua chu, file khac van dua vao de bao "khong phai anh"). */
function filesOf(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : []
}

/** O gui bao loi trong Cai dat > Ho tro: mo ta, anh app tu chup luc loi, anh tu may, gui vao thu muc chung. */
export function BugReportPanel({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [fb] = useFeedback()
  const [desc, setDesc] = useState('')
  const [shots, setShots] = useState<ErrorShot[] | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'fail' | 'saving'>('idle')
  const [zip, setZip] = useState<string | null | undefined>(undefined)
  const [added, setAdded] = useState<ErrorShot[]>([])
  const [adding, setAdding] = useState(false)
  const [addErr, setAddErr] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    void api.invoke('bugs:shots').then((s) => {
      setShots(s)
      // Anh moi nhat chon san
      if (s[0]) setPicked(new Set([s[0].id]))
    })
  }, [])
  const hasDir = !!fb?.dir

  // Chi dung ham set state nen giu nguyen qua cac lan ve
  const addFiles = useCallback(async (files: File[]): Promise<void> => {
    if (!files.length) return
    setAdding(true)
    setAddErr(null)
    for (const f of files) {
      let res: AddImageResult
      try {
        res = await api.invoke(
          'bugs:addImage',
          f.name,
          f.type,
          new Uint8Array(await f.arrayBuffer())
        )
      } catch {
        res = { ok: false, code: 'loi' }
      }
      if (res.ok) {
        const shot = res.shot
        setAdded((a) => [...a, shot])
      } else {
        setAddErr(t.addFail[res.code](f.name || 'ảnh'))
        if (res.code === 'quaNhieu') break
      }
    }
    setAdding(false)
  }, [])
  const removeAdded = (id: string): void => {
    setAdded((a) => a.filter((s) => s.id !== id))
    void api.invoke('bugs:removeImage', id)
  }

  // Dan anh (Ctrl+V) khi o bao loi dang mo; dan chu vao o mo ta van binh thuong
  useEffect(() => {
    const onPaste = (e: ClipboardEvent): void => {
      const files = filesOf(e.clipboardData?.files).filter((f) => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      void addFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addFiles])

  const toggle = (id: string): void => {
    const s = new Set(picked)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setPicked(s)
  }
  const send = async (): Promise<void> => {
    setState('sending')
    const res = await api.invoke('bugs:send', {
      desc,
      shotIds: [...picked, ...added.map((s) => s.id)]
    })
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

      <fieldset
        className={cn(
          'm-0 flex flex-col gap-2 rounded-lg border-0 p-0',
          dragOver && 'outline-2 outline-offset-4 outline-cham outline-dashed'
        )}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void addFiles(filesOf(e.dataTransfer.files))
        }}
      >
        <legend className="p-0 pb-1 text-sm font-bold">{t.shotsTitle}</legend>
        <span className="pb-1 text-[13px] text-phu">{t.shotsSub}</span>
        <div className="flex flex-wrap gap-3">
          {(shots ?? []).map((s) => {
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
          {added.map((s) => (
            <div key={s.id} className="flex w-[200px] flex-col gap-1.5">
              <span className="relative block aspect-video overflow-hidden rounded-lg border-2 border-cham bg-white">
                <img
                  src={fileUrl(s.file, s.at)}
                  alt={s.label}
                  className="size-full object-cover object-top"
                  draggable={false}
                />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-cham-nhat px-2 py-0.5 text-[11px] font-bold text-cham-dam">
                  {t.yourImage}
                </span>
                <button
                  type="button"
                  onClick={() => removeAdded(s.id)}
                  aria-label={t.removeImage(s.label)}
                  title={t.removeImage(s.label)}
                  className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full border border-vien-dam bg-white hover:bg-nen"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </span>
              <span className="truncate text-xs text-phu" title={s.label}>
                {s.label}
              </span>
            </div>
          ))}
          <button
            type="button"
            disabled={adding}
            onClick={() => fileInput.current?.click()}
            className="flex aspect-video w-[200px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-vien-dam bg-white p-2 text-center hover:border-cham disabled:cursor-wait"
          >
            {adding ? (
              <Loader2 aria-hidden className="size-6 animate-spin text-cham" />
            ) : (
              <ImagePlus aria-hidden className="size-6 text-cham" />
            )}
            <span className="text-sm font-bold text-cham">{adding ? t.adding : t.addImage}</span>
            <span className="text-[11px] text-phu">{t.addImageSub}</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            multiple
            hidden
            onChange={(e) => {
              const files = filesOf(e.target.files)
              e.target.value = ''
              void addFiles(files)
            }}
          />
        </div>
        {addErr && (
          <div
            role="alert"
            className="rounded-lg border border-loi/30 bg-loi-nen px-3 py-2 text-[13px] text-loi"
          >
            {addErr}
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
