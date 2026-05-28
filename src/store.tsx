import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage, NoteBlock, Paper, Settings } from './types'
import { loadPapers, loadSettings, savePapers, saveSettings, uid } from './lib/storage'

interface Store {
  papers: Paper[]
  activeId: string | null
  settings: Settings
  activePaper: Paper | undefined
  setActiveId: (id: string | null) => void
  addPaper: (paper: Paper) => void
  removePaper: (id: string) => void
  updateNotes: (id: string, notes: NoteBlock[]) => void
  setAiSummary: (id: string, summary: string) => void
  updateChat: (id: string, chat: ChatMessage[]) => void
  updateSettings: (s: Settings) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [papers, setPapers] = useState<Paper[]>(() => loadPapers())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  // Debounced persistence so rapid note edits don't thrash localStorage.
  const saveTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => savePapers(papers), 400)
    return () => window.clearTimeout(saveTimer.current)
  }, [papers])

  const addPaper = useCallback((paper: Paper) => {
    setPapers((prev) => [paper, ...prev])
    setActiveId(paper.id)
  }, [])

  const removePaper = useCallback((id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id))
    setActiveId((cur) => (cur === id ? null : cur))
  }, [])

  const updateNotes = useCallback((id: string, notes: NoteBlock[]) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)))
  }, [])

  const setAiSummary = useCallback((id: string, summary: string) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, aiSummary: summary, aiSummaryAt: Date.now() } : p)),
    )
  }, [])

  const updateChat = useCallback((id: string, chat: ChatMessage[]) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, chat } : p)))
  }, [])

  const updateSettings = useCallback((s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }, [])

  const activePaper = useMemo(() => papers.find((p) => p.id === activeId), [papers, activeId])

  const value: Store = {
    papers,
    activeId,
    settings,
    activePaper,
    setActiveId,
    addPaper,
    removePaper,
    updateNotes,
    setAiSummary,
    updateChat,
    updateSettings,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function newBlock(type: NoteBlock['type'] = 'text', text = ''): NoteBlock {
  return { id: uid(), type, text }
}
