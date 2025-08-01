import { useState, useEffect, useRef } from 'react'
import { Search, Filter, X, Clock, Target, Users } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Card, CardContent } from './card'

interface SearchResult {
  id: string
  type: 'match' | 'team' | 'player' | 'league'
  title: string
  subtitle: string
  icon: React.ReactNode
}

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  className?: string
}

export function SearchBar({ 
  placeholder = "Search matches, teams, players...",
  onSearch,
  onResultSelect,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'matches' | 'teams' | 'players'>('all')
  const searchRef = useRef<HTMLDivElement>(null)

  // Mock search results - would come from API
  const mockSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    // Mock matches
    if (selectedFilter === 'all' || selectedFilter === 'matches') {
      if (query.includes('man') || query.includes('city')) {
        results.push({
          id: '1',
          type: 'match',
          title: 'Manchester City vs Arsenal',
          subtitle: 'Premier League • Today 20:00',
          icon: <Target className="w-4 h-4" />
        })
      }
      if (query.includes('real') || query.includes('madrid')) {
        results.push({
          id: '2',
          type: 'match',
          title: 'Real Madrid vs Barcelona',
          subtitle: 'La Liga • Tomorrow 21:00',
          icon: <Target className="w-4 h-4" />
        })
      }
    }

    // Mock teams
    if (selectedFilter === 'all' || selectedFilter === 'teams') {
      if (query.includes('man') || query.includes('city')) {
        results.push({
          id: '3',
          type: 'team',
          title: 'Manchester City',
          subtitle: 'Premier League • England',
          icon: <Users className="w-4 h-4" />
        })
      }
      if (query.includes('arsenal')) {
        results.push({
          id: '4',
          type: 'team',
          title: 'Arsenal',
          subtitle: 'Premier League • England',
          icon: <Users className="w-4 h-4" />
        })
      }
    }

    // Mock players
    if (selectedFilter === 'all' || selectedFilter === 'players') {
      if (query.includes('haaland')) {
        results.push({
          id: '5',
          type: 'player',
          title: 'Erling Haaland',
          subtitle: 'Manchester City • Striker',
          icon: <Users className="w-4 h-4" />
        })
      }
    }

    return results
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const searchResults = mockSearch(query)
      setResults(searchResults)
      setIsOpen(true)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query, selectedFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    }
    setIsOpen(false)
  }

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result)
    }
    setIsOpen(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const getFilterColor = (filter: string) => {
    return selectedFilter === filter 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter Pills */}
      <div className="flex items-center space-x-2 mt-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <Badge
          variant="outline"
          className={`cursor-pointer ${getFilterColor('all')}`}
          onClick={() => setSelectedFilter('all')}
        >
          All
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer ${getFilterColor('matches')}`}
          onClick={() => setSelectedFilter('matches')}
        >
          Matches
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer ${getFilterColor('teams')}`}
          onClick={() => setSelectedFilter('teams')}
        >
          Teams
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer ${getFilterColor('players')}`}
          onClick={() => setSelectedFilter('players')}
        >
          Players
        </Badge>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {results.map((result) => (
              <Card
                key={result.id}
                className="mb-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 text-gray-400">
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-8 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No results found for "{query}"</p>
            <p className="text-sm">Try different keywords or filters</p>
          </div>
        </div>
      )}
    </div>
  )
} 