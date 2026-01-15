/**
 * Field Preferences Persistence
 * 
 * Stores user preferences for field input modes in localStorage.
 * Scalable structure: { [listId]: { [fieldName]: { inputMode, ...future } } }
 */

const STORAGE_KEY = 'ai-list-field-prefs'

/** Input mode types for number fields */
export type NumberInputMode = 'increments' | 'dropdown'

/** Preferences for a single field */
export interface FieldPreference {
  /** For number fields: which input mode to use */
  inputMode?: NumberInputMode
}

/** Structure: listId -> fieldName -> preferences */
type FieldPreferencesStore = Record<string, Record<string, FieldPreference>>

/**
 * Load all field preferences from localStorage
 */
function loadStore(): FieldPreferencesStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Save the entire store to localStorage
 */
function saveStore(store: FieldPreferencesStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage may be unavailable or full
  }
}

/**
 * Get preferences for a specific field
 */
export function getFieldPreference(
  listId: string,
  fieldName: string
): FieldPreference {
  const store = loadStore()
  return store[listId]?.[fieldName] ?? {}
}

/**
 * Get the input mode for a number field (defaults to 'increments')
 */
export function getNumberInputMode(
  listId: string,
  fieldName: string
): NumberInputMode {
  const pref = getFieldPreference(listId, fieldName)
  return pref.inputMode ?? 'increments'
}

/**
 * Set preferences for a specific field (merges with existing)
 */
export function setFieldPreference(
  listId: string,
  fieldName: string,
  preference: Partial<FieldPreference>
): void {
  const store = loadStore()
  
  if (!store[listId]) {
    store[listId] = {}
  }
  
  store[listId][fieldName] = {
    ...store[listId][fieldName],
    ...preference,
  }
  
  saveStore(store)
}

/**
 * Set the input mode for a number field
 */
export function setNumberInputMode(
  listId: string,
  fieldName: string,
  mode: NumberInputMode
): void {
  setFieldPreference(listId, fieldName, { inputMode: mode })
}

/**
 * Clear all preferences for a list (e.g., when list is deleted)
 */
export function clearListPreferences(listId: string): void {
  const store = loadStore()
  delete store[listId]
  saveStore(store)
}
