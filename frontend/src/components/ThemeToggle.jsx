import { useEffect, useState } from 'react'

const getInitialTheme = () => {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M20.2 15.2A8 8 0 0 1 8.8 3.8 8.7 8.7 0 1 0 20.2 15.2Z" fill="currentColor" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const syncTheme = () => setTheme(getInitialTheme())
    window.addEventListener('mdcat-theme-change', syncTheme)
    return () => window.removeEventListener('mdcat-theme-change', syncTheme)
  }, [])

  const toggleTheme = (event) => {
    const html = document.documentElement
    const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'

    const ripple = document.createElement('div')
    ripple.className = 'theme-toggle-ripple'
    ripple.style.left = `${event.clientX}px`
    ripple.style.top = `${event.clientY}px`
    document.body.appendChild(ripple)
    window.setTimeout(() => ripple.remove(), 500)

    html.setAttribute('data-theme', next)
    localStorage.setItem('mdcat-theme', next)
    setTheme(next)
    window.dispatchEvent(new CustomEvent('mdcat-theme-change', { detail: { theme: next } }))
  }

  const isDark = theme === 'dark'

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
