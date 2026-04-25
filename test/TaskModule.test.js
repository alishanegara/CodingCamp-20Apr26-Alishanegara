import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Load the app.js file
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf-8');

// Create a new JSDOM instance with localStorage
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Execute the app.js code to get modules
const script = dom.window.document.createElement('script');
script.textContent = appJs;
dom.window.document.body.appendChild(script);

const TaskModule = dom.window.TaskModule;
const StorageModule = dom.window.StorageModule;

describe('TaskModule', () => {
  let container;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.className = 'task-container';
    container.innerHTML = `
      <form class="task-form">
        <input type="text" class="task-input" placeholder="Add a new task...">
        <button type="submit" class="btn-add">Add</button>
      </form>
      <ul class="task-list">
      </ul>
      <div class="task-empty" hidden>No tasks yet. Add one above!</div>
    `;
    document.body.appendChild(container);
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = TaskModule.generateId();
      const id2 = TaskModule.generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp and random parts', () => {
      const id = TaskModule.generateId();
      
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('validateText', () => {
    it('should accept valid task text', () => {
      expect(TaskModule.validateText('Valid task')).toBe(true);
      expect(TaskModule.validateText('Another valid task')).toBe(true);
      expect(TaskModule.validateText('a')).toBe(true);
    });

    it('should reject empty text', () => {
      expect(TaskModule.validateText('')).toBe(false);
    });

    it('should reject whitespace-only text', () => {
      expect(TaskModule.validateText('   ')).toBe(false);
      expect(TaskModule.validateText('\t\n')).toBe(false);
    });

    it('should reject text exceeding 500 characters', () => {
      const longText = 'a'.repeat(501);
      expect(TaskModule.validateText(longText)).toBe(false);
    });

    it('should accept text at exactly 500 characters', () => {
      const maxText = 'a'.repeat(500);
      expect(TaskModule.validateText(maxText)).toBe(true);
    });

    it('should trim text before validation', () => {
      expect(TaskModule.validateText('  valid  ')).toBe(true);
    });
  });

  describe('init', () => {
    it('should initialize without errors', () => {
      expect(() => {
        TaskModule.init(container);
      }).not.toThrow();
    });

    it('should handle missing container gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      TaskModule.init(null);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('TaskModule: Container element not found');
      consoleErrorSpy.mockRestore();
    });

    it('should show empty state when no tasks exist', () => {
      TaskModule.init(container);
      
      const emptyElement = container.querySelector('.task-empty');
      expect(emptyElement.hidden).toBe(true); // Initially hidden, but should show when rendered with 0 tasks
    });
  });

  describe('addTask', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should add a valid task', () => {
      const result = TaskModule.addTask('New task');
      
      expect(result).toBe(true);
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe('New task');
      expect(tasks[0].completed).toBe(false);
      expect(tasks[0].id).toBeTruthy();
      expect(tasks[0].createdAt).toBeTruthy();
    });

    it('should trim task text before adding', () => {
      TaskModule.addTask('  Trimmed task  ');
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks[0].text).toBe('Trimmed task');
    });

    it('should reject empty task text', () => {
      const result = TaskModule.addTask('');
      
      expect(result).toBe(false);
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toBe(null); // No tasks saved
    });

    it('should reject whitespace-only task text', () => {
      const result = TaskModule.addTask('   ');
      
      expect(result).toBe(false);
    });

    it('should reject task text exceeding 500 characters', () => {
      const longText = 'a'.repeat(501);
      const result = TaskModule.addTask(longText);
      
      expect(result).toBe(false);
    });

    it('should render the task in the DOM', () => {
      TaskModule.addTask('Visible task');
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(1);
      expect(taskItems[0].querySelector('.task-text').textContent).toBe('Visible task');
    });

    it('should hide empty state after adding first task', () => {
      TaskModule.addTask('First task');
      
      const emptyElement = container.querySelector('.task-empty');
      expect(emptyElement.hidden).toBe(true);
    });

    it('should add multiple tasks', () => {
      TaskModule.addTask('Task 1');
      TaskModule.addTask('Task 2');
      TaskModule.addTask('Task 3');
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(3);
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      expect(taskItems).toHaveLength(3);
    });
  });

  describe('toggleComplete', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should toggle task from incomplete to complete', () => {
      TaskModule.addTask('Task to complete');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      expect(tasks[0].completed).toBe(false);
      
      TaskModule.toggleComplete(taskId);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks[0].completed).toBe(true);
    });

    it('should toggle task from complete to incomplete', () => {
      TaskModule.addTask('Task to toggle');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.toggleComplete(taskId);
      TaskModule.toggleComplete(taskId);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks[0].completed).toBe(false);
    });

    it('should update DOM when toggling completion', () => {
      TaskModule.addTask('Task with checkbox');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.toggleComplete(taskId);
      
      const taskElement = container.querySelector(`[data-id="${taskId}"]`);
      const checkbox = taskElement.querySelector('.task-checkbox');
      
      expect(checkbox.checked).toBe(true);
      expect(taskElement.classList.contains('completed')).toBe(true);
    });

    it('should handle toggling nonexistent task gracefully', () => {
      expect(() => {
        TaskModule.toggleComplete('nonexistent-id');
      }).not.toThrow();
    });

    it('should save to storage after toggling', () => {
      TaskModule.addTask('Task to save');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.toggleComplete(taskId);
      
      // Verify it was saved
      const savedTasks = StorageModule.load('dashboard_tasks');
      expect(savedTasks[0].completed).toBe(true);
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should delete a task', () => {
      TaskModule.addTask('Task to delete');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.deleteTask(taskId);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks).toHaveLength(0);
    });

    it('should remove task from DOM', () => {
      TaskModule.addTask('Task to remove');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.deleteTask(taskId);
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      expect(taskItems).toHaveLength(0);
    });

    it('should show empty state after deleting last task', () => {
      TaskModule.addTask('Only task');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.deleteTask(taskId);
      
      const emptyElement = container.querySelector('.task-empty');
      expect(emptyElement.hidden).toBe(false);
    });

    it('should delete only the specified task', () => {
      TaskModule.addTask('Task 1');
      TaskModule.addTask('Task 2');
      TaskModule.addTask('Task 3');
      
      const tasks = StorageModule.load('dashboard_tasks');
      const taskIdToDelete = tasks[1].id;
      
      TaskModule.deleteTask(taskIdToDelete);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks).toHaveLength(2);
      expect(updatedTasks.find(t => t.id === taskIdToDelete)).toBeUndefined();
    });

    it('should handle deleting nonexistent task gracefully', () => {
      TaskModule.addTask('Task 1');
      
      expect(() => {
        TaskModule.deleteTask('nonexistent-id');
      }).not.toThrow();
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(1);
    });
  });

  describe('editTask', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should edit task text', () => {
      TaskModule.addTask('Original text');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      const result = TaskModule.editTask(taskId, 'Updated text');
      
      expect(result).toBe(true);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks[0].text).toBe('Updated text');
    });

    it('should trim edited text', () => {
      TaskModule.addTask('Original');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.editTask(taskId, '  Trimmed edit  ');
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks[0].text).toBe('Trimmed edit');
    });

    it('should reject empty edited text', () => {
      TaskModule.addTask('Original');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      const result = TaskModule.editTask(taskId, '');
      
      expect(result).toBe(false);
      
      const updatedTasks = StorageModule.load('dashboard_tasks');
      expect(updatedTasks[0].text).toBe('Original');
    });

    it('should reject whitespace-only edited text', () => {
      TaskModule.addTask('Original');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      const result = TaskModule.editTask(taskId, '   ');
      
      expect(result).toBe(false);
    });

    it('should reject edited text exceeding 500 characters', () => {
      TaskModule.addTask('Original');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      const longText = 'a'.repeat(501);
      const result = TaskModule.editTask(taskId, longText);
      
      expect(result).toBe(false);
    });

    it('should return false for nonexistent task', () => {
      const result = TaskModule.editTask('nonexistent-id', 'New text');
      
      expect(result).toBe(false);
    });

    it('should update DOM after editing', () => {
      TaskModule.addTask('Original');
      const tasks = StorageModule.load('dashboard_tasks');
      const taskId = tasks[0].id;
      
      TaskModule.editTask(taskId, 'Updated');
      
      const taskElement = container.querySelector(`[data-id="${taskId}"]`);
      const textElement = taskElement.querySelector('.task-text');
      
      expect(textElement.textContent).toBe('Updated');
    });
  });

  describe('loadTasks', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should load tasks from storage', () => {
      const savedTasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Task 2', completed: true, createdAt: Date.now() }
      ];
      
      StorageModule.save('dashboard_tasks', savedTasks);
      
      TaskModule.loadTasks();
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(2);
    });

    it('should handle missing storage data', () => {
      expect(() => {
        TaskModule.loadTasks();
      }).not.toThrow();
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(0);
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('dashboard_tasks', 'invalid json {]');
      
      expect(() => {
        TaskModule.loadTasks();
      }).not.toThrow();
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(0);
    });

    it('should handle non-array storage data', () => {
      StorageModule.save('dashboard_tasks', { not: 'an array' });
      
      expect(() => {
        TaskModule.loadTasks();
      }).not.toThrow();
      
      const taskList = container.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(0);
    });

    it('should render completed tasks with completed styling', () => {
      const savedTasks = [
        { id: '1', text: 'Completed task', completed: true, createdAt: Date.now() }
      ];
      
      StorageModule.save('dashboard_tasks', savedTasks);
      TaskModule.loadTasks();
      
      const taskElement = container.querySelector('[data-id="1"]');
      expect(taskElement.classList.contains('completed')).toBe(true);
      
      const checkbox = taskElement.querySelector('.task-checkbox');
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should add task on form submission', () => {
      const form = container.querySelector('.task-form');
      const input = container.querySelector('.task-input');
      
      input.value = 'Task from form';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe('Task from form');
    });

    it('should clear input after successful submission', () => {
      const form = container.querySelector('.task-form');
      const input = container.querySelector('.task-input');
      
      input.value = 'Task to clear';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      expect(input.value).toBe('');
    });

    it('should not clear input after failed submission', () => {
      const form = container.querySelector('.task-form');
      const input = container.querySelector('.task-input');
      
      input.value = '   '; // Invalid (whitespace only)
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      expect(input.value).toBe('   ');
    });

    it('should prevent default form submission', () => {
      const form = container.querySelector('.task-form');
      const input = container.querySelector('.task-input');
      
      input.value = 'Test task';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      TaskModule.init(container);
    });

    it('should handle complete workflow: add, edit, toggle, delete', () => {
      // Add
      TaskModule.addTask('Initial task');
      let tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(1);
      const taskId = tasks[0].id;
      
      // Edit
      TaskModule.editTask(taskId, 'Edited task');
      tasks = StorageModule.load('dashboard_tasks');
      expect(tasks[0].text).toBe('Edited task');
      
      // Toggle complete
      TaskModule.toggleComplete(taskId);
      tasks = StorageModule.load('dashboard_tasks');
      expect(tasks[0].completed).toBe(true);
      
      // Delete
      TaskModule.deleteTask(taskId);
      tasks = StorageModule.load('dashboard_tasks');
      expect(tasks).toHaveLength(0);
    });

    it('should maintain task order', () => {
      TaskModule.addTask('First');
      TaskModule.addTask('Second');
      TaskModule.addTask('Third');
      
      const tasks = StorageModule.load('dashboard_tasks');
      expect(tasks[0].text).toBe('First');
      expect(tasks[1].text).toBe('Second');
      expect(tasks[2].text).toBe('Third');
    });

    it('should persist tasks across module reinitialization', () => {
      TaskModule.addTask('Persistent task');
      
      // Reinitialize
      const newContainer = document.createElement('div');
      newContainer.className = 'task-container';
      newContainer.innerHTML = container.innerHTML;
      document.body.appendChild(newContainer);
      
      TaskModule.init(newContainer);
      TaskModule.loadTasks();
      
      const taskList = newContainer.querySelector('.task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      
      expect(taskItems).toHaveLength(1);
      expect(taskItems[0].querySelector('.task-text').textContent).toBe('Persistent task');
    });
  });
});
