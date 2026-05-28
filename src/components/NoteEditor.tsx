import { useCallback, useEffect, useRef, useState } from 'react'
import type { BlockType, NoteBlock, Paper } from '../types'
import { useStore, newBlock } from '../store'
import { notesToMarkdown, downloadText } from '../lib/export'
import { EditableBlock } from './EditableBlock'

export function NoteEditor({ paper }: { paper: Paper }) {
  const { updateNotes } = useStore()
  // Local state is the source of truth while editing; we push to the store
  // (which persists) on every change. Initialised once per paper (keyed mount).
  const [blocks, setBlocks] = useState<NoteBlock[]>(() =>
    paper.notes.length ? paper.notes : [newBlock('text', '')],
  )
  const [focusId, setFocusId] = useState<string | null>(null)
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  // Persist to the store whenever blocks change.
  useEffect(() => {
    updateNotes(paper.id, blocks)
  }, [blocks, paper.id, updateNotes])

  const commit = useCallback((next: NoteBlock[]) => {
    setBlocks(next.length ? next : [newBlock('text', '')])
  }, [])

  const updateText = useCallback((id: string, text: string) => {
    // Mutate in place via map but avoid triggering EditableBlock re-render of
    // content — text is uncontrolled, so we just keep state in sync for saving.
    blocksRef.current = blocksRef.current.map((b) => (b.id === id ? { ...b, text } : b))
    setBlocks(blocksRef.current)
  }, [])

  const changeType = useCallback((id: string, type: BlockType) => {
    commit(blocksRef.current.map((b) => (b.id === id ? { ...b, type, text: type === 'divider' ? '' : b.text } : b)))
  }, [commit])

  const setChecked = useCallback((id: string, checked: boolean) => {
    commit(blocksRef.current.map((b) => (b.id === id ? { ...b, checked } : b)))
  }, [commit])

  const insertAfter = useCallback((id: string, type: BlockType = 'text') => {
    const idx = blocksRef.current.findIndex((b) => b.id === id)
    const nb = newBlock(type, '')
    const next = [...blocksRef.current]
    next.splice(idx + 1, 0, nb)
    commit(next)
    setFocusId(nb.id)
  }, [commit])

  const mergeWithPrev = useCallback((id: string) => {
    const idx = blocksRef.current.findIndex((b) => b.id === id)
    if (idx <= 0) {
      // First block: just reset its type to text if it was something else.
      if (blocksRef.current[idx]?.type !== 'text') changeType(id, 'text')
      return
    }
    const prev = blocksRef.current[idx - 1]
    const next = blocksRef.current.filter((b) => b.id !== id)
    commit(next)
    setFocusId(prev.id)
  }, [commit, changeType])

  const moveFocus = useCallback((id: string, dir: -1 | 1) => {
    const idx = blocksRef.current.findIndex((b) => b.id === id)
    const target = blocksRef.current[idx + dir]
    if (target) setFocusId(target.id)
  }, [])

  const completedTodos = blocks.filter((b) => b.type === 'todo' && b.checked).length
  const totalTodos = blocks.filter((b) => b.type === 'todo').length

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-ink-400">
          📝 내 노트
          {totalTodos > 0 && <span className="ml-2">· 할 일 {completedTodos}/{totalTodos}</span>}
        </div>
        <button
          onClick={() => downloadText(`${paper.outline.title.slice(0, 40)}.md`, notesToMarkdown({ ...paper, notes: blocks }))}
          className="text-xs px-2.5 py-1 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-100"
        >
          ⬇ Markdown 내보내기
        </button>
      </div>

      <div className="space-y-0.5">
        {blocks.map((block) => (
          <EditableBlock
            key={block.id}
            block={block}
            autoFocus={focusId === block.id}
            onFocused={() => setFocusId(null)}
            onChangeText={updateText}
            onChangeType={changeType}
            onChecked={setChecked}
            onEnter={(type) => insertAfter(block.id, type)}
            onBackspaceEmpty={() => mergeWithPrev(block.id)}
            onArrow={(dir) => moveFocus(block.id, dir)}
          />
        ))}
      </div>

      <button
        onClick={() => insertAfter(blocks[blocks.length - 1].id)}
        className="mt-2 w-full text-left text-sm text-ink-300 hover:text-ink-500 px-1 py-2"
      >
        + 클릭하거나 마지막 줄에서 Enter를 눌러 블록 추가
      </button>
    </div>
  )
}
