'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FetchUsersParams } from '@/types/admin-user'
import { useUserStore } from '@/store/userStore'

interface UserControlsProps {
  currentParams: FetchUsersParams
  totalUsers: number
  onlineUsers: number
}

// Helper to debounce function calls
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor)
    })
}

export default function UserControls({
  currentParams,
  totalUsers,
  onlineUsers
}: UserControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(currentParams.searchQuery || '')
  const [roleFilter, setRoleFilter] = useState(currentParams.roleFilter || '')
  const [statusFilter, setStatusFilter] = useState(currentParams.newStatusFilter || '')

  const createQueryString = useCallback(
    (paramsToUpdate: Partial<FetchUsersParams>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).length > 0) {
          params.set(key, String(value))
        } else {
          params.delete(key)
        }
      })
      // Always reset page to 1 when filters or search change
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
    // Sync local state if URL params change externally
    setSearchTerm(searchParams.get('searchQuery') || '')
    setRoleFilter(searchParams.get('roleFilter') || '')
    setStatusFilter(searchParams.get('newStatusFilter') || '')
  }, [searchParams])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value
    setSearchTerm(newSearchTerm)
    debouncedSearch(newSearchTerm)
  }

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setRoleFilter(value)
    router.push(pathname + '?' + createQueryString({ roleFilter: value }))
  }

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setStatusFilter(value)
    router.push(pathname + '?' + createQueryString({ newStatusFilter: value }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
    router.push(
      pathname + '?' + createQueryString({ searchQuery: '', roleFilter: '', newStatusFilter: '' })
    )
  }

  // DaisyUI select options
  const roleOptions = [
    { value: '', label: 'All roles' },
    { value: 'USER', label: 'User' },
    { value: 'ADMIN', label: 'Admin' }
  ]
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' }
  ]

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={handleRoleChange}
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
          {/* You can add a manual "Apply Filters" button if you remove automatic updates */}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">Total users: {totalUsers}</p>
      <p className="text-sm text-gray-600 mt-4">Total online users: {onlineUsers}</p>
    </div>
  )
}
