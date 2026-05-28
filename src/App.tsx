import { useState } from 'react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { UploadView } from './components/UploadView'
import { PaperWorkspace } from './components/PaperWorkspace'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const { activePaper, settings } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-ink-200 bg-white/90 backdrop-blur flex items-center gap-2 px-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600"
              title="라이브러리 열기"
            >
              ☰
            </button>
          )}
          <div className="text-sm font-semibold text-ink-800 truncate">
            {activePaper ? activePaper.outline.title : 'Paper Study'}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowSettings(true)}
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              settings.geminiApiKey
                ? 'text-ink-600 hover:bg-ink-100'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
            }`}
            title="Gemini API 설정"
          >
            <span>⚙</span>
            {settings.geminiApiKey ? '설정' : 'API 키 입력'}
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
