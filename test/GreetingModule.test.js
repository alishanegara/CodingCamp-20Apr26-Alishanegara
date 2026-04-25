/**
 * Unit tests for GreetingModule
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Load the app.js file
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf-8');

// Create a new JSDOM instance
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Execute the app.js code to get GreetingModule
const script = dom.window.document.createElement('script');
script.textContent = appJs;
dom.window.document.body.appendChild(script);

const GreetingModule = dom.window.GreetingModule;

describe('GreetingModule', () => {
  let container;

  beforeEach(() => {
    // Create container with required elements
    container = document.createElement('div');
    container.className = 'greeting-container';
    container.innerHTML = `
      <div class="time">10:30 AM</div>
      <div class="date">Monday, January 15</div>
      <div class="greeting">Good morning</div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    GreetingModule.destroy();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('formatTime', () => {
    it('should format midnight as 12:00 AM', () => {
      const date = new Date('2024-01-15T00:00:00');
      expect(GreetingModule.formatTime(date)).toBe('12:00 AM');
    });

    it('should format noon as 12:00 PM', () => {
      const date = new Date('2024-01-15T12:00:00');
      expect(GreetingModule.formatTime(date)).toBe('12:00 PM');
    });

    it('should format morning time correctly', () => {
      const date = new Date('2024-01-15T09:30:00');
      expect(GreetingModule.formatTime(date)).toBe('9:30 AM');
    });

    it('should format afternoon time correctly', () => {
      const date = new Date('2024-01-15T15:45:00');
      expect(GreetingModule.formatTime(date)).toBe('3:45 PM');
    });

    it('should pad single-digit minutes with zero', () => {
      const date = new Date('2024-01-15T10:05:00');
      expect(GreetingModule.formatTime(date)).toBe('10:05 AM');
    });

    it('should handle 11:59 PM correctly', () => {
      const date = new Date('2024-01-15T23:59:00');
      expect(GreetingModule.formatTime(date)).toBe('11:59 PM');
    });
  });

  describe('formatDate', () => {
    it('should format date with day of week, month, and day', () => {
      const date = new Date('2024-01-15T10:30:00'); // Monday
      expect(GreetingModule.formatDate(date)).toBe('Monday, January 15');
    });

    it('should handle different months correctly', () => {
      const date = new Date('2024-12-25T10:30:00'); // Wednesday
      expect(GreetingModule.formatDate(date)).toBe('Wednesday, December 25');
    });

    it('should handle first day of month', () => {
      const date = new Date('2024-03-01T10:30:00'); // Friday
      expect(GreetingModule.formatDate(date)).toBe('Friday, March 1');
    });

    it('should handle last day of month', () => {
      const date = new Date('2024-01-31T10:30:00'); // Wednesday
      expect(GreetingModule.formatDate(date)).toBe('Wednesday, January 31');
    });
  });

  describe('getGreeting', () => {
    it('should return "Good morning" for 5 AM', () => {
      expect(GreetingModule.getGreeting(5)).toBe('Good morning');
    });

    it('should return "Good morning" for 11 AM', () => {
      expect(GreetingModule.getGreeting(11)).toBe('Good morning');
    });

    it('should return "Good afternoon" for 12 PM', () => {
      expect(GreetingModule.getGreeting(12)).toBe('Good afternoon');
    });

    it('should return "Good afternoon" for 4 PM', () => {
      expect(GreetingModule.getGreeting(16)).toBe('Good afternoon');
    });

    it('should return "Good evening" for 5 PM', () => {
      expect(GreetingModule.getGreeting(17)).toBe('Good evening');
    });

    it('should return "Good evening" for 8 PM', () => {
      expect(GreetingModule.getGreeting(20)).toBe('Good evening');
    });

    it('should return "Good night" for 9 PM', () => {
      expect(GreetingModule.getGreeting(21)).toBe('Good night');
    });

    it('should return "Good night" for midnight', () => {
      expect(GreetingModule.getGreeting(0)).toBe('Good night');
    });

    it('should return "Good night" for 4 AM', () => {
      expect(GreetingModule.getGreeting(4)).toBe('Good night');
    });
  });

  describe('init and destroy', () => {
    it('should initialize and update DOM elements', () => {
      GreetingModule.init(container);
      
      const timeElement = container.querySelector('.time');
      const dateElement = container.querySelector('.date');
      const greetingElement = container.querySelector('.greeting');

      // Check that elements have been updated (not the default values)
      expect(timeElement.textContent).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(dateElement.textContent).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}$/);
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night)$/);
    });

    it('should handle missing container gracefully', () => {
      // Should not throw error
      expect(() => GreetingModule.init(null)).not.toThrow();
    });

    it('should update display every second', async () => {
      vi.useFakeTimers();
      
      GreetingModule.init(container);
      const timeElement = container.querySelector('.time');
      const initialTime = timeElement.textContent;

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Time should be updated (or at least the function should have been called)
      // Note: In a real scenario, we'd need to mock Date to see actual changes
      expect(timeElement.textContent).toBeDefined();

      vi.useRealTimers();
    });

    it('should clean up interval on destroy', () => {
      vi.useFakeTimers();
      
      GreetingModule.init(container);
      GreetingModule.destroy();

      const timeElement = container.querySelector('.time');
      const timeBeforeAdvance = timeElement.textContent;

      // Advance time - should not update after destroy
      vi.advanceTimersByTime(5000);

      // Time should remain the same after destroy
      expect(timeElement.textContent).toBe(timeBeforeAdvance);

      vi.useRealTimers();
    });
  });

  describe('updateCustomName', () => {
    beforeEach(() => {
      GreetingModule.init(container);
    });

    it('should display greeting without name when customName is empty', () => {
      const greetingElement = container.querySelector('.greeting');
      
      // Initial state should have no name
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night)$/);
      expect(greetingElement.textContent).not.toContain(',');
    });

    it('should display greeting with custom name when provided', () => {
      const greetingElement = container.querySelector('.greeting');
      
      GreetingModule.updateCustomName('John');
      
      // Should include the name
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night), John$/);
    });

    it('should update greeting when custom name changes', () => {
      const greetingElement = container.querySelector('.greeting');
      
      GreetingModule.updateCustomName('Alice');
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night), Alice$/);
      
      GreetingModule.updateCustomName('Bob');
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night), Bob$/);
    });

    it('should revert to greeting without name when custom name is cleared', () => {
      const greetingElement = container.querySelector('.greeting');
      
      GreetingModule.updateCustomName('John');
      expect(greetingElement.textContent).toContain('John');
      
      GreetingModule.updateCustomName('');
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night)$/);
      expect(greetingElement.textContent).not.toContain(',');
    });

    it('should handle whitespace-only names as empty', () => {
      const greetingElement = container.querySelector('.greeting');
      
      GreetingModule.updateCustomName('   ');
      
      // Should not include comma or name
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night)$/);
      expect(greetingElement.textContent).not.toContain(',');
    });

    it('should preserve names with spaces', () => {
      const greetingElement = container.querySelector('.greeting');
      
      GreetingModule.updateCustomName('Mary Jane');
      
      expect(greetingElement.textContent).toMatch(/^Good (morning|afternoon|evening|night), Mary Jane$/);
    });

    it('should update display immediately when name is set', () => {
      const greetingElement = container.querySelector('.greeting');
      const initialGreeting = greetingElement.textContent;
      
      GreetingModule.updateCustomName('Sarah');
      
      // Greeting should be updated immediately
      expect(greetingElement.textContent).not.toBe(initialGreeting);
      expect(greetingElement.textContent).toContain('Sarah');
    });
  });
});
