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
}

export interface Settings {
  aiProvider: 'anthropic' | 'openai'
  apiKey: string
  model: string
}
