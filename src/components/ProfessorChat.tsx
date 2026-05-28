import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Paper } from '../types'
import { useStore } from '../store'
import { askProfessor } from '../lib/gemini'
import { renderMarkdown } from '../lib/markdown'
import { uid } from '../lib/storage'

const SUGGESTIONS = [
  '이 논문의 핵심 기여를 한 문장으로 알려줘',
  '연구 방법을 쉽게 설명해줘',
  '이 논문의 한계는 무엇이야?',
  '관련 분야 초심자에게 배경지식을 설명해줘',
]

export function ProfessorChat({ paper }: { paper: Paper }) {
  const { settings, updateChat } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>(paper.chat ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setError(null)
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: q, ts: Date.now() }
    const next = [...messages, userMsg]
    setMessages(next)
    updateChat(paper.id, next)
    setInput('')
    setLoading(true)
    try {
      const answer = await askProfessor(paper, messages, q, settings)
      const modelMsg: ChatMessage = { id: uid(), role: 'model', text: answer, ts: Date.now() }
      const after = [...next, modelMsg]
      setMessages(after)
      updateChat(paper.id, after)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    updateChat(paper.id, [])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2.5 bg-white">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-sm shadow-sm">
          🎓
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-800">AI 교수</div>
          <div className="text-[11px] text-ink-400">이 논문에 대해 무엇이든 물어보세요</div>
        </div>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-xs text-ink-400 hover:text-red-500 px-1.5">
            대화 지우기
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="text-4xl">🎓</div>
            <p className="mt-3 text-sm font-medium text-ink-700">교수님께 질문해 보세요</p>
            <p className="mt-1 text-xs text-ink-400">논문 내용을 바탕으로 답변합니다</p>
            <div className="mt-5 grid gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-3 py-2 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-ink-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {m.role === 'model' && (
              <div className="w-7 h-7 shrink-0 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs mr-2 mt-0.5">
                🎓
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white ring-1 ring-ink-200 text-ink-800 rounded-bl-sm shadow-card'
              }`}
            >
              {m.role === 'model' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
              ) : (
                <span className="whitespace-pre-wrap">{m.text}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 shrink-0 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs mr-2">
              🎓
            </div>
            <div className="bg-white ring-1 ring-ink-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
      </div>

      <div className="border-t border-ink-200 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="질문을 입력하세요… (Shift+Enter 줄바꿈)"
            className="flex-1 resize-none max-h-32 text-sm px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 grid place-items-center shadow-sm"
            title="보내기"
          >
            {loading ? <span className="spinner" /> : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
