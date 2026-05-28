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
    <div className="h-full overflow-y-auto scroll-thin flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-ink-900">논문을 업로드하세요</h1>
        <p className="mt-2 text-ink-500">
          PDF를 올리면 제목·초록·섹션을 자동으로 정리하고, Notion처럼 노트를 기록할 수 있습니다.
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
            dragging ? 'border-ink-500 bg-ink-100' : 'border-ink-300 bg-white hover:bg-ink-50'
          }`}
        >
          <div className="text-5xl">{status ? '⏳' : '📄'}</div>
          <p className="mt-4 font-medium text-ink-700">
            {status ?? 'PDF를 여기로 끌어다 놓거나 클릭해서 선택하세요'}
          </p>
          {!status && <p className="mt-1 text-sm text-ink-400">브라우저 안에서만 처리됩니다 · 서버 업로드 없음</p>}
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
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-10 grid grid-cols-3 gap-4 text-left">
          {[
            ['🧹 자동 정리', '초록·섹션·키워드·핵심 문장을 추출해 깔끔하게 보여줍니다.'],
            ['📝 Notion식 노트', '슬래시(/) 메뉴로 제목·목록·체크박스를 추가하며 기록합니다.'],
            ['🤖 AI 요약(선택)', '본인의 API 키를 넣으면 더 깊이 있는 요약을 만들 수 있습니다.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-white border border-ink-200 p-4">
              <div className="font-semibold text-ink-800 text-sm">{t}</div>
              <div className="mt-1 text-xs text-ink-500 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
