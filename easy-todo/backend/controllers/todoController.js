import db from '../models/Todo.js'

// Összes todo lekérdezése
const getAllTodos = (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
}

// Egy todo lekérdezése ID alapján
const getTodoById = (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).json({ message: 'Todo nem található' })
    }
    res.json(row)
  })
}

// Új todo létrehozása
const createTodo = (req, res) => {
  const { title, description } = req.body
 
  db.run(
    'INSERT INTO todos (id, title, description) VALUES ( ?, ?)',
    [title, description],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.status(201).json({ id: this.lastID, title, description })
    }
  )
}

// Todo frissítése
const updateTodo = (req, res) => {
  const { id } = req.params
  const { title, description, completed } = req.body
  db.run(
    'UPDATE todos SET title = ?, description = ?, completed = ? WHERE id = ?',
    [title, description, completed, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Todo nem található' })
      }
      res.json({ message: 'Todo frissítve' })
    }
  )
}

// Todo törlése
const deleteTodo = (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Todo nem található' })
    }
    res.json({ message: 'Todo törölve' })
  })
}

export {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
}
