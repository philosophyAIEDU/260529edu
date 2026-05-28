import type { PaperOutline, PaperSection } from '../types'
import { uid } from './storage'

// Common English/Korean section names found in academic papers.
const SECTION_NAMES = [
  'abstract',
  'introduction',
  'background',
  'related work',
  'related works',
  'preliminaries',
  'methodology',
  'methods',
  'method',
  'approach',
  'model',
  'experiments',
  'experimental setup',
  'evaluation',
  'results',
  'results and discussion',
  'discussion',
  'analysis',
  'ablation',
  'limitations',
  'conclusion',
  'conclusions',
  'conclusion and future work',
  'future work',
  'acknowledgments',
  'acknowledgements',
  'references',
  'appendix',
  '서론',
  '관련 연구',
  '관련연구',
  '배경',
  '연구 방법',
  '연구방법',
  '방법',
  '실험',
  '실험 결과',
  '결과',
  '논의',
  '고찰',
  '결론',
  '참고문헌',
  '감사의 글',
]

const STOPWORDS = new Set(
  (
    'the of and to in a is that for it as we are with this be on by an or which from at can has have our their these those used using use such may also more most than then so into over under between within both each other等 ' +
    'paper method model results data using based show shows propose proposed approach figure table section et al however therefore thus while where when what how why ' +
    '이 그 저 것 수 등 및 또한 그리고 하지만 그러나 따라서 통해 위해 대한 대해 있는 있다 한다 된다 함을 위한 으로 에서 에게 라는'
  )
    .split(/\s+/)
    .filter(Boolean),
)

function isLikelyHeading(line: string): { ok: boolean; level: number; title: string } {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 90) return { ok: false, level: 0, title: '' }

  // Numbered headings: "1 Introduction", "2.1 Model", "3.2.1 ..."
  const numbered = trimmed.match(/^(\d+(?:\.\d+){0,3})\.?\s+(.{2,80})$/)
  if (numbered) {
    const depth = numbered[1].split('.').length
    const title = numbered[2].trim()
    // Avoid matching things that are clearly sentences (end with a period + lowercase run).
    if (!/[.!?]$/.test(title) || title.length < 40) {
      return { ok: true, level: Math.min(depth, 3), title: `${numbered[1]} ${title}` }
    }
  }

  const lower = trimmed.toLowerCase().replace(/[:.]$/, '')
  if (SECTION_NAMES.includes(lower)) {
    return { ok: true, level: 1, title: trimmed.replace(/[:.]$/, '') }
  }
  // Roman numeral style: "II. Related Work"
  const roman = trimmed.match(/^([IVX]{1,5})\.\s+(.{2,70})$/)
  if (roman) {
    return { ok: true, level: 1, title: trimmed }
  }
  return { ok: false, level: 0, title: '' }
}

function detectTitle(lines: string[]): string {
  // Title is usually among the first lines, before "abstract", and reasonably long.
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const l = lines[i].trim()
    if (l.length >= 12 && l.length <= 200 && !/^abstract/i.test(l) && !/\d{4}/.test(l.slice(0, 4))) {
      return l
    }
  }
  return lines[0]?.trim() || '제목 없음'
}

function detectAuthors(lines: string[], title: string): string {
  const titleIdx = lines.findIndex((l) => l.trim() === title)
  for (let i = titleIdx + 1; i < Math.min(titleIdx + 6, lines.length); i++) {
    const l = lines[i]?.trim() || ''
    if (!l) continue
    if (/^abstract/i.test(l)) break
    // Author lines often contain commas, "and", or look like names (capitalised words).
    if (/[,]|\band\b/i.test(l) && l.length < 160 && !/\.$/.test(l)) {
      return l
    }
    if (/^[A-Z][a-z]+ [A-Z]/.test(l) && l.length < 120) return l
  }
  return ''
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?。])\s+(?=[A-Z가-힣"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 400)
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{3,}|[가-힣]{2,}/g) || []).filter(
    (w) => !STOPWORDS.has(w),
  )
}

function topKeywords(text: string, n: number): string[] {
  const freq = new Map<string, number>()
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) || 0) + 1)
  return [...freq.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w)
}

// Score sentences by keyword density + light positional bias, then return the
// top ones in their original order — a classic extractive summary.
function extractiveSummary(text: string, keywords: string[], n: number): string[] {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return []
  const kw = new Set(keywords)
  const scored = sentences.map((s, i) => {
    const tokens = tokenize(s)
    if (tokens.length === 0) return { s, i, score: 0 }
    const hits = tokens.filter((t) => kw.has(t)).length
    let score = hits / Math.sqrt(tokens.length)
    if (i < sentences.length * 0.2) score *= 1.25 // early sentences matter more
    return { s, i, score }
  })
  const chosen = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
  return chosen
}

export function organizeText(rawText: string): PaperOutline {
  const lines = rawText.split('\n').map((l) => l.replace(/­/g, '').trimEnd())
  const nonEmpty = lines.filter((l) => l.trim().length > 0)

  const title = detectTitle(nonEmpty)
  const authors = detectAuthors(nonEmpty, title)

  // Build sections by scanning for headings; everything else becomes paragraphs
  // attached to the current section.
  const sections: PaperSection[] = []
  let current: PaperSection = {
    id: uid(),
    title: '서두',
    level: 1,
    paragraphs: [],
  }
  let buffer = ''

  const flushBuffer = () => {
    const p = buffer.trim()
    if (p) current.paragraphs.push(p)
    buffer = ''
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      flushBuffer()
      continue
    }
    const head = isLikelyHeading(t)
    if (head.ok) {
      flushBuffer()
      if (current.paragraphs.length > 0 || current.title !== '서두') sections.push(current)
      current = { id: uid(), title: head.title, level: head.level, paragraphs: [] }
    } else {
      // Join wrapped lines: if previous char isn't sentence-ending, add a space.
      buffer = buffer ? `${buffer} ${t}` : t
    }
  }
  flushBuffer()
  if (current.paragraphs.length > 0 || sections.length === 0) sections.push(current)

  // Abstract: the section literally named abstract, else first chunk of text.
  let abstract = ''
  const abstractSec = sections.find((s) => /^abstract$|초록|요약/i.test(s.title.trim()))
  if (abstractSec) {
    abstract = abstractSec.paragraphs.join(' ').slice(0, 1500)
  } else {
    const m = rawText.match(/abstract[\s:.\-]+([\s\S]{60,1400}?)(?:\n\s*\n|introduction|keywords|\b1\.?\s+intro)/i)
    if (m) abstract = m[1].replace(/\s+/g, ' ').trim()
  }

  const bodyForAnalysis = sections
    .filter((s) => !/references|참고문헌|acknowled|감사/i.test(s.title))
    .map((s) => s.paragraphs.join(' '))
    .join(' ')

  // Explicit "Keywords:" line takes priority, otherwise frequency-based.
  let keywords: string[] = []
  const kwLine = rawText.match(/key\s?words?[\s:—-]+([^\n]{3,200})/i)
  if (kwLine) {
    keywords = kwLine[1]
      .split(/[,;·•]/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 1 && k.length < 40)
      .slice(0, 12)
  }
  if (keywords.length < 4) {
    const auto = topKeywords(bodyForAnalysis || rawText, 12)
    keywords = [...new Set([...keywords, ...auto])].slice(0, 12)
  }

  const summary = extractiveSummary(abstract ? `${abstract} ${bodyForAnalysis}` : bodyForAnalysis, keywords, 6)

  const words = (rawText.match(/[A-Za-z]+|[가-힣]+/g) || []).length
  const readingMinutes = Math.max(1, Math.round(words / 230))

  return {
    title,
    authors,
    abstract,
    sections,
    keywords,
    summary,
    wordCount: words,
    readingMinutes,
  }
}
