'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
}

const INCREMENTS = [1, 10, 100, 1000] as const

export function NumberInput({
  value,
  onChange,
  placeholder,
  onKeyDown,
  className,
}: NumberInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const displayValue = value === '' ? placeholder : value

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

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-full left-0 right-0 mb-2 p-2 rounded-lg shadow-lg z-50',
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
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
