'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Label, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { publishList, deleteDraft, type PublishListResponse } from '@/app/lists/actions'
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
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
]

type Step = 'edit' | 'success'

export function DraftEditor({
  listId,
  initialName,
  initialFields,
  initialAiModel,
  onPublished,
  onDeleted,
}: DraftEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('edit')
  const [error, setError] = useState<string | null>(null)
  const [publishedList, setPublishedList] = useState<PublishListResponse | null>(null)

  const [name, setName] = useState(initialName === 'New List' ? '' : initialName)
  const [fields, setFields] = useState<ListFieldDefinition[]>(
    initialFields.length > 0 
      ? initialFields 
      : [{ name: 'item', label: 'Item', type: 'text', required: true, order: 0 }]
  )
  const [aiModel, setAiModel] = useState<AiModel>(initialAiModel || 'chatgpt')

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        name: '',
        label: '',
        type: 'text' as FieldType,
        required: true,
        order: prev.length,
      },
    ])
  }

  const removeField = (index: number) => {
    if (fields.length <= 1) return
    setFields((prev) => prev.filter((_, i) => i !== index))
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
        fields,
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

  const canPublish = name.trim().length > 0 && fields.every((f) => f.name && f.label)

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
        <div>
          <h1 className={cn('text-2xl font-bold mb-2', tw.text.primary)}>
            Create New List
          </h1>
          <p className={cn('text-sm', tw.text.muted)}>
            Configure your list, then publish to get AI instructions.
          </p>
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
          <h2 className={cn('text-lg font-semibold mb-4', tw.text.primary)}>
            Fields
          </h2>
          <p className={cn('text-sm mb-4', tw.text.muted)}>
            What data should each entry capture?
          </p>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border space-y-3',
                  tw.bg.main,
                  tw.border.muted
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`field-label-${index}`}>Label</Label>
                    <Input
                      id={`field-label-${index}`}
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="e.g., Pain Level, Item Name"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`field-type-${index}`}>Type</Label>
                    <Select
                      id={`field-type-${index}`}
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

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className={cn('text-sm', tw.text.error)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
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
