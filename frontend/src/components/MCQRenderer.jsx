import { Fragment } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

const DIAGRAM_REGEX = /\[DIAGRAM:\s*([\s\S]*?)\]/gi
const IMAGE_TOKEN_REGEX =
  /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]/gi
const MARKDOWN_IMAGE_REGEX = /!\[([\s\S]*?)\]\(([\s\S]*?)\)/gi
const IMAGE_URL_REGEX =
  /((?:(?:https?:\/\/)[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:https?:\/\/res\.cloudinary\.com\/[^\s<>"']*?\/image\/upload\/[^\s<>"']+)|(?:\/uploads\/[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+))/gi
const HTML_IMAGE_TAG_REGEX = /<img\b[^>]*>/gi
const IMAGE_SOURCE_REGEX = /\bsrc\s*=\s*["']([^"']+)["']/i
const IMAGE_ALT_REGEX = /\balt\s*=\s*["']([^"']*)["']/i

function encodeImageToken({ url, alt = '' }) {
  return `[IMAGE:${String(url || '').trim()}|alt=${String(alt || '').trim()}]`
}

function normalizeMediaMarkup(text) {
  const value = String(text || '')
  if (!value) return ''

  return value
    .replace(HTML_IMAGE_TAG_REGEX, (tag) => {
      const srcMatch = tag.match(IMAGE_SOURCE_REGEX)
      if (!srcMatch?.[1]) return ''
      const altMatch = tag.match(IMAGE_ALT_REGEX)
      return encodeImageToken({ url: srcMatch[1], alt: altMatch?.[1] || '' })
    })
    .replace(MARKDOWN_IMAGE_REGEX, (_, alt, url) =>
      encodeImageToken({ url, alt }),
    )
    .replace(IMAGE_URL_REGEX, (url) => encodeImageToken({ url }))
}

function parseImageTokenBody(body) {
  const value = String(body || '').trim()
  if (!value) return { url: '', alt: '' }

  const parts = value.split('|').map((part) => part.trim()).filter(Boolean)
  const url = parts[0] || ''
  const altPart = parts.find((part) => /^alt\s*=/i.test(part))
  const alt = altPart ? altPart.replace(/^alt\s*=/i, '').trim() : ''
  return { url, alt }
}

function renderImageBlock(body, key) {
  const { url, alt } = parseImageTokenBody(body)
  if (!url) return null

  return (
    <figure key={key} className="mcq-image-block">
      <img
        className="mcq-image-block-media"
        src={url}
        alt={alt || 'MCQ figure'}
        loading="lazy"
      />
      {alt ? <figcaption className="mcq-image-block-caption">{alt}</figcaption> : null}
    </figure>
  )
}

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
  const value = normalizeMediaMarkup(text)
  if (!value) return <div className="mcq-renderer" />

  const nodes = []
  let lastIndex = 0
  let blockIndex = 0
  const blocks = []
  const diagramRegex = new RegExp(DIAGRAM_REGEX)
  const imageRegex = new RegExp(IMAGE_TOKEN_REGEX)
  let diagramMatch
  let imageMatch

  while ((diagramMatch = diagramRegex.exec(value)) !== null) {
    blocks.push({
      type: 'diagram',
      match: diagramMatch,
      index: diagramMatch.index,
    })
  }

  while ((imageMatch = imageRegex.exec(value)) !== null) {
    blocks.push({
      type: 'image',
      match: imageMatch,
      index: imageMatch.index,
    })
  }

  blocks.sort((a, b) => a.index - b.index)

  blocks.forEach((block) => {
    const match = block.match
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`text-${blockIndex}`}>
          {renderTextWithMath(value.slice(lastIndex, match.index), `text-${blockIndex}`)}
        </span>,
      )
    }

    if (block.type === 'diagram') {
      nodes.push(
        <div key={`diagram-${blockIndex}`} className="mcq-diagram-callout">
          <div className="mcq-diagram-callout-head">
            <span className="mcq-diagram-callout-icon" aria-hidden="true">
              DIAG
            </span>
            <strong>Diagram</strong>
          </div>
          <div className="mcq-diagram-callout-body">
            {renderTextWithMath(match[1] || '', `diagram-${blockIndex}`)}
          </div>
        </div>
      )
    } else {
      const imageNode = renderImageBlock(match[1] || '', `image-${blockIndex}`)
      if (imageNode) nodes.push(imageNode)
    }

    lastIndex = match.index + match[0].length
    blockIndex += 1
  })

  if (lastIndex < value.length) {
    nodes.push(
      <span key={`tail-${blockIndex}`}>
        {renderTextWithMath(value.slice(lastIndex), `tail-${blockIndex}`)}
      </span>,
    )
  }

  return <div className="mcq-renderer">{nodes}</div>
}
