import './App.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

// Define todo interface
interface Todo {
  id: number
  text: string
  completed: boolean
}

function App() {
  // State for todos and input
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputText, setInputText] = useState<string>('')

  // Fetch todos on mount
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/todos', {
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        
        setTodos(res.data)
      } catch (error) {
        console.error('Error fetching todos:', error)
      }
    }
    fetchTodos()
  }, [])

  // Add new todo
  const addTodo = async () => {
    if (!inputText.trim()) return // Prevent empty todos

    const newTodo: Todo = {
      id: Date.now(), // Temporary ID until server provides one
      text: inputText,
      completed: false,
    }

    try {
      const res = await axios.post(
        'http://localhost:8000/api/todos',
        newTodo
      )
      setTodos([...todos, res.data]) // Use server response
      setInputText('') // Clear input
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  // Toggle todo completion
  const toggleTodo = async (id: number) => {
    const todoToUpdate = todos.find(todo => todo.id === id)
    if (!todoToUpdate) return

    const updatedTodo = {
      ...todoToUpdate,
      completed: !todoToUpdate.completed,
    }

    try {
      await axios.put(
        `http://localhost:8000/api/todos/${id}`,
        updatedTodo
      )
      setTodos(
        todos.map(todo => (todo.id === id ? updatedTodo : todo))
      )
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  // Delete todo
  const deleteTodo = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/todos/${id}`)
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputText(e.target.value)
  }

  // Handle enter key press
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <main className='app'>
      <div className='todo-container'>
        <h1>Todo Application</h1>
        <div className='todo-input'>
          <input
            type='text'
            placeholder='Add a new task...'
            className='task-input'
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button className='add-button' onClick={addTodo}>
            Add
          </button>
        </div>
        <div className='todo-list'>
          {todos.map(todo => (
            <div key={todo.id} className='todo-item'>
              <input
                type='checkbox'
                id={`task-${todo.id}`}
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <label
                htmlFor={`task-${todo.id}`}
                style={{
                  textDecoration: todo.completed
                    ? 'line-through'
                    : 'none',
                }}
              >
                {todo.text}
              </label>
              <button
                className='delete-button'
                onClick={() => deleteTodo(todo.id)}
              >
                ×
              </button>
            </div>
          ))}
          {todos.length === 0 && (
            <p className='empty-message'>
              No todos yet! Add some above.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default App

