import type { ChatMessage, Flashcard, Paper, QuizQuestion, Settings } from '../types'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}
interface GeminiContent {
  role?: 'user' | 'model'
  parts: GeminiPart[]
}
interface GenConfig {
  responseMimeType?: string
  responseSchema?: unknown
  responseModalities?: string[]
  temperature?: number
}

function ensureKey(settings: Settings): string {
  if (!settings.geminiApiKey.trim()) {
    throw new Error('Gemini API 키가 없습니다. 우측 상단 ⚙ 설정에서 키를 입력하세요.')
  }
  return settings.geminiApiKey.trim()
}

// Low-level call to the Gemini generateContent endpoint.
async function generateContent(
  apiKey: string,
  model: string,
  body: { systemInstruction?: GeminiContent; contents: GeminiContent[]; generationConfig?: GenConfig },
): Promise<GeminiPart[]> {
  const res = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = await res.text()
    try {
      detail = JSON.parse(detail)?.error?.message || detail
    } catch {
      /* keep raw text */
    }
    throw new Error(`Gemini API 오류 (${res.status}): ${detail}`)
  }
  const data = await res.json()
  const cand = data.candidates?.[0]
  if (!cand) throw new Error('Gemini 응답이 비어 있습니다. 잠시 후 다시 시도하세요.')
  if (cand.finishReason === 'SAFETY') throw new Error('안전 정책에 의해 응답이 차단되었습니다.')
  return (cand.content?.parts ?? []) as GeminiPart[]
}

function partsToText(parts: GeminiPart[]): string {
  return parts
    .map((p) => p.text || '')
    .join('')
    .trim()
}

// Build a compact, reference-stripped context from the paper for prompting.
export function paperContext(paper: Paper, maxChars = 14000): string {
  const o = paper.outline
  const body = o.sections
    .filter((s) => !/references|참고문헌|acknowled|감사/i.test(s.title))
    .map((s) => `## ${s.title}\n${s.paragraphs.join('\n')}`)
    .join('\n\n')
  const head = [
    `제목: ${o.title}`,
    o.authors ? `저자: ${o.authors}` : '',
    o.abstract ? `초록: ${o.abstract}` : '',
    o.keywords.length ? `키워드: ${o.keywords.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return `${head}\n\n${body}`.slice(0, maxChars)
}

// --- 1. Clean study-friendly summary -------------------------------------
export async function summarizePaper(paper: Paper, settings: Settings): Promise<string> {
  const apiKey = ensureKey(settings)
  const prompt = [
    '아래 학술 논문을 학생이 이해하기 쉽도록 한국어 마크다운으로 정리해 주세요. 다음 구조를 따르세요:',
    '## 한 줄 요약',
    '## 연구 배경과 문제',
    '## 핵심 방법 (불릿)',
    '## 주요 결과 (불릿)',
    '## 기여와 한계',
    '## 꼭 알아야 할 용어 (3~6개, 한 줄 설명)',
    '',
    '--- 논문 내용 ---',
    paperContext(paper),
  ].join('\n')
  const parts = await generateContent(apiKey, settings.textModel, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  })
  return partsToText(parts) || '요약을 생성하지 못했습니다.'
}

// --- 2. AI Professor chat -------------------------------------------------
const PROFESSOR_SYSTEM =
  '당신은 친절하고 박식한 대학 교수입니다. 학생이 업로드한 논문에 대해 한국어로 명확하고 정확하게 답합니다. ' +
  '항상 제공된 논문 내용에 근거해 답하고, 논문에 없는 내용은 추측이라고 분명히 밝힙니다. ' +
  '어려운 개념은 쉬운 비유로 풀어 설명하고, 필요하면 단계적으로 정리합니다. 답변은 간결하되 핵심을 빠뜨리지 않습니다.'

export async function askProfessor(
  paper: Paper,
  history: ChatMessage[],
  question: string,
  settings: Settings,
): Promise<string> {
  const apiKey = ensureKey(settings)
  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: `다음은 우리가 논의할 논문입니다. 이 내용을 바탕으로 질문에 답해 주세요.\n\n${paperContext(paper)}` }],
    },
    { role: 'model', parts: [{ text: '논문을 충분히 파악했습니다. 무엇이든 물어보세요!' }] },
    ...history.slice(-10).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: question }] },
  ]
  const parts = await generateContent(apiKey, settings.textModel, {
    systemInstruction: { parts: [{ text: PROFESSOR_SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.5 },
  })
  return partsToText(parts) || '답변을 생성하지 못했습니다.'
}

// --- 3a. Self-test quiz ---------------------------------------------------
export async function generateQuiz(paper: Paper, settings: Settings): Promise<QuizQuestion[]> {
  const apiKey = ensureKey(settings)
  const prompt =
    '아래 논문 내용을 바탕으로, 학생의 이해를 점검할 4지선다 객관식 퀴즈 5개를 한국어로 만들어 주세요. ' +
    '각 문항은 논문 핵심을 다루고, 정답 1개와 그럴듯한 오답 3개, 그리고 정답 해설을 포함합니다.\n\n' +
    paperContext(paper, 12000)
  const parts = await generateContent(apiKey, settings.textModel, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            question: { type: 'STRING' },
            options: { type: 'ARRAY', items: { type: 'STRING' } },
            answerIndex: { type: 'INTEGER' },
            explanation: { type: 'STRING' },
          },
          required: ['question', 'options', 'answerIndex', 'explanation'],
        },
      },
    },
  })
  const parsed = JSON.parse(partsToText(parts)) as QuizQuestion[]
  return parsed.filter((q) => Array.isArray(q.options) && q.options.length >= 2)
}

// --- 3b. Flashcards -------------------------------------------------------
export async function generateFlashcards(paper: Paper, settings: Settings): Promise<Flashcard[]> {
  const apiKey = ensureKey(settings)
  const prompt =
    '아래 논문에서 학생이 반드시 알아야 할 핵심 용어/개념 8개를 골라, 각 용어에 대한 쉽고 정확한 한국어 정의(2~3문장)를 ' +
    '플래시카드 형태로 만들어 주세요.\n\n' + paperContext(paper, 12000)
  const parts = await generateContent(apiKey, settings.textModel, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { term: { type: 'STRING' }, definition: { type: 'STRING' } },
          required: ['term', 'definition'],
        },
      },
    },
  })
  return JSON.parse(partsToText(parts)) as Flashcard[]
}

// --- 4. Infographic image -------------------------------------------------
export interface InfographicResult {
  dataUrl: string
  note: string
}

export async function generateInfographic(
  paper: Paper,
  settings: Settings,
  styleHint = '미니멀한 플랫 디자인, 부드러운 색감',
): Promise<InfographicResult> {
  const apiKey = ensureKey(settings)
  const o = paper.outline
  // A focused spec keeps the rendered text legible inside the image.
  const spec = [
    `제목: ${o.title}`,
    o.keywords.length ? `핵심 키워드: ${o.keywords.slice(0, 6).join(', ')}` : '',
    o.summary.length ? `핵심 포인트:\n- ${o.summary.slice(0, 5).join('\n- ')}` : '',
    paper.aiSummary ? `요약:\n${paper.aiSummary.slice(0, 1200)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const prompt = [
    '이 학술 논문을 한눈에 이해할 수 있는 세로형 인포그래픽 이미지를 만들어 주세요.',
    '요구사항:',
    '- 맨 위에 논문 제목, 그 아래 3~5개의 핵심 포인트를 아이콘/도형과 함께 시각적으로 배치',
    '- 모든 텍스트는 한국어, 짧고 명료하게',
    '- 도표/화살표/아이콘으로 흐름을 표현',
    `- 스타일: ${styleHint}, 전문적이고 깔끔한 학술 포스터 느낌, 흰 배경`,
    '- 글자가 선명하게 읽히도록 충분히 크게',
    '',
    '--- 논문 정보 ---',
    spec,
  ].join('\n')

  const parts = await generateContent(apiKey, settings.imageModel, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  })
  const img = parts.find((p) => p.inlineData)?.inlineData
  if (!img) {
    const text = partsToText(parts)
    throw new Error(
      '이미지가 반환되지 않았습니다.' + (text ? ` 모델 응답: ${text.slice(0, 200)}` : ' 이미지 생성 모델 이름을 확인하세요.'),
    )
  }
  return {
    dataUrl: `data:${img.mimeType};base64,${img.data}`,
    note: partsToText(parts),
  }
}
