import React from 'react';
import type { Todo, UpdateTodoInput } from '../types/todo.js';
import { TodoItem } from './TodoItem.js';
import '../styles/TodoList.css';

interface TodoListProps {
  todos: Todo[];
  onUpdate: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Component for displaying a list of todos
 */
export const TodoList: React.FC<TodoListProps> = React.memo(({
  todos,
  onUpdate,
  onDelete,
  onToggle,
  isLoading = false,
  emptyMessage = 'No todos yet. Add one above to get started!'
}) => {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <div className="todo-list-empty-icon">📝</div>
        <div className="todo-list-empty-message">{emptyMessage}</div>
        <div className="todo-list-empty-hint">
          Start by adding your first todo above
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list" role="list">
      {todos.map((todo) => (
        <div key={todo.id} role="listitem">
          <TodoItem
            todo={todo}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggle={onToggle}
            isLoading={isLoading}
          />
        </div>
      ))}
    </div>
  );
});