'use client'

import { createContext, useContext, useState, useCallback, type ReactNode, type ReactElement } from 'react'

interface NavigationState {
  loadingListId: string | null
  previousIndex: number
  previousContent: ReactElement | null
  slideDirection: 'up' | 'down' | null
  setLoadingList: (listId: string | null) => void
  setPreviousIndex: (index: number) => void
  setPreviousContent: (content: ReactElement | null) => void
  setSlideDirection: (direction: 'up' | 'down' | null) => void
}

const NavigationContext = createContext<NavigationState | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [loadingListId, setLoadingListId] = useState<string | null>(null)
  const [previousIndex, setPreviousIndex] = useState<number>(-1)
  const [previousContent, setPreviousContentState] = useState<ReactElement | null>(null)
  const [slideDirection, setSlideDirectionState] = useState<'up' | 'down' | null>(null)

  const setLoadingList = useCallback((listId: string | null) => {
    setLoadingListId(listId)
  }, [])

  const setIndex = useCallback((index: number) => {
    setPreviousIndex(index)
  }, [])

  const setPreviousContent = useCallback((content: ReactElement | null) => {
    setPreviousContentState(content)
  }, [])

  const setSlideDirection = useCallback((direction: 'up' | 'down' | null) => {
    setSlideDirectionState(direction)
  }, [])

  return (
    <NavigationContext.Provider value={{ 
      loadingListId, 
      previousIndex, 
      previousContent,
      slideDirection,
      setLoadingList, 
      setPreviousIndex: setIndex,
      setPreviousContent,
      setSlideDirection,
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
