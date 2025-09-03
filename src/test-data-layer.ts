/**
 * Test script to manually verify the data layer implementation
 * Run this in browser console to test localStorage service
 */

import { LocalStorageService } from './services/localStorage.js';
import { generateUUID } from './utils/uuid.js';
import type { CreateTodoInput, UpdateTodoInput } from './types/todo.js';

// Test UUID generation
console.log('Testing UUID generation...');
const uuid1 = generateUUID();
const uuid2 = generateUUID();
console.log('UUID 1:', uuid1);
console.log('UUID 2:', uuid2);
console.log('UUIDs are different:', uuid1 !== uuid2);

// Test LocalStorage service
console.log('\nTesting LocalStorage service...');

// Clear any existing data
LocalStorageService.deleteAll();
console.log('Initial count:', LocalStorageService.count());

// Create a test todo
const testTodoInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'This is a test description',
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
  reminderTime: new Date(Date.now() + 3600000), // 1 hour from now
};

console.log('Creating todo:', testTodoInput);
const createdTodo = LocalStorageService.create(testTodoInput);
console.log('Created todo:', createdTodo);

// Get all todos
console.log('\nGetting all todos...');
const allTodos = LocalStorageService.getAll();
console.log('All todos:', allTodos);
console.log('Count:', LocalStorageService.count());

// Get todo by ID
console.log('\nGetting todo by ID...');
const retrievedTodo = LocalStorageService.getById(createdTodo.id);
console.log('Retrieved todo:', retrievedTodo);

// Update todo
console.log('\nUpdating todo...');
const updateInput: UpdateTodoInput = {
  title: 'Updated Test Todo',
  completed: true,
};
const updatedTodo = LocalStorageService.update(createdTodo.id, updateInput);
console.log('Updated todo:', updatedTodo);

// Test filtering
console.log('\nTesting filtering...');
const completedTodos = LocalStorageService.getAll({ completed: true });
console.log('Completed todos:', completedTodos);

const incompleteTodos = LocalStorageService.getAll({ completed: false });
console.log('Incomplete todos:', incompleteTodos);

// Test sorting
console.log('\nTesting sorting...');
const sortedTodos = LocalStorageService.getAll(undefined, { field: 'createdAt', direction: 'desc' });
console.log('Sorted todos (by createdAt desc):', sortedTodos);

// Create another todo to test multiple items
const secondTodo = LocalStorageService.create({
  title: 'Second Todo',
  description: 'Another test todo',
});
console.log('Created second todo:', secondTodo);

// Test delete
console.log('\nTesting deletion...');
const deleted = LocalStorageService.delete(createdTodo.id);
console.log('Deleted first todo:', deleted);
console.log('Remaining todos:', LocalStorageService.getAll());

// Clean up
console.log('\nCleaning up...');
LocalStorageService.deleteAll();
console.log('Final count:', LocalStorageService.count());

console.log('\n✅ All tests completed successfully!');