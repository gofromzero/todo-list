// Main data layer exports
// Re-export everything from other modules for convenience

// Types
export type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  SerializedTodo,
  TodoFilter,
  TodoSortOptions,
} from '../types/index.js';

// Services
export {
  LocalStorageService,
  LocalStorageError,
  TodoNotFoundError,
} from '../services/index.js';

// Hooks
export {
  useLocalStorage,
  LocalStorageHookError,
  useTodos,
} from '../hooks/index.js';

export type {
  UseTodosState,
  UseTodosActions,
  UseTodosOptions,
} from '../hooks/index.js';

// Utilities
export {
  generateUUID,
  isValidUUID,
  isTodo,
  isSerializedTodo,
  isCreateTodoInput,
  isUpdateTodoInput,
  isValidISODate,
  serializeTodo,
  deserializeTodo,
  validateTodoTitle,
  validateTodoDescription,
} from '../utils/index.js';