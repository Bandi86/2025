export default function formatDate () {
  const today = new Date();
const formattedDate = today.toLocaleDateString('hu-HU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
return formattedDate
}
