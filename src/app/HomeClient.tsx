'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'
import { DraftEditor, ListSettingsTray, ListInputBar } from '@/components/lists'
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
    setIsSettingsOpen(false) // Close settings when switching lists
  }, [])

  const handleListRenamed = useCallback((newName: string) => {
    // Update local state immediately for responsive UI
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedListId ? { ...l, name: newName } : l
      )
    )
    router.refresh()
  }, [selectedListId, router])

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

      {/* Settings tray and input bar */}
      {selectedList && !selectedList.isDraft && (
        <div className={cn('border-t', tw.border.muted, tw.bg.main)}>
          <ListSettingsTray
            list={selectedList}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onRenamed={handleListRenamed}
          />

          <ListInputBar
            listName={selectedList.name}
            fields={getFields(selectedList)}
            isSettingsOpen={isSettingsOpen}
            onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
            onSubmit={(values) => {
              // TODO: Submit item to list
              console.log('Submit:', values)
            }}
          />
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
        <h1 className={cn('text-2xl font-bold mb-6', tw.text.primary)}>
          {list.name}
        </h1>

        {/* Items will be loaded here */}
        <div className={cn('text-center py-12', tw.text.muted)}>
          No items yet. Add items via your AI assistant or manually below.
        </div>
      </div>
    </div>
  )
}
