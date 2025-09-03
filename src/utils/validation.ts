import type { Todo, SerializedTodo, CreateTodoInput, UpdateTodoInput } from '../types/todo.js';
import { isValidUUID } from './uuid.js';

/**
 * Type guard to check if an object is a valid Todo
 */
export function isTodo(obj: unknown): obj is Todo {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const todo = obj as Record<string, unknown>;
  
  return (
    typeof todo.id === 'string' &&
    isValidUUID(todo.id) &&
    typeof todo.title === 'string' &&
    todo.title.length > 0 &&
    typeof todo.completed === 'boolean' &&
    todo.createdAt instanceof Date &&
    todo.updatedAt instanceof Date &&
    (todo.description === undefined || typeof todo.description === 'string') &&
    (todo.dueDate === undefined || todo.dueDate instanceof Date) &&
    (todo.reminderTime === undefined || todo.reminderTime instanceof Date)
  );
}

/**
 * Type guard to check if an object is a valid SerializedTodo
 */
export function isSerializedTodo(obj: unknown): obj is SerializedTodo {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const todo = obj as Record<string, unknown>;
  
  return (
    typeof todo.id === 'string' &&
    isValidUUID(todo.id) &&
    typeof todo.title === 'string' &&
    todo.title.length > 0 &&
    typeof todo.completed === 'boolean' &&
    typeof todo.createdAt === 'string' &&
    typeof todo.updatedAt === 'string' &&
    (todo.description === undefined || typeof todo.description === 'string') &&
    (todo.dueDate === undefined || typeof todo.dueDate === 'string') &&
    (todo.reminderTime === undefined || typeof todo.reminderTime === 'string')
  );
}

/**
 * Type guard to check if an object is a valid CreateTodoInput
 */
export function isCreateTodoInput(obj: unknown): obj is CreateTodoInput {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const input = obj as Record<string, unknown>;
  
  return (
    typeof input.title === 'string' &&
    input.title.length > 0 &&
    (input.description === undefined || typeof input.description === 'string') &&
    (input.dueDate === undefined || input.dueDate instanceof Date) &&
    (input.reminderTime === undefined || input.reminderTime instanceof Date)
  );
}

/**
 * Type guard to check if an object is a valid UpdateTodoInput
 */
export function isUpdateTodoInput(obj: unknown): obj is UpdateTodoInput {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const input = obj as Record<string, unknown>;
  
  return (
    (input.title === undefined || (typeof input.title === 'string' && input.title.length > 0)) &&
    (input.description === undefined || typeof input.description === 'string') &&
    (input.completed === undefined || typeof input.completed === 'boolean') &&
    (input.dueDate === undefined || input.dueDate instanceof Date) &&
    (input.reminderTime === undefined || input.reminderTime instanceof Date)
  );
}

/**
 * Validates if a date string is a valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Serializes a Todo object for localStorage storage
 */
export function serializeTodo(todo: Todo): SerializedTodo {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    dueDate: todo.dueDate?.toISOString(),
    reminderTime: todo.reminderTime?.toISOString(),
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

/**
 * Deserializes a SerializedTodo object from localStorage
 */
export function deserializeTodo(serialized: SerializedTodo): Todo {
  if (!isSerializedTodo(serialized)) {
    throw new Error('Invalid serialized todo format');
  }
  
  return {
    id: serialized.id,
    title: serialized.title,
    description: serialized.description,
    completed: serialized.completed,
    dueDate: serialized.dueDate ? new Date(serialized.dueDate) : undefined,
    reminderTime: serialized.reminderTime ? new Date(serialized.reminderTime) : undefined,
    createdAt: new Date(serialized.createdAt),
    updatedAt: new Date(serialized.updatedAt),
  };
}

/**
 * Validates and sanitizes a todo title
 */
export function validateTodoTitle(title: string): string {
  if (typeof title !== 'string') {
    throw new Error('Todo title must be a string');
  }
  
  const sanitized = title.trim();
  if (sanitized.length === 0) {
    throw new Error('Todo title cannot be empty');
  }
  
  if (sanitized.length > 200) {
    throw new Error('Todo title cannot exceed 200 characters');
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes a todo description
 */
export function validateTodoDescription(description?: string): string | undefined {
  if (description === undefined) {
    return undefined;
  }
  
  if (typeof description !== 'string') {
    throw new Error('Todo description must be a string');
  }
  
  const sanitized = description.trim();
  if (sanitized.length === 0) {
    return undefined;
  }
  
  if (sanitized.length > 1000) {
    throw new Error('Todo description cannot exceed 1000 characters');
  }
  
  return sanitized;
}