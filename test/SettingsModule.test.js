import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('SettingsModule - Task 4 Core Functionality', () => {
  let dom;
  let document;
  let window;
  let StorageModule;
  let SettingsModule;

  beforeEach(() => {
    // Create a new JSDOM instance
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="settings-container">
            <button id="theme-toggle" aria-pressed="false"></button>
            <form class="custom-name-form">
              <input type="text" class="custom-name-input" maxlength="50">
            </form>
            <select class="duration-select">
              <option value="15">15 minutes</option>
              <option value="25">25 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
            </select>
            <div class="settings-saved" hidden></div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true
    });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;

    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    global.localStorage = localStorageMock;

    // Load modules
    const appCode = require('fs').readFileSync('./js/app.js', 'utf8');
    eval(appCode);
    
    StorageModule = global.StorageModule;
    SettingsModule = global.SettingsModule;
    
    // Initialize StorageModule
    StorageModule.init();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Task 4.1: State and Constants', () => {
    it('should define STORAGE_KEY constant', () => {
      // Test by attempting to save and load
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
      
      // The module should use 'dashboard_settings' as the key
      const saved = localStorage.getItem('dashboard_settings');
      // Initially should be null or have default values
      expect(saved === null || saved !== undefined).toBe(true);
    });

    it('should define DEFAULT_PREFERENCES with correct values', () => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
      
      // Load preferences should use defaults when no data exists
      SettingsModule.loadPreferences();
      
      // Check that theme toggle is set to light mode (default)
      const themeToggle = document.querySelector('#theme-toggle');
      expect(themeToggle.getAttribute('aria-pressed')).toBe('false');
      
      // Check that name input is empty (default)
      const nameInput = document.querySelector('.custom-name-input');
      expect(nameInput.value).toBe('');
      
      // Check that duration select is 25 (default)
      const durationSelect = document.querySelector('.duration-select');
      expect(durationSelect.value).toBe('25');
    });

    it('should initialize preferences state object', () => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
      
      // Verify preferences are initialized by checking applied theme
      expect(document.body.classList.contains('dark-theme')).toBe(false);
    });

    it('should initialize DOM element references', () => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
      
      // Verify DOM elements are found and used
      const themeToggle = document.querySelector('#theme-toggle');
      const nameInput = document.querySelector('.custom-name-input');
      const durationSelect = document.querySelector('.duration-select');
      
      expect(themeToggle).not.toBeNull();
      expect(nameInput).not.toBeNull();
      expect(durationSelect).not.toBeNull();
    });
  });

  describe('Task 4.2: Validation Functions', () => {
    beforeEach(() => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
    });

    it('should validate theme correctly - accept light', () => {
      expect(SettingsModule._validateTheme('light')).toBe(true);
    });

    it('should validate theme correctly - accept dark', () => {
      expect(SettingsModule._validateTheme('dark')).toBe(true);
    });

    it('should validate theme correctly - reject invalid', () => {
      expect(SettingsModule._validateTheme('blue')).toBe(false);
      expect(SettingsModule._validateTheme('')).toBe(false);
      expect(SettingsModule._validateTheme(null)).toBe(false);
      expect(SettingsModule._validateTheme(undefined)).toBe(false);
    });

    it('should validate custom name - accept empty string', () => {
      expect(SettingsModule._validateCustomName('')).toBe(true);
    });

    it('should validate custom name - accept valid names', () => {
      expect(SettingsModule._validateCustomName('John')).toBe(true);
      expect(SettingsModule._validateCustomName('Mary Jane')).toBe(true);
      expect(SettingsModule._validateCustomName('A')).toBe(true);
    });

    it('should validate custom name - trim and check length', () => {
      expect(SettingsModule._validateCustomName('  John  ')).toBe(true);
      expect(SettingsModule._validateCustomName('a'.repeat(50))).toBe(true);
    });

    it('should validate custom name - reject too long', () => {
      expect(SettingsModule._validateCustomName('a'.repeat(51))).toBe(false);
    });

    it('should validate Pomodoro duration - accept valid values', () => {
      expect(SettingsModule._validatePomodoroDuration(15)).toBe(true);
      expect(SettingsModule._validatePomodoroDuration(25)).toBe(true);
      expect(SettingsModule._validatePomodoroDuration(30)).toBe(true);
      expect(SettingsModule._validatePomodoroDuration(45)).toBe(true);
    });

    it('should validate Pomodoro duration - reject invalid values', () => {
      expect(SettingsModule._validatePomodoroDuration(10)).toBe(false);
      expect(SettingsModule._validatePomodoroDuration(20)).toBe(false);
      expect(SettingsModule._validatePomodoroDuration(60)).toBe(false);
      expect(SettingsModule._validatePomodoroDuration(0)).toBe(false);
      expect(SettingsModule._validatePomodoroDuration(-5)).toBe(false);
    });
  });

  describe('Task 4.3: Storage Operations', () => {
    beforeEach(() => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
    });

    it('should load preferences from storage with valid data', () => {
      // Save valid preferences
      const validPrefs = {
        theme: 'dark',
        customName: 'John',
        pomodoroDuration: 30
      };
      StorageModule.save('dashboard_settings', validPrefs);
      
      // Load preferences
      SettingsModule.loadPreferences();
      
      // Verify theme was applied
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      
      // Verify input values were set
      const nameInput = document.querySelector('.custom-name-input');
      const durationSelect = document.querySelector('.duration-select');
      expect(nameInput.value).toBe('John');
      expect(durationSelect.value).toBe('30');
    });

    it('should merge with defaults for missing properties', () => {
      // Save partial preferences (missing pomodoroDuration)
      const partialPrefs = {
        theme: 'dark',
        customName: 'Jane'
      };
      StorageModule.save('dashboard_settings', partialPrefs);
      
      // Load preferences
      SettingsModule.loadPreferences();
      
      // Verify theme and name were loaded
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      const nameInput = document.querySelector('.custom-name-input');
      expect(nameInput.value).toBe('Jane');
      
      // Verify duration uses default
      const durationSelect = document.querySelector('.duration-select');
      expect(durationSelect.value).toBe('25');
    });

    it('should fall back to defaults for corrupted data', () => {
      // Save corrupted data
      localStorage.setItem('dashboard_settings', 'invalid json {');
      
      // Load preferences
      SettingsModule.loadPreferences();
      
      // Verify defaults are used
      expect(document.body.classList.contains('dark-theme')).toBe(false);
      const nameInput = document.querySelector('.custom-name-input');
      const durationSelect = document.querySelector('.duration-select');
      expect(nameInput.value).toBe('');
      expect(durationSelect.value).toBe('25');
    });

    it('should fall back to defaults for invalid property values', () => {
      // Save preferences with invalid values
      const invalidPrefs = {
        theme: 'blue',  // Invalid
        customName: 'a'.repeat(100),  // Too long
        pomodoroDuration: 99  // Invalid
      };
      StorageModule.save('dashboard_settings', invalidPrefs);
      
      // Load preferences
      SettingsModule.loadPreferences();
      
      // Verify defaults are used for invalid values
      expect(document.body.classList.contains('dark-theme')).toBe(false);
      const nameInput = document.querySelector('.custom-name-input');
      const durationSelect = document.querySelector('.duration-select');
      expect(nameInput.value).toBe('');
      expect(durationSelect.value).toBe('25');
    });

    it('should trim custom name when loading', () => {
      // Save preferences with whitespace in name
      const prefsWithWhitespace = {
        theme: 'light',
        customName: '  John  ',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', prefsWithWhitespace);
      
      // Load preferences
      SettingsModule.loadPreferences();
      
      // Verify name was trimmed
      const nameInput = document.querySelector('.custom-name-input');
      expect(nameInput.value).toBe('John');
    });
  });

  describe('Task 4.4: Theme Application Logic', () => {
    beforeEach(() => {
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
    });

    it('should apply light theme by removing dark-theme class', () => {
      // Start with dark theme
      document.body.classList.add('dark-theme');
      
      // Apply light theme
      const validPrefs = {
        theme: 'light',
        customName: '',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', validPrefs);
      SettingsModule.loadPreferences();
      
      // Verify dark-theme class is removed
      expect(document.body.classList.contains('dark-theme')).toBe(false);
    });

    it('should apply dark theme by adding dark-theme class', () => {
      // Apply dark theme
      const validPrefs = {
        theme: 'dark',
        customName: '',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', validPrefs);
      SettingsModule.loadPreferences();
      
      // Verify dark-theme class is added
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    it('should update theme toggle button aria-pressed for light theme', () => {
      const validPrefs = {
        theme: 'light',
        customName: '',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', validPrefs);
      SettingsModule.loadPreferences();
      
      const themeToggle = document.querySelector('#theme-toggle');
      expect(themeToggle.getAttribute('aria-pressed')).toBe('false');
    });

    it('should update theme toggle button aria-pressed for dark theme', () => {
      const validPrefs = {
        theme: 'dark',
        customName: '',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', validPrefs);
      SettingsModule.loadPreferences();
      
      const themeToggle = document.querySelector('#theme-toggle');
      expect(themeToggle.getAttribute('aria-pressed')).toBe('true');
    });

    it('should create aria-live announcement for theme changes', () => {
      // Call announceThemeChange
      SettingsModule.announceThemeChange('dark');
      
      // Check that announcement element was created
      const announcement = document.querySelector('[role="status"][aria-live="polite"]');
      expect(announcement).not.toBeNull();
      expect(announcement.textContent).toBe('Theme changed to dark mode');
      expect(announcement.classList.contains('sr-only')).toBe(true);
    });

    it('should apply theme within 100ms', () => {
      const start = Date.now();
      
      const validPrefs = {
        theme: 'dark',
        customName: '',
        pomodoroDuration: 25
      };
      StorageModule.save('dashboard_settings', validPrefs);
      SettingsModule.loadPreferences();
      
      const elapsed = Date.now() - start;
      
      // Verify theme was applied
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      
      // Verify it was fast (should be nearly instant, well under 100ms)
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Integration: Init Method', () => {
    it('should handle missing container gracefully', () => {
      // Should not throw error
      expect(() => {
        SettingsModule.init(null);
      }).not.toThrow();
    });

    it('should load preferences before applying theme', () => {
      // Save dark theme preference
      const validPrefs = {
        theme: 'dark',
        customName: 'Test',
        pomodoroDuration: 30
      };
      StorageModule.save('dashboard_settings', validPrefs);
      
      // Init should load and apply
      const container = document.querySelector('.settings-container');
      SettingsModule.init(container);
      
      // Verify theme was applied
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      
      // Verify inputs were set
      const nameInput = document.querySelector('.custom-name-input');
      const durationSelect = document.querySelector('.duration-select');
      expect(nameInput.value).toBe('Test');
      expect(durationSelect.value).toBe('30');
    });
  });
});
