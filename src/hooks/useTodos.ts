import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter, TodoSortOptions } from '../types/todo.js';
import { LocalStorageService, TodoNotFoundError } from '../services/localStorage.js';

export interface UseTodosState {
  todos: Todo[];
  isLoading: boolean;
  error: Error | null;
}

export interface UseTodosActions {
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<boolean>;
  deleteAllTodos: () => Promise<void>;
  toggleTodo: (id: string) => Promise<Todo>;
  refreshTodos: () => Promise<void>;
  getTodoById: (id: string) => Todo | undefined;
  getTodosCount: (filter?: TodoFilter) => number;
}

export interface UseTodosOptions {
  filter?: TodoFilter;
  sort?: TodoSortOptions;
  autoRefresh?: boolean;
}

/**
 * Custom hook for managing todos with localStorage persistence
 */
export function useTodos(options: UseTodosOptions = {}): [UseTodosState, UseTodosActions] {
  const { filter, sort, autoRefresh = true } = options;
  
  const [state, setState] = useState<UseTodosState>({
    todos: [],
    isLoading: true,
    error: null,
  });
  
  // Load todos from localStorage
  const loadTodos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const todos = LocalStorageService.getAll(filter, sort);
      
      setState(prev => ({
        ...prev,
        todos,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        todos: [],
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [filter, sort]);
  
  // Create a new todo
  const createTodo = useCallback(async (input: CreateTodoInput): Promise<Todo> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const newTodo = LocalStorageService.create(input);
      
      // Refresh todos to maintain filter/sort order
      await loadTodos();
      
      return newTodo;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [loadTodos]);
  
  // Update an existing todo
  const updateTodo = useCallback(async (id: string, input: UpdateTodoInput): Promise<Todo> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedTodo = LocalStorageService.update(id, input);
      
      // Refresh todos to maintain filter/sort order
      await loadTodos();
      
      return updatedTodo;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [loadTodos]);
  
  // Delete a todo
  const deleteTodo = useCallback(async (id: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const deleted = LocalStorageService.delete(id);
      
      if (deleted) {
        // Refresh todos to reflect deletion
        await loadTodos();
      }
      
      return deleted;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [loadTodos]);
  
  // Delete all todos
  const deleteAllTodos = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      LocalStorageService.deleteAll();
      
      // Refresh todos to reflect deletion
      await loadTodos();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [loadTodos]);
  
  // Toggle todo completion status
  const toggleTodo = useCallback(async (id: string): Promise<Todo> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const existingTodo = LocalStorageService.getById(id);
      if (!existingTodo) {
        throw new TodoNotFoundError(id);
      }
      
      const updatedTodo = LocalStorageService.update(id, {
        completed: !existingTodo.completed,
      });
      
      // Refresh todos to maintain filter/sort order
      await loadTodos();
      
      return updatedTodo;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [loadTodos]);
  
  // Refresh todos manually
  const refreshTodos = useCallback(async (): Promise<void> => {
    await loadTodos();
  }, [loadTodos]);
  
  // Get a specific todo by ID
  const getTodoById = useCallback((id: string): Todo | undefined => {
    return state.todos.find(todo => todo.id === id);
  }, [state.todos]);
  
  // Get count of todos matching current filter
  const getTodosCount = useCallback((customFilter?: TodoFilter): number => {
    return LocalStorageService.count(customFilter || filter);
  }, [filter]);
  
  // Auto-refresh when dependencies change
  useEffect(() => {
    if (autoRefresh) {
      loadTodos();
    }
  }, [loadTodos, autoRefresh]);
  
  // Listen for localStorage changes from other tabs
  useEffect(() => {
    if (!autoRefresh || typeof window === 'undefined') {
      return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'todos') {
        loadTodos();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTodos, autoRefresh]);
  
  const actions: UseTodosActions = {
    createTodo,
    updateTodo,
    deleteTodo,
    deleteAllTodos,
    toggleTodo,
    refreshTodos,
    getTodoById,
    getTodosCount,
  };
  
  return [state, actions];
}