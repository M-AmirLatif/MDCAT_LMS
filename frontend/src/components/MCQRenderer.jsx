import { Fragment, useEffect, useRef, useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import { normalizeImageUrl } from '../utils/mediaUrls'
import 'katex/dist/katex.min.css'

const DIAGRAM_REGEX = /\[DIAGRAM:\s*([\s\S]*?)\]/gi
const IMAGE_TOKEN_REGEX =
  /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]/gi
const MARKDOWN_IMAGE_REGEX = /!\[([\s\S]*?)\]\(([\s\S]*?)\)/gi
const EXISTING_IMAGE_TOKEN_SPLIT_REGEX =
  /(\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):[\s\S]*?\])/gi
const EXISTING_IMAGE_TOKEN_TEST_REGEX =
  /^\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):[\s\S]*?\]$/i
const IMAGE_URL_REGEX =
  /((?:(?:https?:\/\/)[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:https?:\/\/res\.cloudinary\.com\/[^\s<>"']*?\/image\/upload\/[^\s<>"']+)|(?:\/uploads\/[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+))/gi
const HTML_IMAGE_TAG_REGEX = /<img\b[^>]*>/gi
const IMAGE_SOURCE_REGEX = /\bsrc\s*=\s*["']([^"']+)["']/i
const IMAGE_ALT_REGEX = /\balt\s*=\s*["']([^"']*)["']/i
const DEBUG_LOG_LIMIT = 40
let debugLogCount = 0

function cleanImageUrl(url) {
  return String(url || '')
    .trim()
    .replace(/^["'`<]+|["'`>]+$/g, '')
    .replace(/\s+["'][^"']*["']$/g, '')
    .replace(/[),.;\]]+$/g, '')
}

function isSafeImageUrl(url) {
  const value = normalizeImageUrl(cleanImageUrl(url))
  if (!value) return false

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(value)) {
    return true
  }

  if (/^blob:/i.test(value)) return true
  if (/^\/?(?:api\/)?uploads\/[^\s<>"']+/i.test(value)) return true

  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (parsed.hostname.includes('cloudinary.com')) return true
    if (/\/(?:api\/)?uploads\//i.test(parsed.pathname)) return true
    return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(parsed.pathname)
  } catch {
    return false
  }
}

function encodeImageToken({ url, alt = '' }) {
  const safeUrl = cleanImageUrl(url)
  if (!safeUrl) return ''
  return `[IMAGE:${safeUrl}|alt=${String(alt || '').trim()}]`
}

function shouldDebugRenderer() {
  if (typeof console === 'undefined') return false
  if (typeof window === 'undefined') return true
  return window.localStorage?.getItem('mcqRendererDebug') === 'true'
}

function logRendererDebug(payload) {
  if (!shouldDebugRenderer() || debugLogCount >= DEBUG_LOG_LIMIT) return
  debugLogCount += 1
  console.groupCollapsed?.('[MCQRenderer] image extraction')
  console.debug('[MCQRenderer] raw content prop:', payload.rawContent)
  console.debug('[MCQRenderer] images prop:', payload.images)
  console.debug('[MCQRenderer] imageUrls prop:', payload.imageUrls)
  console.debug('[MCQRenderer] extracted image matches:', payload.extractedImageMatches)
  console.debug('[MCQRenderer] final image URL array:', payload.finalImageUrls)
  console.groupEnd?.()
}

function imageFromUnknown(image) {
  if (!image) return null
  if (typeof image === 'string') return { url: cleanImageUrl(image), alt: '' }
  return {
    url: cleanImageUrl(
      image.url
        || image.src
        || image.imageUrl
        || image.secure_url
        || image.secureUrl
        || image.fileUrl
        || image.absoluteUrl
        || image.publicUrl
        || image.location
        || image.path
        || '',
    ),
    alt: image.alt || image.caption || image.title || '',
  }
}

function getImageToken(rawBody) {
  const parsed = parseImageTokenBody(rawBody)
  return parsed.url ? parsed : null
}

function normalizeMediaMarkup(text) {
  const value = String(text || '')
  if (!value) return ''

  const normalized = value
    .replace(HTML_IMAGE_TAG_REGEX, (tag) => {
      const srcMatch = tag.match(IMAGE_SOURCE_REGEX)
      if (!srcMatch?.[1]) return ''
      const altMatch = tag.match(IMAGE_ALT_REGEX)
      return encodeImageToken({ url: srcMatch[1], alt: altMatch?.[1] || '' })
    })
    .replace(MARKDOWN_IMAGE_REGEX, (_, alt, url) =>
      encodeImageToken({ url, alt }),
    )

  return normalized
    .split(EXISTING_IMAGE_TOKEN_SPLIT_REGEX)
    .map((segment) => {
      if (EXISTING_IMAGE_TOKEN_TEST_REGEX.test(segment)) return segment
      return segment.replace(IMAGE_URL_REGEX, (url) => encodeImageToken({ url }))
    })
    .join('')
}

function stripMediaMarkup(text) {
  return String(text || '')
    .replace(HTML_IMAGE_TAG_REGEX, '')
    .replace(MARKDOWN_IMAGE_REGEX, (_, alt) => (alt ? String(alt).trim() : ''))
    .replace(IMAGE_TOKEN_REGEX, '')
    .replace(IMAGE_URL_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractImageMatches(value) {
  const matches = []
  const imageRegex = new RegExp(IMAGE_TOKEN_REGEX)
  let imageMatch

  while ((imageMatch = imageRegex.exec(value)) !== null) {
    const image = getImageToken(imageMatch[1] || '')
    matches.push({
      raw: imageMatch[0],
      body: imageMatch[1] || '',
      index: imageMatch.index,
      url: image?.url || '',
      alt: image?.alt || '',
      valid: Boolean(image?.url && isSafeImageUrl(image.url)),
    })
  }

  return matches
}

function parseImageTokenBody(body) {
  const value = String(body || '').trim()
  if (!value) return { url: '', alt: '' }

  const parts = value.split('|').map((part) => part.trim()).filter(Boolean)
  const url = cleanImageUrl(parts[0] || '')
  const altPart = parts.find((part) => /^alt\s*=/i.test(part))
  const alt = altPart ? altPart.replace(/^alt\s*=/i, '').trim() : ''
  return { url, alt }
}

function RichImage({ image }) {
  const url = normalizeImageUrl(cleanImageUrl(image?.url))
  const alt = image?.alt || ''
  const imageRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)

    const image = imageRef.current
    if (!image) return

    if (image.complete) {
      if (image.naturalWidth > 0) {
        setLoaded(true)
      } else {
        setFailed(true)
      }
    }
  }, [url])

  if (!isSafeImageUrl(url)) return null

  return (
    <figure className="mcq-image-block">
      {!loaded && !failed ? <div className="mcq-image-skeleton" aria-hidden="true" /> : null}
      {failed ? (
        <div className="mcq-image-unavailable" role="status">Image unavailable</div>
      ) : (
        <img
          ref={imageRef}
          className={`mcq-image-block-media ${loaded ? 'mcq-image-block-media--loaded' : 'mcq-image-block-media--loading'}`}
          src={url}
          alt={alt || 'Question figure'}
          loading="eager"
          onLoad={() => {
            setFailed(false)
            setLoaded(true)
          }}
          onError={() => {
            setLoaded(false)
            setFailed(true)
          }}
        />
      )}
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

export default function MCQRenderer({
  text,
  content,
  imageUrl,
  imageUrls = [],
  images = [],
}) {
  const rawContent = text ?? content ?? ''
  const normalizedPropImages = [
    imageFromUnknown(imageUrl),
    ...[].concat(imageUrls || []).map((url) => imageFromUnknown(url)),
    ...[].concat(images || []).map((image) => imageFromUnknown(image)),
  ].filter((image) => image?.url)
    .filter((image) => isSafeImageUrl(image.url))

  const explicitImages = normalizedPropImages
  const appendedImages = explicitImages
    .map((image) => encodeImageToken(image))
    .filter(Boolean)
    .join('')

  const value = explicitImages.length
    ? stripMediaMarkup(rawContent)
    : normalizeMediaMarkup(`${rawContent || ''}${appendedImages}`)
  if (!value && explicitImages.length === 0) return <div className="mcq-renderer" />

  const nodes = []
  let lastIndex = 0
  let blockIndex = 0
  const blocks = []
  const diagramRegex = new RegExp(DIAGRAM_REGEX)
  const imageRegex = new RegExp(IMAGE_TOKEN_REGEX)
  const extractedImageMatches = explicitImages.length ? [] : extractImageMatches(value)
  const finalImageUrls = extractedImageMatches
    .filter((image) => image.valid)
    .map((image) => image.url)
    .concat(explicitImages.map((image) => image.url))
  let diagramMatch
  let imageMatch

  logRendererDebug({
    rawContent,
    images,
    imageUrls,
    extractedImageMatches,
    finalImageUrls,
  })

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
      const image = getImageToken(match[1] || '')
      if (image?.url && isSafeImageUrl(image.url)) {
        nodes.push(<RichImage key={`image-${blockIndex}`} image={image} />)
      }
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

  explicitImages.forEach((image, index) => {
    nodes.push(<RichImage key={`prop-image-${index}-${image.url}`} image={image} />)
  })

  return <div className="mcq-renderer">{nodes}</div>
}

export { MCQRenderer as MCQContent, MCQRenderer as RichContentRenderer }
