'use client'

import { useState, useEffect } from 'react'
import { Todo } from '../types/todo'
import { VscCheck, VscPlug } from 'react-icons/vsc'
import { MdDelete } from 'react-icons/md'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const res = await fetch('/api/todos')
    const data = await res.json()
    console.log(data)
    setTodos(data)
  }

  const handleAddTodo = async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    if (res.ok) {
      const newTodo = await res.json()
      setTodos([...todos, newTodo])
      setTitle('')
    }
  }

  const handleToggleTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'PUT' })
    if (res.ok) {
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
      )
    }
  }

  const handleDeleteTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTodos(todos.filter((todo) => todo.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Todo App</h1>
          <div className="mb-8 mt-8 justify-center flex flex-col items-center gap-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a new todo..."
              className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTodo}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <VscPlug className="w-5 h-5 inline-block mr-2" />
              Add New Todo
            </button>
          </div>
        </header>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Active Tasks<span> ({todos.filter((todo) => !todo.completed).length})</span>
          </h2>
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="w-4 h-4 text-blue-500 border rounded focus:ring-blue-500"
                  />
                  <span
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text-gray-400' : 'text-gray-700'
                    }}
                  >
                    {todo.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <MdDelete className="w-5 h-5 inline-block" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Completed ({todos.filter((todo) => todo.completed).length} tasks)
          </h2>
          <button
            onClick={() => {
              setTodos(todos.filter((todo) => !todo.completed))
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <VscCheck className="w-5 h-5 inline-block mr-2" />
            Mark All as Complete
          </button>
        </div>

        <button
          onClick={() => {
            setTodos(todos.filter((todo) => !todo.completed))
          }}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors mt-4"
        >
          Delete All Remaining
        </button>
      </div>
    </div>
  )
}
