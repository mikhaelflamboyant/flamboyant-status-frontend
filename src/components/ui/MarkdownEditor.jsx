import { useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

const ToolbarButton = ({ onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors font-mono"
  >
    {children}
  </button>
)

export function MarkdownEditor({ value, onChange, rows = 4, placeholder = '' }) {
  const [tab, setTab] = useState('edit')

  const insert = (before, after = '') => {
    const textarea = document.activeElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newValue)
    setTimeout(() => {
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selected.length
      textarea.focus()
    }, 0)
  }

  const insertLine = (prefix) => {
    const textarea = document.activeElement
    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart)
    onChange(newValue)
  }

  const html = DOMPurify.sanitize(marked(value || ''))

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => insert('**', '**')} title="Negrito">B</ToolbarButton>
          <ToolbarButton onClick={() => insert('*', '*')} title="Itálico"><em>I</em></ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => insertLine('1. ')} title="Lista numerada">1.</ToolbarButton>
          <ToolbarButton onClick={() => insertLine('- ')} title="Lista com marcadores">•</ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => insert('`', '`')} title="Código">{`</>`}</ToolbarButton>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${tab === 'edit' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${tab === 'preview' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Prévia
          </button>
        </div>
      </div>

      {tab === 'edit' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm outline-none resize-none bg-white text-gray-700"
        />
      ) : (
        <div
          className="px-3 py-2 text-sm text-gray-700 min-h-80px prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}