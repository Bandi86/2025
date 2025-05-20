// Sorting helper for API endpoints
export function getSorting(query: Record<string, any>) {
  // Example: ?sort=username:asc,email:desc
  if (!query.sort) return undefined
  const fields = (query.sort as string).split(',')
  return fields.map((field) => {
    const [key, order] = field.split(':')
    return { [key]: order === 'desc' ? 'desc' : 'asc' }
  })
}
