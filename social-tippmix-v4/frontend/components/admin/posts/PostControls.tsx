'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FetchPostsParams } from '@/types/posts'

interface PostControlsProps {
  currentParams: FetchPostsParams
  totalPosts: number
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => resolve(func(...args)), waitFor)
    })
}

export default function PostControls({ currentParams, totalPosts }: PostControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(currentParams.searchQuery || '')
  const [categoryFilter, setCategoryFilter] = useState(currentParams.categoryFilter || '')
  const [statusFilter, setStatusFilter] = useState(currentParams.statusFilter || '')

  const createQueryString = useCallback(
    (paramsToUpdate: Partial<FetchPostsParams>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).length > 0) {
          params.set(key, String(value))
        } else {
          params.delete(key)
        }
      })
      if (Object.keys(paramsToUpdate).some((k) => k !== 'page')) {
        params.set('page', '1')
      }
      return params.toString()
    },
    [searchParams]
  )

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      router.push(pathname + '?' + createQueryString({ searchQuery: query }))
    }, 500),
    [pathname, createQueryString, router]
  )

  useEffect(() => {
    setSearchTerm(searchParams.get('searchQuery') || '')
    setCategoryFilter(searchParams.get('categoryFilter') || '')
    setStatusFilter(searchParams.get('statusFilter') || '')
  }, [searchParams])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value
    setSearchTerm(newSearchTerm)
    debouncedSearch(newSearchTerm)
  }

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setCategoryFilter(value)
    router.push(pathname + '?' + createQueryString({ categoryFilter: value }))
  }

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setStatusFilter(value)
    router.push(pathname + '?' + createQueryString({ statusFilter: value }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setStatusFilter('')
    router.push(
      pathname + '?' + createQueryString({ searchQuery: '', categoryFilter: '', statusFilter: '' })
    )
  }

  // Example options, replace with dynamic categories if available
  const categoryOptions = [
    { value: '', label: 'All categories' },
    { value: 'sports', label: 'Sports' },
    { value: 'news', label: 'News' },
    { value: 'entertainment', label: 'Entertainment' }
  ]
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ]

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Posts
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full"
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleClearFilters} variant="outline" className="w-full md:w-auto">
            Clear Filters
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">Total posts: {totalPosts}</p>
    </div>
  )
}
