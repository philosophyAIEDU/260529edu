import { useState } from 'react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { UploadView } from './components/UploadView'
import { PaperWorkspace } from './components/PaperWorkspace'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const { activePaper } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 shrink-0 border-b border-ink-200 bg-white/80 backdrop-blur flex items-center gap-2 px-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-ink-100 text-ink-600"
              title="라이브러리 열기"
            >
              ☰
            </button>
          )}
          <div className="text-sm font-semibold text-ink-700 truncate">
            {activePaper ? activePaper.outline.title : 'Paper Study'}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm px-2.5 py-1 rounded-md text-ink-600 hover:bg-ink-100"
            title="AI 요약 설정"
          >
            ⚙︎ 설정
          </button>
        </header>

        <div className="flex-1 min-h-0">
          {activePaper ? <PaperWorkspace key={activePaper.id} paper={activePaper} /> : <UploadView />}
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
