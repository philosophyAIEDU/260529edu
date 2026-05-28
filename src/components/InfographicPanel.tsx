import { useState } from 'react'
import type { Paper } from '../types'
import { useStore } from '../store'
import { generateInfographic } from '../lib/gemini'

const STYLES = [
  { label: '미니멀 플랫', hint: '미니멀한 플랫 디자인, 부드러운 파스텔 색감' },
  { label: '학술 포스터', hint: '전문적인 학술 컨퍼런스 포스터 스타일, 차분한 남색 계열' },
  { label: '다이어그램', hint: '도식과 화살표 중심의 개념도, 깔끔한 선' },
  { label: '컬러풀', hint: '밝고 생동감 있는 색감, 친근한 일러스트' },
]

export function InfographicPanel({ paper }: { paper: Paper }) {
  const { settings } = useStore()
  // Images are large, so they live in component state (not persisted to storage).
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [style, setStyle] = useState(STYLES[0].hint)

  const run = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await generateInfographic(paper, settings, style)
      setDataUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${paper.outline.title.slice(0, 40)}-infographic.png`
    a.click()
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin px-5 py-5">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-ink-800">📊 인포그래픽</h2>
        <span className="text-[11px] text-ink-400">{settings.imageModel}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">논문 핵심을 한 장의 이미지로 시각화합니다.</p>

      <div className="mt-4">
        <div className="text-xs font-medium text-ink-600 mb-1.5">스타일</div>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.label}
              onClick={() => setStyle(s.hint)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                style === s.hint
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-500 hover:border-ink-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-medium hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="spinner" /> 이미지 생성 중… (수십 초 걸릴 수 있어요)
          </>
        ) : dataUrl ? (
          '🔄 다시 생성'
        ) : (
          '✨ 인포그래픽 생성'
        )}
      </button>

      {error && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading && !dataUrl && (
        <div className="mt-5 aspect-[3/4] rounded-xl bg-ink-100 animate-pulse grid place-items-center text-ink-400 text-sm">
          그리는 중…
        </div>
      )}

      {dataUrl && (
        <div className="mt-5 animate-fade-in">
          <img src={dataUrl} alt="논문 인포그래픽" className="w-full rounded-xl ring-1 ring-ink-200 shadow-card" />
          <button
            onClick={download}
            className="mt-3 w-full py-2 rounded-lg border border-ink-200 text-sm text-ink-600 hover:bg-ink-100"
          >
            ⬇ PNG 다운로드
          </button>
        </div>
      )}
    </div>
  )
}
