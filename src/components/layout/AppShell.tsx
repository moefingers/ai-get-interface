'use client'

import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { Sidebar } from './Sidebar'

export interface AppShellProps {
  children: React.ReactNode
  sidebarContent?: React.ReactNode
}

export function AppShell({ children, sidebarContent }: AppShellProps) {
  return (
    <div className={cn('min-h-screen', tw.bg.main)}>
      <Sidebar>{sidebarContent}</Sidebar>
      <main className="min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
