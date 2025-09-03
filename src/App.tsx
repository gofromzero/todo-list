import React, { useCallback, useEffect } from 'react';
import { useTodos } from './hooks/useTodos.js';
import { useNotifications } from './hooks/useNotifications.js';
import { AddTodo, TodoList, NotificationPermission } from './components/index.js';
import type { CreateTodoInput, UpdateTodoInput } from './types/todo.js';
import './styles/App.css'

function App() {
  const [{ todos, isLoading, error }, actions] = useTodos({
    sort: { field: 'createdAt', direction: 'desc' }
  });

  const [notificationState, notificationActions] = useNotifications({
    onNotificationFired: (todoId: string) => {
      console.log(`Notification fired for todo: ${todoId}`);
    },
    onPermissionChange: (permission) => {
      console.log(`Notification permission changed: ${permission}`);
    }
  });

  const handleAddTodo = useCallback(async (input: CreateTodoInput) => {
    const newTodo = await actions.createTodo(input);
    
    // Schedule notifications for the new todo if it has reminder/due times
    if (newTodo.reminderTime) {
      notificationActions.scheduleReminder(newTodo);
    } else if (newTodo.dueDate) {
      notificationActions.scheduleDueNotification(newTodo);
    }
  }, [actions, notificationActions]);

  const handleUpdateTodo = useCallback(async (id: string, input: UpdateTodoInput) => {
    const updatedTodo = await actions.updateTodo(id, input);
    
    // Clear existing notification and reschedule if needed
    notificationActions.clearNotification(id);
    if (!updatedTodo.completed) {
      if (updatedTodo.reminderTime) {
        notificationActions.scheduleReminder(updatedTodo);
      } else if (updatedTodo.dueDate) {
        notificationActions.scheduleDueNotification(updatedTodo);
      }
    }
  }, [actions, notificationActions]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    // Clear notification before deleting
    notificationActions.clearNotification(id);
    await actions.deleteTodo(id);
  }, [actions, notificationActions]);

  const handleToggleTodo = useCallback(async (id: string) => {
    const updatedTodo = await actions.toggleTodo(id);
    
    // Clear notification if todo is completed, reschedule if uncompleted
    if (updatedTodo.completed) {
      notificationActions.clearNotification(id);
    } else {
      if (updatedTodo.reminderTime) {
        notificationActions.scheduleReminder(updatedTodo);
      } else if (updatedTodo.dueDate) {
        notificationActions.scheduleDueNotification(updatedTodo);
      }
    }
  }, [actions, notificationActions]);

  // Reschedule notifications when todos change
  useEffect(() => {
    if (!isLoading && notificationState.permission === 'granted') {
      notificationActions.rescheduleNotifications(todos);
    }
  }, [todos, isLoading, notificationState.permission, notificationActions]);

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

        {notificationState.error && (
          <div className="global-error" role="alert">
            <strong>Notification Error:</strong> {notificationState.error}
            <button
              onClick={() => notificationActions.clearError()}
              className="retry-button"
              aria-label="Clear notification error"
            >
              Dismiss
            </button>
          </div>
        )}

        <NotificationPermission
          show={notificationState.isSupported && notificationState.permission !== 'granted'}
          onPermissionChange={(permission) => {
            console.log(`Permission changed to: ${permission}`);
          }}
        />

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
