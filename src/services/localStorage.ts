import type { Todo, SerializedTodo, CreateTodoInput, UpdateTodoInput, TodoFilter, TodoSortOptions } from '../types/todo.js';
import { generateUUID } from '../utils/uuid.js';
import { serializeTodo, deserializeTodo, validateTodoTitle, validateTodoDescription, isSerializedTodo } from '../utils/validation.js';

export class LocalStorageError extends Error {
  public readonly cause?: Error;
  
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LocalStorageError';
    this.cause = cause;
  }
}

export class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo with id ${id} not found`);
    this.name = 'TodoNotFoundError';
  }
}

/**
 * LocalStorage service for managing todos
 */
export class LocalStorageService {
  private static readonly STORAGE_KEY = 'todos';
  
  /**
   * Checks if localStorage is available and functional
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Gets all todos from localStorage
   */
  private static loadTodos(): Todo[] {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError('localStorage is not available');
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new LocalStorageError('Invalid todos data format in localStorage');
      }
      
      return parsed
        .filter((item): item is SerializedTodo => isSerializedTodo(item))
        .map(deserializeTodo);
        
    } catch (error) {
      if (error instanceof LocalStorageError) {
        throw error;
      }
      throw new LocalStorageError('Failed to load todos from localStorage', error as Error);
    }
  }
  
  /**
   * Saves todos to localStorage
   */
  private static saveTodos(todos: Todo[]): void {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError('localStorage is not available');
    }
    
    try {
      const serialized = todos.map(serializeTodo);
      const data = JSON.stringify(serialized);
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new LocalStorageError('localStorage quota exceeded');
      }
      throw new LocalStorageError('Failed to save todos to localStorage', error as Error);
    }
  }
  
  /**
   * Creates a new todo
   */
  static create(input: CreateTodoInput): Todo {
    const title = validateTodoTitle(input.title);
    const description = validateTodoDescription(input.description);
    
    const now = new Date();
    const todo: Todo = {
      id: generateUUID(),
      title,
      description,
      completed: false,
      dueDate: input.dueDate,
      reminderTime: input.reminderTime,
      createdAt: now,
      updatedAt: now,
    };
    
    const todos = this.loadTodos();
    todos.push(todo);
    this.saveTodos(todos);
    
    return todo;
  }
  
  /**
   * Gets a todo by ID
   */
  static getById(id: string): Todo | null {
    const todos = this.loadTodos();
    return todos.find(todo => todo.id === id) || null;
  }
  
  /**
   * Gets all todos with optional filtering and sorting
   */
  static getAll(filter?: TodoFilter, sort?: TodoSortOptions): Todo[] {
    let todos = this.loadTodos();
    
    // Apply filters
    if (filter) {
      if (filter.completed !== undefined) {
        todos = todos.filter(todo => todo.completed === filter.completed);
      }
      
      if (filter.dueBefore) {
        todos = todos.filter(todo => todo.dueDate && todo.dueDate <= filter.dueBefore!);
      }
      
      if (filter.dueAfter) {
        todos = todos.filter(todo => todo.dueDate && todo.dueDate >= filter.dueAfter!);
      }
      
      if (filter.hasReminder !== undefined) {
        todos = todos.filter(todo => (todo.reminderTime !== undefined) === filter.hasReminder);
      }
    }
    
    // Apply sorting
    if (sort) {
      todos.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];
        
        // Handle undefined values (put at end)
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Convert dates to numbers for comparison
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        // String comparison for title
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sort.direction === 'desc' ? -comparison : comparison;
        }
        
        // Numeric comparison
        const comparison = aValue - bValue;
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }
    
    return todos;
  }
  
  /**
   * Updates a todo by ID
   */
  static update(id: string, input: UpdateTodoInput): Todo {
    const todos = this.loadTodos();
    const index = todos.findIndex(todo => todo.id === id);
    
    if (index === -1) {
      throw new TodoNotFoundError(id);
    }
    
    const existingTodo = todos[index];
    const updatedTodo: Todo = {
      ...existingTodo,
      ...input,
      id: existingTodo.id, // Ensure ID cannot be changed
      createdAt: existingTodo.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date(),
    };
    
    // Validate updated fields
    if (input.title !== undefined) {
      updatedTodo.title = validateTodoTitle(input.title);
    }
    
    if (input.description !== undefined) {
      updatedTodo.description = validateTodoDescription(input.description);
    }
    
    todos[index] = updatedTodo;
    this.saveTodos(todos);
    
    return updatedTodo;
  }
  
  /**
   * Deletes a todo by ID
   */
  static delete(id: string): boolean {
    const todos = this.loadTodos();
    const index = todos.findIndex(todo => todo.id === id);
    
    if (index === -1) {
      return false;
    }
    
    todos.splice(index, 1);
    this.saveTodos(todos);
    
    return true;
  }
  
  /**
   * Deletes all todos
   */
  static deleteAll(): void {
    this.saveTodos([]);
  }
  
  /**
   * Gets the count of todos matching optional filter
   */
  static count(filter?: TodoFilter): number {
    return this.getAll(filter).length;
  }
  
  /**
   * Checks if a todo exists by ID
   */
  static exists(id: string): boolean {
    return this.getById(id) !== null;
  }
}