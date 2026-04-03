import { aiSettingsStore, companyStore, burdenProfilesStore, rateLibraryStore, quotesStore } from '@/data/mockStore'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const BASE_PROMPT = `You are BidCraft AI, an expert assistant for facility services contractors who need to price bids, calculate labor, and generate proposals.

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

function buildSystemPrompt(): string {
  const parts = [BASE_PROMPT]

  // Inject user's company context
  const company = companyStore.get()
  if (company.name) {
    parts.push(`\n## User's Company
- Name: ${company.name}
- Set-aside: ${company.setAside || 'None specified'}
- CAGE: ${company.cageCode || 'Not set'}
- Location: ${company.address || 'Not set'}`)
  }

  // Inject burden profiles
  const profiles = burdenProfilesStore.get()
  if (profiles.length > 0) {
    const profileLines = profiles.map(p =>
      `- "${p.name}": $${p.baseWage.toFixed(2)} base → $${(p.computedRate ?? 0).toFixed(2)}/hr burdened (G&A: ${p.gaPct}%, Fee: ${p.feePct}%)`
    ).join('\n')
    parts.push(`\n## User's Burden Profiles\n${profileLines}\nUse these when the user asks to price work — reference their actual profiles by name.`)
  }

  // Inject rate library summary
  const library = rateLibraryStore.get()
  const customRates = library.rates.filter(r => r.isCustom)
  parts.push(`\n## User's Rate Library
- Library: "${library.name}" with ${library.rates.length} rates
- ${customRates.length} custom rates`)
  if (customRates.length > 0 && customRates.length <= 10) {
    const customLines = customRates.map(r =>
      `- ${r.task} (${r.equipment}): ${r.sqftPerHour} ${r.sqftPerHour < 100 ? 'units' : 'sf'}/hr`
    ).join('\n')
    parts.push(`Custom rates:\n${customLines}`)
  }

  // Inject recent quotes summary
  const quotes = quotesStore.get()
  if (quotes.length > 0) {
    const recent = [...quotes].reverse().slice(0, 5)
    const quoteLines = recent.map(q =>
      `- "${q.title}" (${q.quoteType}, ${q.status}): $${q.grandTotal.toLocaleString()} — ${q.totalHours.toFixed(0)} hrs`
    ).join('\n')
    parts.push(`\n## Recent Quotes\n${quoteLines}\nReference these if the user asks about their recent work or pricing history.`)
  }

  return parts.join('\n')
}

export async function sendMessage(
  messages: ChatMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const settings = aiSettingsStore.get()
  if (!settings.apiKey) {
    throw new Error('No API key configured. Go to Settings to add your Claude API key.')
  }

  const systemPrompt = buildSystemPrompt()

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
      system: systemPrompt,
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
