import { useEffect, useRef, useState } from 'react'
import type { BlockType, NoteBlock } from '../types'

interface Props {
  block: NoteBlock
  autoFocus: boolean
  onFocused: () => void
  onChangeText: (id: string, text: string) => void
  onChangeType: (id: string, type: BlockType) => void
  onChecked: (id: string, checked: boolean) => void
  onEnter: (newType: BlockType) => void
  onBackspaceEmpty: () => void
  onArrow: (dir: -1 | 1) => void
}

const MENU: { type: BlockType; label: string; icon: string; hint: string }[] = [
  { type: 'text', label: '텍스트', icon: '¶', hint: 'text 본문' },
  { type: 'h1', label: '제목 1', icon: 'H1', hint: 'h1 heading title' },
  { type: 'h2', label: '제목 2', icon: 'H2', hint: 'h2 heading' },
  { type: 'h3', label: '제목 3', icon: 'H3', hint: 'h3 heading' },
  { type: 'bullet', label: '글머리 목록', icon: '•', hint: 'bullet list 목록' },
  { type: 'todo', label: '할 일 (체크박스)', icon: '☑', hint: 'todo check 할일' },
  { type: 'quote', label: '인용', icon: '❝', hint: 'quote 인용' },
  { type: 'code', label: '코드', icon: '‹›', hint: 'code 코드' },
  { type: 'divider', label: '구분선', icon: '—', hint: 'divider line 구분선' },
]

function focusEnd(el: HTMLElement) {
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function caretAtStart(): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const r = sel.getRangeAt(0)
  return r.collapsed && r.startOffset === 0
}

function caretAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const r = sel.getRangeAt(0)
  return r.collapsed && r.endOffset === (el.textContent?.length ?? 0)
}

const SHORTCUTS: { re: RegExp; type: BlockType }[] = [
  { re: /^#\s$/, type: 'h1' },
  { re: /^##\s$/, type: 'h2' },
  { re: /^###\s$/, type: 'h3' },
  { re: /^[-*]\s$/, type: 'bullet' },
  { re: /^\[\]\s$|^\[ \]\s$/, type: 'todo' },
  { re: /^>\s$/, type: 'quote' },
  { re: /^```$/, type: 'code' },
  { re: /^---$/, type: 'divider' },
]

const editableClass: Record<BlockType, string> = {
  text: 'text-[15px] leading-7 text-ink-800',
  h1: 'text-2xl font-bold text-ink-900 leading-snug',
  h2: 'text-xl font-bold text-ink-900 leading-snug',
  h3: 'text-lg font-semibold text-ink-800',
  bullet: 'text-[15px] leading-7 text-ink-800',
  todo: 'text-[15px] leading-7 text-ink-800',
  quote: 'text-[15px] leading-7 text-ink-600 italic',
  code: 'text-sm font-mono text-ink-800 whitespace-pre-wrap',
  divider: '',
}

export function EditableBlock(props: Props) {
  const { block, autoFocus } = props
  const ref = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuIdx, setMenuIdx] = useState(0)
  const [menuQuery, setMenuQuery] = useState('')

  // Initialise DOM content once (uncontrolled — React never overwrites it).
  useEffect(() => {
    if (ref.current && ref.current.textContent !== block.text) {
      ref.current.textContent = block.text
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (autoFocus && ref.current) {
      focusEnd(ref.current)
      props.onFocused()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  const filteredMenu = MENU.filter(
    (m) => !menuQuery || m.label.includes(menuQuery) || m.hint.includes(menuQuery.toLowerCase()),
  )

  const pickMenu = (type: BlockType) => {
    if (ref.current) ref.current.textContent = ''
    props.onChangeText(block.id, '')
    setMenuOpen(false)
    setMenuQuery('')
    if (type === 'divider') {
      props.onChangeType(block.id, 'divider')
      props.onEnter('text')
    } else {
      props.onChangeType(block.id, type)
      requestAnimationFrame(() => ref.current && focusEnd(ref.current))
    }
  }

  const handleInput = () => {
    const el = ref.current
    if (!el) return
    const text = el.textContent ?? ''

    // Slash command menu.
    if (text.startsWith('/')) {
      setMenuOpen(true)
      setMenuIdx(0)
      setMenuQuery(text.slice(1))
      return
    } else if (menuOpen) {
      setMenuOpen(false)
      setMenuQuery('')
    }

    // Markdown shortcuts (only meaningful for a plain text block).
    if (block.type === 'text') {
      for (const sc of SHORTCUTS) {
        if (sc.re.test(text)) {
          pickMenu(sc.type)
          return
        }
      }
    }

    props.onChangeText(block.id, text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (menuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMenuIdx((i) => Math.min(i + 1, filteredMenu.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMenuIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredMenu[menuIdx]) pickMenu(filteredMenu[menuIdx].type)
        return
      }
      if (e.key === 'Escape') {
        setMenuOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = ref.current?.textContent ?? ''
      // Empty list/quote item: exit the list back to plain text.
      if (!text.trim() && (block.type === 'bullet' || block.type === 'todo' || block.type === 'quote')) {
        props.onChangeType(block.id, 'text')
        return
      }
      // Continue lists, otherwise start a plain text block.
      const nextType: BlockType = block.type === 'bullet' || block.type === 'todo' ? block.type : 'text'
      props.onEnter(nextType)
      return
    }

    if (e.key === 'Backspace') {
      const text = ref.current?.textContent ?? ''
      if (caretAtStart() && (!text || block.type !== 'text')) {
        if (!text) {
          e.preventDefault()
          props.onBackspaceEmpty()
          return
        }
        // Non-empty but styled: demote to plain text instead of deleting chars.
        if (block.type !== 'text') {
          e.preventDefault()
          props.onChangeType(block.id, 'text')
          return
        }
      }
    }

    if (e.key === 'ArrowUp' && caretAtStart()) {
      e.preventDefault()
      props.onArrow(-1)
    }
    if (e.key === 'ArrowDown' && ref.current && caretAtEnd(ref.current)) {
      e.preventDefault()
      props.onArrow(1)
    }
  }

  if (block.type === 'divider') {
    return (
      <div
        className="group py-2 cursor-pointer"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            props.onBackspaceEmpty()
          }
        }}
      >
        <hr className="border-ink-200" />
      </div>
    )
  }

  const placeholder =
    block.type === 'text' ? "입력하거나 '/' 로 블록 추가" : block.type === 'code' ? '코드' : ''

  const editable = (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`outline-none flex-1 min-w-0 ${editableClass[block.type]}`}
    />
  )

  return (
    <div className="group relative flex items-start gap-1.5 rounded px-1 -mx-1 hover:bg-ink-100/40">
      {block.type === 'bullet' && <span className="mt-[7px] text-ink-500 select-none">•</span>}
      {block.type === 'todo' && (
        <input
          type="checkbox"
          checked={!!block.checked}
          onChange={(e) => props.onChecked(block.id, e.target.checked)}
          className="mt-[7px] accent-ink-700"
        />
      )}
      {block.type === 'quote' && <span className="self-stretch w-0.5 bg-ink-300 rounded mt-1 mb-1" />}

      {block.type === 'code' ? (
        <div className="flex-1 rounded-md bg-ink-100 px-3 py-2">{editable}</div>
      ) : (
        editable
      )}

      {menuOpen && (
        <div className="absolute z-20 left-4 top-7 w-56 max-h-64 overflow-y-auto scroll-thin rounded-lg border border-ink-200 bg-white shadow-lg py-1">
          {filteredMenu.length === 0 && (
            <div className="px-3 py-2 text-xs text-ink-400">일치하는 블록이 없습니다</div>
          )}
          {filteredMenu.map((m, i) => (
            <button
              key={m.type}
              onMouseDown={(e) => {
                e.preventDefault()
                pickMenu(m.type)
              }}
              onMouseEnter={() => setMenuIdx(i)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm ${
                i === menuIdx ? 'bg-ink-100' : ''
              }`}
            >
              <span className="w-6 text-center text-ink-500 text-xs">{m.icon}</span>
              <span className="text-ink-700">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
