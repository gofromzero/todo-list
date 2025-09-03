/**
 * Core Todo interface representing a todo item
 */
export interface Todo {
  /** Unique identifier for the todo */
  id: string;
  /** Title of the todo item */
  title: string;
  /** Optional description with additional details */
  description?: string;
  /** Whether the todo is completed */
  completed: boolean;
  /** Optional due date for the todo */
  dueDate?: Date;
  /** Optional reminder time for notifications */
  reminderTime?: Date;
  /** Timestamp when the todo was created */
  createdAt: Date;
  /** Timestamp when the todo was last updated */
  updatedAt: Date;
}

/**
 * Partial todo interface for creating new todos
 * (id, createdAt, updatedAt, and completed are managed automatically)
 */
export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: Date;
  reminderTime?: Date;
}

/**
 * Partial todo interface for updating existing todos
 */
export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: Date;
  reminderTime?: Date;
}

/**
 * Serialized todo for localStorage storage
 * (dates are stored as ISO strings)
 */
export interface SerializedTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Filter options for querying todos
 */
export interface TodoFilter {
  completed?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  hasReminder?: boolean;
}

/**
 * Sort options for ordering todos
 */
export interface TodoSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'title';
  direction: 'asc' | 'desc';
}