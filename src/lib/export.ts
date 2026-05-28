import type { NoteBlock, Paper } from '../types'

function blockToMarkdown(b: NoteBlock): string {
  switch (b.type) {
    case 'h1':
      return `# ${b.text}`
    case 'h2':
      return `## ${b.text}`
    case 'h3':
      return `### ${b.text}`
    case 'bullet':
      return `- ${b.text}`
    case 'todo':
      return `- [${b.checked ? 'x' : ' '}] ${b.text}`
    case 'quote':
      return `> ${b.text}`
    case 'code':
      return '```\n' + b.text + '\n```'
    case 'divider':
      return '---'
    default:
      return b.text
  }
}

export function notesToMarkdown(paper: Paper): string {
  const header = `# ${paper.outline.title}\n\n_노트 · ${new Date().toLocaleDateString('ko-KR')}_\n`
  const body = paper.notes.map(blockToMarkdown).join('\n\n')
  return `${header}\n${body}\n`
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
