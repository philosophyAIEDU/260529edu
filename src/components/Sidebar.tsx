import { useMemo, useState } from 'react'
import { useStore } from '../store'

export function Sidebar({ onClose }: { onClose: () => void }) {
  const { papers, activeId, setActiveId, removePaper } = useStore()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return papers
    return papers.filter(
      (p) =>
        p.outline.title.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q) ||
        p.outline.keywords.some((k) => k.includes(q)),
    )
  }, [papers, query])

  return (
    <aside className="w-64 shrink-0 h-full bg-white border-r border-ink-200 flex flex-col">
      <div className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-ink-200">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-base shadow-sm">
          📚
        </span>
        <div className="leading-tight">
          <div className="font-bold text-ink-800 text-sm">Paper Study</div>
          <div className="text-[10px] text-ink-400">논문 학습 노트</div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-ink-100 text-ink-500 text-sm"
          title="사이드바 닫기"
        >
          ⟨
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={() => setActiveId(null)}
          className="w-full text-sm font-medium bg-brand-600 text-white rounded-lg py-2.5 hover:bg-brand-700 transition shadow-sm"
        >
          + 새 논문 업로드
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="논문 검색…"
          className="mt-3 w-full text-sm px-2.5 py-1.5 rounded-md border border-ink-200 bg-ink-50 focus:outline-none focus:ring-2 focus:ring-ink-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3 space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-ink-400 px-2 py-6 text-center">
            {papers.length === 0 ? '아직 업로드한 논문이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`group flex items-start gap-2 rounded-lg px-2 py-2 cursor-pointer transition ${
              p.id === activeId ? 'bg-brand-50 ring-1 ring-brand-100' : 'hover:bg-ink-50'
            }`}
            onClick={() => setActiveId(p.id)}
          >
            <span className="mt-0.5 text-ink-400">📄</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-800 leading-snug line-clamp-2">
                {p.outline.title}
              </div>
              <div className="text-[11px] text-ink-400 mt-0.5">
                {p.pageCount}p · 노트 {p.notes.filter((b) => b.text.trim()).length}개
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('이 논문과 노트를 삭제할까요?')) removePaper(p.id)
              }}
              className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 text-xs px-1"
              title="삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-ink-200 text-[11px] text-ink-400">
        모든 데이터는 이 브라우저에만 저장됩니다.
      </div>
    </aside>
  )
}
