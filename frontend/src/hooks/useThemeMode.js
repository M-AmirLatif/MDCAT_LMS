import { useEffect, useMemo, useState } from 'react'

const getTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

export function getChartTheme(theme = getTheme()) {
  const isDark = theme === 'dark'
  return {
    isDark,
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)',
    axisColor: isDark ? '#9B8FCC' : '#6B7280',
    tooltipBg: isDark ? '#12102A' : '#FAFAFC',
    tooltipText: isDark ? '#F0EEFF' : '#1A1A2E',
    legendColor: isDark ? '#9B8FCC' : '#6B7280',
  }
}

export default function useThemeMode() {
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => {
    const syncTheme = (event) => setTheme(event.detail?.theme || getTheme())
    window.addEventListener('mdcat-theme-change', syncTheme)
    return () => window.removeEventListener('mdcat-theme-change', syncTheme)
  }, [])

  return useMemo(() => getChartTheme(theme), [theme])
}
