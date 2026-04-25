/**
 * Unit tests for TimerModule
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

// Execute the app.js code to get TimerModule
const script = dom.window.document.createElement('script');
script.textContent = appJs;
dom.window.document.body.appendChild(script);

const TimerModule = dom.window.TimerModule;

describe('TimerModule', () => {
  let container;

  beforeEach(() => {
    // Create container with required elements
    container = document.createElement('div');
    container.className = 'timer-container';
    container.innerHTML = `
      <div class="timer-display">25:00</div>
      <div class="timer-controls">
        <button class="btn-start">Start</button>
        <button class="btn-stop" disabled>Stop</button>
        <button class="btn-reset">Reset</button>
      </div>
      <div class="timer-complete" hidden>Session Complete!</div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    TimerModule.destroy();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('formatTime', () => {
    it('should format 1500 seconds as 25:00', () => {
      expect(TimerModule.formatTime(1500)).toBe('25:00');
    });

    it('should format 0 seconds as 0:00', () => {
      expect(TimerModule.formatTime(0)).toBe('0:00');
    });

    it('should format 60 seconds as 1:00', () => {
      expect(TimerModule.formatTime(60)).toBe('1:00');
    });

    it('should format 125 seconds as 2:05', () => {
      expect(TimerModule.formatTime(125)).toBe('2:05');
    });

    it('should pad single-digit seconds with zero', () => {
      expect(TimerModule.formatTime(65)).toBe('1:05');
    });

    it('should handle 59 seconds correctly', () => {
      expect(TimerModule.formatTime(59)).toBe('0:59');
    });

    it('should handle large values correctly', () => {
      expect(TimerModule.formatTime(3661)).toBe('61:01');
    });
  });

  describe('init', () => {
    it('should initialize with 25:00 display', () => {
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      expect(display.textContent).toBe('25:00');
    });

    it('should have start button enabled initially', () => {
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      expect(startBtn.disabled).toBe(false);
    });

    it('should have stop button disabled initially', () => {
      TimerModule.init(container);
      const stopBtn = container.querySelector('.btn-stop');
      expect(stopBtn.disabled).toBe(true);
    });

    it('should have reset button enabled initially', () => {
      TimerModule.init(container);
      const resetBtn = container.querySelector('.btn-reset');
      expect(resetBtn.disabled).toBe(false);
    });

    it('should handle missing container gracefully', () => {
      expect(() => TimerModule.init(null)).not.toThrow();
    });
  });

  describe('start', () => {
    it('should disable start button when timer starts', () => {
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      
      TimerModule.start();
      expect(startBtn.disabled).toBe(true);
    });

    it('should enable stop button when timer starts', () => {
      TimerModule.init(container);
      const stopBtn = container.querySelector('.btn-stop');
      
      TimerModule.start();
      expect(stopBtn.disabled).toBe(false);
    });

    it('should hide completion message when starting', () => {
      TimerModule.init(container);
      const completeMsg = container.querySelector('.timer-complete');
      completeMsg.hidden = false; // Simulate completion message visible
      
      TimerModule.start();
      expect(completeMsg.hidden).toBe(true);
    });

    it('should decrement time after 1 second', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(1000);
      
      expect(display.textContent).toBe('24:59');
      
      vi.useRealTimers();
    });

    it('should decrement time continuously', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(3000);
      
      expect(display.textContent).toBe('24:57');
      
      vi.useRealTimers();
    });
  });

  describe('stop', () => {
    it('should enable start button when timer stops', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      
      TimerModule.start();
      TimerModule.stop();
      
      expect(startBtn.disabled).toBe(false);
      
      vi.useRealTimers();
    });

    it('should disable stop button when timer stops', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const stopBtn = container.querySelector('.btn-stop');
      
      TimerModule.start();
      TimerModule.stop();
      
      expect(stopBtn.disabled).toBe(true);
      
      vi.useRealTimers();
    });

    it('should preserve remaining time when stopped', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(5000); // 5 seconds
      TimerModule.stop();
      
      const timeAfterStop = display.textContent;
      expect(timeAfterStop).toBe('24:55');
      
      // Advance time further - should not change
      vi.advanceTimersByTime(5000);
      expect(display.textContent).toBe('24:55');
      
      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should restore time to 25:00', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(10000); // 10 seconds
      TimerModule.reset();
      
      expect(display.textContent).toBe('25:00');
      
      vi.useRealTimers();
    });

    it('should stop the timer if running', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(5000);
      TimerModule.reset();
      
      // Advance time - should not change after reset
      vi.advanceTimersByTime(5000);
      expect(display.textContent).toBe('25:00');
      
      vi.useRealTimers();
    });

    it('should enable start button after reset', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      
      TimerModule.start();
      TimerModule.reset();
      
      expect(startBtn.disabled).toBe(false);
      
      vi.useRealTimers();
    });

    it('should disable stop button after reset', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const stopBtn = container.querySelector('.btn-stop');
      
      TimerModule.start();
      TimerModule.reset();
      
      expect(stopBtn.disabled).toBe(true);
      
      vi.useRealTimers();
    });

    it('should hide completion message', () => {
      TimerModule.init(container);
      const completeMsg = container.querySelector('.timer-complete');
      completeMsg.hidden = false; // Simulate completion message visible
      
      TimerModule.reset();
      expect(completeMsg.hidden).toBe(true);
    });
  });

  describe('timer completion', () => {
    it('should stop at zero', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(1500000); // 1500 seconds (25 minutes)
      
      expect(display.textContent).toBe('0:00');
      
      // Advance further - should stay at 0:00
      vi.advanceTimersByTime(5000);
      expect(display.textContent).toBe('0:00');
      
      vi.useRealTimers();
    });

    it('should show completion message when reaching zero', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const completeMsg = container.querySelector('.timer-complete');
      
      TimerModule.start();
      vi.advanceTimersByTime(1500000); // 1500 seconds
      
      expect(completeMsg.hidden).toBe(false);
      
      vi.useRealTimers();
    });

    it('should enable start button when complete', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      
      TimerModule.start();
      vi.advanceTimersByTime(1500000); // 1500 seconds
      
      expect(startBtn.disabled).toBe(false);
      
      vi.useRealTimers();
    });

    it('should disable stop button when complete', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const stopBtn = container.querySelector('.btn-stop');
      
      TimerModule.start();
      vi.advanceTimersByTime(1500000); // 1500 seconds
      
      expect(stopBtn.disabled).toBe(true);
      
      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should stop the timer', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(5000);
      const timeBeforeDestroy = display.textContent;
      
      TimerModule.destroy();
      
      // Advance time - should not change after destroy
      vi.advanceTimersByTime(5000);
      expect(display.textContent).toBe(timeBeforeDestroy);
      
      vi.useRealTimers();
    });

    it('should clean up event listeners', () => {
      TimerModule.init(container);
      const startBtn = container.querySelector('.btn-start');
      
      TimerModule.destroy();
      
      // Click should not cause errors
      expect(() => startBtn.click()).not.toThrow();
    });
  });

  describe('pause and resume', () => {
    it('should allow resuming after stop', () => {
      vi.useFakeTimers();
      TimerModule.init(container);
      const display = container.querySelector('.timer-display');
      
      TimerModule.start();
      vi.advanceTimersByTime(5000); // 5 seconds
      expect(display.textContent).toBe('24:55');
      
      TimerModule.stop();
      
      // Resume
      TimerModule.start();
      vi.advanceTimersByTime(5000); // 5 more seconds
      expect(display.textContent).toBe('24:50');
      
      vi.useRealTimers();
    });
  });
});
