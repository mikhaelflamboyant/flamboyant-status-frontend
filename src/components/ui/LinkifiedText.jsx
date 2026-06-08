import { Link } from 'react-router-dom'

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})/g
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/
const MENTION_REGEX = /([@+])\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g

function renderUrlToken(token, key) {
  const match = TRAILING_PUNCT.exec(token)
  let urlPart = token
  let trailing = ''
  if (match) {
    urlPart = token.slice(0, match.index)
    trailing = match[0]
  }

  const isEmail = urlPart.includes('@') && !urlPart.startsWith('http') && !urlPart.startsWith('www.')
  const href = isEmail
    ? `mailto:${urlPart}`
    : urlPart.startsWith('http') ? urlPart : `https://${urlPart}`

  return (
    <span key={key}>
      <a
        href={href}
        target={isEmail ? undefined : '_blank'}
        rel={isEmail ? undefined : 'noopener noreferrer'}
        className="text-primary-600 hover:text-primary-800 underline underline-offset-2 break-all"
      >
        {urlPart}
      </a>
      {trailing}
    </span>
  )
}

function renderUrlsInText(text, keyPrefix) {
  const parts = text.split(URL_REGEX)
  return parts.map((part, idx) => {
    if (!part) return null
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0
      return renderUrlToken(part, `${keyPrefix}-u${idx}`)
    }
    URL_REGEX.lastIndex = 0
    return <span key={`${keyPrefix}-t${idx}`}>{part}</span>
  })
}

function renderLine(line, lineIdx) {
  const nodes = []
  let lastIndex = 0
  let m
  MENTION_REGEX.lastIndex = 0

  while ((m = MENTION_REGEX.exec(line)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(...renderUrlsInText(line.slice(lastIndex, m.index), `${lineIdx}-${lastIndex}`))
    }
    const [, trigger, label, id] = m
    if (trigger === '@') {
      nodes.push(
        <span
          key={`${lineIdx}-mu-${m.index}`}
          className="inline-flex items-center bg-primary-50 text-primary-700 rounded px-1 font-medium"
        >
          @{label}
        </span>
      )
    } else {
      nodes.push(
        <Link
          key={`${lineIdx}-mp-${m.index}`}
          to={`/projetos/${id}`}
          className="inline-flex items-center bg-violet-50 text-violet-700 rounded px-1 font-medium hover:bg-violet-100 transition-colors"
        >
          +{label}
        </Link>
      )
    }
    lastIndex = m.index + m[0].length
  }

  if (lastIndex < line.length) {
    nodes.push(...renderUrlsInText(line.slice(lastIndex), `${lineIdx}-${lastIndex}-end`))
  }

  return nodes
}

export function LinkifiedText({ content, className = '' }) {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx}>
          {renderLine(line, lineIdx)}
          {lineIdx < lines.length - 1 && '\n'}
        </span>
      ))}
    </div>
  )
}