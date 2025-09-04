import React, { useState } from 'react';
import type { CreateTodoInput } from '../types/todo.js';
import '../styles/AddTodo.css';

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
    <form 
      onSubmit={handleSubmit} 
      className={`add-todo-form ${isSubmitting ? 'loading' : ''}`} 
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Add new todo"
    >
      <div className="add-todo-header">
        <h2 className="add-todo-title">Add New Todo</h2>
        <span className="add-todo-icon" aria-hidden="true">➕</span>
      </div>

      <div className="form-group">
        <label htmlFor="todo-title" className="sr-only">
          Todo title (required)
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={disabled}
          autoFocus
          required
          aria-label="Todo title (required)"
          aria-describedby={error ? 'title-error form-hint' : 'form-hint'}
          className={error ? 'error' : ''}
          maxLength={200}
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
          maxLength={500}
        />
        <div className={`character-counter ${description.length > 450 ? 'warning' : ''} ${description.length > 500 ? 'error' : ''}`}>
          {description.length}/500
        </div>
      </div>

      {error && (
        <div id="title-error" className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={disabled || !title.trim()}
          className={`add-button primary ${isSubmitting ? 'loading' : ''}`}
          aria-label={isSubmitting ? 'Adding todo, please wait' : 'Add todo to list'}
          aria-describedby="form-hint"
        >
          {isSubmitting ? 'Adding...' : 'Add Todo'}
        </button>
        
        <div className="form-actions-secondary">
          <div id="form-hint" className="form-hint">
            <kbd>Enter</kbd> to add • <kbd>Escape</kbd> to clear
          </div>
        </div>
      </div>
    </form>
  );
};