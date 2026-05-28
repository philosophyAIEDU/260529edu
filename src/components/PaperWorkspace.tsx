import { useState } from 'react'
import type { Paper } from '../types'
import { PaperReader } from './PaperReader'
import { NoteEditor } from './NoteEditor'

export function PaperWorkspace({ paper }: { paper: Paper }) {
  const [tab, setTab] = useState<'read' | 'notes'>('read')

  return (
    <div className="h-full flex flex-col">
      {/* Tab switcher — only used on narrow screens. */}
      <div className="lg:hidden flex border-b border-ink-200 bg-white shrink-0">
        {(['read', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium ${
              tab === t ? 'text-ink-900 border-b-2 border-ink-800' : 'text-ink-400'
            }`}
          >
            {t === 'read' ? '📖 정리된 논문' : '📝 내 노트'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 lg:flex">
        <div
          className={`h-full lg:w-1/2 lg:border-r border-ink-200 overflow-y-auto scroll-thin bg-white ${
            tab === 'read' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PaperReader paper={paper} />
        </div>
        <div
          className={`h-full lg:w-1/2 overflow-y-auto scroll-thin bg-ink-50 ${
            tab === 'notes' ? 'block' : 'hidden lg:block'
          }`}
        >
          <NoteEditor paper={paper} />
        </div>
      </div>
    </div>
  )
}
