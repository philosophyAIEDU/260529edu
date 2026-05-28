import { useState } from 'react'
import type { Paper } from '../types'
import { PaperReader } from './PaperReader'
import { NoteEditor } from './NoteEditor'
import { ProfessorChat } from './ProfessorChat'
import { InfographicPanel } from './InfographicPanel'
import { StudyTools } from './StudyTools'

type RightTab = 'notes' | 'chat' | 'study' | 'infographic'

const RIGHT_TABS: { key: RightTab; label: string; icon: string }[] = [
  { key: 'notes', label: '노트', icon: '📝' },
  { key: 'chat', label: 'AI 교수', icon: '🎓' },
  { key: 'study', label: '학습 도구', icon: '🧠' },
  { key: 'infographic', label: '인포그래픽', icon: '📊' },
]

export function PaperWorkspace({ paper }: { paper: Paper }) {
  const [rightTab, setRightTab] = useState<RightTab>('notes')
  // On narrow screens, 'read' shows the reader; otherwise the active right tab.
  const [mobilePane, setMobilePane] = useState<'read' | RightTab>('read')

  const showReader = mobilePane === 'read'

  // Keep every right panel mounted (hidden via CSS) so generated quizzes,
  // chats and images survive tab switches within the same paper.
  const rightVisible = (key: RightTab) =>
    rightTab === key && (mobilePane === 'read' || mobilePane === key)

  return (
    <div className="h-full flex flex-col">
      {/* Mobile tab bar */}
      <div className="lg:hidden flex overflow-x-auto border-b border-ink-200 bg-white shrink-0 scroll-thin">
        <TabBtn active={showReader} onClick={() => setMobilePane('read')} icon="📖" label="논문" />
        {RIGHT_TABS.map((t) => (
          <TabBtn
            key={t.key}
            active={mobilePane === t.key}
            onClick={() => {
              setRightTab(t.key)
              setMobilePane(t.key)
            }}
            icon={t.icon}
            label={t.label}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 lg:flex">
        {/* Reader */}
        <div
          className={`h-full lg:w-[46%] lg:border-r border-ink-200 overflow-y-auto scroll-thin bg-white ${
            showReader ? 'block' : 'hidden lg:block'
          }`}
        >
          <PaperReader paper={paper} />
        </div>

        {/* Right workspace */}
        <div
          className={`h-full lg:flex-1 flex flex-col bg-ink-50 min-w-0 ${
            !showReader ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Desktop tab bar */}
          <div className="hidden lg:flex shrink-0 border-b border-ink-200 bg-white px-2">
            {RIGHT_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setRightTab(t.key)}
                className={`relative px-4 py-3 text-sm transition ${
                  rightTab === t.key ? 'text-brand-700 font-semibold' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
                {rightTab === t.key && (
                  <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-brand-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            <div className={`h-full ${rightVisible('notes') ? 'block' : 'hidden'}`}>
              <div className="h-full overflow-y-auto scroll-thin">
                <NoteEditor paper={paper} />
              </div>
            </div>
            <div className={`h-full ${rightVisible('chat') ? 'block' : 'hidden'}`}>
              <ProfessorChat paper={paper} />
            </div>
            <div className={`h-full ${rightVisible('study') ? 'block' : 'hidden'}`}>
              <StudyTools paper={paper} />
            </div>
            <div className={`h-full ${rightVisible('infographic') ? 'block' : 'hidden'}`}>
              <InfographicPanel paper={paper} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabBtn(props: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={props.onClick}
      className={`shrink-0 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition ${
        props.active ? 'border-brand-600 text-brand-700 font-semibold' : 'border-transparent text-ink-400'
      }`}
    >
      <span className="mr-1">{props.icon}</span>
      {props.label}
    </button>
  )
}
