'use client'

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from 'react'
import { Save, Eye, Pencil, AlertTriangle } from 'lucide-react'
import { Button, Input, Label, ColumnHider, RowHider, SlidingView, SlidingViewItem } from '@/components/ui'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { publishList, deleteDraft, updateDraft, type PublishListResponse } from '@/app/lists/actions'
import { 
  AI_MODELS, 
  AUTH_METHODS,
  generateAiInstructions, 
  getAiModelInfo,
  type AiModel,
  type AuthMethod,
} from '@/lib/ai-instructions'
import type { ListFieldDefinition, FieldType } from '@/types/list-fields'

export interface DraftEditorProps {
  listId: string
  initialName: string
  initialFields: ListFieldDefinition[]
  initialAuthMethod: AuthMethod | null
  initialAiModel: AiModel | null
  onPublished: (slug: string) => void
  onDeleted: () => void
  onNameChanged?: (name: string) => void
}

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
    .map(({ _id, _leaving, ...rest }, index) => ({
      ...rest,
      name: String(index + 1), // Always use numeric names: 1, 2, 3
      order: index,
    }))

export function DraftEditor({
  listId,
  initialName,
  initialFields,
  initialAuthMethod,
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
        : [{ name: '1', label: 'Item', type: 'text', required: true, order: 0 }]
    )
  )
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(initialAuthMethod)
  const [aiModel, setAiModel] = useState<AiModel | null>(initialAiModel)

  // Track if initial load to skip first auto-save
  const isInitialMount = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Get external fields (exclude leaving ones) - memoized to prevent constant re-renders
  const externalFields = useMemo(() => toExternalFields(fields), [fields])
  // Stable JSON string for effect dependency comparison
  const externalFieldsJson = useMemo(() => JSON.stringify(externalFields), [externalFields])
  // Get visible fields (all, including leaving - for animation)
  const visibleFields = fields

  // Auto-save function - uses ref to avoid recreating callback on every field change
  const saveChangesRef = useRef<() => Promise<void>>(undefined)
  saveChangesRef.current = async () => {
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
  }
  
  const saveChanges = useCallback(() => {
    return saveChangesRef.current?.()
  }, [])

  // Debounced auto-save effect - uses stable primitive dependencies
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Using stable JSON string instead of object reference
  }, [name, aiModel, externalFieldsJson])

  const addField = () => {
    const newId = generateFieldId()
    const nextOrder = fields.filter((f) => !f._leaving).length
    
    // Add field in "leaving" state initially (hidden)
    // Name will be set to numeric index by toExternalFields
    setFields((prev) => [
      ...prev,
      {
        _id: newId,
        _leaving: true, // Start hidden for animation
        name: String(nextOrder + 1), // Temporary, recalculated on export
        label: '',
        type: 'text' as FieldType,
        required: true,
        order: nextOrder,
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
        // Name is always numeric (set by toExternalFields), only update label/type/required
        const { name: _ignoreName, ...safeUpdates } = updates
        return { ...f, ...safeUpdates }
      })
    )
  }

  const handlePublish = () => {
    if (!authMethod) return // Safety check (canPublish should prevent this)
    setError(null)
    startTransition(async () => {
      const result = await publishList({
        listId,
        name: name.trim() || 'Untitled List',
        authMethod,
        aiModel,
        fields: externalFields,
      })

      if (result.success) {
        setPublishedList(result)
        setStep('success')
        onPublished(result.list.slug)
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

  const canPublish = name.trim().length > 0 && externalFields.every((f) => f.name && f.label) && authMethod !== null

  // Note: SuccessView is no longer shown because onPublished navigates immediately
  // Keeping the component in case we want to use it in the future (e.g., modal)

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
              <ColumnHider showWhen={showFieldsPreview} duration={150}>
                <span className="flex items-center gap-1.5">
                  <Pencil className="w-4 h-4" />
                  Edit
                </span>
              </ColumnHider>
              <ColumnHider showWhen={!showFieldsPreview} duration={150}>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Preview
                </span>
              </ColumnHider>
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
                What data should each entry capture? (Column titles in the list - see preview above.)
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
                          <Label htmlFor={`field-label-${field._id}`}>Column Label</Label>
                          <Input
                            id={`field-label-${field._id}`}
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="e.g., Pain Level, Item Name"
                          />
                        </div>
                        <div className="w-28">
                          <Label>Type</Label>
                          <button
                            type="button"
                            onClick={() => updateField(index, { type: field.type === 'text' ? 'number' : 'text' })}
                            className={cn(
                              'w-full h-10 px-3 rounded-lg border text-left text-sm overflow-hidden',
                              tw.bg.main,
                              tw.border.muted,
                              tw.hover.border.primary
                            )}
                          >
                            <div className="relative">
                              <RowHider showWhen={field.type === 'text'} duration={150}>
                                <span className={tw.text.primary}>Text</span>
                              </RowHider>
                              <RowHider showWhen={field.type === 'number'} duration={150}>
                                <span className={tw.text.primary}>Number</span>
                              </RowHider>
                            </div>
                          </button>
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

        {/* Setup Section (Security + AI Assistant) */}
        <section className={cn('p-6 rounded-xl', tw.card.default)}>
          {/* Security Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn('text-lg font-semibold', tw.text.primary)}>
                Security
              </h2>
              {authMethod && (
                <button
                  type="button"
                  onClick={() => setAuthMethod(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    tw.bg.hover,
                    tw.text.secondary,
                    tw.hover.bg.subtle,
                    tw.hover.text.primary
                  )}
                >
                  Change
                </button>
              )}
            </div>
            
            <RowHider showWhen={!authMethod} duration={200}>
              <p className={cn('text-sm mb-4', tw.text.muted)}>
                How should requests be authenticated?
              </p>
            </RowHider>

            <div className="space-y-2">
              {AUTH_METHODS.map((method) => {
                const isDisabled = !method.implemented
                const isSelected = authMethod === method.value && !isDisabled
                const isTokenMethod = method.value === 'token'
                const showOption = !authMethod || isSelected
                
                return (
                  <RowHider key={method.value} showWhen={showOption} duration={200}>
                    <div>
                      <label
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isDisabled && 'opacity-50 cursor-not-allowed',
                          isSelected
                            ? isTokenMethod 
                              ? [tw.border.warning, tw.bg.warningMuted]
                              : [tw.border.primary, tw.bg.primaryMuted]
                            : [tw.border.muted, !isDisabled && tw.hover.bg.subtle]
                        )}
                      >
                        <input
                          type="radio"
                          name="auth-method"
                          value={method.value}
                          checked={authMethod === method.value}
                          onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                          disabled={isDisabled}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className={cn('font-medium', tw.text.primary)}>
                            {method.label}
                            {isDisabled && (
                              <span className={cn('ml-2 text-xs font-normal', tw.text.muted)}>
                                (Coming soon)
                              </span>
                            )}
                          </div>
                          <div className={cn('text-sm mt-1', tw.text.muted)}>
                            {method.description}
                          </div>
                        </div>
                        {isSelected && (
                          isTokenMethod 
                            ? <AlertTriangle className={cn('w-5 h-5 mt-0.5', tw.text.warning)} />
                            : <CheckIcon className={cn('w-5 h-5 mt-0.5', tw.text.primary)} />
                        )}
                      </label>
                      {/* Warning message for token auth */}
                      <RowHider showWhen={isSelected && isTokenMethod} duration={200}>
                        <div className={cn('mt-2 p-3 rounded-lg text-sm', tw.bg.warningMuted, tw.text.warning)}>
                          <a 
                            href="https://github.com/moefingers/ai-get-interface/issues/1" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            Known issue #1
                          </a>
                          : AI currently refuse to fetch on initial request. Currently implemented work around is forcing AI to ask for confirmation before executing. AI still frequently refuses browsing the link. Try at your own risk.
                        </div>
                      </RowHider>
                    </div>
                  </RowHider>
                )
              })}
            </div>
          </div>

          {/* AI Assistant Selection (expands after security is selected) */}
          <RowHider showWhen={authMethod !== null} duration={200}>
            <div className={cn('pt-4 border-t', tw.border.muted)}>
              <h3 className={cn('text-lg font-semibold mb-1', tw.text.primary)}>
                AI Assistant <span className={cn('text-sm font-normal', tw.text.muted)}>(optional)</span>
              </h3>
              <p className={cn('text-sm mb-4', tw.text.muted)}>
                Which AI will add items to this list? You can change this later.
              </p>
              <div className="space-y-2">
                {AI_MODELS.map((model) => {
                  const isGoogleAssistant = model.value === 'google-assistant'
                  const isDisabled = isGoogleAssistant
                  
                  return (
                    <label
                      key={model.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        !isDisabled && 'cursor-pointer',
                        aiModel === model.value && !isDisabled
                          ? [tw.border.primary, tw.bg.primaryMuted]
                          : [tw.border.muted, !isDisabled && tw.hover.bg.subtle]
                      )}
                    >
                      <input
                        type="radio"
                        name="ai-model"
                        value={model.value}
                        checked={aiModel === model.value}
                        onChange={(e) => setAiModel(e.target.value as AiModel)}
                        disabled={isDisabled}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className={tw.text.primary}>
                          {model.label}
                          {isDisabled && (
                            <span className={cn('ml-2 text-xs font-normal', tw.text.muted)}>
                              (Coming soon)
                            </span>
                          )}
                        </div>
                        <div className={cn('text-sm', tw.text.muted)}>
                          Paste to: {model.destination}
                        </div>
                      </div>
                      {aiModel === model.value && !isDisabled && (
                        <CheckIcon className={cn('w-5 h-5', tw.text.primary)} />
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          </RowHider>
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
    authMethod: AuthMethod
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
    authMethod: list.authMethod,
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
