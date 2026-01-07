'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'
import { DraftEditor, ListSettingsTray, ListInputBar } from '@/components/lists'
import { addItem, getListItems } from '@/app/lists/actions'
import type { ListFieldDefinition } from '@/types/list-fields'
import type { AiModel } from '@/lib/ai-instructions'

interface ListItemData {
  id: string
  content: Record<string, string | number>
  source: string | null
  createdAt: Date
}

export interface HomeClientProps {
  userName: string
  initialLists: UserList[]
}

export function HomeClient({ userName, initialLists }: HomeClientProps) {
  const router = useRouter()
  const [lists, setLists] = useState(initialLists)
  const [selectedListId, setSelectedListId] = useState<string | undefined>()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [items, setItems] = useState<ListItemData[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  // Load items when selected list changes
  useEffect(() => {
    const selectedList = lists.find((l) => l.id === selectedListId)
    if (selectedList && !selectedList.isDraft) {
      setIsLoadingItems(true)
      getListItems(selectedList.id).then((result) => {
        if (result.success) {
          setItems(result.items)
        }
        setIsLoadingItems(false)
      })
    } else {
      setItems([])
    }
  }, [selectedListId, lists])

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

  const handleAddItem = useCallback(
    (values: Record<string, string>) => {
      if (!selectedListId) return

      // Convert string values to proper types based on field definitions
      const selectedList = lists.find((l) => l.id === selectedListId)
      if (!selectedList) return

      const fields = getFields(selectedList)
      const content: Record<string, string | number> = {}

      for (const [key, value] of Object.entries(values)) {
        const field = fields.find((f) => f.name === key)
        if (field?.type === 'number' && value !== '') {
          content[key] = Number(value)
        } else {
          content[key] = value
        }
      }

      startTransition(async () => {
        const result = await addItem({
          listId: selectedListId,
          content,
          source: 'manual',
        })

        if (result.success) {
          // Prepend new item to list (newest first)
          setItems((prev) => [result.item, ...prev])
        }
      })
    },
    [selectedListId, lists]
  )

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
        <ListContent
          list={selectedList}
          items={items}
          fields={getFields(selectedList)}
          isLoading={isLoadingItems}
        />
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
            onSubmit={handleAddItem}
            isSubmitting={isPending}
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
  items: ListItemData[]
  fields: ListFieldDefinition[]
  isLoading: boolean
}

function ListContent({ list, items, fields, isLoading }: ListContentProps) {
  // Sort fields by order for display
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <h1 className={cn('text-2xl font-bold mb-6', tw.text.primary)}>
          {list.name}
        </h1>

        {isLoading ? (
          <div className={cn('text-center py-12', tw.text.muted)}>
            Loading items...
          </div>
        ) : items.length === 0 ? (
          <div className={cn('text-center py-12', tw.text.muted)}>
            No items yet. Add items via your AI assistant or manually below.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-lg',
                  tw.bg.card,
                  'border',
                  tw.border.default
                )}
              >
                {/* If fields defined, show structured content */}
                {sortedFields.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {sortedFields.map((field) => (
                      <div key={field.name} className="min-w-0">
                        <span className={cn('text-xs', tw.text.muted)}>
                          {field.label}
                        </span>
                        <div className={cn('font-medium', tw.text.primary)}>
                          {item.content[field.name] ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback: show raw content */
                  <pre className={cn('text-sm', tw.text.primary)}>
                    {JSON.stringify(item.content, null, 2)}
                  </pre>
                )}

                {/* Metadata */}
                <div className={cn('mt-2 text-xs flex gap-3', tw.text.muted)}>
                  <span>{item.source}</span>
                  <span>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
