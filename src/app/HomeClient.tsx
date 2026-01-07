'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'

export interface HomeClientProps {
  userName: string
  initialLists: UserList[]
}

export function HomeClient({ userName, initialLists }: HomeClientProps) {
  const router = useRouter()

  const handleListCreated = useCallback((listId: string) => {
    // Find the newly created draft and navigate to it
    router.refresh()
  }, [router])

  const handleSelectList = useCallback((listId: string) => {
    // Find the list and navigate to its slug
    const list = initialLists.find((l) => l.id === listId)
    if (list) {
      router.push(`/lists/${list.slug}`)
    }
  }, [initialLists, router])

  return (
    <AppShell
      lists={initialLists}
      selectedListId={undefined}
      onSelectList={handleSelectList}
      onListCreated={handleListCreated}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className={cn('max-w-2xl w-full text-center', tw.card.default, 'p-8')}>
          <h1 className={cn('text-3xl font-bold mb-4', tw.text.primary)}>
            Welcome, {userName}
          </h1>
          <p className={cn('mb-6', tw.text.secondary)}>
            Create your first list to get started with AI-triggered item management.
          </p>
          <p className={cn('text-sm', tw.text.muted)}>
            Click &quot;New List&quot; in the sidebar to begin.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
