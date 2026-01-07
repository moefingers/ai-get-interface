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
  
  // Condensed algorithm - must fit in ~1495 char total instructions
  const algorithmBlock = `
## t Parameter
Key: ${token}
m = floor(unix_seconds / 30) as string
ipad = key padded to 64 bytes, each XOR 0x36
opad = key padded to 64 bytes, each XOR 0x5c
t = SHA256(opad + SHA256(ipad + m)) as lowercase hex
`.trim()

  // Build field params string
  const fieldParams = fields
    .map((f) => `${f.name}={${f.label}${f.required ? '' : ', optional'}}`)
    .join('&')
  
  // Build field definitions for instructions
  const fieldDefs = fields
    .map((f) => `- ${f.name} (${f.required ? 'required' : 'optional'}): ${f.label} [${f.type}]`)
    .join('\n')

  // Endpoint format - condensed
  const endpointBlock = `
## URL
GET ${domain}/api/list/${slug}/append?t={t}&source=${model}&${fieldParams}
URL-encode values.
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
  _token: string
): string {
  return `
# ${listName}
When I say "add X to ${listName}", compute t, build URL, fetch it, tell me the response.
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
When I say "add X to ${listName}", compute t, build URL, fetch it, tell me the response.
${algorithmBlock}
${endpointBlock}
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
