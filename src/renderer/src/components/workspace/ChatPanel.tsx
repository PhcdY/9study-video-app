import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Image as ImageIcon,
  Loader2,
  MessageCircleQuestion,
  Send,
  Square,
  TriangleAlert,
  Volume2,
  X
} from 'lucide-react'
import type { ApprovalDecision, ChatItem, ChatState, VideoStage } from '../../../../shared/video'
import { STAGE_CHIPS } from '../../../../shared/prompt'
import { withPicks, type Pick, type PickKind } from '../../../../shared/picks'
import { findChoices, type ChoiceOption, type ChoiceQuestion } from '../../../../shared/choices'
import { api, useAiModels } from '@/lib/api'
import { ErrorSnap } from '@/components/ErrorSnap'
import { AiPicker } from '@/components/AiPicker'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Markdown } from './Markdown'
import { LegacyChatList, LegacyTranscript } from '@/components/Legacy'
import type { LegacyChat } from '../../../../shared/legacy'

const c = copy.chat

export function ChatPanel({
  chatKey,
  chat,
  slug,
  stage,
  wide,
  draft,
  picks = [],
  onPicksChange
}: {
  chatKey: string
  chat: ChatState | null
  slug?: string
  stage: VideoStage
  /** Video moi dang do (AI chua tao thu muc video): hien nut Lam tiep */
  draft?: boolean
  /** Chiem het chieu ngang (man tro chuyen rieng, khong co tab ket qua) */
  wide?: boolean
  /** Anh / cau dang chon ben tab ket qua: gan vao loi nhan ke tiep */
  picks?: Pick[]
  onPicksChange?: (p: Pick[]) => void
}): React.JSX.Element {
  const [text, setText] = useState('')
  const [width, setWidth] = useState(readWidth)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const busy = !!chat?.busy
  const items = useMemo(() => chat?.items ?? [], [chat])
  const models = useAiModels()

  // Viec dang cho nguoi dung chon: cot noi canh khung chat, van keo len doc chat ma tra loi duoc
  const approvals = items.filter(
    (i): i is Extract<ChatItem, { kind: 'approval' }> =>
      i.kind === 'approval' && i.state === 'pending'
  )
  const lastItem = items[items.length - 1]
  const ask = useMemo(
    () =>
      !busy && lastItem?.kind === 'ai' && !lastItem.streaming ? findChoices(lastItem.text) : null,
    [busy, lastItem]
  )
  const trayId = approvals[0]?.id ?? (ask ? lastItem?.id : undefined)
  // Thu gon theo tung yeu cau: yeu cau moi thi khay mo lai
  const [collapsedId, setCollapsedId] = useState<string | null>(null)
  const trayOpen = !!trayId && collapsedId !== trayId
  const sectionRef = useRef<HTMLElement>(null)
  const outside = useTrayOutside(sectionRef, !!wide)

  // Tro chuyen cu (truoc khi co app) cua video nay: xem lai, hoac mo tiep cuoc Codex
  const [oldChats, setOldChats] = useState<LegacyChat[]>([])
  const [viewing, setViewing] = useState<LegacyChat | null>(null)
  const [resuming, setResuming] = useState<string | null>(null)
  const [resumeFail, setResumeFail] = useState(false)
  const loadOld = (): void => {
    if (slug) void api.invoke('legacy:chats', slug).then(setOldChats)
  }
  useEffect(loadOld, [slug])
  const resume = async (old: LegacyChat): Promise<void> => {
    setResuming(old.id)
    setResumeFail(false)
    const ok = await api.invoke('legacy:resume', chatKey, old.id)
    setResuming(null)
    if (ok) {
      setViewing(null)
      loadOld()
    } else setResumeFail(true)
  }

  // Tu cuon xuong cuoi khi co noi dung moi (tru khi nguoi dung dang cuon len doc)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [items])

  const send = (): void => {
    const msg = text.trim()
    if (!msg || busy) return
    setText('')
    void api.invoke('chat:send', chatKey, withPicks(msg, picks))
    if (picks.length) onPicksChange?.([])
  }
  const nHinh = picks.filter((p) => p.kind === 'hinh').length
  const nGiong = picks.length - nHinh
  const pick = (q: ChoiceQuestion, opt: ChoiceOption): void => {
    if (busy) return
    const reply = q.yesNo
      ? opt.key === 'co'
        ? c.tray.replyYes
        : c.tray.replyNo
      : c.tray.reply(opt.key, opt.label)
    void api.invoke('chat:send', chatKey, reply)
  }

  return (
    <section
      ref={sectionRef}
      aria-label={c.label}
      style={
        // Luon chua it nhat 700px cho phan ket qua ben phai (day tab khong bi cat)
        wide ? undefined : { width: Math.min(width, Math.max(MIN_W, window.innerWidth - 700)) }
      }
      className={cn(
        'relative flex min-h-0 shrink-0 flex-col bg-white',
        wide ? 'mx-auto w-full max-w-[900px] flex-1 border-x border-vien' : 'border-r border-vien'
      )}
    >
      {!wide && <ResizeHandle width={width} onChange={setWidth} />}
      <LegacyChatList
        chats={oldChats}
        label={copy.legacy.oldChats(oldChats.length)}
        current={viewing?.id}
        onView={(o) => {
          setViewing(o)
          setResumeFail(false)
        }}
        onResume={busy ? undefined : (o) => void resume(o)}
        resuming={resuming}
      />
      {viewing ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-x-hidden overflow-y-auto bg-[#fbfcff] p-5">
          {resumeFail && (
            <p role="alert" className="m-0 text-sm text-loi">
              {copy.legacy.resumeFail}
            </p>
          )}
          <LegacyTranscript chat={viewing} />
        </div>
      ) : (
        <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-5">
          {items.length === 0 && !busy && <p className="m-0 text-sm text-phu">{c.empty}</p>}
          {items.map((it) =>
            it.kind === 'approval' && it.state === 'pending' ? (
              <TrayMarker
                key={it.id}
                label={c.tray.markerApproval}
                outside={outside}
                onClick={() => setCollapsedId(null)}
              />
            ) : (
              <Item key={it.id} item={it} chatKey={chatKey} />
            )
          )}
          {ask && (
            <TrayMarker
              label={c.tray.markerAsk}
              outside={outside}
              onClick={() => setCollapsedId(null)}
            />
          )}
          {busy &&
            !items.some(
              (i) =>
                (i.kind === 'status' && i.state === 'running') || (i.kind === 'ai' && i.streaming)
            ) && <Status label={c.thinking} running />}
        </div>
      )}

      {viewing && (
        <div className="px-5 pt-3 pb-5">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-vien px-3.5 py-2.5">
            <span className="flex-1 text-sm text-phu">{copy.legacy.viewing}</span>
            <Button size="sm" onClick={() => setViewing(null)}>
              {copy.legacy.back}
            </Button>
          </div>
        </div>
      )}

      {!viewing && draft && !busy && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          <button
            type="button"
            onClick={() => void api.invoke('videos:resumeDraft', chatKey)}
            className="h-9 cursor-pointer rounded-full border-[1.5px] border-cham bg-white px-3.5 text-sm font-semibold text-cham hover:bg-cham-nhat"
          >
            {c.resumeDraft}
          </button>
        </div>
      )}

      {!viewing && slug && !busy && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {STAGE_CHIPS[stage].map((chip, i) => (
            <button
              key={chip}
              type="button"
              onClick={() => void api.invoke('chat:chip', chatKey, chip, slug)}
              className={cn(
                'h-9 cursor-pointer rounded-full bg-white px-3.5 text-sm font-semibold',
                i === 0
                  ? 'border-[1.5px] border-cham text-cham hover:bg-cham-nhat'
                  : 'border border-vien-dam text-navy hover:bg-nen'
              )}
            >
              {c.chips[chip]}
            </button>
          ))}
        </div>
      )}

      {!viewing && trayId && (
        <div
          className={cn(
            'absolute z-20 flex max-h-[calc(100%-40px)] flex-col',
            trayOpen ? 'w-[300px]' : 'w-max whitespace-nowrap',
            // Ngoai: canh phai khung chat, de len mep phan ket qua. Khong du cho: noi tren o nhan
            outside
              ? 'bottom-5 left-[calc(100%+12px)]'
              : 'right-4 bottom-[150px] max-w-[calc(100%-32px)]'
          )}
        >
          {!trayOpen ? (
            <button
              type="button"
              onClick={() => setCollapsedId(null)}
              className="flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-cham bg-cham-nhat px-3.5 py-2 text-left text-sm font-semibold text-cham-dam shadow-[0_6px_20px_rgba(14,16,70,0.14)] hover:bg-[#e2e5fd]"
            >
              <MessageCircleQuestion aria-hidden className="size-4 shrink-0" />
              <span className="flex-1">
                {approvals.length ? c.tray.collapsedApproval : c.tray.collapsedAsk}
              </span>
              <span className="text-[13px] font-semibold">{c.tray.expand}</span>
              <ChevronUp aria-hidden className="size-4 shrink-0" />
            </button>
          ) : approvals.length ? (
            <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-xl shadow-[0_6px_20px_rgba(14,16,70,0.14)]">
              <ApprovalCard
                item={approvals[0]}
                chatKey={chatKey}
                onCollapse={() => setCollapsedId(trayId)}
              />
              {approvals.length > 1 && (
                <p className="m-0 rounded-lg bg-white px-2 py-1 text-[13px] text-phu">
                  {c.tray.more(approvals.length - 1)}
                </p>
              )}
            </div>
          ) : (
            ask && (
              <ChoiceCard
                q={ask}
                onPick={(o) => pick(ask, o)}
                onCollapse={() => setCollapsedId(trayId)}
                onType={() => inputRef.current?.focus()}
              />
            )
          )}
        </div>
      )}

      <div className={cn('px-5 pb-5', viewing && 'hidden')}>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-[10px] border-[1.5px] py-2 pr-2 pl-3 focus-within:border-cham',
            picks.length ? 'border-cham' : 'border-vien-dam'
          )}
        >
          {picks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-phu">{c.picking}</span>
              {picks.map((p) => (
                <span
                  key={`${p.kind}-${p.id}`}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-cham-nhat pr-1 pl-2.5 text-[13px] font-bold text-cham"
                >
                  <PickIcon kind={p.kind} />
                  <span className="sr-only">{c.pickKind[p.kind]}</span>
                  {p.label}
                  <button
                    type="button"
                    aria-label={c.unpick(p.label)}
                    onClick={() => onPicksChange?.(picks.filter((x) => x !== p))}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-white"
                  >
                    <X aria-hidden className="size-3.5" strokeWidth={2.4} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="nhan-ai" className="sr-only">
              {c.label}
            </label>
            <textarea
              ref={inputRef}
              id="nhan-ai"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={picks.length ? c.pickPlaceholder(nHinh, nGiong) : c.placeholder}
              className="flex-1 resize-none border-none bg-transparent text-[15px] leading-normal outline-none"
            />
            {busy ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => void api.invoke('chat:interrupt', chatKey)}
              >
                <Square aria-hidden className="size-4" /> {c.stop}
              </Button>
            ) : (
              <button
                type="button"
                aria-label={c.send}
                disabled={!text.trim()}
                onClick={send}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-cham disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send aria-hidden className="size-[18px] text-white" />
              </button>
            )}
          </div>
        </div>
        {nGiong > 0 && (
          <p className="m-0 mt-2 px-0.5 text-xs leading-normal text-credit">{c.pickCost}</p>
        )}
        {chat && (
          <div className="mt-2">
            <AiPicker
              models={models}
              value={chat.ai}
              onChange={(choice) => void api.invoke('chat:setAi', chatKey, choice)}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function Item({ item, chatKey }: { item: ChatItem; chatKey: string }): React.JSX.Element {
  switch (item.kind) {
    case 'user':
      return (
        <div className="flex max-w-[85%] flex-col items-end gap-1.5 self-end">
          {item.picks?.length ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {item.picks.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-vien-dam bg-white px-2.5 text-xs font-bold text-cham"
                >
                  <PickIcon kind={p.kind} small />
                  <span className="sr-only">{c.pickKind[p.kind]}</span>
                  {p.label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="rounded-[10px_14px_4px_14px] bg-cham-nhat px-3.5 py-2.5 text-[15px] leading-normal whitespace-pre-wrap">
            {item.text}
          </div>
        </div>
      )
    case 'ai':
      return <Markdown text={item.text || '…'} />
    case 'status': {
      const label = c.status[item.label]
      if (item.state === 'running') return <Status label={`${label}…`} running />
      if (item.state === 'failed') return <Status label={c.statusFailed(label)} warn />
      return <Status label={c.statusDone(label, item.count)} />
    }
    case 'approval':
      return <ApprovalCard item={item} chatKey={chatKey} />
    case 'error':
      return (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] border border-loi/30 bg-loi-nen px-3.5 py-3 text-sm"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-loi" />
          {c.errors[item.code]}
          <ErrorSnap id={`chat-${item.id}`} label={c.errors[item.code]} />
        </div>
      )
  }
}

function PickIcon({ kind, small }: { kind: PickKind; small?: boolean }): React.JSX.Element {
  const Icon = kind === 'hinh' ? ImageIcon : Volume2
  return <Icon aria-hidden className={small ? 'size-[13px]' : 'size-3.5'} strokeWidth={2.2} />
}

/** Cau hoi lua chon cua AI, ghim tren o nhan: bam la gui luon. */
function ChoiceCard({
  q,
  onPick,
  onCollapse,
  onType
}: {
  q: ChoiceQuestion
  onPick: (o: ChoiceOption) => void
  onCollapse: () => void
  onType: () => void
}): React.JSX.Element {
  const options: ChoiceOption[] = q.yesNo
    ? [
        { key: 'co', label: c.tray.yes },
        { key: 'khong', label: c.tray.no }
      ]
    : q.options
  return (
    <div
      role="group"
      aria-label={c.tray.ask}
      className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-xl border-[1.5px] border-cham bg-white px-3.5 py-3 shadow-[0_6px_20px_rgba(14,16,70,0.14)]"
    >
      <div className="flex items-center gap-2 text-[13px] font-bold text-cham-dam">
        <MessageCircleQuestion aria-hidden className="size-4 shrink-0" />
        <span className="flex-1">{c.tray.ask}</span>
        <CollapseButton onClick={onCollapse} />
      </div>
      <div className="text-[15px] leading-normal font-semibold">{q.question}</div>
      {q.yesNo ? (
        <div className="flex flex-wrap gap-2">
          {options.map((o, i) => (
            <Button
              key={o.key}
              size="md"
              variant={i === 0 ? undefined : 'outline'}
              onClick={() => onPick(o)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => onPick(o)}
              className="flex w-full cursor-pointer items-start gap-2.5 rounded-[10px] border border-vien-dam bg-nen px-3 py-2 text-left hover:border-cham hover:bg-cham-nhat focus-visible:border-cham"
            >
              <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-cham-nhat text-xs font-bold text-cham-dam">
                {o.key}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-snug">
                <span className="font-semibold text-navy">{o.label}</span>
                {o.detail && <span className="block text-[13px] text-phu">{o.detail}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onType}
        className="cursor-pointer self-start border-none bg-transparent p-0 text-[13px] text-phu underline-offset-2 hover:underline"
      >
        {c.tray.hint}
      </button>
    </div>
  )
}

function CollapseButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={c.tray.collapse}
      title={c.tray.collapse}
      className="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-phu hover:bg-nen"
    >
      <ChevronDown aria-hidden className="size-4" />
    </button>
  )
}

/** Dau nho trong cuoc tro chuyen: viec nay dang cho o cot lua chon. */
function TrayMarker({
  label,
  outside,
  onClick
}: {
  label: string
  outside: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 self-start rounded-full border-none bg-cham-nhat px-3 py-1 text-[13px] font-semibold text-cham-dam hover:bg-[#e2e5fd]"
    >
      {label}
      {outside ? (
        <ArrowRight aria-hidden className="size-3.5" />
      ) : (
        <MessageCircleQuestion aria-hidden className="size-3.5" />
      )}
    </button>
  )
}

function Status({
  label,
  running,
  warn
}: {
  label: string
  running?: boolean
  warn?: boolean
}): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] bg-nen px-3 py-2 text-[13px] text-phu"
      role={running ? 'status' : undefined}
    >
      {running ? (
        <Loader2 aria-hidden className="size-4 animate-spin text-xanh" />
      ) : warn ? (
        <TriangleAlert aria-hidden className="size-4 text-credit" />
      ) : (
        <Check aria-hidden className="size-4 text-xong" strokeWidth={2.4} />
      )}
      {label}
    </div>
  )
}

function ApprovalCard({
  item,
  chatKey,
  onCollapse
}: {
  item: Extract<ChatItem, { kind: 'approval' }>
  chatKey: string
  /** Dang nam trong khay tren o nhan: co nut thu gon */
  onCollapse?: () => void
}): React.JSX.Element {
  const pending = item.state === 'pending'
  const title =
    item.title === 'congCu' && item.label
      ? c.approvalTool(c.status[item.label])
      : c.approval[item.title]
  const answer = (d: ApprovalDecision): void => void api.invoke('chat:approve', chatKey, item.id, d)
  return (
    <div
      role="group"
      aria-label={title}
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border-[1.5px] px-4 py-3.5',
        item.costly ? 'border-[#F2C38B] bg-[#FFF8EF]' : 'border-vien-dam bg-nen'
      )}
    >
      {item.costly && (
        <div className="flex items-center gap-2 text-[13px] font-bold text-credit">
          <CircleAlert aria-hidden className="size-4" /> {c.costly}
          {onCollapse && <CollapseButton onClick={onCollapse} />}
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1 text-base font-bold">{title}</div>
        {onCollapse && !item.costly && <CollapseButton onClick={onCollapse} />}
      </div>
      {item.command && (
        <code className="block rounded-md bg-white px-2.5 py-2 font-mono text-xs break-all text-navy">
          {item.command}
        </code>
      )}
      {item.estimate && (
        <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold">
          {copy.estimate(item.estimate.lines, item.estimate.chars)}
        </div>
      )}
      {item.costly && <div className="text-[13px] leading-normal text-phu">{c.costlyHint}</div>}
      {pending ? (
        <div className="flex flex-wrap gap-2">
          <Button size="md" onClick={() => answer('accept')}>
            {c.accept}
          </Button>
          {/* Viec ton credit hay lenh la: luon hoi tung lan */}
          {!item.costly && item.title !== 'lenhLa' && (
            <Button variant="outline" size="md" onClick={() => answer('acceptForSession')}>
              {c.acceptAlways}
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={() => answer('decline')}>
            {c.decline}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'text-sm font-semibold',
            item.state === 'declined' ? 'text-phu' : 'text-xong'
          )}
        >
          {item.state === 'accepted'
            ? c.accepted
            : item.state === 'acceptedForSession'
              ? c.acceptedAlways
              : c.declined}
        </div>
      )}
    </div>
  )
}

// ---------- cot lua chon: dat ben phai khung chat neu du cho ----------

const TRAY_SPACE = 300 + 24

/** Man video: luon co phan ket qua ben phai. Man chi co chat: do khoang trong ben phai. */
function useTrayOutside(ref: React.RefObject<HTMLElement | null>, wide: boolean): boolean {
  const [roomy, setRoomy] = useState(false)
  useEffect(() => {
    if (!wide) return
    // Goi lai ngay luc bat dau quan sat va moi khi cua so doi kich thuoc
    const ro = new ResizeObserver(() => {
      const el = ref.current
      if (el) setRoomy(window.innerWidth - el.getBoundingClientRect().right >= TRAY_SPACE)
    })
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [ref, wide])
  return !wide || roomy
}

// ---------- keo doi do rong khung chat ----------

const WIDTH_KEY = 'do-rong-khung-chat'
const MIN_W = 340
const MAX_W = 900

function readWidth(): number {
  try {
    const n = Number(localStorage.getItem(WIDTH_KEY))
    return n >= MIN_W && n <= MAX_W ? n : 440
  } catch {
    return 440
  }
}

function ResizeHandle({
  width,
  onChange
}: {
  width: number
  onChange: (w: number) => void
}): React.JSX.Element {
  const start = (e: React.PointerEvent<HTMLDivElement>): void => {
    const x0 = e.clientX
    const w0 = width
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent): void =>
      onChange(Math.max(MIN_W, Math.min(MAX_W, w0 + ev.clientX - x0)))
    const up = (ev: PointerEvent): void => {
      el.releasePointerCapture(ev.pointerId)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      try {
        localStorage.setItem(
          WIDTH_KEY,
          String(Math.max(MIN_W, Math.min(MAX_W, w0 + ev.clientX - x0)))
        )
      } catch {
        // khong luu duoc thi thoi
      }
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={copy.chatResize}
      aria-valuenow={width}
      aria-valuemin={MIN_W}
      aria-valuemax={MAX_W}
      tabIndex={0}
      onPointerDown={start}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(Math.max(MIN_W, width - 40))
        if (e.key === 'ArrowRight') onChange(Math.min(MAX_W, width + 40))
      }}
      title={copy.chatResize}
      className="absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize hover:bg-cham/15 focus-visible:bg-cham/20"
    />
  )
}
