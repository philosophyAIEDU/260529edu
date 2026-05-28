import { useState } from 'react'
import type { Flashcard, Paper, QuizQuestion } from '../types'
import { useStore } from '../store'
import { generateFlashcards, generateQuiz } from '../lib/gemini'

export function StudyTools({ paper }: { paper: Paper }) {
  const [tool, setTool] = useState<'quiz' | 'cards'>('quiz')
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-4">
        <h2 className="text-base font-bold text-ink-800">🧠 학습 도구</h2>
        <p className="mt-0.5 text-xs text-ink-500">AI가 만든 퀴즈와 용어 카드로 이해도를 점검하세요.</p>
        <div className="mt-3 inline-flex rounded-lg bg-ink-100 p-0.5">
          {([['quiz', '📝 퀴즈'], ['cards', '🃏 용어 카드']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTool(k)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                tool === k ? 'bg-white shadow-card text-ink-800 font-medium' : 'text-ink-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4">
        {tool === 'quiz' ? <Quiz paper={paper} /> : <Flashcards paper={paper} />}
      </div>
    </div>
  )
}

function Quiz({ paper }: { paper: Paper }) {
  const { settings } = useStore()
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setError(null)
    setLoading(true)
    setPicked({})
    try {
      setQuestions(await generateQuiz(paper, settings))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const answered = Object.keys(picked).length
  const correct = questions
    ? Object.entries(picked).filter(([i, v]) => questions[+i]?.answerIndex === v).length
    : 0

  if (!questions) {
    return (
      <Starter
        loading={loading}
        error={error}
        onRun={run}
        icon="📝"
        title="이해도 점검 퀴즈"
        desc="논문 핵심을 다루는 4지선다 5문항을 만들어 드립니다."
        cta="퀴즈 생성"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-600">
          정답 <span className="font-bold text-brand-600">{correct}</span> / {questions.length}
          <span className="text-ink-400"> · 푼 문제 {answered}/{questions.length}</span>
        </div>
        <button onClick={run} disabled={loading} className="text-xs text-ink-500 hover:text-ink-800 disabled:opacity-50">
          {loading ? '생성 중…' : '🔄 새 퀴즈'}
        </button>
      </div>

      {questions.map((q, qi) => {
        const chosen = picked[qi]
        const done = chosen !== undefined
        return (
          <div key={qi} className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="font-medium text-sm text-ink-800">
              {qi + 1}. {q.question}
            </div>
            <div className="mt-3 space-y-1.5">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answerIndex
                const isChosen = oi === chosen
                let cls = 'border-ink-200 hover:border-brand-300'
                if (done) {
                  if (isAnswer) cls = 'border-green-400 bg-green-50'
                  else if (isChosen) cls = 'border-red-400 bg-red-50'
                  else cls = 'border-ink-200 opacity-60'
                }
                return (
                  <button
                    key={oi}
                    disabled={done}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${cls}`}
                  >
                    <span className="text-ink-400 mr-2">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                    {done && isAnswer && <span className="ml-2 text-green-600">✓</span>}
                  </button>
                )
              })}
            </div>
            {done && (
              <div className="mt-3 text-xs text-ink-600 bg-ink-50 rounded-lg px-3 py-2 leading-relaxed">
                <span className="font-semibold text-ink-700">해설 · </span>
                {q.explanation}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Flashcards({ paper }: { paper: Paper }) {
  const { settings } = useStore()
  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setError(null)
    setLoading(true)
    setFlipped({})
    try {
      setCards(await generateFlashcards(paper, settings))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!cards) {
    return (
      <Starter
        loading={loading}
        error={error}
        onRun={run}
        icon="🃏"
        title="핵심 용어 카드"
        desc="꼭 알아야 할 개념 8개를 카드로 만들어 드립니다. 카드를 눌러 뜻을 확인하세요."
        cta="용어 카드 생성"
      />
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={run} disabled={loading} className="text-xs text-ink-500 hover:text-ink-800 disabled:opacity-50">
          {loading ? '생성 중…' : '🔄 다시 생성'}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
            className="text-left rounded-xl border border-ink-200 bg-white p-4 shadow-card hover:shadow-float transition min-h-[110px] flex flex-col"
          >
            {!flipped[i] ? (
              <>
                <div className="text-[11px] text-brand-500 font-medium">용어</div>
                <div className="mt-1 font-semibold text-ink-800">{c.term}</div>
                <div className="mt-auto pt-2 text-[11px] text-ink-300">눌러서 뜻 보기 →</div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-ink-400 font-medium">{c.term}</div>
                <div className="mt-1 text-sm text-ink-700 leading-relaxed">{c.definition}</div>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function Starter(props: {
  loading: boolean
  error: string | null
  onRun: () => void
  icon: string
  title: string
  desc: string
  cta: string
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="text-4xl">{props.icon}</div>
      <p className="mt-3 font-semibold text-ink-800">{props.title}</p>
      <p className="mt-1 text-sm text-ink-500 max-w-xs">{props.desc}</p>
      <button
        onClick={props.onRun}
        disabled={props.loading}
        className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 shadow-sm flex items-center gap-2"
      >
        {props.loading && <span className="spinner" />}
        {props.loading ? '생성 중…' : props.cta}
      </button>
      {props.error && (
        <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-sm">
          {props.error}
        </p>
      )}
    </div>
  )
}
