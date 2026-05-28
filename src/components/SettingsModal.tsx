import { useState } from 'react'
import { useStore } from '../store'
import type { Settings } from '../types'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore()
  const [draft, setDraft] = useState<Settings>(settings)

  const defaultModel = draft.aiProvider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini'

  const save = () => {
    updateSettings({ ...draft, model: draft.model.trim() || defaultModel })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-ink-900">AI 요약 설정</h2>
        <p className="mt-1 text-xs text-ink-500 leading-relaxed">
          AI 요약은 선택 기능입니다. 본인의 API 키를 입력하면 브라우저에서 직접 호출하며, 키는 이 브라우저에만
          저장되고 외부로 전송되지 않습니다. (키 없이도 핵심 문장·섹션 정리는 동작합니다.)
        </p>

        <label className="block mt-4 text-sm font-medium text-ink-700">제공자</label>
        <div className="mt-1 flex gap-2">
          {(['anthropic', 'openai'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setDraft((d) => ({ ...d, aiProvider: p, model: '' }))}
              className={`flex-1 py-1.5 text-sm rounded-md border ${
                draft.aiProvider === p
                  ? 'border-ink-800 bg-ink-800 text-white'
                  : 'border-ink-200 text-ink-600'
              }`}
            >
              {p === 'anthropic' ? 'Anthropic (Claude)' : 'OpenAI'}
            </button>
          ))}
        </div>

        <label className="block mt-4 text-sm font-medium text-ink-700">API 키</label>
        <input
          type="password"
          value={draft.apiKey}
          onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
          placeholder={draft.aiProvider === 'anthropic' ? 'sk-ant-…' : 'sk-…'}
          className="mt-1 w-full text-sm px-2.5 py-1.5 rounded-md border border-ink-200 focus:outline-none focus:ring-2 focus:ring-ink-300"
        />

        <label className="block mt-4 text-sm font-medium text-ink-700">모델</label>
        <input
          value={draft.model}
          onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
          placeholder={defaultModel}
          className="mt-1 w-full text-sm px-2.5 py-1.5 rounded-md border border-ink-200 focus:outline-none focus:ring-2 focus:ring-ink-300"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md text-ink-600 hover:bg-ink-100">
            취소
          </button>
          <button onClick={save} className="px-3 py-1.5 text-sm rounded-md bg-ink-800 text-white hover:bg-ink-700">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
