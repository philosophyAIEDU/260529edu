// Core domain types for the paper-study app.

export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'

export interface NoteBlock {
  id: string
  type: BlockType
  text: string
  checked?: boolean // for 'todo'
}

// A logical section detected inside the paper (e.g. Abstract, Introduction).
export interface PaperSection {
  id: string
  title: string
  level: number // heading depth, 1 = top level
  paragraphs: string[]
}

// Result of analysing the extracted PDF text.
export interface PaperOutline {
  title: string
  authors: string
  abstract: string
  sections: PaperSection[]
  keywords: string[]
  summary: string[] // key sentences
  wordCount: number
  readingMinutes: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  ts: number
}

export interface QuizQuestion {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface Flashcard {
  term: string
  definition: string
}

export interface Paper {
  id: string
  fileName: string
  addedAt: number
  pageCount: number
  rawText: string
  outline: PaperOutline
  notes: NoteBlock[]
  // AI-generated summary (markdown), optional and filled on demand.
  aiSummary?: string
  aiSummaryAt?: number
  // AI Professor conversation, persisted so notes-style records survive reloads.
  chat?: ChatMessage[]
}

export interface Settings {
  // Google Gemini API key, entered by the user and stored only in this browser.
  geminiApiKey: string
  textModel: string // e.g. gemini-3.1-flash-lite
  imageModel: string // e.g. gemini-3.1-flash-image
}
