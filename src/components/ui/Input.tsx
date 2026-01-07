import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Show error styling */
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          hasError ? tw.input.error : tw.input.default,
          'px-3 py-2 w-full',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
