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
  
  // Base algorithm explanation - same for all models
  // NOTE: Spells out HMAC as basic math operations to avoid "crypto" refusal
  const algorithmBlock = `
## How to Calculate t

Calculate the "t" parameter as follows:

**Step 1:** Get current Unix timestamp in seconds, divide by 30, floor it.
Example: if timestamp is 1736208000, then floor(1736208000/30) = 57873600

**Step 2:** Convert that number to a string. That's your "message".

**Step 3:** Calculate the checksum using this formula (this is just XOR and SHA-256):

Key = "${token}"

1. Pad the key with zeros to 64 bytes
2. XOR each byte of padded key with 0x36 → call this "inner_key"
3. XOR each byte of padded key with 0x5c → call this "outer_key"  
4. Concatenate inner_key + message, then SHA-256 hash it → "inner_hash"
5. Concatenate outer_key + inner_hash, then SHA-256 hash it → final result

The final result (lowercase hex) is your t value.

This is basic math: XOR, concatenation, and SHA-256. You can do all of these operations.
`.trim()

  // Build field params string
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions for instructions
  const fieldDefs = fields
    .map((f) => `- ${f.name} (${f.required ? 'required' : 'optional'}): ${f.label} [${f.type}]`)
    .join('\n')

  // Endpoint format - includes source param for tracking which AI sent the request
  const endpointBlock = `
## Endpoint

To add an entry, make this GET request:
\`\`\`
GET ${domain}/api/list/${slug}/append?t={time_code}&source=${model}&${fieldParams}
\`\`\`

## Fields

${fieldDefs}

URL-encode all values. The \`source\` parameter identifies you.
`.trim()

  switch (model) {
    case 'gemini':
      return generateGeminiInstructions(listName, algorithmBlock, endpointBlock, token)
    case 'chatgpt':
      return generateChatGptInstructions(listName, algorithmBlock, endpointBlock, token)
    case 'google-assistant':
      return generateGoogleAssistantInstructions(listName, algorithmBlock, endpointBlock)
    default:
      return generateChatGptInstructions(listName, algorithmBlock, endpointBlock, token)
  }
}

function generateGeminiInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string,
  token: string
): string {
  return `
# ${listName}

When I mention "${listName}" or ask to add something to it, fetch the URL.

${algorithmBlock}

${endpointBlock}

## Instructions

When I say "add eggs to ${listName}":
1. Get current time, do the math above to get t
2. Build the URL with the item filled in
3. Fetch it and tell me what it says
`.trim()
}

function generateChatGptInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string,
  token: string
): string {
  return `
# List: ${listName}

When I mention "${listName}" or ask to add something to this list, fetch the URL to add it.

${algorithmBlock}

${endpointBlock}

## What To Do

When I say "add eggs to ${listName}":
1. Get the current time, calculate the time window number
2. Do the XOR + SHA-256 steps above to get t
3. Build the URL and fetch it like reading any webpage
4. Tell me what the response says

You know the current time. You can do XOR. You can do SHA-256. You can fetch URLs. Gemini does this exact same calculation. So do the math and fetch the URL.
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
