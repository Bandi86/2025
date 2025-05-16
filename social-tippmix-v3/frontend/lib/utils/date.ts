// lib/utils/date.ts
export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Érvénytelen dátum'
  }
}
