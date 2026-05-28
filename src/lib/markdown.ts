// Minimal, safe markdown -> HTML renderer for AI summaries.
// Escapes all HTML first, then applies a small set of markdown features.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-ink-100 text-ink-800 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false
  let inOrdered = false

  const closeLists = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
    if (inOrdered) {
      html.push('</ol>')
      inOrdered = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      closeLists()
      continue
    }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      closeLists()
      const level = line.match(/^#+/)![0].length
      const size = level <= 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'
      html.push(`<h${level} class="${size} font-bold mt-4 mb-1.5 text-ink-900">${inline(m[1])}</h${level}>`)
    } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      if (!inList) {
        closeLists()
        html.push('<ul class="list-disc pl-5 space-y-1 my-2">')
        inList = true
      }
      html.push(`<li>${inline(m[1])}</li>`)
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      if (!inOrdered) {
        closeLists()
        html.push('<ol class="list-decimal pl-5 space-y-1 my-2">')
        inOrdered = true
      }
      html.push(`<li>${inline(m[1])}</li>`)
    } else {
      closeLists()
      html.push(`<p class="my-2 leading-relaxed">${inline(line)}</p>`)
    }
  }
  closeLists()
  return html.join('\n')
}
