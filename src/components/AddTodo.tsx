import React, { useState } from 'react';
import type { CreateTodoInput } from '../types/todo.js';

interface AddTodoProps {
  onAdd: (input: CreateTodoInput) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Component for adding new todos with form validation
 */
export const AddTodo: React.FC<AddTodoProps> = ({ onAdd, isLoading = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd({
        title: trimmedTitle,
        description: description.trim() || undefined,
      });
      
      // Clear form on success
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('');
      setDescription('');
      setError(null);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="add-todo-form" onKeyDown={handleKeyDown}>
      <div className="form-group">
        <label htmlFor="todo-title" className="sr-only">
          Todo title
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={disabled}
          autoFocus
          aria-label="Todo title"
          aria-describedby={error ? 'title-error' : undefined}
          className={error ? 'error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="todo-description" className="sr-only">
          Todo description (optional)
        </label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          disabled={disabled}
          rows={2}
          aria-label="Todo description (optional)"
        />
      </div>

      {error && (
        <div id="title-error" className="error-message" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || !title.trim()}
        className="add-button"
        aria-label="Add todo"
      >
        {isSubmitting ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
};