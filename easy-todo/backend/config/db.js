import sqlite3 from 'sqlite3'


// SQLite3 adatbázis inicializálása (fájl alapú)
const db = new sqlite3.Database('./todos.db', err => {
  if (err) {
    console.error('Adatbázis csatlakozási hiba:', err.message)
  } else {
    console.log('Csatlakozva az SQLite adatbázishoz.')
  }
})

export default db
