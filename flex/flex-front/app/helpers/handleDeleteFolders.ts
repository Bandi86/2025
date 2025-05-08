import axios from 'axios' // Axios importálása

// A függvényt async-re módosítjuk, hogy await-et használhassunk
export async function handleDeleteFolders() {
  try {
    // Axios DELETE kérés használata
    const response = await axios.delete('http://localhost:8000/api/dirs')

    // Axios alapból hibát dob nem 2xx státuszkódok esetén,
    // így a response.ok ellenőrzés itt nem szükséges úgy, mint a fetch-nél.
    // A response.data tartalmazza a backend által küldött választ.
    console.log(response.data.message) // Sikeres törlés üzenetének logolása
    return response.data // Visszaadjuk a választ, ha a hívó helyen szükség van rá
  } catch (error: any) {
    // Hibakezelés
    console.error('Hiba a mappák törlése közben (handleDeleteFolders):', error)
    // Dobjuk tovább a hibát, hogy a hívó komponens (SettingsPage)
    // tudja kezelni és frissíteni a UI-t (pl. hibaüzenet megjelenítése).
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          `Nem sikerült törölni a mappákat (státusz: ${error.response.status})`
      )
    } else {
      throw new Error(error.message || 'Ismeretlen hiba történt a mappák törlésekor.')
    }
  }
}
