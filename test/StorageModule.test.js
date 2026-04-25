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

// Execute the app.js code to get StorageModule
const script = dom.window.document.createElement('script');
script.textContent = appJs;
dom.window.document.body.appendChild(script);

const StorageModule = dom.window.StorageModule;

describe('StorageModule', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Clear any warning banners from previous tests
    const warnings = document.querySelectorAll('.storage-warning');
    warnings.forEach(w => w.remove());
  });

  describe('init and storage availability', () => {
    it('should detect when localStorage is available', () => {
      StorageModule.init();
      expect(StorageModule.isStorageAvailable()).toBe(true);
    });

    it('should not show warning when localStorage is available', () => {
      StorageModule.init();
      const warning = document.querySelector('.storage-warning');
      expect(warning).toBe(null);
    });

    it('should detect when localStorage is unavailable', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Create new instance to test
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        runScripts: 'dangerously'
      });
      
      // Override global temporarily
      const savedGlobal = global.localStorage;
      global.document = testDom.window.document;
      global.localStorage = testDom.window.localStorage;
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Re-execute script
      const testScript = testDom.window.document.createElement('script');
      testScript.textContent = appJs;
      testDom.window.document.body.appendChild(testScript);
      
      const TestStorageModule = testDom.window.StorageModule;
      
      // Suppress console.warn for this test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TestStorageModule.init();
      
      expect(TestStorageModule.isStorageAvailable()).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Local Storage is unavailable')
      );
      
      // Restore
      localStorage.setItem = originalSetItem;
      global.localStorage = savedGlobal;
      consoleWarnSpy.mockRestore();
    });

    it('should show warning banner when localStorage is unavailable', () => {
      // Create test environment with disabled localStorage
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        runScripts: 'dangerously'
      });
      
      global.document = testDom.window.document;
      const savedLocalStorage = global.localStorage;
      global.localStorage = testDom.window.localStorage;
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Re-execute script
      const testScript = testDom.window.document.createElement('script');
      testScript.textContent = appJs;
      testDom.window.document.body.appendChild(testScript);
      
      const TestStorageModule = testDom.window.StorageModule;
      
      // Suppress console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TestStorageModule.init();
      
      const warning = testDom.window.document.querySelector('.storage-warning');
      expect(warning).not.toBe(null);
      expect(warning.textContent).toContain('Local Storage is unavailable');
      expect(warning.textContent).toContain('will not persist');
      
      // Restore
      global.localStorage = savedLocalStorage;
      consoleWarnSpy.mockRestore();
    });
  });

  describe('in-memory fallback', () => {
    it('should use in-memory storage when localStorage is unavailable', () => {
      // Create test environment with disabled localStorage
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        runScripts: 'dangerously'
      });
      
      const savedLocalStorage = global.localStorage;
      global.localStorage = testDom.window.localStorage;
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });
      global.localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Re-execute script
      const testScript = testDom.window.document.createElement('script');
      testScript.textContent = appJs;
      testDom.window.document.body.appendChild(testScript);
      
      const TestStorageModule = testDom.window.StorageModule;
      
      // Suppress console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TestStorageModule.init();
      
      // Test save and load with in-memory fallback
      const testData = { id: '123', text: 'Test task' };
      const saveResult = TestStorageModule.save('test_key', testData);
      expect(saveResult).toBe(true);
      
      const loaded = TestStorageModule.load('test_key');
      expect(loaded).toEqual(testData);
      
      // Restore
      global.localStorage = savedLocalStorage;
      consoleWarnSpy.mockRestore();
    });

    it('should handle remove with in-memory fallback', () => {
      // Create test environment with disabled localStorage
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        runScripts: 'dangerously'
      });
      
      const savedLocalStorage = global.localStorage;
      global.localStorage = testDom.window.localStorage;
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });
      global.localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });
      global.localStorage.removeItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Re-execute script
      const testScript = testDom.window.document.createElement('script');
      testScript.textContent = appJs;
      testDom.window.document.body.appendChild(testScript);
      
      const TestStorageModule = testDom.window.StorageModule;
      
      // Suppress console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TestStorageModule.init();
      
      // Save data
      TestStorageModule.save('test_key', { data: 'test' });
      expect(TestStorageModule.load('test_key')).toEqual({ data: 'test' });
      
      // Remove data
      TestStorageModule.remove('test_key');
      expect(TestStorageModule.load('test_key')).toBe(null);
      
      // Restore
      global.localStorage = savedLocalStorage;
      consoleWarnSpy.mockRestore();
    });

    it('should handle clear with in-memory fallback', () => {
      // Create test environment with disabled localStorage
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        runScripts: 'dangerously'
      });
      
      const savedLocalStorage = global.localStorage;
      global.localStorage = testDom.window.localStorage;
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });
      global.localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });
      global.localStorage.clear = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      // Re-execute script
      const testScript = testDom.window.document.createElement('script');
      testScript.textContent = appJs;
      testDom.window.document.body.appendChild(testScript);
      
      const TestStorageModule = testDom.window.StorageModule;
      
      // Suppress console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TestStorageModule.init();
      
      // Save multiple items
      TestStorageModule.save('key1', { data: '1' });
      TestStorageModule.save('key2', { data: '2' });
      
      expect(TestStorageModule.load('key1')).toEqual({ data: '1' });
      expect(TestStorageModule.load('key2')).toEqual({ data: '2' });
      
      // Clear all
      TestStorageModule.clear();
      
      expect(TestStorageModule.load('key1')).toBe(null);
      expect(TestStorageModule.load('key2')).toBe(null);
      
      // Restore
      global.localStorage = savedLocalStorage;
      consoleWarnSpy.mockRestore();
    });
  });

  describe('save', () => {
    it('should save data to localStorage with JSON serialization', () => {
      const testData = { id: '123', text: 'Test task', completed: false };
      const result = StorageModule.save('test_key', testData);
      
      expect(result).toBe(true);
      const stored = localStorage.getItem('test_key');
      expect(stored).toBe(JSON.stringify(testData));
    });

    it('should save arrays to localStorage', () => {
      const testData = [
        { id: '1', text: 'Task 1' },
        { id: '2', text: 'Task 2' }
      ];
      const result = StorageModule.save('tasks', testData);
      
      expect(result).toBe(true);
      const stored = localStorage.getItem('tasks');
      expect(stored).toBe(JSON.stringify(testData));
    });

    it('should save primitive values', () => {
      expect(StorageModule.save('string', 'hello')).toBe(true);
      expect(StorageModule.save('number', 42)).toBe(true);
      expect(StorageModule.save('boolean', true)).toBe(true);
      expect(StorageModule.save('null', null)).toBe(true);
      
      expect(localStorage.getItem('string')).toBe('"hello"');
      expect(localStorage.getItem('number')).toBe('42');
      expect(localStorage.getItem('boolean')).toBe('true');
      expect(localStorage.getItem('null')).toBe('null');
    });

    it('should handle QuotaExceededError gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      const result = StorageModule.save('test', { data: 'test' });
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Local Storage quota exceeded');
      
      // Restore original
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle other save errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw a generic error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Generic storage error');
      });
      
      const result = StorageModule.save('test', { data: 'test' });
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save to Local Storage:',
        expect.any(Error)
      );
      
      // Restore original
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle circular references gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const circular = { a: 1 };
      circular.self = circular;
      
      const result = StorageModule.save('circular', circular);
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('load', () => {
    it('should load and deserialize data from localStorage', () => {
      const testData = { id: '123', text: 'Test task', completed: false };
      localStorage.setItem('test_key', JSON.stringify(testData));
      
      const loaded = StorageModule.load('test_key');
      
      expect(loaded).toEqual(testData);
    });

    it('should load arrays from localStorage', () => {
      const testData = [
        { id: '1', text: 'Task 1' },
        { id: '2', text: 'Task 2' }
      ];
      localStorage.setItem('tasks', JSON.stringify(testData));
      
      const loaded = StorageModule.load('tasks');
      
      expect(loaded).toEqual(testData);
    });

    it('should load primitive values', () => {
      localStorage.setItem('string', '"hello"');
      localStorage.setItem('number', '42');
      localStorage.setItem('boolean', 'true');
      localStorage.setItem('null', 'null');
      
      expect(StorageModule.load('string')).toBe('hello');
      expect(StorageModule.load('number')).toBe(42);
      expect(StorageModule.load('boolean')).toBe(true);
      expect(StorageModule.load('null')).toBe(null);
    });

    it('should return null for missing keys', () => {
      const result = StorageModule.load('nonexistent_key');
      
      expect(result).toBe(null);
    });

    it('should return null for corrupted JSON data', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorage.setItem('corrupted', 'this is not valid JSON {]');
      
      const result = StorageModule.load('corrupted');
      
      expect(result).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load from Local Storage:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should return null for incomplete JSON data', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorage.setItem('incomplete', '{"id": "123", "text": "incomplete');
      
      const result = StorageModule.load('incomplete');
      
      expect(result).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string as valid JSON', () => {
      localStorage.setItem('empty', '""');
      
      const result = StorageModule.load('empty');
      
      expect(result).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove a key from localStorage', () => {
      localStorage.setItem('test_key', 'test_value');
      expect(localStorage.getItem('test_key')).toBe('test_value');
      
      StorageModule.remove('test_key');
      
      expect(localStorage.getItem('test_key')).toBe(null);
    });

    it('should not throw error when removing nonexistent key', () => {
      expect(() => {
        StorageModule.remove('nonexistent_key');
      }).not.toThrow();
    });

    it('should handle remove errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.removeItem to throw an error
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Remove error');
      });
      
      expect(() => {
        StorageModule.remove('test');
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to remove from Local Storage:',
        expect.any(Error)
      );
      
      // Restore original
      localStorage.removeItem = originalRemoveItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all localStorage data', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');
      
      expect(localStorage.length).toBe(3);
      
      StorageModule.clear();
      
      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem('key1')).toBe(null);
      expect(localStorage.getItem('key2')).toBe(null);
      expect(localStorage.getItem('key3')).toBe(null);
    });

    it('should not throw error when clearing empty storage', () => {
      expect(localStorage.length).toBe(0);
      
      expect(() => {
        StorageModule.clear();
      }).not.toThrow();
      
      expect(localStorage.length).toBe(0);
    });

    it('should handle clear errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.clear to throw an error
      const originalClear = localStorage.clear;
      localStorage.clear = vi.fn(() => {
        throw new Error('Clear error');
      });
      
      expect(() => {
        StorageModule.clear();
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear Local Storage:',
        expect.any(Error)
      );
      
      // Restore original
      localStorage.clear = originalClear;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle save and load round-trip for complex data', () => {
      const complexData = {
        tasks: [
          { id: '1', text: 'Task 1', completed: false, createdAt: 1705334400000 },
          { id: '2', text: 'Task 2', completed: true, createdAt: 1705334500000 }
        ],
        metadata: {
          version: '1.0',
          lastModified: Date.now()
        }
      };
      
      const saveResult = StorageModule.save('complex', complexData);
      expect(saveResult).toBe(true);
      
      const loaded = StorageModule.load('complex');
      expect(loaded).toEqual(complexData);
    });

    it('should handle multiple keys independently', () => {
      const tasks = [{ id: '1', text: 'Task' }];
      const links = [{ id: '1', name: 'Link', url: 'https://example.com' }];
      
      StorageModule.save('dashboard_tasks', tasks);
      StorageModule.save('dashboard_links', links);
      
      expect(StorageModule.load('dashboard_tasks')).toEqual(tasks);
      expect(StorageModule.load('dashboard_links')).toEqual(links);
      
      StorageModule.remove('dashboard_tasks');
      
      expect(StorageModule.load('dashboard_tasks')).toBe(null);
      expect(StorageModule.load('dashboard_links')).toEqual(links);
    });

    it('should handle overwriting existing keys', () => {
      const data1 = { value: 'first' };
      const data2 = { value: 'second' };
      
      StorageModule.save('key', data1);
      expect(StorageModule.load('key')).toEqual(data1);
      
      StorageModule.save('key', data2);
      expect(StorageModule.load('key')).toEqual(data2);
    });
  });
});
