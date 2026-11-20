import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, FileText, Paperclip, X } from 'lucide-react'
import type { Lesson, NewVideoInput, SubjectId } from '../../../shared/video'
import { EXAMS, SUBJECTS, VOICES, subjectName, suggestedVoice } from '../../../shared/prompt'
import { api, useVideos } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card as UiCard,
  CardTitle,
  Eyebrow,
  Hint,
  Input,
  Page,
  PageTitle,
  PathText,
  Pill,
  Textarea
} from '@/components/ui/layout'

const t = copy.newVideo
const MEMORY_KEY = 'lam-video-moi'

/** Lua chon nho cho lan sau (moi may mot ban, khong can dong bo). */
function remembered(): Partial<NewVideoInput> {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? '{}')
  } catch {
    return {}
  }
}
function remember(v: NewVideoInput): void {
  try {
    const { subject, lop, voice, exams, doDai, moDau } = v
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ subject, lop, voice, exams, doDai, moDau }))
  } catch {
    // khong luu duoc thi thoi
  }
}

export function NewVideoScreen({
  onCancel,
  onCreated
}: {
  onCancel: () => void
  onCreated: (key: string) => void
}): React.JSX.Element {
  const mem = remembered()
  const [v, setV] = useState<NewVideoInput>({
    subject: 'toan',
    lop: 12,
    loai: 'baiHoc',
    bai: '',
    voice: suggestedVoice((mem.subject as SubjectId) ?? 'toan'),
    exams: ['THPTQG'],
    moDau: 'aiChon',
    doDai: 'ai',
    ...mem
  })
  const set = <K extends keyof NewVideoInput>(k: K, val: NewVideoInput[K]): void =>
    setV((old) => ({ ...old, [k]: val }))
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [otherBai, setOtherBai] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const videos = useVideos()

  useEffect(() => {
    let alive = true
    void api.invoke('videos:lessons', v.subject, v.lop).then((l) => alive && setLessons(l))
    return () => {
      alive = false
    }
  }, [v.subject, v.lop])

  const pickSubject = (id: SubjectId): void =>
    setV((old) => ({
      ...old,
      subject: id,
      voice: suggestedVoice(id),
      bai: '',
      lessonFile: undefined
    }))

  const submit = async (): Promise<void> => {
    if (!v.bai.trim()) {
      setError(v.loai === 'baiHoc' ? t.needBai : t.needCauHoi)
      return
    }
    setBusy(true)
    remember(v)
    const key = await api.invoke('videos:create', v)
    onCreated(key)
  }

  const pickFiles = async (): Promise<void> => {
    const files = await api.invoke('dialog:pickFiles')
    if (files.length) set('attachments', [...new Set([...(v.attachments ?? []), ...files])])
  }

  return (
    <Page className="flex-row flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-fit cursor-pointer items-center gap-1.5 p-0 text-[15px] font-semibold text-cham hover:text-cham-dam"
          >
            <ChevronLeft aria-hidden className="size-4" /> {t.back}
          </button>
          <PageTitle>{t.title}</PageTitle>
        </div>

        {/* 1. Video ve bai nao */}
        <Card n={1} title={t.part1}>
          <Field label={t.subject}>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Pill key={s.id} on={v.subject === s.id} onClick={() => pickSubject(s.id)}>
                  {s.short}
                </Pill>
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap gap-6">
            <Field label={t.lop}>
              <div className="flex gap-2">
                {([10, 11, 12] as const).map((l) => (
                  <LopButton key={l} on={v.lop === l} onClick={() => set('lop', l)}>
                    {l}
                  </LopButton>
                ))}
              </div>
            </Field>
            <Field label={t.loai}>
              <div className="flex flex-wrap gap-2">
                <Choice
                  on={v.loai === 'baiHoc'}
                  onClick={() => set('loai', 'baiHoc')}
                  title={t.baiHoc}
                  hint={t.baiHocHint}
                />
                <Choice
                  on={v.loai === 'hienTuong'}
                  onClick={() => set('loai', 'hienTuong')}
                  title={t.hienTuong}
                  hint={t.hienTuongHint}
                />
              </div>
            </Field>
          </div>
          {v.loai === 'baiHoc' ? (
            <Field label={t.bai}>
              {lessons.length > 0 && !otherBai ? (
                <select
                  value={v.lessonFile ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '__khac') {
                      setOtherBai(true)
                      setV((o) => ({ ...o, bai: '', lessonFile: undefined }))
                      return
                    }
                    const l = lessons.find((x) => x.file === e.target.value)
                    setV((o) => ({ ...o, bai: l?.title ?? '', lessonFile: l?.file }))
                    setError('')
                  }}
                  className="h-12 cursor-pointer rounded-lg border-[1.5px] border-vien-dam bg-white px-3.5 text-base outline-none focus:border-cham"
                >
                  <option value="">{t.baiPick}</option>
                  {lessons.map((l) => (
                    <option key={l.file} value={l.file}>
                      {l.title}
                    </option>
                  ))}
                  <option value="__khac">{t.baiOther}</option>
                </select>
              ) : (
                <TextInput
                  value={v.bai}
                  onChange={(x) => (set('bai', x), setError(''))}
                  placeholder={t.baiPlaceholder}
                />
              )}
              {v.bai && (
                <Hint tone={v.lessonFile ? 'ok' : 'muted'}>
                  {v.lessonFile ? t.hasCard : t.noCard}
                </Hint>
              )}
            </Field>
          ) : (
            <Field label={t.cauHoi}>
              <TextInput
                value={v.bai}
                onChange={(x) => (set('bai', x), setError(''))}
                placeholder={t.cauHoiPlaceholder}
              />
            </Field>
          )}
          <Field label={t.yBanChat} hint={t.yBanChatHint}>
            <TextArea value={v.yBanChat} onChange={(x) => set('yBanChat', x)} />
          </Field>
        </Card>

        {/* 2. Giong doc */}
        <Card n={2} title={t.part2} aside={t.part2Hint}>
          <div className="flex flex-col gap-2">
            {VOICES.map((voice) => {
              const on = v.voice === voice.id
              return (
                <label
                  key={voice.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3',
                    on ? 'border-cham bg-cham-nhat' : 'border-vien-dam bg-white'
                  )}
                >
                  <input
                    type="radio"
                    name="giong"
                    className="size-4 accent-cham"
                    checked={on}
                    onChange={() => set('voice', voice.id)}
                  />
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">{voice.id}</span>
                    <span className="text-[13px] text-phu">{t.voiceDesc[voice.id]}</span>
                  </span>
                  {voice.id === suggestedVoice(v.subject) && (
                    <span className="ml-auto rounded-full bg-xong-nen px-2 py-0.5 text-xs font-semibold text-xong">
                      {t.voiceSuggested(subjectName(v.subject))}
                    </span>
                  )}
                </label>
              )
            })}
            <Field label={t.voiceOther}>
              <TextInput
                value={VOICES.some((x) => x.id === v.voice) ? '' : v.voice}
                onChange={(x) => set('voice', x || suggestedVoice(v.subject))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-cham"
                checked={!!v.voicePerScene}
                onChange={(e) => set('voicePerScene', e.target.checked)}
              />
              {t.voicePerScene}
            </label>
          </div>
        </Card>

        {/* 3. Nang cao */}
        <details className="group rounded-xl border border-vien bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-5">
            <StepNo n={3} />
            <span className="flex flex-col">
              <span className="text-lg font-bold">{t.part3}</span>
              <span className="text-[13px] text-phu">{t.part3Hint}</span>
            </span>
            <ChevronDown
              aria-hidden
              className="ml-auto size-5 text-phu transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="flex flex-col gap-6 border-t border-vien px-6 py-5">
            <Group title={t.viewer}>
              <Field label={t.exams}>
                <div className="flex flex-wrap gap-2">
                  {EXAMS.map((e) => (
                    <Pill
                      key={e}
                      size="sm"
                      on={v.exams.includes(e)}
                      onClick={() =>
                        set(
                          'exams',
                          v.exams.includes(e) ? v.exams.filter((x) => x !== e) : [...v.exams, e]
                        )
                      }
                    >
                      {e}
                    </Pill>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t.daHoc}>
                  <TextArea value={v.daHoc} onChange={(x) => set('daHoc', x)} />
                </Field>
                <Field label={t.chuaHoc}>
                  <TextArea value={v.chuaHoc} onChange={(x) => set('chuaHoc', x)} />
                </Field>
              </div>
              <Hint>{t.studentHint}</Hint>
              <Field label={t.videoTruoc} hint={t.videoTruocHint}>
                <select
                  value={v.videoTruoc ?? ''}
                  onChange={(e) => set('videoTruoc', e.target.value || undefined)}
                  className="h-11 cursor-pointer rounded-lg border-[1.5px] border-vien-dam bg-white px-3 text-[15px] outline-none focus:border-cham"
                >
                  <option value="">{t.videoTruocNone}</option>
                  {videos?.videos
                    .filter((x) => !x.sample)
                    .map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.title} ({subjectName(x.subject)}
                        {x.lop ? ` ${x.lop}` : ''})
                      </option>
                    ))}
                </select>
              </Field>
            </Group>
            <Group title={t.story}>
              <Field label={t.moDau}>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(t.moDauOpts) as (keyof typeof t.moDauOpts)[]).map((k) => (
                    <Pill
                      size="sm"
                      key={k}
                      on={(v.moDau ?? 'aiChon') === k}
                      onClick={() => set('moDau', k)}
                    >
                      {t.moDauOpts[k]}
                    </Pill>
                  ))}
                </div>
              </Field>
              <Field label={t.goiYMoDau}>
                <TextInput value={v.goiYMoDau} onChange={(x) => set('goiYMoDau', x)} />
              </Field>
              <Field label={t.viDu}>
                <TextInput value={v.viDu} onChange={(x) => set('viDu', x)} />
              </Field>
              <Field label={t.doDai}>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(t.doDaiOpts) as (keyof typeof t.doDaiOpts)[]).map((k) => (
                    <Pill
                      size="sm"
                      key={k}
                      on={(v.doDai ?? 'ai') === k}
                      onClick={() => set('doDai', k)}
                    >
                      {t.doDaiOpts[k]}
                    </Pill>
                  ))}
                </div>
              </Field>
            </Group>
            <Group title={t.examContent}>
              <Field label={t.loiHayMac} hint={t.loiHayMacHint}>
                <TextArea value={v.loiHayMac} onChange={(x) => set('loiHayMac', x)} />
              </Field>
              <Field label={t.dangBaiThi} hint={t.dangBaiThiHint}>
                <TextArea value={v.dangBaiThi} onChange={(x) => set('dangBaiThi', x)} />
              </Field>
            </Group>
            <Group title={t.docs}>
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-vien-dam p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Paperclip aria-hidden className="size-5 text-phu" />
                  <span className="flex-1 text-sm text-phu">{t.attach}</span>
                  <Button variant="outline" size="md" onClick={() => void pickFiles()}>
                    {t.attachBtn}
                  </Button>
                </div>
                {(v.attachments ?? []).map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <FileText aria-hidden className="size-4 text-phu" />
                    <PathText className="min-w-0 flex-1">{f}</PathText>
                    <button
                      type="button"
                      aria-label="Bỏ tệp này"
                      className="cursor-pointer rounded p-1 hover:bg-nen"
                      onClick={() =>
                        set(
                          'attachments',
                          v.attachments?.filter((x) => x !== f)
                        )
                      }
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Field label={t.ghiChu}>
                <TextArea value={v.ghiChu} onChange={(x) => set('ghiChu', x)} />
              </Field>
            </Group>
          </div>
        </details>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-loi/30 bg-loi-nen px-4 py-3 text-[15px]"
          >
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={busy} onClick={() => void submit()}>
            {t.submit}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
          <span className="text-[13px] text-phu">{t.remember}</span>
        </div>
      </div>

      <aside className="sticky top-20 flex max-w-[340px] flex-[1_1_280px] flex-col gap-3 rounded-xl border border-vien bg-white p-5">
        <div className="text-base font-bold">{t.whatNext}</div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {t.whatNextSteps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-normal">
              <StepNo n={i + 1} small />
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="m-0 text-[13px] leading-normal text-phu">{t.whatNextNote}</p>
      </aside>
    </Page>
  )
}

function StepNo({ n, small }: { n: number; small?: boolean }): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-cham font-bold text-white',
        small ? 'size-6 text-xs' : 'size-7 text-sm'
      )}
    >
      {n}
    </span>
  )
}

function Card({
  n,
  title,
  aside,
  children
}: {
  n: number
  title: string
  aside?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <UiCard className="flex flex-col gap-6 px-7 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <StepNo n={n} />
        <CardTitle>{title}</CardTitle>
        {aside && <span className="text-[13px] text-phu">{aside}</span>}
      </div>
      {children}
    </UiCard>
  )
}

function Group({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="text-[15px] font-bold">{label}</div>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  )
}

/** Nut chon lop: vuong 56 x 40 (theo thiet ke). */
function LopButton({
  on,
  onClick,
  children
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'h-10 w-14 cursor-pointer rounded-[10px] border-[1.5px] text-[15px]',
        on
          ? 'border-cham bg-cham-nhat font-bold text-cham'
          : 'border-vien-dam bg-white font-semibold text-navy hover:bg-nen'
      )}
    >
      {children}
    </button>
  )
}

/** O chon co nut tron + ten + mo ta ngan (loai video). */
function Choice({
  on,
  onClick,
  title,
  hint
}: {
  on: boolean
  onClick: () => void
  title: string
  hint: string
}): React.JSX.Element {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] px-3.5 py-2.5',
        on ? 'border-cham bg-cham-nhat' : 'border-vien-dam bg-white hover:bg-nen'
      )}
    >
      <input
        type="radio"
        name="loai-video"
        checked={on}
        onChange={onClick}
        className="size-4 accent-cham"
      />
      <span className="flex flex-col">
        <span className={cn('text-[15px] font-bold', on ? 'text-cham' : 'text-navy')}>{title}</span>
        <span className="text-[13px] text-phu">{hint}</span>
      </span>
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
}): React.JSX.Element {
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function TextArea({
  value,
  onChange
}: {
  value?: string
  onChange: (v: string) => void
}): React.JSX.Element {
  return <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
}
