import { createContext, useContext, useState, useMemo } from 'react'

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  searchPlaceholder: 'Search courses, students, classes...',
  setSearchPlaceholder: () => {},
})

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search courses, students, classes...')

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      searchPlaceholder,
      setSearchPlaceholder,
    }),
    [searchQuery, searchPlaceholder]
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  return useContext(SearchContext)
}
