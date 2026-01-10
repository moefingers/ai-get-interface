'use client'

import { useState, useEffect, useCallback } from 'react'
import { SignIn, SignUp } from '@stackframe/stack'
import { SlidingView, SlidingViewItem } from '@/components/ui/SlidingView'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

type AuthTab = 'sign-in' | 'sign-up'

const TABS: { id: AuthTab; label: string }[] = [
  { id: 'sign-in', label: 'Sign In' },
  { id: 'sign-up', label: 'Sign Up' },
]

function getTabFromHash(): AuthTab {
  if (typeof window === 'undefined') return 'sign-up'
  const hash = window.location.hash.replace('#', '')
  return hash === 'sign-in' ? 'sign-in' : 'sign-up'
}

export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<AuthTab>('sign-up')
  const [mounted, setMounted] = useState(false)

  // Read hash on mount
  useEffect(() => {
    setActiveTab(getTabFromHash())
    setMounted(true)
  }, [])

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    function handleHashChange() {
      setActiveTab(getTabFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleTabChange = useCallback((tab: AuthTab) => {
    setActiveTab(tab)
    // Update URL hash without adding to history
    history.replaceState(null, '', `#${tab}`)
  }, [])

  const activeIndex = activeTab === 'sign-in' ? 0 : 1

  return (
    <div className={cn('w-full max-w-md mx-auto', tw.bg.card, 'rounded-2xl')}>
      {/* Tab buttons */}
      <div className={cn('flex border-b', tw.border.default)}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex-1 py-4 text-center font-medium transition-colors relative',
              activeTab === tab.id
                ? tw.text.primary
                : cn(tw.text.muted, tw.hover.text.primary)
            )}
          >
            {tab.label}
            {/* Active indicator */}
            <span
              className={cn(
                'absolute bottom-0 left-0 right-0 h-0.5 transition-colors',
                activeTab === tab.id ? tw.bg.primary : 'bg-transparent'
              )}
            />
          </button>
        ))}
      </div>

      {/* Sliding content - hide until mounted to avoid flash */}
      <div className={cn(!mounted && 'opacity-0')}>
        <SlidingView activeIndex={activeIndex} viewCount={2} duration={300}>
          <SlidingViewItem>
            <div className="p-6">
              <SignIn />
            </div>
          </SlidingViewItem>
          <SlidingViewItem>
            <div className="p-6">
              <SignUp />
            </div>
          </SlidingViewItem>
        </SlidingView>
      </div>
    </div>
  )
}
