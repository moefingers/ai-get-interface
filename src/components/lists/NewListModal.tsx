'use client'

import { useState, useTransition } from 'react'
import { Modal, Button, Input, Label, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { createDraft, publishList, type PublishListResponse } from '@/app/lists/actions'
import { 
  AI_MODELS, 
  generateAiInstructions, 
  getAiModelInfo,
  type AiModel,
  type AuthMethod,
  AUTH_METHODS,
} from '@/lib/ai-instructions'
import type { ListFieldDefinition, FieldType } from '@/types/list-fields'

export interface NewListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type Step = 'name' | 'fields' | 'auth-method' | 'ai-model' | 'success'

interface FormState {
  name: string
  fields: ListFieldDefinition[]
  authMethod: AuthMethod
  aiModel: AiModel
  draftId: string | null  // Track draft created internally
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
]

export function NewListModal({ open, onOpenChange, onSuccess }: NewListModalProps) {
  const [step, setStep] = useState<Step>('name')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdList, setCreatedList] = useState<PublishListResponse | null>(null)
  
  const [form, setForm] = useState<FormState>({
    name: '',
    fields: [{ name: 'item', label: 'Item', type: 'text', required: true, order: 0 }],
    authMethod: 'token',
    aiModel: 'chatgpt',
    draftId: null,
  })

  const resetForm = () => {
    setStep('name')
    setError(null)
    setCreatedList(null)
    setForm({
      name: '',
      fields: [{ name: 'item', label: 'Item', type: 'text', required: true, order: 0 }],
      authMethod: 'token',
      aiModel: 'chatgpt',
      draftId: null,
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset after modal animation
    setTimeout(resetForm, 200)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      // Create draft first if not already created
      let draftId = form.draftId
      if (!draftId) {
        const draftResult = await createDraft()
        if (!draftResult.success) {
          setError(draftResult.error)
          return
        }
        draftId = draftResult.list.id
        setForm((prev) => ({ ...prev, draftId }))
      }

      // Publish the draft
      const result = await publishList({
        listId: draftId,
        name: form.name,
        authMethod: form.authMethod,
        aiModel: form.aiModel,
        fields: form.fields,
      })

      if (result.success) {
        setCreatedList(result)
        setStep('success')
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  const addField = () => {
    setForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          name: '',
          label: '',
          type: 'text' as FieldType,
          required: true,
          order: prev.fields.length,
        },
      ],
    }))
  }

  const removeField = (index: number) => {
    if (form.fields.length <= 1) return
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }))
  }

  const updateField = (index: number, updates: Partial<ListFieldDefinition>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== index) return f
        const updated = { ...f, ...updates }
        // Auto-generate name from label if not manually set
        if (updates.label && !f.name) {
          updated.name = updates.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
        }
        return updated
      }),
    }))
  }

  const canProceedFromName = form.name.trim().length > 0
  const canProceedFromFields = form.fields.every((f) => f.name && f.label)

  const getStepTitle = () => {
    switch (step) {
      case 'name':
        return 'Create New List'
      case 'fields':
        return 'Define Fields'
      case 'auth-method':
        return 'Security Method'
      case 'ai-model':
        return 'Choose AI Assistant'
      case 'success':
        return 'List Created!'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'name':
        return 'Give your list a name'
      case 'fields':
        return 'What data should each entry have?'
      case 'auth-method':
        return 'How should requests be authenticated?'
      case 'ai-model':
        return 'Which AI will add items to this list?'
      case 'success':
        return 'Copy these instructions to your AI'
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={getStepTitle()}
      description={getStepDescription()}
      maxWidth={step === 'success' ? 'max-w-2xl' : 'max-w-md'}
    >
      {/* Step: Name */}
      {step === 'name' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="list-name" required>
              List Name
            </Label>
            <Input
              id="list-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Grocery List, Pain Log, Workout Tracker"
              autoFocus
            />
          </div>

          {error && (
            <p className={cn('text-sm', tw.text.error)}>{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setError(null)
                setStep('fields')
              }}
              disabled={!canProceedFromName}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step: Fields */}
      {step === 'fields' && (
        <div className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {form.fields.map((field, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg border space-y-2',
                  tw.bg.card,
                  tw.border.muted
                )}
              >
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`field-label-${index}`}>Label</Label>
                    <Input
                      id={`field-label-${index}`}
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="e.g., Pain Level"
                    />
                  </div>
                  <div className="w-28">
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
                  
                  {form.fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className={cn('text-sm', tw.text.error, tw.hover.text.accent)}
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
              'w-full py-2 border border-dashed rounded-lg text-sm',
              tw.border.muted,
              tw.text.secondary,
              tw.hover.bg.subtle
            )}
          >
            + Add Field
          </button>

          {error && (
            <p className={cn('text-sm', tw.text.error)}>{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('name')}>
              Back
            </Button>
            <Button
              onClick={() => {
                setError(null)
                setStep('auth-method')
              }}
              disabled={!canProceedFromFields}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step: Auth Method */}
      {step === 'auth-method' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {AUTH_METHODS.map((method) => (
              <label
                key={method.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  form.authMethod === method.value
                    ? [tw.border.primary, tw.bg.primaryMuted]
                    : [tw.border.muted, tw.hover.bg.subtle]
                )}
              >
                <input
                  type="radio"
                  name="auth-method"
                  value={method.value}
                  checked={form.authMethod === method.value}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, authMethod: e.target.value as AuthMethod }))
                  }
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className={cn('font-medium', tw.text.primary)}>{method.label}</div>
                  <div className={cn('text-sm mt-1', tw.text.muted)}>
                    {method.description}
                  </div>
                </div>
                {form.authMethod === method.value && (
                  <CheckIcon className={cn('w-5 h-5 mt-0.5', tw.text.primary)} />
                )}
              </label>
            ))}
          </div>

          {error && (
            <p className={cn('text-sm', tw.text.error)}>{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('fields')}>
              Back
            </Button>
            <Button
              onClick={() => {
                setError(null)
                setStep('ai-model')
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step: AI Model */}
      {step === 'ai-model' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {AI_MODELS.map((model) => (
              <label
                key={model.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  form.aiModel === model.value
                    ? [tw.border.primary, tw.bg.primaryMuted]
                    : [tw.border.muted, tw.hover.bg.subtle]
                )}
              >
                <input
                  type="radio"
                  name="ai-model"
                  value={model.value}
                  checked={form.aiModel === model.value}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, aiModel: e.target.value as AiModel }))
                  }
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className={tw.text.primary}>{model.label}</div>
                  <div className={cn('text-sm', tw.text.muted)}>
                    Paste to: {model.destination}
                  </div>
                </div>
                {form.aiModel === model.value && (
                  <CheckIcon className={cn('w-5 h-5', tw.text.primary)} />
                )}
              </label>
            ))}
          </div>

          {error && (
            <p className={cn('text-sm', tw.text.error)}>{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('auth-method')}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && createdList?.success && (
        <SuccessStep
          list={createdList.list}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
}

interface SuccessStepProps {
  list: {
    name: string
    slug: string
    authToken: string
    authMethod: AuthMethod
    aiModel: string
    fields: ListFieldDefinition[]
  }
  onClose: () => void
}

function SuccessStep({ list, onClose }: SuccessStepProps) {
  const [copied, setCopied] = useState(false)
  const modelInfo = getAiModelInfo(list.aiModel as AiModel)

  // Get domain - in production this would be the actual domain
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
    <div className="space-y-4">
      <div className={cn('p-3 rounded-lg', tw.bg.successMuted)}>
        <p className={cn('text-sm', tw.text.success)}>
          Your list &quot;{list.name}&quot; has been created!
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Instructions for {modelInfo.label}</Label>
          <a
            href={modelInfo.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-sm', tw.text.accent, tw.hover.text.primary)}
          >
            Open {modelInfo.destination} →
          </a>
        </div>
        
        <div
          className={cn(
            'p-3 rounded-lg border max-h-64 overflow-y-auto font-mono text-xs whitespace-pre-wrap',
            tw.bg.main,
            tw.border.muted,
            tw.text.secondary
          )}
        >
          {instructions}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
        <Button onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Instructions'}
        </Button>
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
