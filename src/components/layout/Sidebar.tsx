'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { ColumnHider } from '@/components/ui'
import { SidebarToggle } from './SidebarToggle'
import { UserMenu } from './UserMenu'

export interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex relative">
      {/* Sidebar with ColumnHider for smooth collapse */}
      <ColumnHider showWhen={isOpen} className="h-screen">
        <aside
          className={cn(
            'h-full w-65 flex flex-col',
            tw.bg.sidebar,
            'border-r',
            tw.border.muted
          )}
        >
          {/* Sidebar Header */}
          <div
            className={cn(
              'h-14 flex items-center justify-between px-3',
              'border-b',
              tw.border.muted
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
              <span className="font-medium whitespace-nowrap">New List</span>
            </button>
          </div>

          {/* Sidebar Content (list of lists) */}
          <div className="flex-1 overflow-y-auto py-2">
            {children}
          </div>

          {/* Sidebar Footer (User Menu) */}
          <div
            className={cn(
              'border-t p-2',
              tw.border.muted
            )}
          >
            <UserMenu />
          </div>
        </aside>
      </ColumnHider>

      {/* Toggle button - in document flow, slides with sidebar */}
      <div className="h-screen shrink-0">
        <div className="sticky top-3 ml-3">
          <SidebarToggle isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
        </div>
      </div>
    </div>
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
