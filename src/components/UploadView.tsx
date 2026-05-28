import { useCallback, useRef, useState } from 'react'
import { useStore, newBlock } from '../store'
import { extractPdf } from '../lib/pdf'
import { organizeText } from '../lib/organize'
import { uid } from '../lib/storage'
import type { Paper } from '../types'

export function UploadView() {
  const { addPaper } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('PDF 파일만 업로드할 수 있습니다.')
        return
      }
      try {
        setStatus('PDF를 읽는 중…')
        const { pageCount, text } = await extractPdf(file, (page, total) => {
          setStatus(`텍스트 추출 중… (${page}/${total} 페이지)`)
        })
        if (text.trim().length < 40) {
          setError(
            '텍스트를 거의 추출하지 못했습니다. 스캔된 이미지 PDF는 OCR이 필요해 지원되지 않습니다.',
          )
          setStatus(null)
          return
        }
        setStatus('내용을 정리하는 중…')
        const outline = organizeText(text)
        const paper: Paper = {
          id: uid(),
          fileName: file.name,
          addedAt: Date.now(),
          pageCount,
          rawText: text,
          outline,
          notes: [newBlock('text', '')],
        }
        addPaper(paper)
        setStatus(null)
      } catch (e) {
        console.error(e)
        setError('PDF 처리 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)))
        setStatus(null)
      }
    },
    [addPaper],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="h-full overflow-y-auto scroll-thin bg-gradient-to-b from-brand-50/50 to-ink-50">
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-3xl text-center py-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-100 rounded-full px-3 py-1">
            ✨ AI 논문 학습 워크스페이스
          </div>
          <h1 className="mt-4 text-4xl font-bold text-ink-900 font-serif tracking-tight">
            논문을 올리면, 학습이 시작됩니다
          </h1>
          <p className="mt-3 text-ink-500 max-w-xl mx-auto leading-relaxed">
            PDF를 업로드하면 핵심을 깔끔하게 정리하고, AI 교수와 대화하고, 인포그래픽·퀴즈로 공부하며,
            Notion처럼 노트를 기록할 수 있습니다.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-12 transition ${
              dragging ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-ink-300 bg-white hover:border-brand-300 hover:bg-brand-50/40'
            } shadow-card`}
          >
            <div className="text-5xl">{status ? '⏳' : '📄'}</div>
            <p className="mt-4 font-semibold text-ink-700">
              {status ?? 'PDF를 여기로 끌어다 놓거나 클릭해서 선택하세요'}
            </p>
            {!status && (
              <p className="mt-1 text-sm text-ink-400">브라우저 안에서만 처리됩니다 · 서버 업로드 없음</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            {[
              ['🧹', '자동 정리', '초록·섹션·키워드·핵심 문장을 추출해 읽기 좋게 재구성합니다.'],
              ['🤖', 'AI 심화 요약', 'Gemini가 논문을 한국어로 구조화해 깊이 있게 요약합니다.'],
              ['🎓', 'AI 교수 채팅', '논문 내용을 근거로 무엇이든 질문하고 답을 얻습니다.'],
              ['📊', '인포그래픽', '논문 핵심을 한 장의 이미지로 시각화해 줍니다.'],
              ['🧠', '퀴즈 & 카드', '자가 진단 퀴즈와 용어 플래시카드로 복습합니다.'],
              ['📝', 'Notion식 노트', '슬래시(/) 메뉴로 자유롭게 기록하고 자동 저장됩니다.'],
            ].map(([icon, t, d]) => (
              <div
                key={t}
                className="rounded-xl bg-white border border-ink-200 p-4 shadow-card hover:shadow-float transition"
              >
                <div className="text-xl">{icon}</div>
                <div className="mt-2 font-semibold text-ink-800 text-sm">{t}</div>
                <div className="mt-1 text-xs text-ink-500 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
