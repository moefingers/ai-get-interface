'use client'

import { useUser, useStackApp } from '@stackframe/stack'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export function UserMenu() {
  const user = useUser()
  const app = useStackApp()

  if (!user) {
    return (
      <button
        onClick={() => app.redirectToSignIn()}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
          tw.btn.ghost
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            tw.bg.elevated,
            tw.text.muted
          )}
        >
          <UserIcon className="w-5 h-5" />
        </div>
        <span className={tw.text.secondary}>Sign In</span>
      </button>
    )
  }

  return (
    <div className="relative group">
      {/* Hidden checkbox for CSS-only toggle */}
      <input type="checkbox" id="user-menu-toggle" className="peer sr-only" />
      
      {/* Clickable label styled as button */}
      <label
        htmlFor="user-menu-toggle"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
          tw.btn.ghost
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            tw.bg.primary,
            tw.text.onPrimary,
            'font-medium text-sm'
          )}
        >
          {getInitials(user.displayName || user.primaryEmail || 'U')}
        </div>
        <span className={cn('flex-1 text-left truncate', tw.text.primary)}>
          {user.displayName || user.primaryEmail || 'User'}
        </span>
        <ChevronIcon className={cn('w-4 h-4 transition-transform', tw.text.muted, 'group-has-[:checked]:rotate-90')} />
      </label>

      {/* Dropdown menu - shown when peer checkbox is checked */}
      <div
        className={cn(
          'absolute bottom-full left-0 right-0 mb-1',
          'hidden peer-checked:block',
          tw.bg.elevated,
          'border',
          tw.border.default,
          'rounded-lg shadow-lg',
          'py-1'
        )}
      >
        <button
          onClick={() => app.signOut()}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2',
            tw.hover.bg.subtle,
            tw.text.secondary
          )}
        >
          <LogOutIcon className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function UserIcon({ className }: { className?: string }) {
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
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function LogOutIcon({ className }: { className?: string }) {
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
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  )
}
