/**
 * List Field Types
 * 
 * Defines the schema for user-configurable list fields.
 * Stored as JSON in List.fields, validated at runtime.
 */

/** Supported field data types */
export type FieldType = 'text' | 'number'

/** Definition of a single field in a list schema */
export interface ListFieldDefinition {
  /** Field name (used as query param key) */
  name: string
  /** Display label for UI */
  label: string
  /** Data type */
  type: FieldType
  /** Whether the field must be provided */
  required: boolean
  /** Display order (0-indexed) */
  order: number
}

/** The content stored in ListItem.content */
export type ListItemContent = Record<string, string | number>

/**
 * Validates that a value matches the expected field type
 */
export function validateFieldValue(
  value: string | undefined,
  field: ListFieldDefinition
): { valid: true; parsed: string | number } | { valid: false; error: string } {
  // Check required
  if (field.required && (value === undefined || value === '')) {
    return { valid: false, error: `Missing required field: ${field.name}` }
  }

  // Optional field with no value is valid
  if (!field.required && (value === undefined || value === '')) {
    return { valid: true, parsed: '' }
  }

  // Type validation
  if (field.type === 'number') {
    const num = Number(value)
    if (isNaN(num)) {
      return { valid: false, error: `Field "${field.name}" must be a number` }
    }
    return { valid: true, parsed: num }
  }

  // Text type - just return as-is
  return { valid: true, parsed: value! }
}

/**
 * Validates all fields in incoming data against the schema
 */
export function validateItemData(
  queryParams: Record<string, string | undefined>,
  fields: ListFieldDefinition[]
): { valid: true; data: ListItemContent } | { valid: false; errors: string[] } {
  const errors: string[] = []
  const data: ListItemContent = {}

  for (const field of fields) {
    const value = queryParams[field.name]
    const result = validateFieldValue(value, field)

    if (!result.valid) {
      errors.push(result.error)
    } else if (result.parsed !== '') {
      data[field.name] = result.parsed
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data }
}

/**
 * Type guard to validate ListFieldDefinition array from JSON
 */
export function isValidFieldDefinitions(value: unknown): value is ListFieldDefinition[] {
  if (!Array.isArray(value)) return false

  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.label === 'string' &&
      (item.type === 'text' || item.type === 'number') &&
      typeof item.required === 'boolean' &&
      typeof item.order === 'number'
  )
}

/**
 * Creates a simple single-field "item" schema (for basic lists like groceries)
 */
export function createSimpleItemSchema(): ListFieldDefinition[] {
  return [
    {
      name: 'item',
      label: 'Item',
      type: 'text',
      required: true,
      order: 0,
    },
  ]
}
