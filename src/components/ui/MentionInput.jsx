import { useState, useRef, useEffect, useCallback } from 'react'

export function MentionInput({
  value = '',
  onChange,
  users = [],
  projects = [],
  multiline = false,
  placeholder = '',
  rows = 3,
  className = '',
}) {
  const ref = useRef(null)
  const [menu, setMenu] = useState(null) // { type, query, start }
  const [highlight, setHighlight] = useState(0)

  const trigger = menu?.type === 'user' ? '@' : '+'
  const pool = menu?.type === 'user'
    ? users.map(u => ({ id: u.id, label: u.name }))
    : projects.map(p => ({ id: p.id, label: p.title }))

  const filtered = menu
    ? pool.filter(o => o.label.toLowerCase().includes(menu.query.toLowerCase())).slice(0, 8)
    : []

  const detectMenu = useCallback((text, caret) => {
    const upToCaret = text.slice(0, caret)
    const match = /([@+])([^\s@+]*)$/.exec(upToCaret)
    if (!match) return null
    return {
      type: match[1] === '@' ? 'user' : 'project',
      query: match[2],
      start: caret - match[0].length,
    }
  }, [])

  const handleInput = (e) => {
    const text = e.target.value
    onChange(text)
    const caret = e.target.selectionStart
    setMenu(detectMenu(text, caret))
    setHighlight(0)
  }

  const insertMention = (option) => {
    if (!menu) return
    const el = ref.current
    const caret = el.selectionStart
    const before = value.slice(0, menu.start)
    const after = value.slice(caret)
    const token = menu.type === 'user'
      ? `@[${option.label}](${option.id}) `
      : `+[${option.label}](${option.id}) `
    const next = before + token + after
    onChange(next)
    setMenu(null)
    requestAnimationFrame(() => {
      const pos = (before + token).length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const handleKeyDown = (e) => {
    if (!menu || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => (h + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => (h - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(filtered[highlight])
    } else if (e.key === 'Escape') {
      setMenu(null)
    }
  }

  useEffect(() => {
    const handler = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setMenu(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commonProps = {
    ref, value, onChange: handleInput, onKeyDown: handleKeyDown, placeholder, className,
  }

  return (
    <div className="relative">
      {multiline
        ? <textarea {...commonProps} rows={rows} />
        : <input {...commonProps} />}

      {menu && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[220px] max-h-56 overflow-y-auto">
          <p className="text-xs text-gray-300 px-2 py-1">
            {menu.type === 'user' ? 'Mencionar usuário' : 'Mencionar projeto'}
          </p>
          {filtered.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(o) }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                i === highlight ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-400 mr-1">{trigger}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}