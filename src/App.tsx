import React, { useCallback } from 'react';
import { useTodos } from './hooks/useTodos.js';
import { AddTodo, TodoList } from './components/index.js';
import type { CreateTodoInput, UpdateTodoInput } from './types/todo.js';
import './styles/App.css'

function App() {
  const [{ todos, isLoading, error }, actions] = useTodos({
    sort: { field: 'createdAt', direction: 'desc' }
  });

  const handleAddTodo = useCallback(async (input: CreateTodoInput) => {
    await actions.createTodo(input);
  }, [actions]);

  const handleUpdateTodo = useCallback(async (id: string, input: UpdateTodoInput) => {
    await actions.updateTodo(id, input);
  }, [actions]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    await actions.deleteTodo(id);
  }, [actions]);

  const handleToggleTodo = useCallback(async (id: string) => {
    await actions.toggleTodo(id);
  }, [actions]);

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo List</h1>
        {totalCount > 0 && (
          <div className="todo-stats">
            <span>
              {completedCount} of {totalCount} completed
            </span>
          </div>
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="global-error" role="alert">
            <strong>Error:</strong> {error.message}
            <button
              onClick={() => actions.refreshTodos()}
              className="retry-button"
              aria-label="Retry loading todos"
            >
              Retry
            </button>
          </div>
        )}

        <section className="add-todo-section">
          <AddTodo 
            onAdd={handleAddTodo}
            isLoading={isLoading}
          />
        </section>

        <section className="todo-list-section">
          <TodoList
            todos={todos}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
            onToggle={handleToggleTodo}
            isLoading={isLoading}
            emptyMessage="No todos yet. Add one above to get started!"
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          <kbd>Enter</kbd> to save • <kbd>Escape</kbd> to cancel • Click to edit
        </p>
      </footer>
    </div>
  )
}

export default App
