'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { ColumnHider } from '@/components/ui'
import { createDraft } from '@/app/lists/actions'
import { SidebarToggle } from './SidebarToggle'
import { UserMenu } from './UserMenu'

export interface UserList {
  id: string
  name: string
  slug: string
  aiModel: string | null
  fields: string  // JSON string of ListFieldDefinition[]
  isDraft: boolean
  isActive: boolean
}

export interface SidebarProps {
  lists?: UserList[]
  selectedListId?: string
  onSelectList?: (listId: string) => void
  onListCreated?: (listId: string) => void
}

export function Sidebar({ 
  lists = [], 
  selectedListId,
  onSelectList,
  onListCreated,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleNewList = () => {
    startTransition(async () => {
      const result = await createDraft()
      if (result.success) {
        onListCreated?.(result.list.id)
        onSelectList?.(result.list.id)
      }
    })
  }

  // Separate drafts and published lists
  const drafts = lists.filter((l) => l.isDraft)
  const published = lists.filter((l) => !l.isDraft)

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
              onClick={handleNewList}
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                tw.btn.ghost,
                tw.text.primary,
                isPending && 'opacity-50'
              )}
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium whitespace-nowrap">
                {isPending ? 'Creating...' : 'New List'}
              </span>
            </button>
          </div>

          {/* Sidebar Content (list of lists) */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {lists.length === 0 ? (
              <p className={cn('text-sm px-2 py-4 text-center', tw.text.muted)}>
                No lists yet. Create one to get started!
              </p>
            ) : (
              <nav className="space-y-1">
                {/* Drafts section */}
                {drafts.length > 0 && (
                  <>
                    {drafts.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => onSelectList?.(list.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                          'border border-dashed',
                          selectedListId === list.id
                            ? [tw.bg.primaryMuted, tw.text.primary, tw.border.primary]
                            : [tw.text.secondary, tw.border.muted, tw.hover.bg.subtle, tw.hover.text.primary]
                        )}
                      >
                        <EditIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate italic">{list.name}</span>
                      </button>
                    ))}
                    {published.length > 0 && (
                      <div className={cn('h-px my-2', tw.bg.hover)} />
                    )}
                  </>
                )}
                
                {/* Published lists */}
                {published.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => onSelectList?.(list.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                      selectedListId === list.id
                        ? [tw.bg.active, tw.text.primary]
                        : [tw.text.secondary, tw.hover.bg.subtle, tw.hover.text.primary]
                    )}
                  >
                    <ListIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{list.name}</span>
                  </button>
                ))}
              </nav>
            )}
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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  )
}
