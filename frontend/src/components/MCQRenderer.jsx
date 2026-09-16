import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
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
  'ion', 'ions', 'higher', 'less', 'more', 'human', 'body', 'one', 'two', 'three', 'four',
  'waveform', 'wave', 'form', 'leads', 'another', 'stable', 'intermediate', 'collected', 'after',
  'reaches', 'same', 'phase', 'point', 'first', 'second', 'catalyst', 'increases', 'decreases',
  'remains', 'constant', 'zero', 'infinite', 'directly', 'inversely', 'proportional', 'described',
  'complex', 'activated', 'best', 'none', 'above', 'below', 'neither', 'either', 'both',
  'always', 'never', 'only', 'also', 'about', 'per', 'ratio', 'product', 'reactant', 'rate',
  'time', 'mass', 'charge', 'field', 'potential', 'current', 'voltage', 'power', 'work',
  'time', 'mass', 'charge', 'field', 'potential', 'current', 'voltage', 'power', 'work',
  'heat', 'entropy', 'enthalpy', 'equilibrium', 'forward', 'reverse', 'direction', 'effect',
  'half', 'twice', 'times', 'double', 'triple', 'quarter', 'third', 'fourth', 'fifth',
  'lesser', 'greater', 'becomes', 'doubled', 'tripled', 'halved', 'quadrupled'
])

export const COMPARISON_PROSE_REGEX = /\b(is|was|are|were|becomes|become|equal to|equals|greater than|less than|lesser than|more than|half of|half|twice|times|double|triple|doubled|tripled|halved|quadrupled|proportional to|inversely proportional to|directly proportional to)\b/i

export function isEnglishWord(word) {
  const clean = String(word || '').toLowerCase().replace(/[^a-z]/g, '')
  if (clean.length >= 4) return true
  return clean.length >= 2 && ENGLISH_STOPWORDS.has(clean)
}

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
      .replace(/\\+\[([\s\S]*?)\\+\]/g, (m, inner) => {
        const trimmed = inner.trim()
        const textCleaned = trimmed.replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[\s,;:]/g, ' ').replace(/\s+/g, ' ').trim()
        const words = textCleaned.split(/\s+/).filter(Boolean)
        if (words.length >= 2 && (words.filter(isEnglishWord).length >= 1 || COMPARISON_PROSE_REGEX.test(textCleaned))) {
          return textCleaned
        }
        if (!/[\\^_{}=<>+*\/±×÷≈≠≤≥~]/.test(trimmed)) {
          if (words.length >= 2 && words.filter(isEnglishWord).length >= 1) return trimmed
        }
        return `$$${inner}$$`
      })
      .replace(/\\+\(([\s\S]*?)\\+\)/g, (m, inner) => {
        const trimmed = inner.trim()
        const textCleaned = trimmed.replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[\s,;:]/g, ' ').replace(/\s+/g, ' ').trim()
        const words = textCleaned.split(/\s+/).filter(Boolean)
        if (words.length >= 2 && (words.filter(isEnglishWord).length >= 1 || COMPARISON_PROSE_REGEX.test(textCleaned))) {
          return textCleaned
        }
        if (!/[\\^_{}=<>+*\/±×÷≈≠≤≥~]/.test(trimmed)) {
          if (words.length >= 2 || (words.length === 1 && isEnglishWord(words[0]))) return trimmed
        }
        const mixedMatch = trimmed.match(/^([A-Za-z\s,;:'"-]{3,}\s+)([\S\s]*)$/)
        if (mixedMatch && !mixedMatch[1].includes('\\')) {
          const prose = mixedMatch[1]
          const math = mixedMatch[2]
          const proseWords = prose.trim().split(/\s+/)
          if (proseWords.length >= 2 || (proseWords.length >= 1 && isEnglishWord(proseWords[0]))) {
            return prose + '$' + math + '$'
          }
        }
        return `$${inner}$`
      })
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
    '√': '\\sqrt ',
  }
  return str.replace(/[Δλθαβγμπσωρεφηνη∞±×÷≈≠≤≥Σ∑√]/g, (ch) => map[ch] || ch)
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
  res = res.replace(/\(([A-Za-z]{2,})\)/g, '(\\text{$1})')
  res = res.replace(/\\sqrt\s*\(([^)]+)\)/g, (m, inner) => {
    if (inner.includes('/')) {
      const parts = inner.split('/')
      return `\\sqrt{\\frac{${cleanAlgebraicTerm(parts[0])}}{${cleanAlgebraicTerm(parts[1])}}}`
    }
    return `\\sqrt{${cleanAlgebraicTerm(inner)}}`
  })
  return res.trim()
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

const SUPERSCRIPT_MAP = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '−': '-', '–': '-', '—': '-'
}

function normalizeSuperscriptString(raw) {
  let res = ''
  for (const ch of String(raw || '')) {
    res += SUPERSCRIPT_MAP[ch] !== undefined ? SUPERSCRIPT_MAP[ch] : ch
  }
  return res.replace(/[{}]/g, '').replace(/[−–—]/g, '-').trim()
}

function normalizeUnit(rawUnit) {
  if (!rawUnit) return ''
  const u = rawUnit.trim()

  let cleanExp = ''
  const m = u.match(/^([A-Za-z°Ωμ]+(?:\/[A-Za-z°Ωμ]+)?)(?:[\^]([+-]?\d+)|([²³⁻¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)|([-−–]?\d+))?$/)
  if (m) {
    const base = m[1].trim()
    const expPart = m[2] || m[3] || m[4]
    if (expPart) {
      for (const ch of expPart) {
        cleanExp += SUPERSCRIPT_MAP[ch] !== undefined ? SUPERSCRIPT_MAP[ch] : ch
      }
      return `\\,\\text{${base}}^{${cleanExp}}`
    }
    return `\\,\\text{${base}}`
  }

  return `\\,\\text{${u.replace(/[⁻−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3')}}`
}

function mapNonMath(text, transformFn) {
  return splitByMathDelimiters(text).map((seg) => {
    if (seg.type === 'math') return seg.content
    return transformFn(seg.content)
  }).join('')
}

export const KNOWN_PHYSICS_VARS = new Set([
  'VA', 'VB', 'VC', 'VD',
  'EA', 'EB', 'EC', 'ED',
  'IA', 'IB', 'IC', 'ID',
  'RA', 'RB', 'RC', 'RD',
  'PA', 'PB', 'PC', 'PD',
  'TA', 'TB', 'TC', 'TD',
  'QA', 'QB', 'QC', 'QD',
  'FA', 'FB', 'FC', 'FD',
  'vA', 'vB', 'vC', 'vD',
  'qA', 'qB', 'qC', 'qD',
  'Fe', 'Fg', 'Fb', 'Fn', 'Fc', 'Fr', 'Ft',
  'Ep', 'Ek', 'Em',
  'Vi', 'Vf', 'Vo', 'V0', 'Vp', 'Vs',
  'vi', 'vf', 'vo', 'v0',
  'Ii', 'If', 'Io', 'I0', 'Ip', 'Is',
  'pi', 'pf', 'p0',
  'ti', 'tf', 't0',
  'xi', 'xf', 'x0',
  'Req', 'Ceq', 'Leq',
  'Irms', 'Vrms', 'Erms',
  'V1', 'V2', 'E1', 'E2', 'I1', 'I2', 'R1', 'R2',
  'C1', 'C2', 'q1', 'q2', 'F1', 'F2', 'm1', 'm2',
  'r1', 'r2', 'v1', 'v2', 'a1', 'a2', 't1', 't2',
  'p1', 'p2', 'N1', 'N2', 'T1', 'T2', 'K1', 'K2',
])

export function physicsVarToLatex(v) {
  if (!v) return v
  if (v.includes('_') || v.includes('\\') || v.includes('$')) return v

  const m1 = v.match(/^([VEIRPTQFabpq])([ABCD])$/)
  if (m1) return `${m1[1]}_{${m1[2]}}`

  const m2 = v.match(/^([F])([egbncrt])$/)
  if (m2) return `${m2[1]}_{${m2[2]}}`

  const m3 = v.match(/^([E])([pkm])$/)
  if (m3) return `${m3[1]}_{${m3[2]}}`

  const m4 = v.match(/^([VvIiptx])([ifo0ps])$/)
  if (m4) return `${m4[1]}_{${m4[2]}}`

  const m5 = v.match(/^([RCL])(eq)$/i)
  if (m5) return `${m5[1]}_{\\text{${m5[2].toLowerCase()}}}`

  const m6 = v.match(/^([VIE])(rms)$/i)
  if (m6) return `${m6[1]}_{\\text{${m6[2].toLowerCase()}}}`

  const m7 = v.match(/^([VEIRQCqFmrvaltpNTK])(\d+)$/)
  if (m7) return `${m7[1]}_{${m7[2]}}`

  return v
}

function cleanGreekAndConstants(str) {
  return str
    .replace(/πε0/g, '\\pi\\epsilon_0 ')
    .replace(/πεr/g, '\\pi\\epsilon_r ')
    .replace(/πε/g, '\\pi\\epsilon ')
    .replace(/ε0/g, '\\epsilon_0 ')
    .replace(/εr/g, '\\epsilon_r ')
    .replace(/μ0/g, '\\mu_0 ')
    .replace(/π/g, '\\pi ')
    .replace(/ε/g, '\\epsilon ')
    .replace(/λ/g, '\\lambda ')
    .replace(/θ/g, '\\theta ')
    .replace(/μ/g, '\\mu ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/σ/g, '\\sigma ')
    .replace(/ω/g, '\\omega ')
    .replace(/ρ/g, '\\rho ')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
}

function cleanAlgebraicTerm(term) {
  let res = cleanGreekAndConstants(String(term || '').trim())
  res = res.replace(/√\s*([A-Za-z0-9]+)/g, (m, tok) => `\\sqrt{${tok}}`)
  res = res.replace(/[²]/g, '^2').replace(/[³]/g, '^3').replace(/[¹]/g, '^1')
  res = res.replace(/\^([A-Za-z0-9+\-]+)/g, '^{$1}')
  return res.trim()
}

export function formatFormulasInText(text) {
  if (!text) return ''

  let str = String(text).trim()

  // 0a. Clean AI citations and standard LaTeX wrappers \(...\) -> $...$ and \[...\] -> $$...$$
  str = cleanAiCitations(str)

  // 0b. Unescape escaped dollar signs: \$ -> $, \\$ -> $
  str = str.replace(/\\+(\$)/g, '$1')

  // 0c. Clean double-escaped commands: \\times -> \times, \\Delta -> \Delta
  str = str.replace(/\\\\([A-Za-z]+)/g, (m, name) => `\\${name}`)

  // 0d. Normalize unicode √ to \sqrt
  str = str.replace(/√/g, '\\sqrt ')

  // 0e. Strip redundant outer parens like "(\sqrt{W/k})" or "(\sqrt{\frac{W}{k}})" or "(\frac{W}{k})"
  str = mapNonMath(str, (s) => {
    let res = s
    res = res.replace(/^\s*\(\s*(\\sqrt\{[^}]+\}|\\sqrt\([^)]+\)|\\frac\{[^}]+\}\{[^}]+\})\s*\)\s*$/, '$1')
    return res
  })

  // 1. Convert temperature: e.g. "+273.16°C", "-273.16°C", "2°C", "0°C", "2^\circ C"
  str = str.replace(/(?<![A-Za-z0-9])([+-]?\d+(?:\.\d+)?)\s*(?:°|(?:\^\\circ|\^o|\^0))\s*([CFK])\b/g, (m, val, unit) => {
    return `$${val}^\\circ\\text{${unit}}$`
  })

  // 2. Degrees / Angles: "180°", "180^\circ", "90°", "1°", etc.
  str = mapNonMath(str, (s) =>
    s.replace(/(?<![A-Za-z0-9])([+-]?\d+(?:\.\d+)?)\s*(?:°|\^\\circ|\^o|\^0)(?![A-Za-z0-9])/g, (m, val) => {
      return `$${val}^\\circ$`
    })
  )

  // 3. Convert electron notation: e- or 2e- or e^-
  str = mapNonMath(str, (s) =>
    s.replace(/(?<![A-Za-z0-9])(\d*)\s*e\s*[-⁻−–](?![A-Za-z0-9])/g, (m, count) => {
      return `$${count || ''}\\text{e}^-$`
    })
  )

  // 4. Scientific notation with coefficient:
  // e.g. "1.6×10⁻22 J", "1.6 \times 10^-19 J", "4×10⁻3 C", "26.4 × 10⁻12 C/m²", "1.6\times 10^-22"
  const fullSciRegex = /(?<![A-Za-z0-9])([+-]?\d+(?:\.\d+)?)\s*(?:[×*·]|\\times|\\cdot|\bx\b)\s*10(?:\^|\s*\^)?\s*([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−–\d{}]+|[+-]?\d+)(?:\s*([A-Za-z°Ωμ][A-Za-z0-9_/\^⁺⁻−–²³·*\-]*))?/g
  str = mapNonMath(str, (s) =>
    s.replace(fullSciRegex, (match, coeff, expRaw, unitRaw) => {
      const exp = normalizeSuperscriptString(expRaw)
      const unit = normalizeUnit(unitRaw)
      return `$${coeff} \\times 10^{${exp}}${unit}$`
    })
  )

  // 5. Standalone powers of 10 with caret or explicit exponent:
  // e.g. "10^-8", "10^-3C", "10^6 N/C", "10^-12"
  const standalonePow10Regex = /(?<![A-Za-z0-9])10(?:\^|\s*\^)\s*([+-]?[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−–\d{}]+)(?:\s*([A-Za-z°Ωμ][A-Za-z0-9_/\^⁺⁻−–²³·*\-]*))?/g
  str = mapNonMath(str, (s) =>
    s.replace(standalonePow10Regex, (match, expRaw, unitRaw) => {
      const exp = normalizeSuperscriptString(expRaw)
      const unit = normalizeUnit(unitRaw)
      return `$10^{${exp}}${unit}$`
    })
  )

  // 6. Standalone powers of 10 with unicode exponent:
  // e.g. "10⁻5 C", "10⁻8", "10²³", "10⁻¹² A", "10⁷"
  const unicodePow10Regex = /(?<![A-Za-z0-9])10([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−–]+(?:\d+)?)(?:\s*([A-Za-z°Ωμ][A-Za-z0-9_/\^⁺⁻−–²³·*\-]*))?/g
  str = mapNonMath(str, (s) =>
    s.replace(unicodePow10Regex, (match, expRaw, unitRaw) => {
      const exp = normalizeSuperscriptString(expRaw)
      const unit = normalizeUnit(unitRaw)
      return `$10^{${exp}}${unit}$`
    })
  )

  // 7. Hyphenated power of 10 without caret:
  // e.g. "(answer in units of 10-8C)" or "order of 10-5"
  const hyphenPow10 = /(?<=(?:units of|order of|factor of|power of)\s*)10[-−–](\d{1,2})(?:\s*([A-Za-z°Ωμ]+))?/gi
  str = mapNonMath(str, (s) =>
    s.replace(hyphenPow10, (match, expVal, unitRaw) => {
      const unit = normalizeUnit(unitRaw)
      return `$10^{-${expVal}}${unit}$`
    })
  )

  // 8. Standalone physics units in options or text:
  // e.g. "C/m", "C/m2", "C/m-1", "C/m-2", "m/s2", "C² N^-1 m^-2", "N·m² C^-1", "N·m C^-2"
  str = mapNonMath(str, (s) => {
    let res = s
    // Entire string is a unit expression (common in MCQ options like "C/m2" or "C/m-1")
    if (/^\s*[A-Za-z°Ωμ](?:[²³]|\^[+-]?\d+)?(?:\s*[\/·\s]\s*[A-Za-z°Ωμ]+(?:[-−–]?\d+|\^[+-]?\d+|[²³⁻¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)?)+\s*$/.test(res.trim())) {
      const cleanUnit = res.trim()
        .replace(/([A-Za-z°Ωμ]+)\/([A-Za-z°Ωμ]+)([-−–]?\d+)?/g, (m, num, den, exp) => {
          if (!exp) return `\\text{${num}/${den}}`
          const cleanExp = exp.replace(/[⁻−–]/g, '-')
          return `\\text{${num}/${den}}^{${cleanExp}}`
        })
        .replace(/([A-Za-z°Ωμ]+)\^?([+-]?\d+)/g, '\\text{$1}^{$2}')
        .replace(/([A-Za-z°Ωμ]+)([²³])/g, (m, u, p) => `\\text{${u}}^${p === '²' ? '2' : '3'}`)
        .replace(/·/g, '\\cdot ')
      return `$${cleanUnit}$`
    }

    // Single unit with slash and exponent like "C/m", "C/m2", "C/m-1", "C/m-2", "m/s2", "V/cm"
    if (/^\s*([A-Za-z°Ωμ]+)\/([A-Za-z°Ωμ]+)([-−–]?\d+)?\s*$/.test(res.trim())) {
      const m = res.trim().match(/^([A-Za-z°Ωμ]+)\/([A-Za-z°Ωμ]+)([-−–]?\d+)?$/)
      if (m) {
        const exp = m[3] ? `^{${m[3].replace(/[⁻−–]/g, '-')}}` : ''
        return `$\\text{${m[1]}/${m[2]}}${exp}$`
      }
    }

    // Inline units like "C/m2", "C/m-1", "C/m-2", "m/s2", "V/cm"
    res = res.replace(/(?<![A-Za-z0-9])([A-Z][a-z]?)\/([a-z]+)([-−–]?\d+)(?![A-Za-z0-9])/g, (m, num, den, exp) => {
      const cleanExp = exp.replace(/[⁻−–]/g, '-')
      return `$\\text{${num}/${den}}^{${cleanExp}}$`
    })

    return res
  })

  // 9. Physics comparison phrases: e.g. "EA lesser than EB", "Fe greater than Fg", "VA equal to VB", "EA less than EB"
  const compRegex = /\b([A-Za-z0-9_]+)\s+(lesser than|less than|greater than|more than|equal to)\s+([A-Za-z0-9_]+)\b/gi
  str = mapNonMath(str, (s) =>
    s.replace(compRegex, (match, v1, op, v2) => {
      const isV1Known = KNOWN_PHYSICS_VARS.has(v1) || /^[VEIRPFqv][ABCD\d]$/.test(v1)
      const isV2Known = KNOWN_PHYSICS_VARS.has(v2) || /^[VEIRPFqv][ABCD\d]$/.test(v2)
      if (!isV1Known && !isV2Known) return match

      const l1 = physicsVarToLatex(v1)
      const l2 = physicsVarToLatex(v2)
      const cleanOp = op.toLowerCase()
      return `$${l1}$ ${cleanOp} $${l2}$`
    })
  )

  // 10. Direct physics variable equations/inequalities: e.g. "VA=VB", "EA = EB", "VA < VB", "FA > FB", "FA = FB"
  const eqVarRegex = /(?<![A-Za-z0-9])([A-Za-z0-9_]+)\s*(=|!=|<=|>=|<|>)\s*([A-Za-z0-9_]+)(?![A-Za-z0-9])/g
  str = mapNonMath(str, (s) =>
    s.replace(eqVarRegex, (match, v1, op, v2) => {
      const isV1Known = KNOWN_PHYSICS_VARS.has(v1) || /^[VEIRPFqv][ABCD\d]$/.test(v1)
      const isV2Known = KNOWN_PHYSICS_VARS.has(v2) || /^[VEIRPFqv][ABCD\d]$/.test(v2)
      if (!isV1Known && !isV2Known) return match

      const l1 = physicsVarToLatex(v1)
      const l2 = physicsVarToLatex(v2)
      return `$${l1} ${op} ${l2}$`
    })
  )

  // 11. Standalone physics variable in an option: e.g. "VA", "EB", "Fe", "Req"
  if (/^\s*[A-Za-z0-9_]+\s*$/.test(str)) {
    const trimmed = str.trim()
    if (KNOWN_PHYSICS_VARS.has(trimmed)) {
      str = `$${physicsVarToLatex(trimmed)}$`
    }
  }

  // 12. Standalone option number with unit: e.g. "2 mF", "100μC", "100uC", "108MJ", "10/3 V", "5V", "5000V"
  const singleOptionUnitRegex = /^\s*([+-]?(?:\d+(?:\.\d+)?|\d+\/\d+))\s*(?:[x×*·]?\s*10(?:\^|\s*\^)?\s*([+-]?\d+))?\s*([μu]?[A-Za-z°Ω]+(?:[-−–]?\d+|\^[+-]?\d+|[²³])?)\s*$/
  const mOpt = str.match(singleOptionUnitRegex)
  if (mOpt) {
    const val = mOpt[1]
    const exp = mOpt[2]
    let unit = mOpt[3]
    if (unit.startsWith('u') && !['units', 'unit'].includes(unit.toLowerCase())) {
      unit = 'μ' + unit.slice(1)
    }
    if (unit.startsWith('μ')) {
      const remainder = unit.slice(1)
      const unitLatex = remainder ? `\\mu\\text{${remainder}}` : `\\mu`
      if (exp !== undefined) {
        str = `$${val} \\times 10^{${exp}}\\,${unitLatex}$`
      } else {
        str = `$${val}\\,${unitLatex}$`
      }
    } else {
      const cleanUnit = unit.replace(/Ω/g, '\\Omega ')
      if (exp !== undefined) {
        str = `$${val} \\times 10^{${exp}}\\,\\text{${cleanUnit}}$`
      } else {
        str = `$${val}\\,\\text{${cleanUnit}}$`
      }
    }
  }

  // 13. Grouped square roots & textual root variations in non-math text:
  // e.g. "√(W/k)", "√(W / k)", "√{W/k}", "\sqrt(W/k)", "\sqrt{W/k}", "underoot(W/k)", "under root (W/k)", "sqrt(W/k)", "underoot 2gh", "\sqrt{\frac{W}{k}}"
  str = mapNonMath(str, (s) => {
    let res = s
    res = res.replace(/(?:\\|√)?(?:under\s*root|under-root|underoot|sqrt|root)\s*(?:\{\s*\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\}|\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}|\{([^}]+)\}|\(([^)]+)\))/gi, (m, nf1, df1, nf2, df2, brace, paren) => {
      const num = nf1 || nf2
      const den = df1 || df2
      if (num && den) {
        return `$\\sqrt{\\frac{${cleanAlgebraicTerm(num)}}{${cleanAlgebraicTerm(den)}}}$`
      }
      const inner = (brace || paren || '').trim()
      if (inner.includes('/')) {
        const parts = inner.split('/')
        if (parts.length === 2) {
          return `$\\sqrt{\\frac{${cleanAlgebraicTerm(parts[0])}}{${cleanAlgebraicTerm(parts[1])}}}$`
        }
      }
      return `$\\sqrt{${cleanAlgebraicTerm(inner)}}$`
    })

    res = res.replace(/\b(?:under\s*root|under-root|underoot)\s+([A-Za-z0-9/]+)/gi, (m, inner) => {
      const trimmed = inner.trim()
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/')
        return `$\\sqrt{\\frac{${cleanAlgebraicTerm(parts[0])}}{${cleanAlgebraicTerm(parts[1])}}}$`
      }
      return `$\\sqrt{${cleanAlgebraicTerm(trimmed)}}$`
    })

    return res
  })

  // 14. Handle power of half / square root notation:
  // e.g. "(W/k)^(1/2)", "(W/k)^1/2", "(W/k)^{1/2}", "(W/k)^0.5", "(W/k)^½"
  str = mapNonMath(str, (s) => {
    let res = s
    res = res.replace(/\(([^)]+)\)\s*\^\s*(?:\(?\s*1\s*\/\s*2\s*\)?|\{\s*1\s*\/\s*2\s*\}|0\.5|½)/g, (m, inner) => {
      const clean = inner.trim()
      if (clean.includes('/')) {
        const parts = clean.split('/')
        return `$\\sqrt{\\frac{${cleanAlgebraicTerm(parts[0])}}{${cleanAlgebraicTerm(parts[1])}}}$`
      }
      return `$\\sqrt{${cleanAlgebraicTerm(clean)}}$`
    })
    // Single variable power of half: e.g. "T^(1/2)", "T^{1/2}", "T^1/2", "T^½"
    res = res.replace(/(?<![A-Za-z0-9])([A-Za-z0-9_]+)\s*\^\s*(?:\(?\s*1\s*\/\s*2\s*\)?|\{\s*1\s*\/\s*2\s*\}|0\.5|½)(?![A-Za-z0-9])/g, (m, v) => {
      return `$\\sqrt{${v}}$`
    })
    // Single variable power of fraction: e.g. "T^(1/3)", "T^{2/3}"
    res = res.replace(/(?<![A-Za-z0-9])([A-Za-z0-9_]+)\s*\^\s*(?:\(\s*(\d+)\s*\/\s*(\d+)\s*\)|\{\s*(\d+)\s*\/\s*(\d+)\s*\})/g, (m, v, n1, d1, n2, d2) => {
      const num = n1 || n2
      const den = d1 || d2
      return `$${v}^{\\frac{${num}}{${den}}}$`
    })
    return res
  })

  // 15. Algebraic & Numerical fractions: e.g. "0.693/T", "T/0.693", "1/T^2", "1/T²", "Q^2/(4πε0a^2)", "-Q^2/(4πε0a^2)", "1/(4πε0)", "mv^2/r", "1/√2"
  const fracRegex = /(?<![A-Za-z0-9$.])([+-]?)(?:\(([^)]+)\)|([A-Za-z0-9^_.πελθμΔσωραβγ²³]+))\s*\/\s*(?:\(([^)]+)\)|([A-Za-z0-9^_.πελθμΔσωραβγ²³]+))(?![A-Za-z0-9$.])/g
  str = mapNonMath(str, (s) =>
    s.replace(fracRegex, (match, sign, numParen, numRaw, denParen, denRaw) => {
      const num = numParen || numRaw
      const den = denParen || denRaw

      if (!num || !den) return match
      if (/^(?:and|or|yes|no|true|false|either|neither)$/i.test(num) || /^(?:and|or|yes|no|true|false|either|neither)$/i.test(den)) return match
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(match)) return match

      const isMath = /[0-9^πελθμΔσωραβγ_²³]/.test(match) || /^[A-Za-z]\/[A-Za-z]$/.test(match) || /^[A-Za-z0-9.]+\/[A-Za-z0-9.]+$/.test(match)
      if (!isMath) return match

      const cleanNum = cleanAlgebraicTerm(num)
      const cleanDen = cleanAlgebraicTerm(den)

      const prefix = sign === '-' ? '-' : ''
      return `$${prefix}\\frac{${cleanNum}}{${cleanDen}}$`
    })
  )

  // 16. Standalone single-token square roots: e.g. "\sqrt 2", "\sqrt 3", "\sqrt x", "\sqrt g"
  str = mapNonMath(str, (s) => {
    let res = s
    res = res.replace(/\\sqrt\s+([A-Za-z0-9]+)/g, (m, token) => `$\\sqrt{${token}}$`)
    return res
  })

  // 17. Fractions where numerator or denominator is already math (e.g. 1/$\sqrt{2}$):
  str = str.replace(/(?<![A-Za-z0-9$])([0-9A-Za-z]+)\s*\/\s*\$([^$]+)\$/g, (m, num, mathDen) => {
    return `$\\frac{${num}}{${mathDen}}$`
  })
  str = str.replace(/\$([^$]+)\$\s*\/\s*([0-9A-Za-z]+)(?![A-Za-z0-9$])/g, (m, mathNum, den) => {
    return `$\\frac{${mathNum}}{${den}}$`
  })

  // 18. Direct \frac in text that lacks dollar delimiters:
  str = mapNonMath(str, (s) => {
    let res = s
    res = res.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (m, num, den) => `$\\frac{${num.trim()}}{${den.trim()}}$`)
    return res
  })

  let cleaned = str
  cleaned = splitByMathDelimiters(cleaned).map((seg) => {
    if (seg.type === 'math') {
      const isDisplay = seg.content.startsWith('$$')
      const inner = seg.content.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1)
      const sanitized = sanitizeLatexForKaTeX(inner)
      return `${isDisplay ? '$$' : '$'}${sanitized}${isDisplay ? '$$' : '$'}`
    }
    return unicodeToLatex(seg.content)
  }).join('')

  // Clean any accidental English prose inside $ ... $
  cleaned = cleaned.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (m, inner) => {
    const trimmed = inner.trim()
    const textCleaned = trimmed.replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[\s,;:]/g, ' ').replace(/\s+/g, ' ').trim()
    const words = textCleaned.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && (words.filter(isEnglishWord).length >= 1 || COMPARISON_PROSE_REGEX.test(textCleaned))) {
      return textCleaned
    }
    if (!/[\\^_{}=<>+*\/±×÷≈≠≤≥~]/.test(trimmed)) {
      if (words.length >= 2 && words.filter(isEnglishWord).length >= 1) {
        return trimmed
      }
    }
    const mixedMatch = trimmed.match(/^([A-Za-z\s,;:'"-]{3,}\s+)([\S\s]*)$/)
    if (mixedMatch && !mixedMatch[1].includes('\\')) {
      const prose = mixedMatch[1]
      const math = mixedMatch[2]
      const proseWords = prose.trim().split(/\s+/)
      if (proseWords.length >= 2 || (proseWords.length >= 1 && isEnglishWord(proseWords[0]))) {
        return prose + '$' + math + '$'
      }
    }
    return `$${inner}$`
  })

  // Strip outer parens if entire string is wrapped around a single math item: e.g. "($\sqrt{...}$)" -> "$\sqrt{...}$"
  cleaned = cleaned.replace(/^\s*\(\s*(\$[^$]+\$|\$\$[^$]+\$\$)\s*\)\s*$/, '$1')

  if (/^\$\$[\s\S]+?\$\$$/.test(cleaned.trim()) || /^\$[^$]+?\$$/.test(cleaned.trim())) {
    return cleaned
  }

  // Pass 1: match full equations with =, !=, <>, <=, >=, etc.
  const eqPattern = /(?:^|(?<=[;:(,\s]))((?:\\(?:Delta|Sigma|sum|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\s*)*[A-Za-z0-9_\\^(){}\[\]+\-*/]+(?:\([A-Za-z0-9_+\- ]+\))?)\s*(=|!=|<>|\/=|<=|>=|<|>|≈|\\approx|\\neq|\\propto)\s*([+-]?[A-Za-z0-9_\\^(){}\[\]+\-*/]+(?:\s+[A-Za-z0-9_\\^(){}\[\]+\-*/]+)*)(?=[;:,.)\s]|$)/g

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

  // Pass 2: Greek math expressions with divisions/multipliers: \lambda /2, 2\lambda, \pi/180 radians, etc.
  const greekExprRegex = /(?<![A-Za-z0-9])(\d*\s*\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega|Delta|Sigma)\b(?:\s*\\(?:Delta|Sigma|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\b)*(?:\s*[A-Z0-9]\b)?(?:\s*\/\s*\d+)?)(?![A-Za-z0-9])/g

  let pass2 = splitByMathDelimiters(pass1).map((seg) => {
    if (seg.type === 'math') return seg.content
    let current = seg.content
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

  // Pass 3: standalone tokens (subscripts, superscripts, math operators)
  const tokenPattern = /(?:^|(?<=[;:(,\s]))([A-Za-z0-9\)]+_[A-Za-z0-9\{]+(?:\^[A-Za-z0-9\{\-]+)?|(?:\\([A-Za-z0-9_+\- ]+\\)|[A-Za-z0-9_]+)\^(?:\{[^}]+\}|[A-Za-z0-9+\-]+)|\\(?:times|div|pm|approx|neq|leq|geq|infty)\b)(?=[;:,.)\s]|$)/g

  let pass3 = splitByMathDelimiters(pass2).map((seg) => {
    if (seg.type === 'math') return seg.content
    let current = seg.content

    return current.replace(tokenPattern, (fullMatch, token) => {
      const trimmed = token.trim()
      if (isEnglishWord(trimmed)) return fullMatch
      return `$${sanitizeLatexForKaTeX(trimmed)}$`
    })
  }).join('')

  // Pass 4: Standalone LaTeX commands left in text without dollar signs (e.g. \times, \pm, \div, \mu, \Delta, \text{...})
  let pass4 = mapNonMath(pass3, (s) => {
    let res = s
    res = res.replace(/\\(?:times|pm|div|approx|neq|leq|geq|infty)\b/g, (m) => `$${m}$`)
    res = res.replace(/\\(?:Delta|Sigma|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|chi|psi|omega)\b/g, (m) => `$${m}$`)
    res = res.replace(/(?<![A-Za-z0-9$])(\d+(?:\.\d+)?\s*)?\\text\{([^}]+)\}(?!\$)/g, (m) => `$${m}$`)
    return res
  })

  return pass4
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
  if (KNOWN_PHYSICS_VARS.has(identifier)) {
    return physicsVarToLatex(identifier)
  }
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
  if (directEquation) return <KatexMath math={directEquation} displayMode={false} />

  const colonIndex = value.lastIndexOf(':')
  if (colonIndex >= 0) {
    const equation = parseAsciiEquation(value.slice(colonIndex + 1))
    if (equation) {
      return (
        <Fragment>
          {renderPlainTextWithChemistry(value.slice(0, colonIndex + 1), `${keyPrefix}-label`)}{' '}
          <KatexMath math={equation} displayMode={false} />
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
  const [zoomed, setZoomed] = useState(false)

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

  useEffect(() => {
    if (!zoomed) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomed(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomed])

  if (!isSafeImageUrl(url)) return null

  return (
    <>
      <figure className="mcq-image-block">
        {!loaded && !failed ? <div className="mcq-image-skeleton" aria-hidden="true" /> : null}
        {failed ? (
          <div className="mcq-image-unavailable" role="status">Image unavailable</div>
        ) : (
          <div className="mcq-image-wrapper" onClick={() => setZoomed(true)} title="Click to view full size">
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
            {loaded ? (
              <span className="mcq-image-zoom-hint" aria-hidden="true">
                🔍 Click to enlarge
              </span>
            ) : null}
          </div>
        )}
        {alt ? <figcaption className="mcq-image-block-caption">{alt}</figcaption> : null}
      </figure>

      {zoomed ? (
        <div className="mcq-image-lightbox" onClick={() => setZoomed(false)} role="dialog" aria-modal="true">
          <div className="mcq-image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mcq-image-lightbox-close"
              onClick={() => setZoomed(false)}
              aria-label="Close enlarged image"
            >
              ✕
            </button>
            <img src={url} alt={alt || 'Enlarged figure'} className="mcq-image-lightbox-img" />
            {alt ? <figcaption className="mcq-image-lightbox-caption">{alt}</figcaption> : null}
          </div>
        </div>
      ) : null}
    </>
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
    const inner = raw.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1).trim()

    // Safety check: If inner is prose or comparison sentence, render as plain text!
    const textCleaned = inner.replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[\s,;:]/g, ' ').replace(/\s+/g, ' ').trim()
    const words = textCleaned.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && (words.filter(isEnglishWord).length >= 1 || COMPARISON_PROSE_REGEX.test(textCleaned))) {
      parts.push({ type: 'text', content: textCleaned })
      last = match.index + raw.length
      continue
    }
    if (!/[\\^_{}=<>+*\/±×÷≈≠≤≥~]/.test(inner)) {
      if (words.length >= 2 && words.filter(isEnglishWord).length >= 1) {
        parts.push({ type: 'text', content: inner })
        last = match.index + raw.length
        continue
      }
    }

    parts.push({
      type: isDisplay ? 'block-math' : 'inline-math',
      content: inner,
    })
    last = match.index + raw.length
  }
  if (last < text.length)
    parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

function KatexMath({ math, displayMode = false }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return null
    }
  }, [math, displayMode])

  if (!html) {
    return <span>{math}</span>
  }

  return (
    <span
      className={displayMode ? 'mcq-renderer-block-math' : 'mcq-renderer-inline-math'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function renderTextWithMath(text, keyPrefix) {
  const preparedText = formatFormulasInText(text)
  return parseLatexText(preparedText).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.type === 'inline-math') {
      return <KatexMath key={key} math={part.content} displayMode={false} />
    }
    if (part.type === 'block-math') {
      return <KatexMath key={key} math={part.content} displayMode={true} />
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

