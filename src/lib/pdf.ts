import * as pdfjs from 'pdfjs-dist'
// Vite resolves this to a hashed URL for the worker bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface ExtractedPdf {
  pageCount: number
  // Plain text with paragraph-ish line breaks preserved.
  text: string
}

interface TextItemLike {
  str: string
  transform: number[]
  height: number
}

// Reconstruct readable text from a PDF page by grouping text items into lines
// based on their vertical position, then joining lines that belong together.
function pageItemsToText(items: TextItemLike[]): string {
  if (items.length === 0) return ''

  // Group items into lines by their y coordinate (transform[5]).
  const lines: { y: number; parts: { x: number; str: string }[] }[] = []
  const tolerance = 3

  for (const it of items) {
    if (!it.str) continue
    const y = Math.round(it.transform[5])
    const x = it.transform[4]
    let line = lines.find((l) => Math.abs(l.y - y) <= tolerance)
    if (!line) {
      line = { y, parts: [] }
      lines.push(line)
    }
    line.parts.push({ x, str: it.str })
  }

  // PDF y grows upward, so sort descending to get top-to-bottom reading order.
  lines.sort((a, b) => b.y - a.y)

  const text = lines
    .map((l) => {
      l.parts.sort((a, b) => a.x - b.x)
      return l.parts
        .map((p) => p.str)
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
    })
    .filter((l) => l.length > 0)
    .join('\n')

  return text
}

export async function extractPdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<ExtractedPdf> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const pageTexts: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pageTexts.push(pageItemsToText(content.items as TextItemLike[]))
    onProgress?.(i, doc.numPages)
  }

  await doc.destroy()

  return {
    pageCount: doc.numPages,
    text: pageTexts.join('\n\n'),
  }
}
