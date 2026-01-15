'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Minus, Plus, Grid2X2, List } from 'lucide-react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'
import { RowHider } from './RowHider'
import { SlidingView, SlidingViewItem } from './SlidingView'
import {
  getNumberInputMode,
  setNumberInputMode,
  type NumberInputMode,
} from '@/lib/field-preferences'

export interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  /** List ID for persisting input mode preference */
  listId?: string
  /** Field name for persisting input mode preference */
  fieldName?: string
}

const INCREMENTS = [1, 10, 100, 1000] as const
const DROPDOWN_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export function NumberInput({
  value,
  onChange,
  placeholder,
  onKeyDown,
  className,
  listId,
  fieldName,
}: NumberInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [inputMode, setInputMode] = useState<NumberInputMode>('increments')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load persisted input mode on mount
  useEffect(() => {
    if (listId && fieldName) {
      setInputMode(getNumberInputMode(listId, fieldName))
    }
  }, [listId, fieldName])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsManualEntry(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when manual entry mode is activated
  useEffect(() => {
    if (isManualEntry && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isManualEntry])

  const numericValue = value === '' ? 0 : Number(value) || 0

  const handleIncrement = useCallback(
    (amount: number) => {
      const newValue = numericValue + amount
      onChange(String(newValue))
    },
    [numericValue, onChange]
  )

  const handleManualChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      // Allow empty string or valid numbers (including negatives)
      if (newValue === '' || newValue === '-' || !isNaN(Number(newValue))) {
        onChange(newValue)
      }
    },
    [onChange]
  )

  const handleManualKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setIsManualEntry(false)
        setIsOpen(false)
        onKeyDown?.(e)
      } else if (e.key === 'Escape') {
        setIsManualEntry(false)
        setIsOpen(false)
      }
    },
    [onKeyDown]
  )

  const handleModeToggle = useCallback(() => {
    const newMode: NumberInputMode = inputMode === 'increments' ? 'dropdown' : 'increments'
    setInputMode(newMode)
    if (listId && fieldName) {
      setNumberInputMode(listId, fieldName, newMode)
    }
  }, [inputMode, listId, fieldName])

  const handleDropdownSelect = useCallback(
    (num: number) => {
      onChange(String(num))
      setIsOpen(false)
    },
    [onChange]
  )

  const displayValue = value === '' ? placeholder : value

  // Determine active view index: 0 = increments, 1 = dropdown
  const activeViewIndex = inputMode === 'increments' ? 0 : 1

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setIsManualEntry(false)
        }}
        className={cn(
          'flex items-center gap-1 w-full text-left bg-transparent outline-none',
          value ? tw.text.primary : tw.text.muted
        )}
      >
        <span className="flex-1 truncate">{displayValue}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu with RowHider animation */}
      <div className="absolute bottom-full left-0 right-0 mb-2">
        <RowHider showWhen={isOpen}>
          <div
            className={cn(
              'p-2 rounded-lg shadow-lg',
              tw.bg.elevated,
              'border',
              tw.border.default
            )}
          >
            {isManualEntry ? (
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={value}
                onChange={handleManualChange}
                onKeyDown={handleManualKeyDown}
                placeholder="Enter number..."
                className={cn(
                  'w-full px-3 py-2 rounded-md text-center',
                  tw.bg.card,
                  'border',
                  tw.border.default,
                  tw.text.primary,
                  tw.placeholder.default,
                  'outline-none',
                  tw.focus.border.primary
                )}
              />
            ) : (
              <div className="relative">
                {/* Mode toggle icon in corner */}
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className={cn(
                    'absolute top-0 right-0 p-1 rounded transition-colors z-10',
                    tw.hover.bg.subtle,
                    tw.text.muted
                  )}
                  title={inputMode === 'increments' ? 'Switch to 0-10 dropdown' : 'Switch to increments'}
                >
                  {inputMode === 'increments' ? (
                    <List className="w-3.5 h-3.5" />
                  ) : (
                    <Grid2X2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Sliding views container */}
                <SlidingView activeIndex={activeViewIndex} viewCount={2} autoHeight>
                  {/* View 0: Increments mode */}
                  <SlidingViewItem autoHeight>
                    <div className="pr-6">
                      {/* Two columns: + on left, - on right */}
                      <div className="flex gap-2">
                        {/* Plus column */}
                        <div className="flex-1 space-y-1">
                          {INCREMENTS.map((inc) => (
                            <button
                              key={`plus-${inc}`}
                              type="button"
                              onClick={() => handleIncrement(inc)}
                              className={cn(
                                'w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                                tw.hover.bg.subtle,
                                tw.text.secondary
                              )}
                            >
                              <Plus className="w-3 h-3" />
                              {inc}
                            </button>
                          ))}
                        </div>

                        {/* Minus column */}
                        <div className="flex-1 space-y-1">
                          {INCREMENTS.map((inc) => (
                            <button
                              key={`minus-${inc}`}
                              type="button"
                              onClick={() => handleIncrement(-inc)}
                              className={cn(
                                'w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                                tw.hover.bg.subtle,
                                tw.text.secondary
                              )}
                            >
                              <Minus className="w-3 h-3" />
                              {inc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className={cn('h-px my-2', tw.bg.hover)} />

                      {/* Manual entry button */}
                      <button
                        type="button"
                        onClick={() => setIsManualEntry(true)}
                        className={cn(
                          'w-full px-3 py-2 rounded-md text-sm text-center transition-colors',
                          tw.hover.bg.subtle,
                          tw.text.secondary
                        )}
                      >
                        Manual entry
                      </button>
                    </div>
                  </SlidingViewItem>

                  {/* View 1: 0-10 Dropdown mode */}
                  <SlidingViewItem autoHeight>
                    <div className="pr-6">
                      <div className="grid grid-cols-4 gap-1">
                        {DROPDOWN_VALUES.map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleDropdownSelect(num)}
                            className={cn(
                              'px-2 py-1.5 rounded-md text-sm font-medium transition-colors text-center',
                              tw.hover.bg.subtle,
                              value === String(num) ? tw.text.primary : tw.text.secondary,
                              value === String(num) && tw.bg.hover
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className={cn('h-px my-2', tw.bg.hover)} />

                      {/* Manual entry button */}
                      <button
                        type="button"
                        onClick={() => setIsManualEntry(true)}
                        className={cn(
                          'w-full px-3 py-2 rounded-md text-sm text-center transition-colors',
                          tw.hover.bg.subtle,
                          tw.text.secondary
                        )}
                      >
                        Manual entry
                      </button>
                    </div>
                  </SlidingViewItem>
                </SlidingView>
              </div>
            )}
          </div>
        </RowHider>
      </div>
    </div>
  )
}
