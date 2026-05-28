import { useState } from 'react'
import type { Paper } from '../types'
import { useStore } from '../store'
import { summarizePaper } from '../lib/gemini'
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
      const summary = await summarizePaper(paper, settings)
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
      <div className="text-[11px] font-medium uppercase tracking-wider text-brand-500">논문 정리</div>
      <h1 className="mt-1 text-[28px] font-bold text-ink-900 leading-tight font-serif">{o.title}</h1>
      {o.authors && <p className="mt-2 text-sm text-ink-500">{o.authors}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
        <span>📄 {paper.pageCount}페이지</span>
        <span>📝 약 {o.wordCount.toLocaleString()}단어</span>
        <span>⏱ 약 {o.readingMinutes}분 분량</span>
        <span className="truncate max-w-[200px]">📁 {paper.fileName}</span>
      </div>

      {o.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {o.keywords.map((k) => (
            <span
              key={k}
              className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {/* AI summary */}
      <section className="mt-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-800 flex items-center gap-1.5">
            <span>🤖</span> AI 심화 요약
          </h2>
          <button
            onClick={runAi}
            disabled={aiLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {aiLoading && <span className="spinner" />}
            {aiLoading ? '생성 중…' : paper.aiSummary ? '다시 생성' : '요약 생성'}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">{aiError}</p>}
        {paper.aiSummary ? (
          <div
            className="mt-3 text-sm text-ink-700"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(paper.aiSummary) }}
          />
        ) : (
          !aiLoading && (
            <p className="mt-2 text-xs text-ink-500 leading-relaxed">
              ⚙ 설정에서 Gemini API 키를 입력한 뒤 버튼을 누르면, 논문을 한국어로 구조화해 깊이 있게 정리해 줍니다.
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
                className="text-sm text-ink-700 leading-relaxed pl-3 border-l-2 border-brand-300"
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
        <nav className="mt-6 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
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
