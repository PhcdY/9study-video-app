// Bo khung trang, tieu de, the, hang cai dat, o nhap dung chung cho moi man.
// So do lay tu thiet ke (artifact XA873CwpU1C2dhJZUE7rSk): trang rong 1180, le 32;
// tieu de man 28/800; tieu de the 19/700; nhan o 15/700; chu thich 13; o nhap vien 1.5px bo 8.
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Khung noi dung giua man hinh, cung chieu rong voi thanh dau. */
export function Page({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <main
      className={cn(
        'mx-auto box-border flex w-full max-w-[1180px] flex-1 flex-col gap-6 px-8 py-8',
        className
      )}
    >
      {children}
    </main>
  )
}

export function PageTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <h1 className="m-0 text-[28px] leading-tight font-extrabold">{children}</h1>
}

/** Nhan nho in hoa tren mot nhom (vd "LAM TIEP", "BAI CUA BAN · 3"). */
export function Eyebrow({
  children,
  id
}: {
  children: React.ReactNode
  id?: string
}): React.JSX.Element {
  return (
    <h2 id={id} className="m-0 text-[13px] font-bold tracking-[0.06em] text-phu uppercase">
      {children}
    </h2>
  )
}

/** The trang co vien, bo 12. */
export function Card({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <section className={cn('rounded-xl border border-vien bg-white', className)}>
      {children}
    </section>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <h2 className="m-0 text-[19px] leading-snug font-bold">{children}</h2>
}

/** Mot hang trong the cai dat: ten + gia tri + chu thich ben trai, nut ben phai. Cach nhau bang vach mo. */
export function SettingRow({
  label,
  value,
  desc,
  descTone = 'muted',
  children
}: {
  label: React.ReactNode
  value?: React.ReactNode
  desc?: React.ReactNode
  descTone?: 'muted' | 'ok'
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#EEF1F8] py-4 last:border-b-0">
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
        <div className="text-[15px] font-bold">{label}</div>
        {value && <div className="text-sm break-all text-phu">{value}</div>}
        {desc && (
          <div
            className={cn(
              'text-[13px] leading-normal',
              descTone === 'ok' ? 'text-xong' : 'text-phu'
            )}
          >
            {desc}
          </div>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function FieldLabel({
  children,
  htmlFor
}: {
  children: React.ReactNode
  htmlFor?: string
}): React.JSX.Element {
  return (
    <label htmlFor={htmlFor} className="text-[15px] font-bold">
      {children}
    </label>
  )
}

export function Hint({
  children,
  tone = 'muted'
}: {
  children: React.ReactNode
  tone?: 'muted' | 'ok'
}): React.JSX.Element {
  return (
    <div className={cn('text-[13px] leading-normal', tone === 'ok' ? 'text-xong' : 'text-phu')}>
      {children}
    </div>
  )
}

const fieldBase =
  'box-border w-full rounded-lg border-[1.5px] border-vien-dam bg-white text-[15px] text-navy outline-none placeholder:text-mo focus:border-cham'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return <input {...props} className={cn(fieldBase, 'h-11 px-3.5', className)} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>): React.JSX.Element {
  return (
    <textarea
      rows={2}
      {...props}
      className={cn(fieldBase, 'resize-y px-3.5 py-2.5 leading-normal', className)}
    />
  )
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return <select {...props} className={cn(fieldBase, 'h-11 cursor-pointer px-3', className)} />
}

/** Nut chon dang vien tron (mon, ky thi, cach mo dau...). */
export function Pill({
  on,
  onClick,
  children,
  size = 'md'
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
  size?: 'md' | 'sm'
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'shrink-0 cursor-pointer rounded-full border-[1.5px] font-semibold whitespace-nowrap',
        size === 'md' ? 'h-10 px-4 text-[15px]' : 'h-[38px] px-3.5 text-sm',
        on
          ? 'border-cham bg-cham-nhat text-cham'
          : 'border-vien-dam bg-white text-navy hover:bg-nen'
      )}
    >
      {children}
    </button>
  )
}

/** Duong dan tren may: chu thuong, mau phu, ngat dong duoc (khong dung phong chu may). */
export function PathText({
  children,
  className
}: {
  children: string
  className?: string
}): React.JSX.Element {
  return (
    <span className={cn('text-sm break-all text-phu', className)} title={children}>
      {children}
    </span>
  )
}
