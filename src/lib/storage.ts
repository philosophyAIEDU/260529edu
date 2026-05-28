import type { Paper, Settings } from '../types'

const PAPERS_KEY = 'paper-study:papers'
const SETTINGS_KEY = 'paper-study:settings'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function loadPapers(): Paper[] {
  try {
    const raw = localStorage.getItem(PAPERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Paper[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePapers(papers: Paper[]): void {
  try {
    localStorage.setItem(PAPERS_KEY, JSON.stringify(papers))
  } catch (e) {
    // localStorage quota is ~5MB; large PDFs' raw text can exceed it.
    console.warn('논문 저장 실패 (저장 공간 초과 가능):', e)
    alert('저장 공간이 부족합니다. 오래된 논문을 삭제한 뒤 다시 시도해 주세요.')
  }
}

const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  textModel: 'gemini-3.1-flash-lite',
  imageModel: 'gemini-3.1-flash-image',
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}
