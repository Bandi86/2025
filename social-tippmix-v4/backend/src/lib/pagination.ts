// Pagination helper for API endpoints
export function getPagination({
  page = '1',
  pageSize = '10'
}: {
  page?: string | number
  pageSize?: string | number
}) {
  const take = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 10))
  const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take
  return { take, skip, page: parseInt(page as string, 10) || 1, pageSize: take }
}
