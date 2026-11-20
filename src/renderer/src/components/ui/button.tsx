import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Theo thiet ke (artboard Main, Settings, NewVideo):
//  - lg: nut chinh cua trang (vd "Bat dau viet kich ban", buoc cai dat) cao 48, chu 16
//  - md: nut trong the / buoc cai dat cao 44, chu 15
//  - sm: nut trong mot hang cai dat / thanh cong cu cao 40, chu 14, bo 10
// Moi man chi mot nut chinh (primary); con lai la outline hoac ghost.
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-cham text-white hover:bg-cham-dam',
        outline: 'border border-vien-dam bg-white text-navy hover:bg-nen',
        accent: 'border-[1.5px] border-cham bg-white text-cham hover:bg-cham-nhat',
        ghost: 'bg-transparent text-cham hover:bg-cham-nhat',
        danger: 'border border-loi/40 bg-white text-loi hover:bg-loi-nen'
      },
      size: {
        lg: 'h-12 rounded-lg px-[22px] text-base',
        md: 'h-11 rounded-lg px-4 text-[15px]',
        sm: 'h-10 rounded-[10px] px-3.5 text-sm'
      }
    },
    defaultVariants: { variant: 'primary', size: 'lg' }
  }
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
