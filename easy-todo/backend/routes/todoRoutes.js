import express from 'express'

import { createTodo, deleteTodo, getAllTodos, getTodoById, updateTodo } from '../controllers/todoController.js'

const router = express.Router()

// CRUD műveletek
router.get('/', getAllTodos) // Összes todo
router.get('/:id', getTodoById) // Egy todo
router.post('/', createTodo) // Todo létrehozása
router.put('/:id', updateTodo) // Todo frissítése
router.delete('/:id', deleteTodo) // Todo törlése

export default router
