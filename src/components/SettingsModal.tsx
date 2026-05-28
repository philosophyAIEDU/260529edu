import { useState } from 'react'
import { useStore } from '../store'
import type { Settings } from '../types'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore()
  const [draft, setDraft] = useState<Settings>(settings)
  const [show, setShow] = useState(false)

  const save = () => {
    updateSettings({
      geminiApiKey: draft.geminiApiKey.trim(),
      textModel: draft.textModel.trim() || 'gemini-3.1-flash-lite',
      imageModel: draft.imageModel.trim() || 'gemini-3.1-flash-image',
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-ink-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>⚙</span> AI 설정 · Google Gemini
          </h2>
          <p className="mt-1 text-xs text-brand-100 leading-relaxed">
            AI 요약·교수 채팅·인포그래픽·학습 도구는 Gemini API를 사용합니다. 키는 이 브라우저에만 저장되며 서버로
            전송되지 않습니다.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink-700">Gemini API 키</label>
            <div className="mt-1.5 relative">
              <input
                type={show ? 'text' : 'password'}
                value={draft.geminiApiKey}
                onChange={(e) => setDraft((d) => ({ ...d, geminiApiKey: e.target.value }))}
                placeholder="AIza…"
                className="w-full text-sm px-3 py-2 pr-16 rounded-lg border border-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-700 px-1.5"
              >
                {show ? '숨기기' : '보기'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-400">
              키 발급:{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink-700">텍스트 모델</label>
              <input
                value={draft.textModel}
                onChange={(e) => setDraft((d) => ({ ...d, textModel: e.target.value }))}
                placeholder="gemini-3.1-flash-lite"
                className="mt-1.5 w-full text-sm px-3 py-2 rounded-lg border border-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <p className="mt-1 text-[11px] text-ink-400">요약·채팅·퀴즈에 사용</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700">이미지 모델</label>
              <input
                value={draft.imageModel}
                onChange={(e) => setDraft((d) => ({ ...d, imageModel: e.target.value }))}
                placeholder="gemini-3.1-flash-image"
                className="mt-1.5 w-full text-sm px-3 py-2 rounded-lg border border-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <p className="mt-1 text-[11px] text-ink-400">인포그래픽에 사용</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-ink-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-ink-600 hover:bg-ink-100">
            취소
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
