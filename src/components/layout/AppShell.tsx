'use client'

import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { Sidebar, type UserList } from './Sidebar'

export interface AppShellProps {
  children: React.ReactNode
  lists?: UserList[]
  selectedListId?: string
  onSelectList?: (listId: string) => void
  onListCreated?: (listId: string, slug: string) => void
  loadingListId?: string | null
}

export function AppShell({ 
  children, 
  lists,
  selectedListId,
  onSelectList,
  onListCreated,
  loadingListId,
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen flex', tw.bg.main)}>
      <Sidebar 
        lists={lists}
        selectedListId={selectedListId}
        onSelectList={onSelectList}
        onListCreated={onListCreated}
        loadingListId={loadingListId}
      />
      <main className="flex-1 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
