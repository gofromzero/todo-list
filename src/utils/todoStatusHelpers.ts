import { Todo } from '../types/todo.js';
import { getTodoDateStatus, formatDate, type TodoDateStatus, type DateFormatType } from './dateHelpers.js';

/**
 * Visual styles for different todo statuses
 */
export interface TodoStatusStyle {
  className: string;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  icon?: string;
}

/**
 * Todo status with visual indicators
 */
export interface TodoStatusInfo {
  status: TodoDateStatus;
  style: TodoStatusStyle;
  label: string;
  description: string;
  priority: number; // For sorting (higher = more urgent)
}

/**
 * Get visual status information for a todo based on its due date
 */
export function getTodoStatusInfo(todo: Todo): TodoStatusInfo {
  const status = getTodoDateStatus(todo.dueDate);
  
  switch (status) {
    case 'overdue':
      return {
        status,
        style: {
          className: 'todo-overdue',
          color: '#dc2626', // red-600
          backgroundColor: '#fef2f2', // red-50
          borderColor: '#fca5a5', // red-300
          icon: '⚠️',
        },
        label: 'Overdue',
        description: 'This todo is past its due date',
        priority: 4,
      };
    
    case 'due-soon':
      return {
        status,
        style: {
          className: 'todo-due-soon',
          color: '#d97706', // amber-600
          backgroundColor: '#fffbeb', // amber-50
          borderColor: '#fcd34d', // amber-300
          icon: '⏰',
        },
        label: 'Due Soon',
        description: 'This todo is due within 24 hours',
        priority: 3,
      };
    
    case 'upcoming':
      return {
        status,
        style: {
          className: 'todo-upcoming',
          color: '#059669', // emerald-600
          backgroundColor: '#ecfdf5', // emerald-50
          borderColor: '#6ee7b7', // emerald-300
          icon: '📅',
        },
        label: 'Upcoming',
        description: 'This todo has a future due date',
        priority: 2,
      };
    
    case 'no-due-date':
    default:
      return {
        status,
        style: {
          className: 'todo-no-due-date',
          color: '#6b7280', // gray-500
          backgroundColor: undefined,
          borderColor: undefined,
          icon: '',
        },
        label: 'No Due Date',
        description: 'This todo has no due date set',
        priority: 1,
      };
  }
}

/**
 * Get CSS styles object for a todo status
 */
export function getTodoStatusStyles(todo: Todo): React.CSSProperties {
  const statusInfo = getTodoStatusInfo(todo);
  const style = statusInfo.style;
  
  return {
    color: style.color,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
  };
}

/**
 * Get formatted due date text with status context
 */
export function getFormattedDueDateWithStatus(
  todo: Todo, 
  formatType: DateFormatType = 'relative'
): string {
  if (!todo.dueDate) {
    return 'No due date';
  }

  const statusInfo = getTodoStatusInfo(todo);
  const formattedDate = formatDate(todo.dueDate, formatType);
  
  switch (statusInfo.status) {
    case 'overdue':
      return `Overdue ${formattedDate}`;
    case 'due-soon':
      return `Due ${formattedDate}`;
    case 'upcoming':
      return `Due ${formattedDate}`;
    default:
      return formattedDate;
  }
}

/**
 * Get reminder status text
 */
export function getFormattedReminderText(
  todo: Todo, 
  formatType: DateFormatType = 'relative'
): string | null {
  if (!todo.reminderTime) {
    return null;
  }

  const formattedTime = formatDate(todo.reminderTime, formatType);
  return `Reminder ${formattedTime}`;
}

/**
 * Sort todos by priority (overdue first, then by due date)
 */
export function sortTodosByPriority(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    const aInfo = getTodoStatusInfo(a);
    const bInfo = getTodoStatusInfo(b);
    
    // First sort by priority (overdue first)
    if (aInfo.priority !== bInfo.priority) {
      return bInfo.priority - aInfo.priority;
    }
    
    // Then sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Items without due dates go last
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // Finally sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter todos by status
 */
export function filterTodosByStatus(todos: Todo[], status: TodoDateStatus): Todo[] {
  return todos.filter(todo => getTodoDateStatus(todo.dueDate) === status);
}

/**
 * Group todos by status
 */
export function groupTodosByStatus(todos: Todo[]): Record<TodoDateStatus, Todo[]> {
  const groups: Record<TodoDateStatus, Todo[]> = {
    'overdue': [],
    'due-soon': [],
    'upcoming': [],
    'no-due-date': [],
  };
  
  for (const todo of todos) {
    const status = getTodoDateStatus(todo.dueDate);
    groups[status].push(todo);
  }
  
  return groups;
}

/**
 * Get summary statistics for todos
 */
export function getTodoStatusSummary(todos: Todo[]): Record<TodoDateStatus, number> {
  const summary: Record<TodoDateStatus, number> = {
    'overdue': 0,
    'due-soon': 0,
    'upcoming': 0,
    'no-due-date': 0,
  };
  
  for (const todo of todos) {
    if (!todo.completed) { // Only count incomplete todos
      const status = getTodoDateStatus(todo.dueDate);
      summary[status]++;
    }
  }
  
  return summary;
}

/**
 * Check if a todo needs attention (overdue or due soon)
 */
export function todoNeedsAttention(todo: Todo): boolean {
  if (todo.completed) return false;
  
  const status = getTodoDateStatus(todo.dueDate);
  return status === 'overdue' || status === 'due-soon';
}

/**
 * Get CSS class names for a todo item
 */
export function getTodoCssClasses(todo: Todo, additionalClasses: string[] = []): string {
  const statusInfo = getTodoStatusInfo(todo);
  const classes = [
    'todo-item',
    statusInfo.style.className,
    ...(todo.completed ? ['todo-completed'] : []),
    ...additionalClasses,
  ];
  
  return classes.filter(Boolean).join(' ');
}