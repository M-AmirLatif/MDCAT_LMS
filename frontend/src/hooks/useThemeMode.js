import { useEffect, useMemo, useState } from 'react'

const getTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

export function getChartTheme(theme = getTheme()) {
  const isDark = theme === 'dark'
  return {
    isDark,
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,71,255,0.06)',
    axisColor: isDark ? '#6B6B8A' : '#9B8FCC',
    tooltipBg: isDark ? '#1A1640' : '#0F0F1A',
    tooltipText: '#FFFFFF',
    legendColor: isDark ? '#9B8FCC' : '#6B6B8A',
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
