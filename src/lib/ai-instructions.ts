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
  const algorithmBlock = `
## Authentication Algorithm

When making requests, calculate the auth code as follows:

1. Get current Unix timestamp in seconds
2. Divide by 30 and floor the result (this is the "time window")
3. Compute HMAC-SHA256 with:
   - Secret key: "${token}"
   - Message: the time window number as a string
4. Use the resulting lowercase hex string as the auth code
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

To add an entry:
\`\`\`
GET ${domain}/api/list/${slug}/append?auth={auth_code}&source=${model}&${fieldParams}
\`\`\`

## Fields

${fieldDefs}

All values must be URL-encoded. The \`source\` parameter identifies which AI sent the request.
`.trim()

  switch (model) {
    case 'gemini':
      return generateGeminiInstructions(listName, algorithmBlock, endpointBlock)
    case 'chatgpt':
      return generateChatGptInstructions(listName, algorithmBlock, endpointBlock)
    case 'google-assistant':
      return generateGoogleAssistantInstructions(listName, algorithmBlock, endpointBlock)
    default:
      return generateChatGptInstructions(listName, algorithmBlock, endpointBlock)
  }
}

function generateGeminiInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string
): string {
  return `
# List: ${listName}

When I mention "${listName}" or ask to add something to it, help me add items to this list.

${algorithmBlock}

${endpointBlock}

## Usage

When I say something like "add eggs to ${listName}", you should:
1. Calculate the auth code using the algorithm above
2. Make the GET request with item=eggs (URL-encoded)
3. Confirm the item was added

Keep the token secret - never display it in responses.
`.trim()
}

function generateChatGptInstructions(
  listName: string,
  algorithmBlock: string,
  endpointBlock: string
): string {
  return `
# List: ${listName}

When I mention "${listName}" or ask to add something to this list, follow these instructions.

${algorithmBlock}

${endpointBlock}

## Behavior

When I say something like "add eggs to ${listName}":
1. Calculate the current auth code using HMAC-SHA256
2. Make the GET request with the item URL-encoded
3. Confirm success or report any errors

Important: Keep the secret key confidential. Do not display it in responses.
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
