'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { Save, Eye, Pencil } from 'lucide-react'
import { Button, Input, Label, Select, ColumnHider, RowHider, SlidingView, SlidingViewItem } from '@/components/ui'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { publishList, deleteDraft, updateDraft, type PublishListResponse } from '@/app/lists/actions'
import { 
  AI_MODELS, 
  generateAiInstructions, 
  getAiModelInfo,
  type AiModel 
} from '@/lib/ai-instructions'
import type { ListFieldDefinition, FieldType } from '@/types/list-fields'

export interface DraftEditorProps {
  listId: string
  initialName: string
  initialFields: ListFieldDefinition[]
  initialAiModel: AiModel | null
  onPublished: () => void
  onDeleted: () => void
  onNameChanged?: (name: string) => void
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
]

const AUTOSAVE_DEBOUNCE_MS = 800
const FIELD_ANIMATION_MS = 300

type Step = 'edit' | 'success'
// idle = no changes, pending = changes waiting for debounce, saving = request in flight, saved = success, error = failed
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

// Internal field type with unique ID for animations
interface InternalField extends ListFieldDefinition {
  _id: string
  _leaving?: boolean
}

let fieldIdCounter = 0
const generateFieldId = () => `field-${++fieldIdCounter}-${Date.now()}`

const toInternalFields = (fields: ListFieldDefinition[]): InternalField[] =>
  fields.map((f) => ({ ...f, _id: generateFieldId() }))

const toExternalFields = (fields: InternalField[]): ListFieldDefinition[] =>
  fields
    .filter((f) => !f._leaving)
    .map(({ _id, _leaving, ...rest }) => rest)

export function DraftEditor({
  listId,
  initialName,
  initialFields,
  initialAiModel,
  onPublished,
  onDeleted,
  onNameChanged,
}: DraftEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('edit')
  const [error, setError] = useState<string | null>(null)
  const [publishedList, setPublishedList] = useState<PublishListResponse | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [showFieldsPreview, setShowFieldsPreview] = useState(false)

  const [name, setName] = useState(initialName === 'New List' ? '' : initialName)
  const [fields, setFields] = useState<InternalField[]>(() =>
    toInternalFields(
      initialFields.length > 0 
        ? initialFields 
        : [{ name: 'item', label: 'Item', type: 'text', required: true, order: 0 }]
    )
  )
  const [aiModel, setAiModel] = useState<AiModel>(initialAiModel || 'chatgpt')

  // Track if initial load to skip first auto-save
  const isInitialMount = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Get external fields (exclude leaving ones)
  const externalFields = toExternalFields(fields)
  // Get visible fields (all, including leaving - for animation)
  const visibleFields = fields

  // Auto-save function
  const saveChanges = useCallback(async () => {
    setSaveStatus('saving')
    const result = await updateDraft({
      listId,
      name,
      aiModel,
      fields: externalFields,
    })

    if (result.success) {
      setSaveStatus('saved')
      // Notify parent of name change to update sidebar
      if (result.list.name !== initialName) {
        onNameChanged?.(result.list.name)
      }
      // Stay in 'saved' state to show green icon while synced
    } else {
      setSaveStatus('error')
      setError(result.error)
    }
  }, [listId, name, aiModel, externalFields, initialName, onNameChanged])

  // Debounced auto-save effect
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Mark as pending (changes exist, waiting for debounce)
    setSaveStatus('pending')

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      saveChanges()
    }, AUTOSAVE_DEBOUNCE_MS)

    // Cleanup on unmount or before next effect
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [name, aiModel, externalFields, saveChanges])

  const addField = () => {
    const newId = generateFieldId()
    
    // Add field in "leaving" state initially (hidden)
    setFields((prev) => [
      ...prev,
      {
        _id: newId,
        _leaving: true, // Start hidden for animation
        name: '',
        label: '',
        type: 'text' as FieldType,
        required: true,
        order: prev.filter((f) => !f._leaving).length,
      },
    ])

    // Flip to visible after next frame to trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFields((prev) =>
          prev.map((f) => (f._id === newId ? { ...f, _leaving: false } : f))
        )
      })
    })
  }

  const removeField = (fieldId: string) => {
    // Count non-leaving fields
    const activeCount = fields.filter((f) => !f._leaving).length
    if (activeCount <= 1) return

    // Mark as leaving (triggers animation)
    setFields((prev) =>
      prev.map((f) => (f._id === fieldId ? { ...f, _leaving: true } : f))
    )

    // Remove from DOM after animation completes
    setTimeout(() => {
      setFields((prev) => prev.filter((f) => f._id !== fieldId))
    }, FIELD_ANIMATION_MS)
  }

  const updateField = (index: number, updates: Partial<ListFieldDefinition>) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const updated = { ...f, ...updates }
        if (updates.label && !f.name) {
          updated.name = updates.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
        }
        return updated
      })
    )
  }

  const handlePublish = () => {
    setError(null)
    startTransition(async () => {
      const result = await publishList({
        listId,
        name: name.trim() || 'Untitled List',
        aiModel,
        fields: externalFields,
      })

      if (result.success) {
        setPublishedList(result)
        setStep('success')
        onPublished()
      } else {
        setError(result.error)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDraft(listId)
      onDeleted()
    })
  }

  const canPublish = name.trim().length > 0 && externalFields.every((f) => f.name && f.label)

  if (step === 'success' && publishedList?.success) {
    return (
      <SuccessView
        list={publishedList.list}
        onDone={onPublished}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className={cn('text-2xl font-bold mb-2', tw.text.primary)}>
              Create New List
            </h1>
            <p className={cn('text-sm', tw.text.muted)}>
              Configure your list, then publish to get AI instructions.
            </p>
          </div>
          <SaveStatusIndicator status={saveStatus} />
        </div>

        {/* Name Section */}
        <section className={cn('p-6 rounded-xl', tw.card.default)}>
          <h2 className={cn('text-lg font-semibold mb-4', tw.text.primary)}>
            List Name
          </h2>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Grocery List, Pain Log, Workout Tracker"
            autoFocus
          />
        </section>

        {/* Fields Section */}
        <section className={cn('p-6 rounded-xl', tw.card.default)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('text-lg font-semibold', tw.text.primary)}>
              Fields
            </h2>
            <button
              type="button"
              onClick={() => setShowFieldsPreview(!showFieldsPreview)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                showFieldsPreview 
                  ? [tw.bg.primaryMuted, tw.text.primary]
                  : [tw.bg.hover, tw.text.secondary]
              )}
            >
              {showFieldsPreview ? (
                <>
                  <Pencil className="w-4 h-4" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>
          </div>

          <SlidingView 
            activeIndex={showFieldsPreview ? 1 : 0} 
            viewCount={2}
            className="min-h-50"
          >
            {/* Edit View */}
            <SlidingViewItem>
              <p className={cn('text-sm mb-4', tw.text.muted)}>
                What data should each entry capture?
              </p>

              <div>
                {visibleFields.map((field, index) => (
                  <RowHider 
                    key={field._id} 
                    showWhen={!field._leaving}
                    duration={FIELD_ANIMATION_MS}
                    className={cn('transition-all',
                        !field._leaving ? 'mb-4 last:mb-0' : '')}
                  >
                    <div
                      className={cn(
                        'p-4 rounded-lg border space-y-3',
                        tw.bg.main,
                        tw.border.muted
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`field-label-${field._id}`}>Label</Label>
                          <Input
                            id={`field-label-${field._id}`}
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="e.g., Pain Level, Item Name"
                          />
                        </div>
                        <div className="w-32">
                          <Label htmlFor={`field-type-${field._id}`}>Type</Label>
                          <Select
                            id={`field-type-${field._id}`}
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                            options={FIELD_TYPE_OPTIONS}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className={cn('flex items-center gap-2 text-sm', tw.text.secondary)}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>

                        {externalFields.length > 1 && !field._leaving && (
                          <button
                            type="button"
                            onClick={() => removeField(field._id)}
                            className={cn('text-sm', tw.text.error)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </RowHider>
                ))}
              </div>

              <button
                type="button"
                onClick={addField}
                className={cn(
                  'w-full mt-3 py-2 border border-dashed rounded-lg text-sm',
                  tw.border.muted,
                  tw.text.secondary,
                  tw.hover.bg.subtle
                )}
              >
                + Add Field
              </button>
            </SlidingViewItem>

            {/* Preview View - Table Format */}
            <SlidingViewItem>
              <p className={cn('text-sm mb-4', tw.text.muted)}>
                This is how your list entries will look:
              </p>

              <div className={cn('rounded-lg border overflow-hidden', tw.border.muted)}>
                {/* Table Header */}
                <div className={cn('flex border-b', tw.bg.hover, tw.border.muted)}>
                  {externalFields.map((field, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex-1 px-4 py-3 text-sm font-medium',
                        tw.text.primary,
                        index > 0 && 'border-l',
                        tw.border.muted
                      )}
                    >
                      {field.label || `Field ${index + 1}`}
                      {field.required && <span className={tw.text.error}> *</span>}
                    </div>
                  ))}
                </div>

                {/* Sample Rows */}
                {[1, 2, 3].map((row) => (
                  <div 
                    key={row} 
                    className={cn(
                      'flex',
                      row < 3 && 'border-b',
                      tw.border.muted
                    )}
                  >
                    {externalFields.map((field, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex-1 px-4 py-3 text-sm',
                          tw.text.muted,
                          index > 0 && 'border-l',
                          tw.border.muted
                        )}
                      >
                        {field.type === 'number' ? '—' : '...'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <p className={cn('text-xs mt-3 text-center', tw.text.muted)}>
                {externalFields.length} column{externalFields.length !== 1 ? 's' : ''} • 
                {externalFields.filter(f => f.required).length} required
              </p>
            </SlidingViewItem>
          </SlidingView>
        </section>

        {/* AI Model Section */}
        <section className={cn('p-6 rounded-xl', tw.card.default)}>
          <h2 className={cn('text-lg font-semibold mb-4', tw.text.primary)}>
            AI Assistant
          </h2>
          <p className={cn('text-sm mb-4', tw.text.muted)}>
            Which AI will add items to this list?
          </p>

          <div className="space-y-2">
            {AI_MODELS.map((model) => (
              <label
                key={model.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  aiModel === model.value
                    ? [tw.border.primary, tw.bg.primaryMuted]
                    : [tw.border.muted, tw.hover.bg.subtle]
                )}
              >
                <input
                  type="radio"
                  name="ai-model"
                  value={model.value}
                  checked={aiModel === model.value}
                  onChange={(e) => setAiModel(e.target.value as AiModel)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className={tw.text.primary}>{model.label}</div>
                  <div className={cn('text-sm', tw.text.muted)}>
                    Paste to: {model.destination}
                  </div>
                </div>
                {aiModel === model.value && (
                  <CheckIcon className={cn('w-5 h-5', tw.text.primary)} />
                )}
              </label>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className={cn('p-4 rounded-lg', tw.bg.errorMuted)}>
            <p className={cn('text-sm', tw.text.error)}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pb-8">
          <Button variant="ghost" onClick={handleDelete} disabled={isPending}>
            Discard Draft
          </Button>
          <Button onClick={handlePublish} disabled={!canPublish || isPending}>
            {isPending ? 'Publishing...' : 'Publish List'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface SuccessViewProps {
  list: {
    name: string
    slug: string
    authToken: string
    aiModel: string
    fields: ListFieldDefinition[]
  }
  onDone: () => void
}

function SuccessView({ list, onDone }: SuccessViewProps) {
  const [copied, setCopied] = useState(false)
  const modelInfo = getAiModelInfo(list.aiModel as AiModel)
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'

  const instructions = generateAiInstructions(list.aiModel as AiModel, {
    listName: list.name,
    slug: list.slug,
    token: list.authToken,
    domain,
    fields: list.fields,
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(instructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className={cn('p-4 rounded-lg', tw.bg.successMuted)}>
          <h1 className={cn('text-lg font-semibold', tw.text.success)}>
            🎉 List Published!
          </h1>
          <p className={cn('text-sm mt-1', tw.text.success)}>
            &quot;{list.name}&quot; is ready. Copy the instructions below to your AI.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Instructions for {modelInfo.label}</Label>
            <a
              href={modelInfo.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('text-sm', tw.text.accent)}
            >
              Open {modelInfo.destination} →
            </a>
          </div>

          <div
            className={cn(
              'p-4 rounded-lg border max-h-80 overflow-y-auto font-mono text-xs whitespace-pre-wrap',
              tw.bg.main,
              tw.border.default,
              tw.text.secondary
            )}
          >
            {instructions}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onDone}>
            Done
          </Button>
          <Button onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Instructions'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const [isHovered, setIsHovered] = useState(false)

  if (status === 'idle') return null

  const labels: Record<Exclude<SaveStatus, 'idle'>, string> = {
    pending: 'Unsaved',
    saving: 'Saving...',
    saved: 'Synced',
    error: 'Failed',
  }

  return (
    <div
      className={cn(
        'flex items-center px-2 py-1.5 rounded-full text-xs font-medium transition-all cursor-default',
        status === 'pending' && 'text-red-500 bg-red-500/10',
        status === 'saving' && 'text-yellow-500 bg-yellow-500/10',
        status === 'saved' && 'text-green-500 bg-green-500/10',
        status === 'error' && [tw.bg.errorMuted, tw.text.error]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Save className={cn('w-4 h-4 shrink-0', status === 'saving' && 'animate-pulse')} />
      <ColumnHider showWhen={isHovered}>
        <span className="whitespace-nowrap">{labels[status]}</span>
      </ColumnHider>
    </div>
  )
}
