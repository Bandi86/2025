// Search helper for API endpoints
export function getSearch(query: Record<string, any>) {
  // Example: ?search=foo
  return query.search ? String(query.search) : undefined
}
