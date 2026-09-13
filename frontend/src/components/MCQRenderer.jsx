import { Fragment, useEffect, useRef, useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { cleanImageUrlValue, normalizeImageUrl } from '../utils/mediaUrls'


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

const CHEMICAL_ELEMENTS = new Set([
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra',
  'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db',
  'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
])
const CHEMICAL_FORMULA_REGEX = /(?<![A-Za-z])(?:\d+\s*)?(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+(?:\^?(?:\+{1,4}|-{1,4}|\d+[+-]|[+-]\d+))?(?![A-Za-z])/g
const GREEK_NAMES = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'nu',
  'pi', 'rho', 'sigma', 'tau', 'phi', 'chi', 'psi', 'omega',
])
const ENGLISH_STOPWORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'when', 'where', 'which', 'what', 'who', 'whom',
  'that', 'this', 'these', 'those', 'then', 'than', 'there', 'here', 'and', 'or', 'not',
  'if', 'so', 'because', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off',
  'on', 'onto', 'out', 'over', 'to', 'up', 'with', 'gives', 'given', 'shows', 'shown',
  'equals', 'equal', 'formula', 'relationship', 'equation', 'law', 'calculate', 'find',
  'determine', 'between', 'value', 'values', 'correct', 'following', 'option', 'statement',
  'according', 'depends', 'reaction', 'system', 'process', 'electron', 'photon', 'energy',
  'series', 'spectrum', 'transition', 'level', 'hydrogen', 'shortest', 'longest', 'highest',
  'lowest', 'constant', 'pressure', 'volume', 'temperature', 'state', 'initial', 'final',
  'where', 'represents', 'force', 'charges', 'two', 'spontaneous', 'all', 'temperatures',
  'its', 'wavelength', 'speed', 'light', 'kinetic', 'acceleration', 'unit', 'units', 'both',
  'bond', 'bonds', 'orbital', 'orbitals', 'atom', 'atoms', 'molecule', 'molecules',
  'ion', 'ions', 'higher', 'less', 'more', 'human', 'body', 'one', 'two', 'three', 'four'
])

const NUCLEIC_ACID_TERMS = [
  [/\bcdna\b/gi, 'cDNA'],
  [/\bmrna\b/gi, 'mRNA'],
  [/\btrna\b/gi, 'tRNA'],
  [/\brrna\b/gi, 'rRNA'],
  [/\bmirna\b/gi, 'miRNA'],
  [/\bsirna\b/gi, 'siRNA'],
  [/\bsnrna\b/gi, 'snRNA'],
  [/\bhnrna\b/gi, 'hnRNA'],
  [/\blncrna\b/gi, 'lncRNA'],
  [/\bmtdna\b/gi, 'mtDNA'],
  [/\bcpdna\b/gi, 'cpDNA'],
  [/\bssdna\b/gi, 'ssDNA'],
  [/\bdsdna\b/gi, 'dsDNA'],
  [/\bssrna\b/gi, 'ssRNA'],
  [/\bdsrna\b/gi, 'dsRNA'],
]

export function normalizeBiologicalTerms(text) {
  if (!text) return text
  let res = String(text)
  for (let i = 0; i < NUCLEIC_ACID_TERMS.length; i++) {
    const [regex, replacement] = NUCLEIC_ACID_TERMS[i]
    res = res.replace(regex, replacement)
  }
  return res
}

export function cleanAiCitations(text) {
  return normalizeBiologicalTerms(
    String(text || '')
      .replace(/\[cite:\s*\d+(?:\s*,\s*[\w\d]+)*\]/gi, '')
      .replace(/(?<=[a-zA-Z0-9\.\;\,])\s*\[\d+\](?=[\s\.\,\;\:\?\!]|$)/g, '')
      .replace(/【[^】]*?】/g, '')
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
      .replace(/\\(Delta|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)([a-zA-Z0-9])/g, '\\$1 $2')
  )
}

export function unicodeToLatex(str) {
  const map = {
    'Δ': '\\Delta ',
    'λ': '\\lambda ',
    'θ': '\\theta ',
    'α': '\\alpha ',
    'β': '\\beta ',
    'γ': '\\gamma ',
    'μ': '\\mu ',
    'π': '\\pi ',
    'σ': '\\sigma ',
    'ω': '\\omega ',
    'ρ': '\\rho ',
    'ε': '\\epsilon ',
    'φ': '\\phi ',
    'τ': '\\tau ',
    'η': '\\eta ',
    'ν': '\\nu ',
    '∞': '\\infty ',
    '±': '\\pm ',
    '×': '\\times ',
    '÷': '\\div ',
    '≈': '\\approx ',
    '≠': '\\neq ',
    '≤': '\\leq ',
    '≥': '\\geq ',
    'Σ': '\\Sigma ',
    '∑': '\\sum ',
  }
  return str.replace(/[Δλθαβγμπσωρεφηνη∞±×÷≈≠≤≥Σ∑]/g, (ch) => map[ch] || ch)
}

export function sanitizeLatexForKaTeX(expr) {
  let res = String(expr || '').trim()
  res = unicodeToLatex(res)
  res = res.replace(/°/g, '^\\circ ')
  res = res.replace(/!=|<>/g, ' \\neq ')
  res = res.replace(/<=/g, ' \\leq ')
  res = res.replace(/>=/g, ' \\geq ')
  res = res.replace(/\\(Delta|Sigma|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)([a-zA-Z0-9])/g, '\\$1 $2')
  res = res.replace(/([A-Za-z])(\d+)(?![_\d{])/g, '$1_{$2}')
  res = res.replace(/([A-Za-z0-9\)])_([A-Za-z0-9]+)(?![_{])/g, '$1_{$2}')
  res = res.replace(/\^\\(Delta|Sigma|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\s*([a-zA-Z0-9])/g, '^{\\$1 $2}')
  res = res.replace(/\^\(([^)]+)\)/g, '^{$1}')
  res = res.replace(/(^|[\s=+\-*])(\d+)\/(\d+)([\s*]|$)/g, '$1\\frac{$2}{$3}$4')
  return res.trim()
}

function isEnglishWord(word) {
  const clean = String(word || '').toLowerCase().replace(/[^a-z]/g, '')
  return clean.length >= 2 && ENGLISH_STOPWORDS.has(clean)
}

function splitByMathDelimiters(text) {
  const segments = []
  const existingMathRegex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g
  let lastIndex = 0
  let match

  while ((match = existingMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'math', content: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return segments
}

export function formatFormulasInText(text) {
  if (!text) return ''

  // 1. Convert temperature degrees Celcius / Fahrenheit / Kelvin: e.g. "2°C", "2 °C", "2^\circ C", "37°C"
  let str = String(text)
    .replace(/(?<![A-Za-z0-9])(-?\d+(?:\.\d+)?)\s*(?:°|(?:\^\\circ|\^o|\^0))\s*([CFK])\b/g, '$$$1^\\circ\\text{$2}$$')

  // 2. Degrees / Angles: "180°", "180^\circ", "90°", "1°", etc.
  str = splitByMathDelimiters(str).map((seg) => {
    if (seg.type === 'math') return seg.content
    return seg.content.replace(/(?<![A-Za-z0-9])(-?\d+(?:\.\d+)?)\s*(?:°|\^\\circ|\^o|\^0)(?![A-Za-z0-9])/g, '$$$1^\\circ$$')
  }).join('')

  // 3. Convert electron notation: e- or 2e- or e^-
  str = str.replace(/(?<![A-Za-z0-9])(\d*)\s*e\s*[-⁻](?![A-Za-z0-9])/g, (m, count) => {
    return `$$${count || ''}\\text{e}^-$$`
  })

  // 4. Convert scientific notation: 6.02×10^23, 6.02 x 10^-23, 6.02 × 10²³
  str = str.replace(/(?<![A-Za-z0-9])(-?\d+(?:\.\d+)?)\s*(?:[×*]|\\times|x)\s*10\^({?-?\d+}?)(?![A-Za-z0-9])/g, (m, coeff, exp) => {
    const cleanExp = exp.replace(/[{}]/g, '')
    return `$$${coeff} \\times 10^{${cleanExp}}$$`
  })
  str = str.replace(/(?<![A-Za-z0-9])(-?\d+(?:\.\d+)?)\s*(?:[×*]|\\times)\s*10([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)(?![A-Za-z0-9])/g, (m, coeff, exp) => {
    const supMap = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁺':'+', '⁻':'-' }
    const cleanExp = exp.split('').map((c) => supMap[c] || c).join('')
    return `$$${coeff} \\times 10^{${cleanExp}}$$`
  })

  // 5. Greek math expressions: \lambda, \lambda/2, \lambda /4, 2\lambda, \pi/90, 2\pi, λ, λ/2, 2λ, etc.
  const unicodeGreekMap = {
    'Δ': '\\Delta',
    'Σ': '\\Sigma',
    'λ': '\\lambda',
    'θ': '\\theta',
    'α': '\\alpha',
    'β': '\\beta',
    'γ': '\\gamma',
    'μ': '\\mu',
    'π': '\\pi',
    'σ': '\\sigma',
    'ω': '\\omega',
    'ρ': '\\rho',
    'ε': '\\epsilon',
    'φ': '\\phi',
    'τ': '\\tau',
    'η': '\\eta',
    'ν': '\\nu',
  }
  str = splitByMathDelimiters(str).map((seg) => {
    if (seg.type === 'math') return seg.content
    let current = seg.content
    for (const [uni, lat] of Object.entries(unicodeGreekMap)) {
      current = current.replace(new RegExp(uni, 'g'), lat)
    }
    const greekExprRegex = /(?<![A-Za-z0-9])(\d*\s*\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega|Delta|Sigma)\b(?:\s*\/\s*\d+)?)(?![A-Za-z0-9])/g
    return current.replace(greekExprRegex, (match) => {
      let expr = match.trim()
      if (expr.includes('/')) {
        const parts = expr.split('/')
        const num = parts[0].trim()
        const den = parts[1].trim()
        return `$\\frac{${num}}{${den}}$`
      }
      return `$${expr}$`
    })
  }).join('')

  let cleaned = cleanAiCitations(str)
  cleaned = unicodeToLatex(cleaned)

  if (/^\$\$[\s\S]+?\$\$$/.test(cleaned.trim()) || /^\$[^$]+?\$$/.test(cleaned.trim())) {
    return cleaned
  }

  // Pass 1: match full equations with =, !=, <>, <=, >=, etc.
  const eqPattern = /(?:^|(?<=[;:(,\s]))((?:\\(?:Delta|Sigma|sum|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\s*)*[A-Za-z0-9_\\^(){}\[\]+\-*/]+)\s*(=|!=|<>|\/=|<=|>=|<|>|≈|\\approx|\\neq|\\propto)\s*([A-Za-z0-9_\\^(){}\[\]+\-*/]+(?:\s+[A-Za-z0-9_\\^(){}\[\]+\-*/]+)*)(?=[;:,.)\s]|$)/g

  let pass1 = splitByMathDelimiters(cleaned).map((seg) => {
    if (seg.type === 'math') return seg.content
    let current = seg.content

    return current.replace(eqPattern, (fullMatch, lhs, op, rhs) => {
      if (isEnglishWord(lhs)) return fullMatch

      const rhsTokens = rhs.trim().split(/\s+/)
      let validRhsTokens = []
      for (const tok of rhsTokens) {
        if (isEnglishWord(tok)) break
        validRhsTokens.push(tok)
      }
      if (!validRhsTokens.length) return fullMatch

      const cleanRhs = validRhsTokens.join(' ')
      const formula = `${lhs} ${op} ${cleanRhs}`
      const trailingExtra = rhs.slice(cleanRhs.length)

      return `$${sanitizeLatexForKaTeX(formula)}$${trailingExtra}`
    })
  }).join('')

  // Pass 2: match standalone variables, subscripts, powers, Greek letters in remaining text
  // Notice: Greek letters do NOT absorb following words unless single variable/digit (e.g. \Delta T, \lambda 1)
  const greekRe = '\\\\(?:Delta|Sigma|sum|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\\b'
  const tokenPattern = new RegExp(
    `(?:^|(?<=[;:(,\\s]))((?:${greekRe}(?:\\s+[A-Z0-9]\\b)?|[A-Za-z0-9\\)]+_[A-Za-z0-9\\{]+(?:\\^[A-Za-z0-9\\{\\-]+)?|(?:\\([A-Za-z0-9_+\\- ]+\\)|[A-Za-z0-9_]+)\\^(?:\\{[^}]+\\}|[A-Za-z0-9+\\-]+)|\\\\(?:times|div|pm|approx|neq|leq|geq|infty)\\b))(?=[;:,.)\\s]|$)`,
    'g'
  )

  let pass2 = splitByMathDelimiters(pass1).map((seg) => {
    if (seg.type === 'math') return seg.content
    let current = seg.content

    return current.replace(tokenPattern, (fullMatch, token) => {
      const trimmed = token.trim()
      if (isEnglishWord(trimmed)) return fullMatch
      return `$${sanitizeLatexForKaTeX(trimmed)}$`
    })
  }).join('')

  return pass2
}

function tokenizeAsciiMath(value) {
  const tokens = []
  const regex = /\s*([A-Za-z][A-Za-z0-9_]*|\d*\.\d+|\d+|[()+\-*/^=])/gy
  let index = 0
  while (index < value.length) {
    regex.lastIndex = index
    const match = regex.exec(value)
    if (!match) return null
    tokens.push(match[1])
    index = regex.lastIndex
  }
  return tokens
}

function identifierToLatex(identifier) {
  const match = identifier.match(/^([A-Za-z]+)(?:_?(\d+))?$/)
  if (!match) return identifier
  const base = GREEK_NAMES.has(match[1].toLowerCase())
    ? `\\${match[1].toLowerCase()}`
    : match[1]
  return match[2] ? `${base}_{${match[2]}}` : base
}

function mathNodeToLatex(node, parentPrecedence = 0) {
  if (node.type === 'number') return node.value
  if (node.type === 'identifier') return identifierToLatex(node.value)
  if (node.type === 'negate') return `-${mathNodeToLatex(node.value, 4)}`
  if (node.type === 'power') {
    return `{${mathNodeToLatex(node.left, 4)}}^{${mathNodeToLatex(node.right)}}`
  }
  if (node.type === 'divide') {
    return `\\frac{${mathNodeToLatex(node.left)}}{${mathNodeToLatex(node.right)}}`
  }

  const precedence = node.type === 'add' || node.type === 'subtract' ? 1 : 2
  const operator = {
    add: '+',
    subtract: '-',
    multiply: '\\cdot',
  }[node.type]
  const rendered = `${mathNodeToLatex(node.left, precedence)} ${operator} ${mathNodeToLatex(node.right, precedence + 1)}`
  return precedence < parentPrecedence ? `\\left(${rendered}\\right)` : rendered
}

function parseAsciiEquation(value) {
  const raw = String(value || '').trim()
  if (!raw.includes('=')) return null
  const tokens = tokenizeAsciiMath(raw)
  if (!tokens || tokens.filter((token) => token === '=').length !== 1) return null
  let position = 0

  const parsePrimary = () => {
    const token = tokens[position]
    if (token === '-') {
      position += 1
      const valueNode = parsePrimary()
      return valueNode ? { type: 'negate', value: valueNode } : null
    }
    if (token === '(') {
      position += 1
      const node = parseExpression()
      if (tokens[position] !== ')') return null
      position += 1
      return node
    }
    if (/^\d/.test(token || '')) {
      position += 1
      return { type: 'number', value: token }
    }
    if (/^[A-Za-z]/.test(token || '')) {
      position += 1
      return { type: 'identifier', value: token }
    }
    return null
  }

  const parsePower = () => {
    let node = parsePrimary()
    if (node && tokens[position] === '^') {
      position += 1
      const right = parsePower()
      node = right ? { type: 'power', left: node, right } : null
    }
    return node
  }

  const parseProduct = () => {
    let node = parsePower()
    while (node && ['*', '/'].includes(tokens[position])) {
      const operator = tokens[position]
      position += 1
      const right = parsePower()
      if (!right) return null
      node = { type: operator === '*' ? 'multiply' : 'divide', left: node, right }
    }
    return node
  }

  function parseExpression() {
    let node = parseProduct()
    while (node && ['+', '-'].includes(tokens[position])) {
      const operator = tokens[position]
      position += 1
      const right = parseProduct()
      if (!right) return null
      node = { type: operator === '+' ? 'add' : 'subtract', left: node, right }
    }
    return node
  }

  const left = parseExpression()
  if (!left || tokens[position] !== '=') return null
  position += 1
  const right = parseExpression()
  if (!right || position !== tokens.length) return null
  return `${mathNodeToLatex(left)} = ${mathNodeToLatex(right)}`
}

function renderAsciiEquationWhenPresent(text, keyPrefix) {
  const value = String(text || '')
  const directEquation = parseAsciiEquation(value)
  if (directEquation) return <InlineMath math={directEquation} />

  const colonIndex = value.lastIndexOf(':')
  if (colonIndex >= 0) {
    const equation = parseAsciiEquation(value.slice(colonIndex + 1))
    if (equation) {
      return (
        <Fragment>
          {renderPlainTextWithChemistry(value.slice(0, colonIndex + 1), `${keyPrefix}-label`)}{' '}
          <InlineMath math={equation} />
        </Fragment>
      )
    }
  }
  return null
}

function parseChemicalFormula(value) {
  const raw = String(value || '')
  if (!/\d|[+-]$/.test(raw)) return null

  const coefficientMatch = raw.match(/^\d+(?=\s*[A-Z(])/)
  const coefficient = coefficientMatch?.[0] || ''
  const formula = raw.slice(coefficient.length).trimStart()
  const chargeMatch = formula.match(/\^?(?:\+{1,4}|-{1,4}|\d+[+-]|[+-]\d+)$/)
  const charge = chargeMatch?.[0]?.replace('^', '') || ''
  const body = charge ? formula.slice(0, -chargeMatch[0].length) : formula
  const elementMatches = [...body.matchAll(/[A-Z][a-z]?/g)].map((match) => match[0])

  if (!elementMatches.length || elementMatches.some((element) => !CHEMICAL_ELEMENTS.has(element))) {
    return null
  }
  const consumed = body.replace(/[A-Z][a-z]?|\d+|[()]/g, '')
  if (consumed) return null
  return { coefficient, body, charge }
}

function ChemicalFormula({ parsed }) {
  const parts = []
  const tokenRegex = /([A-Z][a-z]?|\d+|[()])/g
  let match
  let index = 0
  while ((match = tokenRegex.exec(parsed.body)) !== null) {
    const token = match[0]
    parts.push(/^\d+$/.test(token)
      ? <sub key={`sub-${index}`}>{token}</sub>
      : <Fragment key={`atom-${index}`}>{token}</Fragment>)
    index += 1
  }
  return (
    <span className="mcq-chemical-formula">
      {parsed.coefficient}{parts}
      {parsed.charge ? <sup>{parsed.charge}</sup> : null}
    </span>
  )
}

function renderPlainTextWithChemistry(text, keyPrefix) {
  const value = String(text || '')
  if (value.includes('\n')) {
    return value.split('\n').map((line, index, lines) => (
      <Fragment key={`${keyPrefix}-line-${index}`}>
        {renderPlainTextWithChemistry(line, `${keyPrefix}-line-${index}`)}
        {index < lines.length - 1 ? <br /> : null}
      </Fragment>
    ))
  }
  const equation = renderAsciiEquationWhenPresent(value, keyPrefix)
  if (equation) return equation
  const nodes = []
  const regex = new RegExp(CHEMICAL_FORMULA_REGEX)
  let lastIndex = 0
  let match
  let index = 0

  while ((match = regex.exec(value)) !== null) {
    const parsed = parseChemicalFormula(match[0])
    if (!parsed) continue
    if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index))
    nodes.push(<ChemicalFormula key={`${keyPrefix}-chem-${index}`} parsed={parsed} />)
    lastIndex = match.index + match[0].length
    index += 1
  }
  if (lastIndex < value.length) nodes.push(value.slice(lastIndex))
  return nodes.length ? nodes : value
}

function cleanImageUrl(url) {
  return cleanImageUrlValue(url)
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
  const url = normalizeImageUrl(image)
  if (!url) return null
  const alt = typeof image === 'object' && !Array.isArray(image)
    ? image.alt || image.caption || image.title || ''
    : ''
  return { url, alt }
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
  const normalizedImage = imageFromUnknown(image)
  const url = normalizedImage?.url || ''
  const alt = normalizedImage?.alt || ''
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
  const preparedText = formatFormulasInText(text)
  return parseLatexText(preparedText).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.type === 'inline-math') {
      return (
        <InlineMath
          key={key}
          math={part.content}
          renderError={(error) => (
            <span className="katex-fallback" title={error?.message || 'Math rendering error'}>
              {part.content}
            </span>
          )}
        />
      )
    }
    if (part.type === 'block-math') {
      return (
        <div key={key} className="mcq-renderer-block-math">
          <BlockMath
            math={part.content}
            renderError={(error) => (
              <span className="katex-fallback" title={error?.message || 'Math rendering error'}>
                {part.content}
              </span>
            )}
          />
        </div>
      )
    }
    return (
      <Fragment key={key}>
        {renderPlainTextWithChemistry(part.content, key)}
      </Fragment>
    )
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

