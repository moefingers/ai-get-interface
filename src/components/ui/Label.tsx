import { type LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Show as required with asterisk */
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium mb-1.5',
        tw.text.secondary,
        className
      )}
      {...props}
    >
      {children}
      {required && <span className={cn('ml-1', tw.text.error)}>*</span>}
    </label>
  )
}
