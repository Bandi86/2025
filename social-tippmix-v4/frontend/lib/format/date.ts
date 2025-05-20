// Hungarian date formatting utility
export function formatDateTimeHU(dateString?: string): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  // Format: 2025.05. 20. 11:45
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}. ${day}. ${hour}:${minute}`
}
