import type { Paper, Settings } from '../types'

// Builds the prompt used to ask an LLM for a clean, study-friendly summary.
function buildPrompt(paper: Paper): string {
  const o = paper.outline
  const body = o.sections
    .filter((s) => !/references|참고문헌/i.test(s.title))
    .map((s) => `## ${s.title}\n${s.paragraphs.join('\n').slice(0, 2000)}`)
    .join('\n\n')
    .slice(0, 12000)

  return [
    '다음은 학술 논문에서 추출한 텍스트입니다. 학생이 이해하기 쉽도록 한국어로 깔끔하게 정리해 주세요.',
    '',
    '다음 형식의 마크다운으로 작성하세요:',
    '1. **한 줄 요약** — 논문의 핵심을 한 문장으로',
    '2. **연구 배경 및 문제** — 무엇을, 왜 풀려고 하는가',
    '3. **핵심 방법** — 어떻게 접근했는가 (불릿)',
    '4. **주요 결과** — 무엇을 발견했는가 (불릿)',
    '5. **기여 및 한계** — 의의와 한계점',
    '6. **핵심 용어** — 알아야 할 개념 3~6개를 간단히 설명',
    '',
    `# 제목: ${o.title}`,
    o.authors ? `저자: ${o.authors}` : '',
    '',
    body,
  ].join('\n')
}

export async function generateAiSummary(paper: Paper, settings: Settings): Promise<string> {
  if (!settings.apiKey) throw new Error('API 키가 설정되지 않았습니다. 우측 상단 설정에서 입력하세요.')
  const prompt = buildPrompt(paper)

  if (settings.aiProvider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        // Required to allow calling the API directly from a browser.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: settings.model || 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Anthropic API 오류 (${res.status}): ${await res.text()}`)
    const data = await res.json()
    return (data.content?.[0]?.text as string) || '응답이 비어 있습니다.'
  }

  // OpenAI-compatible chat completions.
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API 오류 (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content as string) || '응답이 비어 있습니다.'
}
