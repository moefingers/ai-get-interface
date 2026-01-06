'use client'

import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export interface SidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-2 rounded-lg',
        tw.btn.ghost
      )}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isOpen ? (
        <PanelLeftCloseIcon className="w-5 h-5" />
      ) : (
        <PanelLeftOpenIcon className="w-5 h-5" />
      )}
    </button>
  )
}

function PanelLeftCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
      />
    </svg>
  )
}

function PanelLeftOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
      />
    </svg>
  )
}
