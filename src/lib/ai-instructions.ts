/**
 * AI Instruction Templates
 * 
 * Generates the instruction text users paste into their AI assistant's
 * memory/settings. Each AI platform has slightly different formatting.
 * 
 * Two auth methods:
 * 1. Static token: Simple URL with token param - AI fetches directly
 * 2. Session: Browser opens URL, user must be logged into our site
 */

export type AiModel = 'gemini' | 'chatgpt' | 'google-assistant'
export type AuthMethod = 'token' | 'session'
export type InstructionStyle = 'fetch' | 'link' | 'browser'

export interface InstructionStyleInfo {
  value: InstructionStyle
  label: string
  description: string
}

export const INSTRUCTION_STYLES: InstructionStyleInfo[] = [
  {
    value: 'fetch',
    label: 'Fetch URL',
    description: 'AI fetches the URL directly (if supported)',
  },
  {
    value: 'link',
    label: 'Provide Link',
    description: 'AI provides a clickable link for you to open',
  },
  {
    value: 'browser',
    label: 'Open Browser',
    description: 'AI opens the URL in your browser',
  },
]

export interface AiModelInfo {
  value: AiModel
  label: string
  /** Where users paste instructions */
  destination: string
  /** URL to the settings page */
  destinationUrl: string
}

export interface AuthMethodInfo {
  value: AuthMethod
  label: string
  description: string
  implemented: boolean
}

export const AUTH_METHODS: AuthMethodInfo[] = [
  {
    value: 'token',
    label: 'Simple Token',
    description: 'Anyone with your URL can add items. Best for personal use with trusted AI assistants.',
    implemented: true,
  },
  {
    value: 'session',
    label: 'Browser Session',
    description: 'Opens in your browser - you must be logged in. More secure but requires browser interaction.',
    implemented: true,
  },
]

export const AI_MODELS: AiModelInfo[] = [
  {
    value: 'gemini',
    label: 'Gemini',
    destination: 'Saved Info',
    destinationUrl: 'https://gemini.google.com/saved-info',
  },
  {
    value: 'chatgpt',
    label: 'ChatGPT',
    destination: 'Memory or Custom Instructions',
    destinationUrl: 'https://chatgpt.com/#settings/Personalization',
  },
  {
    value: 'google-assistant',
    label: 'Google Assistant',
    destination: 'Routines',
    destinationUrl: 'https://assistant.google.com/settings/routines',
  },
]

export function getAiModelInfo(model: AiModel): AiModelInfo {
  return AI_MODELS.find((m) => m.value === model)!
}

export interface ListField {
  name: string
  label: string
  type: 'text' | 'number'
  required: boolean
}

export interface InstructionParams {
  listName: string
  slug: string
  token: string
  authMethod: AuthMethod
  domain: string
  fields: ListField[]
  style?: InstructionStyle
}

// Google Apps Script relay URL - DEPRECATED, keeping for reference
// const GOOGLE_RELAY_URL = 'https://script.google.com/macros/s/AKfycbypdyjklRHOT25NmdWZ_g8HDWZHPHFTImyrxqgESnlxSAnEy88p-1Q_7DNyJSvvX2le/exec'

/**
 * Generates AI instructions for a specific model and auth method
 */
export function generateAiInstructions(
  model: AiModel,
  params: InstructionParams
): string {
  const { authMethod } = params
  
  if (authMethod === 'session') {
    return generateSessionInstructions(model, params)
  }
  
  // Default: static token
  return generateTokenInstructions(model, params)
}

/**
 * Generate instructions for static token auth (simple GET with token in URL)
 */
function generateTokenInstructions(
  model: AiModel,
  params: InstructionParams
): string {
  const { listName, slug, token, domain, fields } = params
  
  // Build field params string
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions for instructions
  const fieldDefs = fields
    .map((f) => `- ${f.name} (${f.required ? 'required' : 'optional'}): ${f.label} [${f.type}]`)
    .join('\n')

  const url = `${domain}/go/${slug}/add?token=${token}&source=${model}&${fieldParams}`

  const style = params.style ?? 'fetch'
  const actionVerb = getActionVerb(style)
  const actionSteps = getActionSteps(style, url)

  switch (model) {
    case 'gemini':
      return `
# ${listName}

When I mention "${listName}" or ask to add something to it:
${actionSteps}

## URL

GET ${url}

## Fields

${fieldDefs}

URL-encode all values (spaces become %20 or +).

## Example

If I say "add milk to ${listName}", ${actionVerb}:
${domain}/go/${slug}/add?token=${token}&source=${model}&${fields[0]?.name || 'item'}=milk
`.trim()

    case 'chatgpt':
      return `
# ${listName}

When I ask to add something to ${listName}:
${actionSteps}

## URL

GET ${url}

## Fields

${fieldDefs}

URL-encode all values (spaces become %20 or +).

## Example

If I say "add milk to ${listName}", ${actionVerb}:
${domain}/go/${slug}/add?token=${token}&source=${model}&${fields[0]?.name || 'item'}=milk
`.trim()

    case 'google-assistant':
      return `
# Voice Command List: ${listName}

Trigger phrase: "add to ${listName}"

## URL

GET ${url}

## Fields

${fieldDefs}

## Voice Response

After successfully adding an item, respond with:
"Added {item} to ${listName}"

On failure:
"Sorry, I couldn't add that to ${listName}. Please try again."
`.trim()

    default:
      return generateTokenInstructions('chatgpt', params)
  }
}

/**
 * Get the action verb phrase based on instruction style
 */
function getActionVerb(style: InstructionStyle): string {
  switch (style) {
    case 'fetch':
      return 'fetch'
    case 'link':
      return 'provide this link'
    case 'browser':
      return 'open this URL in my browser'
  }
}

/**
 * Get the numbered action steps based on instruction style
 */
function getActionSteps(style: InstructionStyle, _url: string): string {
  switch (style) {
    case 'fetch':
      return `1. Build the URL below with the item values
2. Fetch the URL
3. Tell me what the response says`
    case 'link':
      return `1. Build the URL below with the item values
2. Provide me a clickable link to open
3. Wait for me to click it and confirm`
    case 'browser':
      return `1. Build the URL below with the item values
2. Open the URL in my browser
3. Tell me you've opened it`
  }
}

/**
 * Generate instructions for session auth (browser opens URL, user must be logged in)
 * Note: Only 'link' and 'browser' styles make sense - fetch won't have session cookies
 */
function generateSessionInstructions(
  model: AiModel,
  params: InstructionParams
): string {
  const { listName, slug, domain, fields } = params
  
  // Build field params string (no token needed - session auth)
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions for instructions
  const fieldDefs = fields
    .map((f) => `- ${f.name} (${f.required ? 'required' : 'optional'}): ${f.label} [${f.type}]`)
    .join('\n')

  const url = `${domain}/go/${slug}/add?source=${model}&${fieldParams}`

  // Session auth requires browser interaction - default to 'browser', fall back from 'fetch'
  const style = params.style === 'fetch' ? 'browser' : (params.style ?? 'browser')
  const actionVerb = getActionVerb(style)
  const actionSteps = getActionSteps(style, url)
  const sessionNote = 'Note: This link requires me to be logged in. The browser will verify my identity.'

  switch (model) {
    case 'gemini':
      return `
# ${listName}

When I mention "${listName}" or ask to add something to it:
${actionSteps}

## URL

${url}

## Fields

${fieldDefs}

URL-encode all values (spaces become %20 or +).

## Example

If I say "add milk to ${listName}", ${actionVerb}:
${domain}/go/${slug}/add?source=${model}&${fields[0]?.name || 'item'}=milk

${sessionNote}
`.trim()

    case 'chatgpt':
      return `
# ${listName}

When I ask to add something to ${listName}:
${actionSteps}

## URL

${url}

## Fields

${fieldDefs}

URL-encode all values (spaces become %20 or +).

## Example

If I say "add milk to ${listName}", ${actionVerb}:
${domain}/go/${slug}/add?source=${model}&${fields[0]?.name || 'item'}=milk

${sessionNote}
`.trim()

    case 'google-assistant':
      return `
# Voice Command List: ${listName}

Trigger phrase: "add to ${listName}"

## URL

${url}

## Fields

${fieldDefs}

## Voice Response

After opening the link, respond with:
"Opening ${listName} to add {item}"

${sessionNote}
`.trim()

    default:
      return generateSessionInstructions('chatgpt', params)
  }
}

/**
 * Returns a shortened preview of instructions (first N lines)
 */
export function getInstructionsPreview(instructions: string, lines: number = 10): string {
  const allLines = instructions.split('\n')
  if (allLines.length <= lines) return instructions
  return allLines.slice(0, lines).join('\n') + '\n...'
}
