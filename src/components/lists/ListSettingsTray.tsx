'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Copy, Check, ChevronDown, AlertTriangle, Pencil, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { RowHider, SlidingView, SlidingViewItem } from '@/components/ui'
import type { UserList } from '@/components/layout'
import {
  AI_MODELS,
  AUTH_METHODS,
  INSTRUCTION_STYLES,
  generateAiInstructions,
  type AiModel,
  type AiModelInfo,
  type AuthMethod,
  type InstructionStyle,
  type InstructionStyleInfo,
} from '@/lib/ai-instructions'
import type { ListFieldDefinition } from '@/types/list-fields'
import { renameList, convertToDraft } from '@/app/lists/actions'

export interface ListSettingsTrayProps {
  list: UserList
  isOpen: boolean
  onClose: () => void
  onRenamed?: (newName: string) => void
}

const TRAY_ANIMATION_MS = 300

export function ListSettingsTray({ list, isOpen, onClose, onRenamed }: ListSettingsTrayProps) {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<AiModel>((list.aiModel as AiModel) ?? 'chatgpt')
  const [selectedStyle, setSelectedStyle] = useState<InstructionStyle>(
    // Default to 'browser' for session auth (fetch won't work), otherwise 'fetch'
    list.authMethod === 'session' ? 'browser' : 'fetch'
  )
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [isPending, startTransition] = useTransition()
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)

  // Reset edit state when list changes
  useEffect(() => {
    setEditName(list.name)
    setIsEditing(false)
    // Sync AI model from list data
    if (list.aiModel) {
      setSelectedModel(list.aiModel as AiModel)
    }
    // Reset style based on auth method (default to browser for session, fetch otherwise)
    setSelectedStyle(list.authMethod === 'session' ? 'browser' : 'fetch')
  }, [list.id, list.name, list.authMethod, list.aiModel])

  // Filter available instruction styles based on auth method and model
  // Session auth requires browser interaction - fetch won't have session cookies
  // ChatGPT can't open browser - only Gemini has that capability
  const availableStyles = INSTRUCTION_STYLES.filter(s => {
    if (list.authMethod === 'session' && s.value === 'fetch') return false
    if (selectedModel === 'chatgpt' && s.value === 'browser') return false
    return true
  })

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

  const handleConvertToDraft = () => {
    startTransition(async () => {
      const result = await convertToDraft(list.id)
      if (result.success) {
        onClose()
        router.refresh()
      }
    })
  }

  const authMethodInfo = AUTH_METHODS.find((m) => m.value === list.authMethod) || AUTH_METHODS[0]
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
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                      'flex-1 px-2 py-1 rounded border text-sm min-w-0',
                      tw.bg.main,
                      tw.border.default,
                      tw.text.primary,
                      'focus:outline-none',
                      tw.focus.border.primary
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isPending}
                    className={cn(
                      'p-1 rounded transition-colors',
                      tw.text.success,
                      tw.hover.bg.subtle
                    )}
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(list.name)
                      setIsEditing(false)
                    }}
                    disabled={isPending}
                    className={cn(
                      'p-1 rounded transition-colors',
                      tw.text.muted,
                      'hover:text-error',
                      tw.hover.bg.subtle
                    )}
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    'flex items-center gap-2 text-sm text-left px-2 py-1 rounded group',
                    tw.text.primary,
                    tw.hover.bg.subtle,
                    'transition-colors'
                  )}
                >
                  <span>{list.name}</span>
                  <Pencil className={cn('w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity', tw.text.primary)} />
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

            {/* Auth Method (read-only) */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                Auth Method
              </label>
              <p className={cn('text-sm px-2 py-1', tw.text.secondary)}>
                {authMethodInfo.label}
              </p>
            </div>

            {/* Fields count */}
            <div>
              <label className={cn('text-xs font-medium mb-1 block', tw.text.muted)}>
                {fields.length} Field{fields.length !== 1 ? 's' : ''}
              </label>
              <p className={cn('text-sm px-2 py-1', tw.text.secondary)}>
                {fields.length > 0 
                  ? fields.map(f => '"' + (f.label || f.name) + '"').join(', ')
                  : 'No fields configured'}
              </p>
            </div>
          </div>

          {/* Change Setup Section */}
          <div className={cn('mb-6 p-4 rounded-lg border overflow-hidden', tw.border.muted, tw.bg.card)}>
            <SlidingView activeIndex={showConvertConfirm ? 1 : 0} viewCount={2}>
              <SlidingViewItem>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn('text-sm font-medium', tw.text.primary)}>
                      Need to change auth, slug, or fields?
                    </p>
                    <p className={cn('text-xs mt-0.5', tw.text.muted)}>
                      Convert back to draft to make instruction breaking changes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConvertConfirm(true)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm',
                      tw.bg.hover,
                      tw.text.secondary,
                      tw.hover.bg.subtle,
                      tw.hover.text.primary,
                      'transition-colors'
                    )}
                  >
                    Change Setup
                  </button>
                </div>
              </SlidingViewItem>
              <SlidingViewItem>
                <div className="flex flex-row items-start gap-3">
                  <div className={cn('flex-1 flex items-start gap-2 text-sm', tw.text.warning)}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      This will unpublish your list. Any AI assistants using the current instructions 
                      will stop working until you re-publish and update any changed instructions.
                    </p>
                  </div>
                  <div className="flex flex-row items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConvertConfirm(false)}
                      disabled={isPending}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm',
                        tw.text.secondary,
                        tw.hover.bg.subtle,
                        'transition-colors'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConvertToDraft}
                      disabled={isPending}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap',
                        tw.bg.error,
                        'text-white',
                        'hover:opacity-90',
                        'transition-colors'
                      )}
                    >
                      {isPending ? 'Converting...' : 'Convert to Draft'}
                    </button>
                  </div>
                </div>
              </SlidingViewItem>
            </SlidingView>
          </div>

          {/* AI Instructions Section */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <label className={cn('text-sm font-medium', tw.text.primary)}>
                Instructions for
              </label>
              <ModelSelector
                models={AI_MODELS}
                selected={selectedModel}
                onChange={setSelectedModel}
              />
              <StyleSelector
                styles={availableStyles}
                selected={selectedStyle}
                onChange={setSelectedStyle}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                  tw.bg.main,
                  tw.border.default,
                  'border',
                  copied ? tw.text.success : tw.text.primary,
                  tw.hover.bg.subtle,
                  'transition-colors'
                )}
                title={copied ? 'Copied!' : 'Copy instructions'}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={selectedModelInfo.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                  tw.bg.main,
                  tw.border.default,
                  'border',
                  tw.text.accent,
                  tw.hover.bg.subtle,
                  'transition-colors'
                )}
              >
                Go to {selectedModelInfo.destination}
              </a>
            </div>

            {/* Gemini browser warning */}
            <RowHider showWhen={selectedModel === 'gemini' && selectedStyle === 'browser'}>
              <div className={cn(
                'mb-3 px-3 py-2 rounded-lg border text-xs',
                tw.border.warning,
                tw.bg.warningMuted,
                tw.text.warning
              )}>
                <span>Gemini may claim success without opening browser unless you say [open | launch] [browser | chrome]. </span>
                <a
                  href="https://github.com/moefingers/ai-get-interface/issues/3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('inline-flex items-center gap-1 underline', tw.hover.text.primary)}
                >
                  Known issue #3
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </RowHider>

            {/* Gemini fetch warning */}
            <RowHider showWhen={selectedModel === 'gemini' && selectedStyle === 'fetch'}>
              <div className={cn(
                'mb-3 px-3 py-2 rounded-lg border text-xs',
                tw.border.warning,
                tw.bg.warningMuted,
                tw.text.warning
              )}>
                <span>AI may not fetch URL on initial prompt. </span>
                <a
                  href="https://github.com/moefingers/ai-get-interface/issues/1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('inline-flex items-center gap-1 underline', tw.hover.text.primary)}
                >
                  Known issue #1
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </RowHider>

            {/* Gemini link warning */}
            <RowHider showWhen={selectedModel === 'gemini' && selectedStyle === 'link'}>
              <div className={cn(
                'mb-3 px-3 py-2 rounded-lg border text-xs',
                tw.border.warning,
                tw.bg.warningMuted,
                tw.text.warning
              )}>
                <span>Gemini links redirect to Google search. Workaround: Select and open, or copy/paste URL. </span>
                <a
                  href="https://github.com/moefingers/ai-get-interface/issues/4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('inline-flex items-center gap-1 underline', tw.hover.text.primary)}
                >
                  Known issue #4
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </RowHider>

            {/* Instructions preview */}
            <div className={cn('rounded-lg border', tw.border.default, tw.bg.main)}>
              <pre className={cn(
                'p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto',
                tw.text.secondary
              )}>
                {instructions}
              </pre>
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
            {models.map((model) => {
              const isGoogleAssistant = model.value === 'google-assistant'
              const isDisabled = isGoogleAssistant
              // const isDisabled = false

              
              return (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(model.value)
                      setIsOpen(false)
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm',
                    isDisabled && 'opacity-30 cursor-not-allowed',
                    selected === model.value && !isDisabled ? tw.text.accent : tw.text.primary,
                    !isDisabled && tw.hover.bg.subtle,
                    'transition-colors'
                  )}
                >
                  {model.label}
                  
                </button>
              )
            })}
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
  // Fallback to first style if selected is not in available styles (can happen during model switch)
  const selectedInfo = styles.find((s) => s.value === selected) ?? styles[0]
  const effectiveSelected = selectedInfo?.value ?? selected

  // Auto-correct if the selected style isn't available
  useEffect(() => {
    if (!styles.find((s) => s.value === selected) && styles.length > 0) {
      onChange(styles[0].value)
    }
  }, [styles, selected, onChange])

  if (!selectedInfo) return null

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
          {/* Dropup - opens above the button */}
          <div className={cn(
            'absolute bottom-full left-0 mb-1 py-1 rounded-lg border shadow-lg z-20 min-w-44',
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
                  effectiveSelected === style.value ? tw.text.accent : tw.text.primary,
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
