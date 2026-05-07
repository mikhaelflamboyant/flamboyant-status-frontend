const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})/g
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/

function renderToken(token, key) {
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

export function LinkifiedText({ content, className = '' }) {
  if (!content) return null

  const lines = content.split('\n')

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(URL_REGEX)
        const rendered = parts.map((part, partIdx) => {
          if (!part) return null
          if (URL_REGEX.test(part)) {
            URL_REGEX.lastIndex = 0
            return renderToken(part, `${lineIdx}-${partIdx}`)
          }
          URL_REGEX.lastIndex = 0
          return <span key={`${lineIdx}-${partIdx}`}>{part}</span>
        })

        return (
          <span key={lineIdx}>
            {rendered}
            {lineIdx < lines.length - 1 && '\n'}
          </span>
        )
      })}
    </div>
  )
}