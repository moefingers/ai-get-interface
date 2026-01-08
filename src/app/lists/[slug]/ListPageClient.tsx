'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'
import { DraftEditor, ListSettingsTray, ListInputBar } from '@/components/lists'
import { addItem, getListItems } from '@/app/lists/actions'
import type { ListFieldDefinition } from '@/types/list-fields'
import type { AiModel, AuthMethod } from '@/lib/ai-instructions'
import { Settings } from 'lucide-react'

interface ListItemData {
  id: string
  content: Record<string, string | number>
  source: string | null
  createdAt: Date
}

export interface ListPageClientProps {
  userName: string
  currentList: UserList & { authToken: string }
  allLists: UserList[]
}

export function ListPageClient({ userName, currentList, allLists }: ListPageClientProps) {
  const router = useRouter()
  const [lists, setLists] = useState(allLists)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [items, setItems] = useState<ListItemData[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Keep lists in sync with server data
  useEffect(() => {
    setLists(allLists)
  }, [allLists])

  // Load items on mount and when list changes
  useEffect(() => {
    if (!currentList.isDraft) {
      setIsLoadingItems(true)
      getListItems(currentList.id).then((result) => {
        if (result.success) {
          setItems(result.items)
        }
        setIsLoadingItems(false)
      })
    } else {
      setItems([])
    }
  }, [currentList.id, currentList.isDraft])

  const handleListCreated = useCallback((listId: string, slug: string) => {
    // Navigate to the newly created draft
    router.push(`/lists/${slug}`)
  }, [router])

  const handleSelectList = useCallback((listId: string) => {
    // Find the list and navigate to its slug
    const list = lists.find((l) => l.id === listId)
    if (list) {
      router.push(`/lists/${list.slug}`)
    }
    setIsSettingsOpen(false)
  }, [lists, router])

  const handleListRenamed = useCallback((newName: string) => {
    // Update local state immediately for responsive UI
    setLists((prev) =>
      prev.map((l) =>
        l.id === currentList.id ? { ...l, name: newName } : l
      )
    )
    router.refresh()
  }, [currentList.id, router])

  const handleDraftPublished = useCallback((newSlug: string) => {
    // Navigate to the new slug after publishing
    router.push(`/lists/${newSlug}`)
    router.refresh()
  }, [router])

  const handleDraftDeleted = useCallback(() => {
    // Navigate to home or first available list
    const otherLists = lists.filter((l) => l.id !== currentList.id && !l.isDraft)
    if (otherLists.length > 0) {
      router.push(`/lists/${otherLists[0].slug}`)
    } else {
      router.push('/')
    }
    router.refresh()
  }, [lists, currentList.id, router])

  const handleDraftNameChanged = useCallback((newName: string) => {
    // Update local state immediately for responsive UI
    setLists((prev) =>
      prev.map((l) =>
        l.id === currentList.id ? { ...l, name: newName } : l
      )
    )
  }, [currentList.id])

  // Parse fields from JSON
  const getFields = (list: UserList): ListFieldDefinition[] => {
    try {
      const parsed = JSON.parse(list.fields)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const handleAddItem = useCallback(
    (values: Record<string, string>) => {
      const fields = getFields(currentList)
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
          listId: currentList.id,
          content,
          source: 'manual',
        })

        if (result.success) {
          // Prepend new item to list (newest first)
          setItems((prev) => [result.item, ...prev])
        }
      })
    },
    [currentList]
  )

  const fields = getFields(currentList)

  return (
    <AppShell
      lists={lists}
      selectedListId={currentList.id}
      onSelectList={handleSelectList}
      onListCreated={handleListCreated}
    >
      {/* Main content area */}
      {currentList.isDraft ? (
        <DraftEditor
          key={currentList.id}
          listId={currentList.id}
          initialName={currentList.name}
          initialFields={fields}
          initialAuthMethod={currentList.authMethod as AuthMethod | null}
          initialAiModel={currentList.aiModel as AiModel | null}
          onPublished={handleDraftPublished}
          onDeleted={handleDraftDeleted}
          onNameChanged={handleDraftNameChanged}
        />
      ) : (
        <ListContent
          list={currentList}
          items={items}
          fields={fields}
          isLoading={isLoadingItems}
        />
      )}

      {/* Settings tray and input bar */}
      {!currentList.isDraft && (
        <div className={cn('border-t', tw.border.muted, tw.bg.main)}>
          <ListSettingsTray
            list={currentList}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onRenamed={handleListRenamed}
          />

          <ListInputBar
            listName={currentList.name}
            fields={fields}
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
            No items yet. Add items via your AI assistant or manually below. To configure an AI assistant, follow the instructions in the settings below. "<Settings className="inline-block w-4 h-4 mb-0.5" />"
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
