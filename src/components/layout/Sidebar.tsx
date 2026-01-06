'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { SidebarToggle } from './SidebarToggle'
import { UserMenu } from './UserMenu'

export interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40',
          'flex flex-col',
          tw.bg.sidebar,
          'border-r',
          tw.border.muted,
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-[260px]' : 'w-0'
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            'h-14 flex items-center justify-between px-3',
            'border-b',
            tw.border.muted,
            !isOpen && 'hidden'
          )}
        >
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              tw.btn.ghost,
              tw.text.primary
            )}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">New List</span>
          </button>
          <SidebarToggle isOpen={isOpen} onToggle={() => setIsOpen(false)} />
        </div>

        {/* Sidebar Content (list of lists) */}
        <div
          className={cn(
            'flex-1 overflow-y-auto py-2',
            !isOpen && 'hidden'
          )}
        >
          {children}
        </div>

        {/* Sidebar Footer (User Menu) */}
        <div
          className={cn(
            'border-t p-2',
            tw.border.muted,
            !isOpen && 'hidden'
          )}
        >
          <UserMenu />
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <div className="fixed left-3 top-3 z-50">
          <SidebarToggle isOpen={isOpen} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      {/* Main content spacer */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isOpen ? 'pl-[260px]' : 'pl-0'
        )}
      />
    </>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}
