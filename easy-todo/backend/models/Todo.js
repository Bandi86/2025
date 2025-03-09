import db from '../config/db.js'

// Tábla létrehozása, ha még nem létezik
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Hiba a tábla létrehozásakor:', err.message);
    } else {
      console.log('Todos tábla sikeresen létrehozva vagy már létezik.');
    }
  });
})

export default db