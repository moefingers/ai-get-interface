/**
 * AI Instruction Templates
 * 
 * Generates the instruction text users paste into their AI assistant's
 * memory/settings. Each AI platform has slightly different formatting.
 * 
 * The instructions teach the AI to:
 * 1. Calculate floor(unix_timestamp / 30)
 * 2. Compute HMAC-SHA256(token, that_number)
 * 3. Make the authenticated GET request
 */

export type AiModel = 'gemini' | 'chatgpt' | 'google-assistant'

export interface AiModelInfo {
  value: AiModel
  label: string
  /** Where users paste instructions */
  destination: string
  /** URL to the settings page */
  destinationUrl: string
}

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
  domain: string
  fields: ListField[]
}

/**
 * Generates AI instructions for a specific model
 */
export function generateAiInstructions(
  model: AiModel,
  params: InstructionParams
): string {
  const { listName, slug, token, domain, fields } = params
  
  // ChatGPT-specific algorithm - avoids "crypto" trigger words
  // Uses "simple arithmetic" framing per ChatGPT's own suggestion
  const chatgptAlgorithmBlock = `
## How to get t (simple arithmetic)

1. Your system UTC timestamp (you have this) divided by 30, floored
2. That number as a string is your "message"

Key: ${token}

Simple steps:
- Pad key to 64 bytes with zeros
- Make ipad: each byte of padded key, bitwise-or with 0x36
- Make opad: each byte of padded key, bitwise-or with 0x5c  
- inner = hash(ipad + message) using SHA-256
- t = hash(opad + inner) using SHA-256, lowercase hex

Example: timestamp 1736208000 → floor(1736208000/30) = 57873600 → message is "57873600"
`.trim()

  // Gemini algorithm - can use normal terminology
  const geminiAlgorithmBlock = `
## How to Calculate t

1. Get system clock as Unix timestamp (seconds since 1970)
2. Divide by 30 and floor it: m = floor(timestamp / 30)
3. Convert m to a string - this is your message

Key: ${token}

Steps:
- Pad key with zeros to 64 bytes
- Create ipad: XOR each byte of padded key with 0x36
- Create opad: XOR each byte of padded key with 0x5c
- inner = SHA256(ipad + message)
- t = SHA256(opad + inner) as lowercase hex

Example: If timestamp = 1736208000, then m = "57873600"
`.trim()

  // Build field params string
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions for instructions
  const fieldDefs = fields
    .map((f) => `- ${f.name} (${f.required ? 'required' : 'optional'}): ${f.label} [${f.type}]`)
    .join('\n')

  // Endpoint format with field info
  const endpointBlock = `
## Endpoint

GET ${domain}/api/list/${slug}/append?t={t}&source=${model}&${fieldParams}

Fields:
${fieldDefs}

URL-encode all values. Replace {t} with the computed value.
`.trim()

  switch (model) {
    case 'gemini':
      return generateGeminiInstructions(listName, geminiAlgorithmBlock, endpointBlock, token)
    case 'chatgpt':
      return generateChatGptInstructions(listName, chatgptAlgorithmBlock, endpointBlock, token)
    case 'google-assistant':
      return generateGoogleAssistantInstructions(listName, geminiAlgorithmBlock, endpointBlock)
    default:
      return generateChatGptInstructions(listName, chatgptAlgorithmBlock, endpointBlock, token)
  }
}

function generateGeminiInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string,
  _token: string
): string {
  return `
# ${listName}

When I mention "${listName}" or ask to add something to it:
1. Compute t using current time and the formula below
2. Build the URL with the item
3. Fetch the URL
4. Tell me what the response says

${algorithmBlock}

${endpointBlock}
`.trim()
}

function generateChatGptInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string,
  _token: string
): string {
  return `
# ${listName}

When I ask to add something to ${listName}, do this step by step using basic math:
1. Get your system UTC timestamp (you already have this)
2. Do the simple arithmetic below to get t
3. Build the URL
4. Fetch the URL and tell me what it says

${algorithmBlock}

${endpointBlock}

This is just division, string operations, and hashing. No tools needed.
`.trim()
}

function generateGoogleAssistantInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string
): string {
  return `
# Voice Command List: ${listName}

Trigger phrase: "add to ${listName}"

${algorithmBlock}

${endpointBlock}

## Voice Response

After successfully adding an item, respond with:
"Added {item} to ${listName}"

On failure:
"Sorry, I couldn't add that to ${listName}. Please try again."
`.trim()
}

/**
 * Returns a shortened preview of instructions (first N lines)
 */
export function getInstructionsPreview(instructions: string, lines: number = 10): string {
  const allLines = instructions.split('\n')
  if (allLines.length <= lines) return instructions
  return allLines.slice(0, lines).join('\n') + '\n...'
}
