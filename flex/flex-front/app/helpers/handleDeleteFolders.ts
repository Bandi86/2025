export function handleDeleteFolders() {
  try {
    fetch('http://localhost:8000/api/dirs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nem sikerült törölni a mappákat.')
        }
        return response.json()
      })
      .then((data) => {
        console.log(data.message)
      })
      .catch((error) => {
        console.error(error)
      })
  } catch (error) {
    console.error(error)
  }
}
