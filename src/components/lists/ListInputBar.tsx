'use client'

import { useState, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { NumberInput } from '@/components/ui'
import type { ListFieldDefinition } from '@/types/list-fields'

export interface ListInputBarProps {
  listName: string
  fields: ListFieldDefinition[]
  isSettingsOpen: boolean
  onToggleSettings: () => void
  onSubmit: (values: Record<string, string>) => void
  isSubmitting?: boolean
}

export function ListInputBar({
  listName,
  fields,
  isSettingsOpen,
  onToggleSettings,
  onSubmit,
  isSubmitting = false,
}: ListInputBarProps) {
  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)
  
  // Initialize state for all fields
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of fields) {
      initial[field.name] = ''
    }
    return initial
  })

  const handleChange = useCallback((fieldName: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    // Check if any required fields are empty
    const hasRequiredEmpty = sortedFields.some(
      (f) => f.required && !values[f.name]?.trim()
    )
    if (hasRequiredEmpty) return

    onSubmit(values)
    
    // Clear all fields after submit
    setValues((prev) => {
      const cleared: Record<string, string> = {}
      for (const key of Object.keys(prev)) {
        cleared[key] = ''
      }
      return cleared
    })
  }, [sortedFields, values, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // If no fields defined, show a single generic input
  const hasFields = sortedFields.length > 0

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-xl',
            tw.bg.card,
            'border',
            tw.border.default
          )}
        >
          {/* Settings button */}
          <button
            type="button"
            onClick={onToggleSettings}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0',
              isSettingsOpen ? tw.text.accent : tw.text.muted,
              tw.hover.text.primary,
              tw.hover.bg.subtle
            )}
            title="List settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Input field(s) */}
          {hasFields ? (
            sortedFields.map((field, idx) =>
              field.type === 'number' ? (
                <NumberInput
                  key={field.name}
                  value={values[field.name] || ''}
                  onChange={(v) => handleChange(field.name, v)}
                  placeholder={field.label + (field.required ? '' : ' (optional)')}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    'flex-1 min-w-0',
                    idx > 0 && ['border-l pl-2', tw.border.muted]
                  )}
                />
              ) : (
                <input
                  key={field.name}
                  type="text"
                  placeholder={field.label + (field.required ? '' : ' (optional)')}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    'flex-1 min-w-0 bg-transparent outline-none',
                    'border-0 border-b border-transparent',
                    tw.text.primary,
                    tw.placeholder.default,
                    tw.focus.outline.none,
                    tw.focus.border.primary,
                    'focus:ring-0',
                    idx > 0 && 'pl-2'
                  )}
                />
              )
            )
          ) : (
            <input
              type="text"
              placeholder={`Add to ${listName}...`}
              onKeyDown={handleKeyDown}
              className={cn(
                'flex-1 min-w-0 bg-transparent outline-none',
                'border-0 border-b border-transparent',
                tw.text.primary,
                tw.placeholder.default,
                tw.focus.outline.none,
                tw.focus.border.primary,
                'focus:ring-0'
              )}
            />
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              tw.btn.primary,
              'px-4 py-2 shrink-0',
              isSubmitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
