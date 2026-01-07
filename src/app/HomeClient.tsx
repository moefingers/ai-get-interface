'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'
import { DraftEditor } from '@/components/lists'
import type { ListFieldDefinition } from '@/types/list-fields'
import type { AiModel } from '@/lib/ai-instructions'

export interface HomeClientProps {
  userName: string
  initialLists: UserList[]
}

export function HomeClient({ userName, initialLists }: HomeClientProps) {
  const router = useRouter()
  const [lists, setLists] = useState(initialLists)
  const [selectedListId, setSelectedListId] = useState<string | undefined>()

  // Keep lists in sync with server data
  useEffect(() => {
    setLists(initialLists)
  }, [initialLists])

  // Auto-select first draft if one exists and nothing selected
  useEffect(() => {
    const firstDraft = lists.find((l) => l.isDraft)
    if (firstDraft && !selectedListId) {
      setSelectedListId(firstDraft.id)
    }
  }, [lists, selectedListId])

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleListCreated = useCallback((listId: string) => {
    setSelectedListId(listId)
    router.refresh()
  }, [router])

  const handleSelectList = useCallback((listId: string) => {
    setSelectedListId(listId)
  }, [])

  const handleDraftPublished = useCallback(() => {
    // Stay on the same list (it's now published)
    router.refresh()
  }, [router])

  const handleDraftDeleted = useCallback(() => {
    setSelectedListId(undefined)
    router.refresh()
  }, [router])

  const handleDraftNameChanged = useCallback((newName: string) => {
    // Update local state immediately for responsive UI
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedListId ? { ...l, name: newName } : l
      )
    )
  }, [selectedListId])

  const selectedList = lists.find((l) => l.id === selectedListId)

  // Parse fields from JSON for draft editor
  const getFields = (list: UserList): ListFieldDefinition[] => {
    try {
      const parsed = JSON.parse(list.fields)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <AppShell
      lists={lists}
      selectedListId={selectedListId}
      onSelectList={handleSelectList}
      onListCreated={handleListCreated}
    >
      {/* Main content area */}
      {selectedList?.isDraft ? (
        <DraftEditor
          key={selectedList.id}
          listId={selectedList.id}
          initialName={selectedList.name}
          initialFields={getFields(selectedList)}
          initialAiModel={selectedList.aiModel as AiModel | null}
          onPublished={handleDraftPublished}
          onDeleted={handleDraftDeleted}
          onNameChanged={handleDraftNameChanged}
        />
      ) : selectedList ? (
        <ListContent list={selectedList} />
      ) : (
        <EmptyState
          hasLists={lists.filter((l) => !l.isDraft).length > 0}
          userName={userName}
          onRefresh={handleRefresh}
        />
      )}

      {/* Input area at bottom - hide when editing draft */}
      {selectedList && !selectedList.isDraft && (
        <div className={cn('border-t p-4', tw.border.muted, tw.bg.main)}>
          <div className="max-w-3xl mx-auto">
            <div className={cn('flex items-center gap-2 p-3 rounded-xl', tw.bg.card, 'border', tw.border.default)}>
              <input
                type="text"
                placeholder={`Add to ${selectedList.name}...`}
                className={cn(
                  'flex-1 bg-transparent border-none outline-none',
                  tw.text.primary,
                  tw.placeholder.default
                )}
              />
              <button className={cn(tw.btn.primary, 'px-4 py-2')}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

interface EmptyStateProps {
  hasLists: boolean
  userName: string
  onRefresh: () => void
}

function EmptyState({ hasLists, userName, onRefresh }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className={cn('max-w-2xl w-full text-center', tw.card.default, 'p-8')}>
        <h1 className={cn('text-3xl font-bold mb-4', tw.text.primary)}>
          Welcome, {userName}
        </h1>
        <p className={cn('mb-6', tw.text.secondary)}>
          {hasLists
            ? 'Select a list from the sidebar to view items, or create a new one.'
            : 'Create your first list to get started with AI-triggered item management.'}
        </p>
        <p className={cn('text-sm', tw.text.muted)}>
          Click &quot;New List&quot; in the sidebar to begin.
        </p>
      </div>
    </div>
  )
}

interface ListContentProps {
  list: UserList
}

function ListContent({ list }: ListContentProps) {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <h1 className={cn('text-2xl font-bold mb-2', tw.text.primary)}>
          {list.name}
        </h1>
        <p className={cn('text-sm mb-6', tw.text.muted)}>
          {list.aiModel ? `Connected to ${list.aiModel}` : 'No AI connected'}
        </p>

        {/* Items will be loaded here */}
        <div className={cn('text-center py-12', tw.text.muted)}>
          No items yet. Add items via your AI assistant or manually below.
        </div>
      </div>
    </div>
  )
}
