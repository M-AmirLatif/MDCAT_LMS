import { Fragment } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

const DIAGRAM_REGEX = /\[DIAGRAM:\s*([\s\S]*?)\]/gi

export function parseLatexText(text) {
  if (!text) return [{ type: 'text', content: '' }]
  const parts = []
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last)
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    const raw = match[0]
    const isDisplay = raw.startsWith('$$')
    parts.push({
      type: isDisplay ? 'block-math' : 'inline-math',
      content: raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1),
    })
    last = match.index + raw.length
  }
  if (last < text.length)
    parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

function renderTextWithMath(text, keyPrefix) {
  return parseLatexText(text).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.type === 'inline-math') {
      return <InlineMath key={key} math={part.content} />
    }
    if (part.type === 'block-math') {
      return (
        <div key={key} className="mcq-renderer-block-math">
          <BlockMath math={part.content} />
        </div>
      )
    }
    return <Fragment key={key}>{part.content}</Fragment>
  })
}

export default function MCQRenderer({ text }) {
  const value = String(text || '')
  if (!value) return <div className="mcq-renderer" />

  const nodes = []
  let lastIndex = 0
  let match
  let diagramIndex = 0

  while ((match = DIAGRAM_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`text-${diagramIndex}`}>
          {renderTextWithMath(value.slice(lastIndex, match.index), `text-${diagramIndex}`)}
        </span>,
      )
    }

    nodes.push(
      <div key={`diagram-${diagramIndex}`} className="mcq-diagram-callout">
        <div className="mcq-diagram-callout-head">
          <span className="mcq-diagram-callout-icon" aria-hidden="true">
            DIAG
          </span>
          <strong>Diagram</strong>
        </div>
        <div className="mcq-diagram-callout-body">
          {renderTextWithMath(match[1] || '', `diagram-${diagramIndex}`)}
        </div>
      </div>,
    )

    lastIndex = match.index + match[0].length
    diagramIndex += 1
  }

  if (lastIndex < value.length) {
    nodes.push(
      <span key={`tail-${diagramIndex}`}>
        {renderTextWithMath(value.slice(lastIndex), `tail-${diagramIndex}`)}
      </span>,
    )
  }

  return <div className="mcq-renderer">{nodes}</div>
}
