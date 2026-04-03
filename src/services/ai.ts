import { aiSettingsStore } from '@/data/mockStore'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are BidCraft AI, an expert assistant for facility services contractors who need to price bids, calculate labor, and generate proposals.

You know:
- Industry-standard cleaning production rates (square feet per hour by task, equipment, and method)
- How to build fully burdened labor rates (base wage + H&W + FICA + SUI + WC + FUTA + leave + G&A + profit)
- SCA (Service Contract Act) wage determination compliance for government contracts
- How to structure zones, tasks, and frequencies for workloading
- Government proposal formatting and requirements
- Security guard, landscaping, and facilities maintenance pricing (not just janitorial)

When a user describes a building or scope of work:
1. Suggest zones (lobbies, offices, restrooms, etc.)
2. Recommend tasks per zone with production rates
3. Suggest frequencies (daily, weekly, monthly)
4. Estimate total annual hours and FTE needs

When a user asks about burden rates:
1. Walk them through each component
2. Provide typical ranges for their state/situation
3. Flag anything that looks off (e.g., WC rate too low for janitorial)

Keep responses concise and actionable. Use tables when showing rates or breakdowns. Format currency and numbers clearly. You are helping contractors WIN bids, not just calculate them.`

export async function sendMessage(
  messages: ChatMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const settings = aiSettingsStore.get()
  if (!settings.apiKey) {
    throw new Error('No API key configured. Go to Settings to add your Claude API key.')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      stream: !!onChunk,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    if (response.status === 401) throw new Error('Invalid API key. Check your key in Settings.')
    if (response.status === 429) throw new Error('Rate limited. Wait a moment and try again.')
    throw new Error(`API error (${response.status}): ${err}`)
  }

  // Streaming
  if (onChunk && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text
              onChunk(fullText)
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    }
    return fullText
  }

  // Non-streaming
  const data = await response.json()
  return data.content?.[0]?.text || 'No response'
}
