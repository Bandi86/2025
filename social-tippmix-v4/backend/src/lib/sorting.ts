// Sorting helper for API endpoints
export function getSorting(query: Record<string, any>) {
  // Támogatja: ?sort=username:asc,email:desc vagy ?sort=createdAt_desc
  if (!query.sort) return undefined
  const fields = (query.sort as string).split(',')
  const arr = fields
    .map((field) => {
      if (field.includes(':')) {
        const [key, order] = field.split(':')
        return { [key]: order === 'desc' ? 'desc' : 'asc' }
      } else if (field.match(/^([a-zA-Z0-9_]+)_(asc|desc)$/)) {
        const match = field.match(/^([a-zA-Z0-9_]+)_(asc|desc)$/)
        if (match) {
          return { [match[1]]: match[2] }
        }
      }
      return undefined
    })
    .filter((x): x is Record<string, string> => !!x)
  if (arr.length === 0) return undefined
  if (arr.length === 1) return arr[0]
  return arr
}
