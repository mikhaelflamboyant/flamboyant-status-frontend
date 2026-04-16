/*
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

export function MarkdownContent({ content, className = '' }) {
  if (!content) return null
  const html = DOMPurify.sanitize(marked(content))
  return (
    <div
      className={`prose prose-sm max-w-none text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
*/