// Filtering helper for API endpoints
export function getFilters(query: Record<string, any>) {
  // Remove known params
  const { page, pageSize, sort, search, ...filters } = query
  // You can add more advanced filtering logic here
  return filters
}
