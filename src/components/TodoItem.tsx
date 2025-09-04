import React, { useState, useRef, useEffect } from 'react';
import type { Todo, UpdateTodoInput } from '../types/todo.js';
import '../styles/TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Individual todo item with inline editing and CRUD operations
 */
export const TodoItem: React.FC<TodoItemProps> = React.memo(({
  todo,
  onUpdate,
  onDelete,
  onToggle,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setError(null);
  };

  const handleSaveEdit = async () => {
    const trimmedTitle = editTitle.trim();
    
    if (!trimmedTitle) {
      setError('Title is required');
      titleInputRef.current?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdate(todo.id, {
        title: trimmedTitle,
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async () => {
    try {
      await onToggle(todo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle todo');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(todo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleBlur = () => {
    // Save on blur if there are changes
    if (isEditing && (editTitle !== todo.title || editDescription !== (todo.description || ''))) {
      handleSaveEdit();
    }
  };

  const disabled = isLoading || isSubmitting;

  // Render edit mode
  if (isEditing) {
    return (
      <div 
        className={`todo-item editing ${todo.completed ? 'completed' : ''}`}
        data-todo-id={todo.id}
      >
        <div className="todo-checkbox">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            disabled={disabled}
            aria-label="Mark todo as completed"
          />
        </div>

        <div className="todo-content">
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            className={`todo-title-input ${error ? 'error' : ''}`}
            aria-label="Edit todo title"
          />

          <textarea
            ref={descriptionInputRef}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Add a description (optional)"
            rows={2}
            className="todo-description-input"
            aria-label="Edit todo description"
          />

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="todo-actions">
          <button
            onClick={handleSaveEdit}
            disabled={disabled || !editTitle.trim()}
            className="save-button"
            aria-label="Save changes"
          >
            {isSubmitting ? '⏳' : '✓'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={disabled}
            className="cancel-button"
            aria-label="Cancel editing"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Determine todo status classes for styling
  const getStatusClasses = () => {
    const classes = ['todo-item'];
    if (todo.completed) classes.push('completed');
    if (isLoading || isSubmitting) classes.push('loading');
    
    // Future enhancement: Add overdue/due-soon classes based on dates
    // These will be handled by Agent-4 when date logic is implemented
    
    return classes.join(' ');
  };

  // Render view mode
  return (
    <article 
      className={getStatusClasses()}
      data-todo-id={todo.id}
      role="article"
      aria-label={`Todo: ${todo.title}${todo.completed ? ' (completed)' : ''}`}
    >
      <div className="todo-checkbox">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          disabled={disabled}
          aria-label={todo.completed ? 'Mark todo as incomplete' : 'Mark todo as completed'}
          aria-describedby={`todo-content-${todo.id}`}
        />
      </div>

      <div 
        className="todo-content" 
        onClick={handleStartEdit}
        role="button"
        tabIndex={0}
        aria-label="Click to edit todo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartEdit();
          }
        }}
      >
        <div id={`todo-content-${todo.id}`} className="todo-title">
          {todo.title}
        </div>
        {todo.description && (
          <div className="todo-description">
            {todo.description}
          </div>
        )}
        {/* Placeholder for date/time info - will be handled by Agent-4 */}
        <div className="todo-meta" aria-label="Todo metadata">
          {todo.dueDate && (
            <span className="due-date" title={`Due date: ${todo.dueDate.toLocaleDateString()}`}>
              <span aria-hidden="true">📅</span>
              <span className="sr-only">Due date: </span>
              {todo.dueDate.toLocaleDateString()}
            </span>
          )}
          {todo.reminderTime && (
            <span className="reminder-time" title={`Reminder time: ${todo.reminderTime.toLocaleTimeString()}`}>
              <span aria-hidden="true">⏰</span>
              <span className="sr-only">Reminder time: </span>
              {todo.reminderTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="todo-actions" role="group" aria-label="Todo actions">
        <button
          onClick={handleStartEdit}
          disabled={disabled}
          className="edit-button ghost"
          aria-label={`Edit todo: ${todo.title}`}
          title="Edit todo"
        >
          <span aria-hidden="true">✏️</span>
          <span className="sr-only">Edit</span>
        </button>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={disabled}
            className="delete-button ghost"
            aria-label={`Delete todo: ${todo.title}`}
            title="Delete todo"
          >
            <span aria-hidden="true">🗑️</span>
            <span className="sr-only">Delete</span>
          </button>
        ) : (
          <div className="delete-confirm" role="group" aria-label="Confirm deletion">
            <button
              onClick={handleDelete}
              disabled={disabled}
              className="confirm-delete danger"
              aria-label={`Confirm delete todo: ${todo.title}`}
              title="Confirm delete"
            >
              <span aria-hidden="true">✓</span>
              <span className="sr-only">Confirm</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={disabled}
              className="cancel-delete ghost"
              aria-label="Cancel delete"
              title="Cancel delete"
            >
              <span aria-hidden="true">✕</span>
              <span className="sr-only">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          <span aria-hidden="true">⚠️</span>
          {error}
        </div>
      )}
    </article>
  );
});