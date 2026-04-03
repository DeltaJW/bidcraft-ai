import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Trash2, Loader2, KeyRound, Plus, MessageSquare, X, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { sendMessage, type ChatMessage } from '@/services/ai'
import { aiSettingsStore, aiConversationsStore, useStore } from '@/data/mockStore'
import type { AIConversation } from '@/types'

const QUICK_PROMPTS = [
  'Help me price a 50,000 sqft federal office building',
  'What burden rate components do I need for a GSA contract in Virginia?',
  'Suggest zones and tasks for a 3-story courthouse',
  'How should I price strip and refinish for 10,000 sqft of VCT?',
  'What production rates should I use for restrooms?',
  'Compare my G&A rate of 15% to industry benchmarks',
]

export default function AIAssistant() {
  const aiSettings = useStore(aiSettingsStore)
  const conversations = useStore(aiConversationsStore)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedText])

  function loadConversation(conv: AIConversation) {
    setActiveConversationId(conv.id)
    setMessages(conv.messages.map((m) => ({ role: m.role, content: m.content })))
    setStreamedText('')
  }

  function startNewChat() {
    setActiveConversationId(null)
    setMessages([])
    setStreamedText('')
    setInput('')
  }

  function deleteConversation(id: string) {
    aiConversationsStore.update((prev) => prev.filter((c) => c.id !== id))
    if (activeConversationId === id) {
      startNewChat()
    }
    toast('Conversation deleted', 'info')
  }

  function saveConversation(msgs: ChatMessage[], convId: string | null): string {
    if (convId) {
      // Update existing
      aiConversationsStore.update((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: msgs.map((m) => ({ role: m.role, content: m.content })) }
            : c
        )
      )
      return convId
    } else {
      // Create new conversation — title from first user message
      const firstUserMsg = msgs.find((m) => m.role === 'user')
      const title = firstUserMsg
        ? firstUserMsg.content.length > 50
          ? firstUserMsg.content.slice(0, 50) + '...'
          : firstUserMsg.content
        : 'New conversation'
      const newId = `conv-${Date.now()}`
      const newConv: AIConversation = {
        id: newId,
        title,
        messages: msgs.map((m) => ({ role: m.role, content: m.content })),
        createdAt: new Date().toISOString(),
      }
      aiConversationsStore.update((prev) => [...prev, newConv])
      return newId
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    if (!aiSettings.apiKey) {
      toast('Add your Claude API key in Settings first', 'error')
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamedText('')

    try {
      const response = await sendMessage(newMessages, (partial) => {
        setStreamedText(partial)
      })
      const finalMessages: ChatMessage[] = [...newMessages, { role: 'assistant', content: response }]
      setMessages(finalMessages)
      setStreamedText('')

      // Auto-save conversation
      const savedId = saveConversation(finalMessages, activeConversationId)
      setActiveConversationId(savedId)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'AI request failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function clearChat() {
    startNewChat()
  }

  const hasKey = !!aiSettings.apiKey
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl h-[calc(100vh-6rem)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-label">AI Tools</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">AI Assistant</h1>
            <span className="badge badge-blue">Beta</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasKey && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              {showSidebar ? 'Hide' : 'History'}
            </button>
          )}
          {messages.length > 0 && (
            <button className="btn btn-ghost" onClick={clearChat}>
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {!hasKey ? (
        <GlassCard className="text-center py-12">
          <KeyRound className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h2>
          <p className="text-text-tertiary text-sm mb-4 max-w-md mx-auto">
            The AI Assistant uses the Claude API directly from your browser. Your key is stored locally and never sent anywhere except Anthropic.
          </p>
          <Link to="/settings" className="btn btn-primary no-underline">
            <KeyRound className="w-4 h-4" />
            Configure in Settings
          </Link>
        </GlassCard>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Conversation sidebar */}
          {showSidebar && (
            <div className="w-64 shrink-0 flex flex-col gap-2">
              <button className="btn btn-primary w-full" onClick={startNewChat}>
                <Plus className="w-4 h-4" />
                New Chat
              </button>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {sortedConversations.length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-4">No conversations yet</p>
                )}
                {sortedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeConversationId === conv.id
                        ? 'bg-accent/15 text-accent'
                        : 'hover:bg-surface-3 text-text-secondary'
                    }`}
                    onClick={() => loadConversation(conv)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{conv.title}</p>
                      <p className="text-[10px] text-text-tertiary">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-disabled hover:text-red-400 transition-all bg-transparent border-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      title="Delete conversation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="py-8">
                  <p className="text-text-tertiary text-sm mb-4">
                    Ask me anything about bid pricing, workloading, burden rates, or proposals.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        className="text-left p-3 glass glass-hover text-xs text-text-secondary cursor-pointer border-none"
                        onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-brand-navy text-white'
                        : 'glass text-text-secondary'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && streamedText && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap glass text-text-secondary">
                    {streamedText}
                    <span className="inline-block w-1.5 h-4 bg-accent/60 ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}

              {loading && !streamedText && (
                <div className="flex justify-start">
                  <div className="glass rounded-lg px-4 py-3 flex items-center gap-2 text-text-tertiary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 !min-h-[44px] !max-h-32 !py-3 resize-none"
                placeholder="Describe a building, ask about pricing, or paste scope of work..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="btn btn-primary !px-4 !py-3"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
