'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** Modal title for accessibility */
  title: string
  /** Optional description */
  description?: string
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Max width class (default: max-w-md) */
  maxWidth?: string
}

export function Modal({
  open,
  onOpenChange,
  children,
  title,
  description,
  showCloseButton = true,
  maxWidth = 'max-w-md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            tw.bg.overlay,
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        
        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full p-6 rounded-xl shadow-lg',
            maxWidth,
            tw.bg.elevated,
            tw.border.default,
            'border',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className={cn('text-lg font-semibold', tw.text.primary)}>
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className={cn('text-sm mt-1', tw.text.secondary)}>
                  {description}
                </Dialog.Description>
              )}
            </div>
            
            {showCloseButton && (
              <Dialog.Close
                className={cn(
                  'p-1 rounded-md -mr-1 -mt-1',
                  tw.text.muted,
                  tw.hover.bg.subtle,
                  'transition-colors'
                )}
                aria-label="Close"
              >
                <CloseIcon className="w-5 h-5" />
              </Dialog.Close>
            )}
          </div>
          
          {/* Body */}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
