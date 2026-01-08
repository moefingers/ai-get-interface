'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Copy, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { RowHider } from '@/components/ui'
import type { UserList } from '@/components/layout'
import {
  AI_MODELS,
  INSTRUCTION_STYLES,
  generateAiInstructions,
  type AiModel,
  type AiModelInfo,
  type AuthMethod,
  type InstructionStyle,
  type InstructionStyleInfo,
} from '@/lib/ai-instructions'
import type { ListFieldDefinition } from '@/types/list-fields'
import { renameList } from '@/app/lists/actions'

export interface ListSettingsTrayProps {
  list: UserList
  isOpen: boolean
  onClose: () => void
  onRenamed?: (newName: string) => void
}

const TRAY_ANIMATION_MS = 300

export function ListSettingsTray({ list, isOpen, onClose, onRenamed }: ListSettingsTrayProps) {
  const [selectedModel, setSelectedModel] = useState<AiModel>('chatgpt')
  const [selectedStyle, setSelectedStyle] = useState<InstructionStyle>('fetch')
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [isPending, startTransition] = useTransition()

  // Reset edit state when list changes
  useEffect(() => {
    setEditName(list.name)
    setIsEditing(false)
  }, [list.id, list.name])

  // Parse fields from JSON
  const fields: ListFieldDefinition[] = (() => {
    try {
      const parsed = JSON.parse(list.fields)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  // Generate instructions for selected model and style
  const instructions = generateAiInstructions(selectedModel, {
    listName: list.name,
    slug: list.slug,
    token: list.authToken,
    authMethod: list.authMethod as AuthMethod,
    domain: typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
    fields: fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required,
    })),
    style: selectedStyle,
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(instructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveName = () => {
    if (editName.trim() && editName !== list.name) {
      startTransition(async () => {
        const result = await renameList(list.id, editName.trim())
        if (result.success) {
          onRenamed?.(editName.trim())
          setIsEditing(false)
        }
      })
    } else {
      setIsEditing(false)
    }
  }

  const selectedModelInfo = AI_MODELS.find((m) => m.value === selectedModel)!

  return (
    <RowHider showWhen={isOpen} duration={TRAY_ANIMATION_MS}>
      <div>
        <div className="max-w-3xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('text-lg font-semibold', tw.text.primary)}>
              List Settings
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                tw.text.muted,
                tw.hover.text.primary,
                tw.hover.bg.subtle
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Name (editable) */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                Name
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') {
                        setEditName(list.name)
                        setIsEditing(false)
                      }
                    }}
                    autoFocus
                    disabled={isPending}
                    className={cn(
                      'flex-1 px-2 py-1 rounded border text-sm',
                      tw.bg.main,
                      tw.border.default,
                      tw.text.primary,
                      'focus:outline-none',
                      tw.focus.border.primary
                    )}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    'text-sm text-left w-full px-2 py-1 rounded',
                    tw.text.primary,
                    tw.hover.bg.subtle,
                    'transition-colors'
                  )}
                >
                  {list.name}
                </button>
              )}
            </div>

            {/* Slug (read-only) */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                Slug
              </label>
              <p className={cn('text-sm px-2 py-1', tw.text.secondary)}>
                {list.slug}
              </p>
            </div>

            {/* Fields count */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                Fields
              </label>
              <p className={cn('text-sm px-2 py-1', tw.text.secondary)}>
                {fields.length} field{fields.length !== 1 ? 's' : ''} configured
              </p>
            </div>

            {/* Status */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                Status
              </label>
              <p className={cn('text-sm px-2 py-1', tw.text.secondary)}>
                {list.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* AI Instructions Section */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <label className={cn('text-sm font-medium', tw.text.primary)}>
                Instructions for
              </label>
              <ModelSelector
                models={AI_MODELS}
                selected={selectedModel}
                onChange={setSelectedModel}
              />
              <StyleSelector
                styles={INSTRUCTION_STYLES}
                selected={selectedStyle}
                onChange={setSelectedStyle}
              />
              <a
                href={selectedModelInfo.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('text-xs underline', tw.text.accent)}
              >
                Go to {selectedModelInfo.destination} →
              </a>
            </div>

            {/* Instructions preview with copy */}
            <div className={cn('relative rounded-lg border', tw.border.default, tw.bg.main)}>
              <pre className={cn(
                'p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto',
                tw.text.secondary
              )}>
                {instructions}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'absolute top-2 right-2 p-2 rounded-lg transition-colors',
                  tw.bg.card,
                  tw.border.default,
                  'border',
                  copied ? tw.text.success : tw.text.muted,
                  !copied && tw.hover.text.primary,
                  !copied && tw.hover.bg.subtle
                )}
                title={copied ? 'Copied!' : 'Copy instructions'}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RowHider>
  )
}

interface ModelSelectorProps {
  models: AiModelInfo[]
  selected: AiModel
  onChange: (model: AiModel) => void
}

function ModelSelector({ models, selected, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedInfo = models.find((m) => m.value === selected)!

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
          tw.bg.main,
          tw.border.default,
          'border',
          tw.text.primary,
          tw.hover.bg.subtle,
          'transition-colors'
        )}
      >
        {selectedInfo.label}
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className={cn(
            'absolute top-full left-0 mt-1 py-1 rounded-lg border shadow-lg z-20 min-w-35',
            tw.bg.elevated,
            tw.border.default
          )}>
            {models.map((model) => (
              <button
                key={model.value}
                type="button"
                onClick={() => {
                  onChange(model.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm',
                  selected === model.value ? tw.text.accent : tw.text.primary,
                  tw.hover.bg.subtle,
                  'transition-colors'
                )}
              >
                {model.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface StyleSelectorProps {
  styles: InstructionStyleInfo[]
  selected: InstructionStyle
  onChange: (style: InstructionStyle) => void
}

function StyleSelector({ styles, selected, onChange }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedInfo = styles.find((s) => s.value === selected)!

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
          tw.bg.main,
          tw.border.default,
          'border',
          tw.text.primary,
          tw.hover.bg.subtle,
          'transition-colors'
        )}
      >
        {selectedInfo.label}
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className={cn(
            'absolute top-full left-0 mt-1 py-1 rounded-lg border shadow-lg z-20 min-w-44',
            tw.bg.elevated,
            tw.border.default
          )}>
            {styles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => {
                  onChange(style.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm',
                  selected === style.value ? tw.text.accent : tw.text.primary,
                  tw.hover.bg.subtle,
                  'transition-colors'
                )}
              >
                <div>{style.label}</div>
                <div className={cn('text-xs mt-0.5', tw.text.muted)}>
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
