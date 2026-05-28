import { useState } from 'react'
import type { Paper } from '../types'
import { useStore } from '../store'
import { generateAiSummary } from '../lib/ai'
import { renderMarkdown } from '../lib/markdown'

export function PaperReader({ paper }: { paper: Paper }) {
  const { settings, setAiSummary } = useStore()
  const o = paper.outline
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const runAi = async () => {
    setAiError(null)
    setAiLoading(true)
    try {
      const summary = await generateAiSummary(paper, settings)
      setAiSummary(paper.id, summary)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e))
    } finally {
      setAiLoading(false)
    }
  }

  const bodySections = o.sections.filter((s) => s.paragraphs.length > 0)

  return (
    <article className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-ink-900 leading-snug font-serif">{o.title}</h1>
      {o.authors && <p className="mt-2 text-sm text-ink-500">{o.authors}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
        <span>📄 {paper.pageCount}페이지</span>
        <span>📝 약 {o.wordCount.toLocaleString()}단어</span>
        <span>⏱ 약 {o.readingMinutes}분 분량</span>
        <span>📁 {paper.fileName}</span>
      </div>

      {o.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {o.keywords.map((k) => (
            <span
              key={k}
              className="text-[11px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 border border-ink-200"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {/* AI summary */}
      <section className="mt-6 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-800">🤖 AI 정리 요약</h2>
          <button
            onClick={runAi}
            disabled={aiLoading}
            className="text-xs px-2.5 py-1 rounded-md bg-ink-800 text-white hover:bg-ink-700 disabled:opacity-50"
          >
            {aiLoading ? '생성 중…' : paper.aiSummary ? '다시 생성' : '요약 생성'}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-red-600">{aiError}</p>}
        {paper.aiSummary ? (
          <div
            className="mt-3 text-sm text-ink-700 prose-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(paper.aiSummary) }}
          />
        ) : (
          !aiLoading && (
            <p className="mt-2 text-xs text-ink-400">
              설정에서 API 키를 입력한 뒤 버튼을 누르면, 논문을 한국어로 깊이 있게 정리해 줍니다.
            </p>
          )
        )}
      </section>

      {/* Extractive key sentences (works offline, no API needed) */}
      {o.summary.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-ink-800">✨ 핵심 문장</h2>
          <ul className="mt-2 space-y-2">
            {o.summary.map((s, i) => (
              <li
                key={i}
                className="text-sm text-ink-700 leading-relaxed pl-3 border-l-2 border-ink-300"
              >
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.abstract && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-ink-800">초록 (Abstract)</h2>
          <p className="mt-2 text-sm text-ink-700 leading-relaxed">{o.abstract}</p>
        </section>
      )}

      {/* Table of contents */}
      {bodySections.length > 1 && (
        <nav className="mt-6 rounded-xl border border-ink-200 p-4">
          <h2 className="text-sm font-bold text-ink-800">목차</h2>
          <ol className="mt-2 space-y-1">
            {bodySections.map((s) => (
              <li key={s.id} style={{ paddingLeft: (s.level - 1) * 14 }}>
                <a href={`#sec-${s.id}`} className="text-sm text-ink-600 hover:text-ink-900 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Full organized body */}
      <div className="mt-8 space-y-6">
        {bodySections.map((s) => (
          <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-4">
            {s.level === 1 ? (
              <h2 className="text-lg font-bold text-ink-900 font-serif">{s.title}</h2>
            ) : (
              <h3 className="text-base font-semibold text-ink-800">{s.title}</h3>
            )}
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-2 text-[15px] text-ink-700 leading-7">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}
