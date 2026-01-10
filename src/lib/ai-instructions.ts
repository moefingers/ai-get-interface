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
    description: 'Less work - less secure. Static URL that any AI can access easily through a GET.',
    implemented: true,
  },
  {
    value: 'session',
    label: 'Browser Session',
    description: 'More work - more secure. Opens in your browser - you must be logged in. More secure but requires browser interaction.',
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
  
  // Build field params string using numeric names (1, 2, 3)
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions with clear number = label format
  const fieldDefs = fields
    .map((f) => `- ${f.name} = ${f.label} (${f.type}${f.required ? ', required' : ''})`)
    .join('\n')

  const url = `${domain}/go/${slug}/add?token=${token}&source=${model}&${fieldParams}`

  const style = params.style ?? 'fetch'

  switch (model) {
    case 'gemini':
      return generateGeminiTokenInstructions(listName, url, fieldDefs, style)

    case 'chatgpt':
      return generateChatGPTTokenInstructions(listName, slug, token, domain, url, fieldDefs, style, model)

    case 'google-assistant':
      return `# Voice Command: ${listName}

Trigger: "add to ${listName}"

URL Template: ${url}

Fields:
${fieldDefs}

When triggered:
1. Build the URL with spoken values
2. Browse to the URL
3. Read the page to the user
`.trim()

    default:
      return generateTokenInstructions('chatgpt', params)
  }
}

/**
 * Generate Gemini instructions for token auth
 */
function generateGeminiTokenInstructions(
  listName: string,
  url: string,
  fieldDefs: string,
  style: InstructionStyle
): string {
  const tokenNote = 'The static token is not sensitive - safe to store.'
  const encodeNote = 'URL-encode special characters (spaces become %20 or +).'
  
  switch (style) {
    case 'fetch':
      return `When I mention "${listName}" or ask to add something to it:
1. Build the URL with my values
2. Ask me to confirm: "${listName}: [values]?"
3. When I confirm, browse to the URL
4. Read the page contents back to me

URL Template: ${url}

Fields:
${fieldDefs}

${encodeNote}
${tokenNote}`.trim()

    case 'link':
      return `When I mention "${listName}" or ask to add something to it:
1. Build the URL with my values
2. Give me a clickable link (do NOT fetch it yourself)

URL Template: ${url}

Fields:
${fieldDefs}

${encodeNote}
${tokenNote}`.trim()

    case 'browser':
      return `When I mention "${listName}" or ask to add something to it:
1. Build the URL with my values
2. Ask me to confirm: "${listName}: [values]?"
3. When I confirm, open the URL in my browser

URL Template: ${url}

Fields:
${fieldDefs}

${encodeNote}
${tokenNote}`.trim()
  }
}

/**
 * Generate ChatGPT instructions for token auth
 */
function generateChatGPTTokenInstructions(
  listName: string,
  slug: string,
  token: string,
  domain: string,
  url: string,
  fieldDefs: string,
  style: InstructionStyle,
  model: AiModel
): string {
  const encodeNote = 'URL-encode special characters (spaces become %20 or +).'
  
  switch (style) {
    case 'fetch':
      return `# ${listName}

When I ask to add something to ${listName}:
1. Build the URL with my values
2. Browse to the URL
3. Read the page contents back to me

**URL Template:**
${url}

**Fields:**
${fieldDefs}

${encodeNote}

**Example:** "add milk to ${listName}" → browse to:
${domain}/go/${slug}/add?token=${token}&source=${model}&1=milk`.trim()

    case 'link':
      return `# ${listName}

When I ask to add something to ${listName}:
1. Build the URL with my values
2. Give me a clickable link (do NOT fetch it)

**URL Template:**
${url}

**Fields:**
${fieldDefs}

${encodeNote}

**Example:** "add milk to ${listName}" → provide link:
${domain}/go/${slug}/add?token=${token}&source=${model}&1=milk`.trim()
  }
  
  // ChatGPT doesn't support 'browser' style, but fallback just in case
  return generateChatGPTTokenInstructions(listName, slug, token, domain, url, fieldDefs, 'link', model)
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
  
  // Build field params string using numeric names (1, 2, 3)
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions with clear number = label format
  const fieldDefs = fields
    .map((f) => `- ${f.name} = ${f.label} (${f.type}${f.required ? ', required' : ''})`)
    .join('\n')

  const url = `${domain}/go/${slug}/add?source=${model}&${fieldParams}`
  const exampleUrl = `${domain}/go/${slug}/add?source=${model}&1=milk`

  // Session auth requires browser interaction - default to 'browser', fall back from 'fetch'
  const style = params.style === 'fetch' ? 'browser' : (params.style ?? 'browser')
  const encodeNote = 'URL-encode special characters (spaces become %20 or +).'

  switch (model) {
    case 'gemini':
      if (style === 'link') {
        return `When I mention "${listName}" or ask to add something to it:
1. Build the URL with my values
2. Give me a clickable link (do NOT open it yourself)

URL Template: ${url}

Fields:
${fieldDefs}

${encodeNote}`.trim()
      }
      // browser style
      return `When I mention "${listName}" or ask to add something to it:
1. Build the URL with my values
2. Ask me to confirm: "${listName}: [values]?"
3. When I confirm, open the URL in my browser

URL Template: ${url}

Fields:
${fieldDefs}

${encodeNote}`.trim()

    case 'chatgpt':
      // ChatGPT can only do 'link' for session auth (no browser capability)
      return `# ${listName}

When I ask to add something to ${listName}:
1. Build the URL with my values
2. Give me a clickable link (do NOT fetch it)

**URL Template:**
${url}

**Fields:**
${fieldDefs}

${encodeNote}

**Example:** "add milk to ${listName}" → provide link:
${exampleUrl}`.trim()

    case 'google-assistant':
      return `# Voice Command: ${listName}

Trigger: "add to ${listName}"

URL Template: ${url}

Fields:
${fieldDefs}

When triggered:
1. Build the URL with spoken values
2. Open the URL in my browser`.trim()

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
