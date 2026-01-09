'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { AppShell, type UserList } from '@/components/layout'
import { DraftEditor, ListSettingsTray, ListInputBar } from '@/components/lists'
import { RowHider, ColumnHider } from '@/components/ui'
import { addItem, getListItems, deleteItem } from '@/app/lists/actions'
import type { ListFieldDefinition } from '@/types/list-fields'
import type { AiModel, AuthMethod } from '@/lib/ai-instructions'
import { Settings, Trash2, Menu } from 'lucide-react'

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
  const [loadingListId, setLoadingListId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [items, setItems] = useState<ListItemData[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Keep lists in sync with server data
  useEffect(() => {
    setLists(allLists)
  }, [allLists])

  // Clear loading state when navigation completes
  useEffect(() => {
    setLoadingListId(null)
  }, [currentList.id])

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
      setLoadingListId(listId)
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

  const handleItemDeleted = useCallback((itemId: string) => {
    // Remove item from local state immediately for responsive UI
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

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
      loadingListId={loadingListId}
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
          onItemDeleted={handleItemDeleted}
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
  onItemDeleted: (itemId: string) => void
}

// Delete button with confirmation state
function DeleteButton({ itemId, onDeleted }: { itemId: string; onDeleted: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Auto-revert after 3 seconds
  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isConfirming])

  const handleClick = async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }
    
    // Second click - delete
    setIsDeleting(true)
    const result = await deleteItem(itemId)
    if (result.success) {
      onDeleted()
    } else {
      setIsDeleting(false)
      setIsConfirming(false)
    }
  }

  const handleBlur = () => {
    if (isConfirming && !isDeleting) {
      setIsConfirming(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      onBlur={handleBlur}
      disabled={isDeleting}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded transition-colors',
        isConfirming
          ? 'text-red-500 hover:text-red-600'
          : cn(tw.text.muted, 'hover:text-gray-500')
      )}
    >
      <Trash2 className="w-4 h-4" />
      <ColumnHider showWhen={isConfirming}>
        <span className="text-xs whitespace-nowrap">
          {isDeleting ? 'Deleting...' : 'Delete item?'}
        </span>
      </ColumnHider>
    </button>
  )
}

type TimeFilter = 'today' | '24h' | 'all'
type SortDirection = 'desc' | 'asc'

function ListContent({ list, items, fields, isLoading, onItemDeleted }: ListContentProps) {
  const [showItems, setShowItems] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [sortField, setSortField] = useState<string>('time') // 'time', field names, or 'source'
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sort fields by order for display
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  // Build list of sortable field options: time + fields + source
  const sortFieldOptions = ['time', ...sortedFields.map(f => f.name), 'source']

  // Trigger animation when items finish loading
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setShowItems(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowItems(false)
    }
  }, [isLoading, items.length])

  // Check if an item matches the current time filter
  const isItemVisible = (item: ListItemData) => {
    if (timeFilter === 'all') return true
    const itemDate = new Date(item.createdAt)
    const now = new Date()
    if (timeFilter === 'today') {
      // Same calendar day
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      )
    }
    // Last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return itemDate >= twentyFourHoursAgo
  }

  const cycleTimeFilter = () => {
    setTimeFilter(prev => {
      if (prev === 'today') return '24h'
      if (prev === '24h') return 'all'
      return 'today'
    })
  }

  const cycleSortField = () => {
    setSortField(prev => {
      const currentIndex = sortFieldOptions.indexOf(prev)
      const nextIndex = (currentIndex + 1) % sortFieldOptions.length
      return sortFieldOptions[nextIndex]
    })
  }

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Get sort type for direction labels
  const getSortType = (): 'time' | 'number' | 'text' => {
    if (sortField === 'time') return 'time'
    const currentField = sortedFields.find(f => f.name === sortField)
    return currentField?.type === 'number' ? 'number' : 'text'
  }

  const sortType = getSortType()

  // Get display label for sort field
  const getSortFieldLabel = (fieldName: string) => {
    if (fieldName === 'time') return 'Time'
    if (fieldName === 'source') return 'Source'
    const field = sortedFields.find(f => f.name === fieldName)
    return field?.label ?? fieldName
  }

  // Sort items based on current sort field and direction
  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0
    if (sortField === 'time') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortField === 'source') {
      comparison = (a.source ?? '').localeCompare(b.source ?? '')
    } else {
      // Sort by field value
      const aVal = a.content[sortField] ?? ''
      const bVal = b.content[sortField] ?? ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Sticky header with blur - inside scroll container so items go behind it */}
      <div className={cn(
        'sticky top-0 z-10 px-8 pt-8 pb-4',
        'backdrop-blur-md bg-background/40',
        'rounded-lg'
      )}>
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <h1 className={cn('text-2xl font-bold', tw.text.primary)}>
            {list.name}
          </h1>
          
          {/* CSS-only responsive menu */}
          <input type="checkbox" id="filter-menu" className="peer hidden" />
          
          {/* Hamburger - visible only on narrow screens */}
          <label
            htmlFor="filter-menu"
            className={cn(
              'sm:hidden flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer',
              tw.bg.card,
              'border',
              tw.border.default,
              tw.text.primary,
              tw.hover.bg.subtle
            )}
          >
            <Menu className="w-5 h-5" />
          </label>
          
          {/* Buttons - animated dropdown on mobile, always visible on desktop */}
          <div className={cn(
            // Mobile: positioned dropdown with grid animation
            'absolute right-4 top-16 z-10',
            'grid transition-[grid-template-rows] duration-200',
            'grid-rows-[0fr] peer-checked:grid-rows-[1fr]',
            // Desktop: in-flow, always visible
            'sm:relative sm:right-auto sm:top-auto',
            'sm:grid-rows-[1fr]'
          )}>
            <div className="overflow-hidden sm:overflow-visible">
              <div className={cn(
                // Mobile: vertical stack with card styling
                'flex flex-col items-end gap-1 p-2 rounded-lg',
                'bg-background/90 backdrop-blur-md border shadow-lg',
                tw.border.default,
                // Desktop: horizontal row, no card styling
                'sm:flex-row sm:items-center sm:gap-2 sm:p-0',
                'sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:shadow-none sm:rounded-none'
              )}>
            {/* Sort field toggle */}
            <button
              onClick={cycleSortField}
              className={cn(
                'flex items-center px-3 py-1.5 rounded-lg text-sm font-medium',
                'transition-colors',
                tw.bg.card,
                'border',
                tw.border.default,
                tw.text.primary,
                tw.hover.bg.subtle
              )}
            >
              {sortFieldOptions.map(fieldName => (
                <ColumnHider key={fieldName} showWhen={sortField === fieldName}>
                  <span className="whitespace-nowrap">{getSortFieldLabel(fieldName)}</span>
                </ColumnHider>
              ))}
            </button>

            {/* Sort direction toggle */}
            <button
              onClick={toggleSortDirection}
              className={cn(
                'flex items-center px-3 py-1.5 rounded-lg text-sm font-medium',
                'transition-colors',
                tw.bg.card,
                'border',
                tw.border.default,
                tw.text.primary,
                tw.hover.bg.subtle
              )}
            >
              {/* Time-based labels */}
              <ColumnHider showWhen={sortType === 'time' && sortDirection === 'desc'}>
                <span className="whitespace-nowrap">Newest</span>
              </ColumnHider>
              <ColumnHider showWhen={sortType === 'time' && sortDirection === 'asc'}>
                <span className="whitespace-nowrap">Oldest</span>
              </ColumnHider>
              {/* Number-based labels */}
              <ColumnHider showWhen={sortType === 'number' && sortDirection === 'desc'}>
                <span className="whitespace-nowrap">Descending</span>
              </ColumnHider>
              <ColumnHider showWhen={sortType === 'number' && sortDirection === 'asc'}>
                <span className="whitespace-nowrap">Ascending</span>
              </ColumnHider>
              {/* Text-based labels */}
              <ColumnHider showWhen={sortType === 'text' && sortDirection === 'desc'}>
                <span className="whitespace-nowrap">Z→A</span>
              </ColumnHider>
              <ColumnHider showWhen={sortType === 'text' && sortDirection === 'asc'}>
                <span className="whitespace-nowrap">A→Z</span>
              </ColumnHider>
            </button>

            {/* Time filter toggle */}
            <button
              onClick={cycleTimeFilter}
              className={cn(
                'flex items-center px-3 py-1.5 rounded-lg text-sm font-medium',
                'transition-colors',
                tw.bg.card,
                'border',
                tw.border.default,
                tw.text.primary,
                tw.hover.bg.subtle
              )}
            >
              <ColumnHider showWhen={timeFilter === 'today'}>
                <span className="whitespace-nowrap">Today</span>
              </ColumnHider>
              <ColumnHider showWhen={timeFilter === '24h'}>
                <span className="whitespace-nowrap">Last 24h</span>
              </ColumnHider>
              <ColumnHider showWhen={timeFilter === 'all'}>
                <span className="whitespace-nowrap">All</span>
              </ColumnHider>
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List content - scrolls behind sticky header */}
      <div className="px-8 pb-8">
        <div className="max-w-3xl mx-auto w-full">
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
              <AnimatePresence mode="popLayout">
                {sortedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RowHider showWhen={showItems && isItemVisible(item)}>
                      <div
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

                        {/* Metadata and actions */}
                        <div className={cn('mt-2 text-xs flex items-center justify-between', tw.text.muted)}>
                          <div className="flex gap-3">
                            <span>{item.source}</span>
                            <span>
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <DeleteButton 
                            itemId={item.id} 
                            onDeleted={() => onItemDeleted(item.id)} 
                          />
                        </div>
                      </div>
                    </RowHider>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
