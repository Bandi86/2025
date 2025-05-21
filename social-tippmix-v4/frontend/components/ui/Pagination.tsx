// Reusable Pagination component for admin and other pages
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

export interface PaginationProps<ParamsType extends Record<string, any> = Record<string, any>> {
  currentPage: number
  totalPages: number
  currentParams: ParamsType
}

export default function Pagination<ParamsType extends Record<string, any> = Record<string, any>>({
  currentPage,
  totalPages,
  currentParams
}: PaginationProps<ParamsType>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    Object.entries(currentParams).forEach(([key, value]) => {
      if (key !== 'page' && value !== undefined && value !== null && String(value).length > 0) {
        params.set(key, String(value))
      }
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    const halfMaxPages = Math.floor(maxPagesToShow / 2)
    let startPage = Math.max(1, currentPage - halfMaxPages)
    let endPage = Math.min(totalPages, currentPage + halfMaxPages)
    if (currentPage - halfMaxPages < 1) {
      endPage = Math.min(totalPages, maxPagesToShow)
    }
    if (currentPage + halfMaxPages > totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1)
    }
    if (startPage > 1) {
      pageNumbers.push(
        <Button
          key="1"
          variant="outline"
          dSize="sm"
          onClick={() => handlePageChange(1)}
          className="h-9 w-9"
        >
          1
        </Button>
      )
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis-start" className="px-2 py-1">
            ...
          </span>
        )
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          dSize="sm"
          onClick={() => handlePageChange(i)}
          className="h-9 w-9"
        >
          {i}
        </Button>
      )
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis-end" className="px-2 py-1">
            ...
          </span>
        )
      }
      pageNumbers.push(
        <Button
          key={totalPages}
          variant="outline"
          dSize="sm"
          onClick={() => handlePageChange(totalPages)}
          className="h-9 w-9"
        >
          {totalPages}
        </Button>
      )
    }
    return pageNumbers
  }

  if (totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        dSize="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9"
      >
        <ChevronLeftIcon className="h-5 w-5" />
        <span className="sr-only">Previous page</span>
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        dSize="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9"
      >
        <ChevronRightIcon className="h-5 w-5" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}
