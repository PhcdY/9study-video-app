// Hai nut chon model va muc suy nghi (reasoning effort), chu tieng Anh nhu app Codex goc.
// Dung o khung chat (nut nho, menu mo len tren) va trong Cai dat (o lon, menu mo xuong).
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { resolveAi, type AiChoice, type AiModelOption } from '../../../shared/ai-model'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'

const t = copy.ai

interface Option {
  value: string
  label: string
  hint?: string
  tag?: string
}

export function AiPicker({
  models,
  value,
  onChange,
  variant = 'pill'
}: {
  models: AiModelOption[]
  value: AiChoice
  onChange: (choice: AiChoice) => void
  /** pill: nut nho duoi o nhan AI; field: o chon trong Cai dat */
  variant?: 'pill' | 'field'
}): React.JSX.Element | null {
  const resolved = resolveAi(models, value)
  if (!resolved) return null
  const { model, effort } = resolved
  const modelValue = models.some((m) => m.id === value.model) ? (value.model as string) : ''

  const modelOptions: Option[] = [
    { value: '', label: t.defaultModel, hint: t.defaultModelHint },
    ...models.map((m) => ({ value: m.id, label: m.name, hint: m.description }))
  ]
  const effortOptions: Option[] = model.efforts.map((e) => ({
    value: e.id,
    label: t.effortName(e.id),
    hint: e.description,
    tag: e.id === model.defaultEffort ? t.defaultTag : undefined
  }))

  const pickModel = (id: string): void => {
    const next = resolveAi(models, { model: id || undefined })
    // Muc suy nghi model moi khong co thi bo, ve mac dinh cua model moi
    const keep = next?.model.efforts.some((e) => e.id === value.effort)
    onChange({ model: id || undefined, effort: keep ? value.effort : undefined })
  }
  const pickEffort = (id: string): void =>
    onChange({ ...value, effort: id === model.defaultEffort ? undefined : id })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown
        label={t.model}
        text={!modelValue && variant === 'field' ? t.defaultModel : model.name}
        options={modelOptions}
        selected={modelValue}
        onPick={pickModel}
        variant={variant}
        width={320}
      />
      <Dropdown
        label={t.effort}
        text={t.effortName(effort)}
        options={effortOptions}
        selected={effort}
        onPick={pickEffort}
        variant={variant}
        width={280}
        heading={t.effort}
      />
    </div>
  )
}

function Dropdown({
  label,
  text,
  options,
  selected,
  onPick,
  variant,
  width,
  heading
}: {
  label: string
  text: string
  options: Option[]
  selected: string
  onPick: (value: string) => void
  variant: 'pill' | 'field'
  width: number
  heading?: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    // Dua phim len muc dang chon de di chuyen bang mui ten
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const pick = (v: string): void => {
    setOpen(false)
    onPick(v)
  }
  const move = (e: React.KeyboardEvent, dir: 1 | -1): void => {
    e.preventDefault()
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    items[(i + dir + items.length) % items.length]?.focus()
  }

  return (
    <div
      ref={box}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 border border-vien-dam bg-white text-navy hover:bg-nen',
          variant === 'pill'
            ? 'h-[30px] rounded-full px-2.5 text-[13px] font-semibold'
            : 'h-11 min-w-[180px] justify-between rounded-[10px] px-3 text-[15px]'
        )}
      >
        {text}
        <ChevronDown aria-hidden className="size-3.5 text-mo" />
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label={label}
          style={{ width }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') move(e, 1)
            if (e.key === 'ArrowUp') move(e, -1)
          }}
          className={cn(
            'absolute left-0 z-40 m-0 flex max-h-[360px] list-none flex-col overflow-y-auto rounded-[10px] border border-vien-dam bg-white p-1.5 shadow-[0_12px_32px_rgba(14,16,70,0.16)]',
            variant === 'pill' ? 'bottom-[38px]' : 'top-[50px]'
          )}
        >
          {heading && (
            <li role="presentation" className="px-2.5 pt-1 pb-1.5 text-xs text-phu">
              {heading}
            </li>
          )}
          {options.map((o) => {
            const on = o.value === selected
            return (
              <li
                key={o.value || 'default'}
                role="option"
                aria-selected={on}
                tabIndex={-1}
                onClick={() => pick(o.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    pick(o.value)
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-start justify-between gap-2 rounded-lg px-2.5 py-1.5 outline-none hover:bg-nen focus-visible:bg-nen',
                  on && 'bg-cham-nhat hover:bg-cham-nhat'
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-semibold text-navy">
                    {o.label}
                    {o.tag && <span className="ml-1 font-normal text-phu">{o.tag}</span>}
                  </span>
                  {o.hint && <span className="text-xs leading-snug text-phu">{o.hint}</span>}
                </span>
                {on && <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-cham" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
