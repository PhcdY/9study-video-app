import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Kieu shadcn/ui, mau theo thiet ke: moi man mot nut chinh (cham), con lai vien hoac chu.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-cham text-white hover:bg-cham-dam',
        outline: 'border border-vien-dam bg-white text-navy hover:bg-nen',
        ghost: 'bg-transparent text-cham hover:bg-cham-nhat'
      },
      size: {
        lg: 'h-12 px-[22px] text-base',
        md: 'h-11 px-5 text-[15px]'
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
