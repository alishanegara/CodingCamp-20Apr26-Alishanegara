// Todo List Life Dashboard Application

// ============================================================================
// StorageModule - Centralized Local Storage operations with error handling
// ============================================================================

const StorageModule = (function() {
  // In-memory storage fallback for when localStorage is unavailable
  let inMemoryStorage = {};
  let storageAvailable = false;
  let warningShown = false;

  /**
   * Check if Local Storage is available
   * @returns {boolean} - True if localStorage is available, false otherwise
   */
  function isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Show warning message if persistence is unavailable
   */
  function showStorageWarning() {
    if (warningShown) {
      return; // Only show once
    }
    
    // Create warning banner
    const warning = document.createElement('div');
    warning.className = 'storage-warning';
    warning.innerHTML = `
      <span class="storage-warning-icon">⚠️</span>
      <span class="storage-warning-text">Local Storage is unavailable. Your data will not persist after closing this page.</span>
      <button class="storage-warning-close" aria-label="Close warning">×</button>
    `;
    
    // Add to top of body
    document.body.insertBefore(warning, document.body.firstChild);
    
    // Add close button handler
    const closeButton = warning.querySelector('.storage-warning-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        warning.remove();
      });
    }
    
    warningShown = true;
    console.warn('Local Storage is unavailable. Using in-memory storage. Data will not persist.');
  }

  /**
   * Initialize storage module and check availability
   */
  function init() {
    storageAvailable = isStorageAvailable();
    
    if (!storageAvailable) {
      showStorageWarning();
    }
  }

  /**
   * Save data to localStorage with JSON serialization
   * Falls back to in-memory storage if localStorage unavailable
   * @param {string} key - Storage key
   * @param {*} data - Data to save (will be JSON serialized)
   * @returns {boolean} - True if save successful, false otherwise
   */
  function save(key, data) {
    try {
      const json = JSON.stringify(data);
      
      if (storageAvailable) {
        localStorage.setItem(key, json);
      } else {
        // Use in-memory fallback
        inMemoryStorage[key] = json;
      }
      
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Local Storage quota exceeded');
      } else {
        console.error('Failed to save to Local Storage:', e);
      }
      return false;
    }
  }

  /**
   * Load and deserialize data from localStorage
   * Falls back to in-memory storage if localStorage unavailable
   * @param {string} key - Storage key
   * @returns {*|null} - Parsed data or null if missing/corrupted
   */
  function load(key) {
    try {
      let json;
      
      if (storageAvailable) {
        json = localStorage.getItem(key);
      } else {
        // Use in-memory fallback
        json = inMemoryStorage[key] || null;
      }
      
      if (json === null) {
        return null; // Key doesn't exist
      }
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to load from Local Storage:', e);
      return null; // Return null for corrupted data
    }
  }

  /**
   * Remove a key from localStorage
   * Falls back to in-memory storage if localStorage unavailable
   * @param {string} key - Storage key to remove
   */
  function remove(key) {
    try {
      if (storageAvailable) {
        localStorage.removeItem(key);
      } else {
        // Use in-memory fallback
        delete inMemoryStorage[key];
      }
    } catch (e) {
      console.error('Failed to remove from Local Storage:', e);
    }
  }

  /**
   * Clear all localStorage data
   * Falls back to in-memory storage if localStorage unavailable
   */
  function clear() {
    try {
      if (storageAvailable) {
        localStorage.clear();
      } else {
        // Use in-memory fallback
        inMemoryStorage = {};
      }
    } catch (e) {
      console.error('Failed to clear Local Storage:', e);
    }
  }

  /**
   * Get storage availability status
   * @returns {boolean} - True if localStorage is available
   */
  function getStorageAvailable() {
    return storageAvailable;
  }

  // Public API
  return {
    init,
    save,
    load,
    remove,
    clear,
    isStorageAvailable: getStorageAvailable
  };
})();

// ============================================================================
// SettingsModule - User preferences management (theme, custom name, timer duration)
// ============================================================================

const SettingsModule = (function() {
  const STORAGE_KEY = 'dashboard_settings';
  const DEFAULT_PREFERENCES = {
    theme: 'light',
    customName: '',
    pomodoroDuration: 25
  };
  
  let preferences = { ...DEFAULT_PREFERENCES };
  
  // DOM element references
  let themeToggle = null;
  let nameForm = null;
  let nameInput = null;
  let durationSelect = null;
  let savedMessage = null;

  /**
   * Validate theme value
   * @param {string} theme - Theme to validate
   * @returns {boolean} - True if valid ('light' or 'dark')
   */
  function _validateTheme(theme) {
    return theme === 'light' || theme === 'dark';
  }

  /**
   * Validate custom name
   * @param {string} name - Name to validate
   * @returns {boolean} - True if valid (0-50 characters after trim)
   */
  function _validateCustomName(name) {
    const trimmed = name.trim();
    return trimmed.length >= 0 && trimmed.length <= 50;
  }

  /**
   * Validate Pomodoro duration
   * @param {number} minutes - Duration in minutes to validate
   * @returns {boolean} - True if valid (15, 25, 30, or 45)
   */
  function _validatePomodoroDuration(minutes) {
    return [15, 25, 30, 45].includes(minutes);
  }

  /**
   * Save preferences to Local Storage
   */
  function _saveToStorage() {
    StorageModule.save(STORAGE_KEY, preferences);
  }

  /**
   * Load preferences from Local Storage
   * Validates and merges with defaults for missing/invalid properties
   */
  function loadPreferences() {
    const saved = StorageModule.load(STORAGE_KEY);
    
    if (saved && typeof saved === 'object') {
      // Merge with defaults, validating each property
      preferences = {
        theme: _validateTheme(saved.theme) ? saved.theme : DEFAULT_PREFERENCES.theme,
        customName: (saved.customName && _validateCustomName(saved.customName)) ? saved.customName.trim() : DEFAULT_PREFERENCES.customName,
        pomodoroDuration: _validatePomodoroDuration(saved.pomodoroDuration) ? saved.pomodoroDuration : DEFAULT_PREFERENCES.pomodoroDuration
      };
    } else {
      // Use defaults if no saved data or corrupted data
      preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Apply theme to the document
   * @param {string} theme - Theme to apply ('light' or 'dark')
   */
  function _applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Update toggle button aria-pressed attribute
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  /**
   * Announce theme change to screen readers
   * @param {string} theme - Theme that was applied
   */
  function announceThemeChange(theme) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${theme} mode`;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  }

  /**
   * Get current theme preference
   * @returns {string} - Current theme ('light' or 'dark')
   */
  function getTheme() {
    return preferences.theme;
  }

  /**
   * Set theme preference
   * @param {string} theme - Theme to set ('light' or 'dark')
   * @returns {boolean} - True if set successfully, false if invalid
   */
  function setTheme(theme) {
    if (!_validateTheme(theme)) {
      return false;
    }
    
    preferences.theme = theme;
    _applyTheme(theme);
    _saveToStorage();
    announceThemeChange(theme);
    showSavedMessage();
    return true;
  }

  /**
   * Get current custom name
   * @returns {string} - Current custom name
   */
  function getCustomName() {
    return preferences.customName;
  }

  /**
   * Set custom name preference
   * @param {string} name - Name to set
   * @returns {boolean} - True if set successfully, false if invalid
   */
  function setCustomName(name) {
    if (!_validateCustomName(name)) {
      return false;
    }
    
    preferences.customName = name.trim();
    _saveToStorage();
    notifyGreetingModule();
    showSavedMessage();
    return true;
  }

  /**
   * Get current Pomodoro duration
   * @returns {number} - Current duration in minutes
   */
  function getPomodoroDuration() {
    return preferences.pomodoroDuration;
  }

  /**
   * Set Pomodoro duration preference
   * @param {number} minutes - Duration in minutes (15, 25, 30, or 45)
   * @returns {boolean} - True if set successfully, false if invalid
   */
  function setPomodoroDuration(minutes) {
    if (!_validatePomodoroDuration(minutes)) {
      return false;
    }
    
    preferences.pomodoroDuration = minutes;
    _saveToStorage();
    notifyTimerModule();
    showSavedMessage();
    return true;
  }

  /**
   * Handle theme toggle button click
   */
  function _handleThemeToggle() {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  /**
   * Handle custom name form submission
   * @param {Event} event - Form submit event
   */
  function _handleNameSubmit(event) {
    event.preventDefault();
    
    if (!nameInput) {
      return;
    }
    
    const name = nameInput.value;
    setCustomName(name);
  }

  /**
   * Handle Pomodoro duration selector change
   * @param {Event} event - Change event
   */
  function _handleDurationChange(event) {
    if (!durationSelect) {
      return;
    }
    
    const minutes = parseInt(durationSelect.value, 10);
    setPomodoroDuration(minutes);
  }

  /**
   * Show settings saved confirmation message
   */
  function showSavedMessage() {
    if (!savedMessage) {
      return;
    }
    
    savedMessage.hidden = false;
    
    // Hide after 2 seconds
    setTimeout(() => {
      savedMessage.hidden = true;
    }, 2000);
  }

  /**
   * Notify GreetingModule of custom name change
   */
  function notifyGreetingModule() {
    if (typeof GreetingModule !== 'undefined' && GreetingModule.updateCustomName) {
      GreetingModule.updateCustomName(preferences.customName);
    }
  }

  /**
   * Notify TimerModule of duration change
   */
  function notifyTimerModule() {
    if (typeof TimerModule !== 'undefined' && TimerModule.updateDuration) {
      TimerModule.updateDuration(preferences.pomodoroDuration);
    }
  }

  /**
   * Initialize the SettingsModule
   * @param {HTMLElement} containerElement - Container element with settings controls
   */
  function init(containerElement) {
    if (!containerElement) {
      console.error('SettingsModule: Container element not found');
      return;
    }

    // Load preferences from storage first
    loadPreferences();
    
    // Apply theme immediately (before other modules render)
    _applyTheme(preferences.theme);
    
    // Get DOM element references
    themeToggle = containerElement.querySelector('#theme-toggle');
    nameForm = containerElement.querySelector('.custom-name-form');
    nameInput = containerElement.querySelector('.custom-name-input');
    durationSelect = containerElement.querySelector('.duration-select');
    savedMessage = containerElement.querySelector('.settings-saved');
    
    // Set initial input values from loaded preferences
    if (nameInput) {
      nameInput.value = preferences.customName;
    }
    if (durationSelect) {
      durationSelect.value = preferences.pomodoroDuration.toString();
    }
    
    // Attach event listeners
    if (themeToggle) {
      themeToggle.addEventListener('click', _handleThemeToggle);
    }
    if (nameForm) {
      nameForm.addEventListener('submit', _handleNameSubmit);
    }
    if (durationSelect) {
      durationSelect.addEventListener('change', _handleDurationChange);
    }
    
    // Notify other modules of initial preferences
    notifyGreetingModule();
    notifyTimerModule();
  }

  /**
   * Reset preferences to defaults
   */
  function resetToDefaults() {
    preferences = { ...DEFAULT_PREFERENCES };
    _applyTheme(preferences.theme);
    
    // Update UI controls
    if (nameInput) {
      nameInput.value = preferences.customName;
    }
    if (durationSelect) {
      durationSelect.value = preferences.pomodoroDuration.toString();
    }
    
    _saveToStorage();
    notifyGreetingModule();
    notifyTimerModule();
  }

  // Public API
  return {
    init,
    loadPreferences,
    announceThemeChange,
    getTheme,
    setTheme,
    getCustomName,
    setCustomName,
    getPomodoroDuration,
    setPomodoroDuration,
    showSavedMessage,
    resetToDefaults,
    // Export for testing
    _validateTheme,
    _validateCustomName,
    _validatePomodoroDuration
  };
})();

// ============================================================================
// GreetingModule - Time, date, and time-based greeting display
// ============================================================================

const GreetingModule = (function() {
  let updateInterval = null;
  let timeElement = null;
  let dateElement = null;
  let greetingElement = null;
  let customName = ''; // Custom user name for personalized greeting

  /**
   * Format time in 12-hour format with AM/PM
   * @param {Date} date - Date object to format
   * @returns {string} - Formatted time string (e.g., "10:30 AM")
   */
  function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Format date with day of week, month, and day
   * @param {Date} date - Date object to format
   * @returns {string} - Formatted date string (e.g., "Monday, January 15")
   */
  function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 
                  'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 
                    'June', 'July', 'August', 'September', 'October', 
                    'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    
    return `${dayName}, ${monthName} ${dayNum}`;
  }

  /**
   * Get greeting based on hour of day
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} - Greeting message
   */
  function getGreeting(hour) {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  }

  /**
   * Update the display with current time, date, and greeting
   */
  function updateDisplay() {
    const now = new Date();
    
    if (timeElement) {
      timeElement.textContent = formatTime(now);
    }
    
    if (dateElement) {
      dateElement.textContent = formatDate(now);
    }
    
    if (greetingElement) {
      const baseGreeting = getGreeting(now.getHours());
      greetingElement.textContent = formatGreetingWithName(baseGreeting, customName);
    }
  }

  /**
   * Format greeting with custom name if provided
   * @param {string} baseGreeting - Base greeting message (e.g., "Good morning")
   * @param {string} name - Custom user name
   * @returns {string} - Formatted greeting with name if present
   */
  function formatGreetingWithName(baseGreeting, name) {
    if (name && name.trim().length > 0) {
      return `${baseGreeting}, ${name}`;
    }
    return baseGreeting;
  }

  /**
   * Initialize the GreetingModule
   * @param {HTMLElement} containerElement - Container element with time, date, and greeting elements
   */
  function init(containerElement) {
    if (!containerElement) {
      console.error('GreetingModule: Container element not found');
      return;
    }

    // Get references to DOM elements
    timeElement = containerElement.querySelector('.time');
    dateElement = containerElement.querySelector('.date');
    greetingElement = containerElement.querySelector('.greeting');

    // Initial update
    updateDisplay();

    // Set up interval to update every second
    updateInterval = setInterval(updateDisplay, 1000);
  }

  /**
   * Destroy the GreetingModule and clean up resources
   */
  function destroy() {
    if (updateInterval !== null) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    
    timeElement = null;
    dateElement = null;
    greetingElement = null;
  }

  /**
   * Update the custom name and refresh the greeting display
   * @param {string} name - Custom user name to display in greeting
   */
  function updateCustomName(name) {
    customName = name;
    updateDisplay();
  }

  // Public API
  return {
    init,
    destroy,
    updateCustomName,
    // Export for testing
    formatTime,
    formatDate,
    getGreeting
  };
})();

// ============================================================================
// TimerModule - Configurable Pomodoro-style countdown timer
// ============================================================================

const TimerModule = (function() {
  let totalSeconds = 1500; // Default 25 minutes (configurable)
  
  let remainingSeconds = totalSeconds;
  let isRunning = false;
  let intervalId = null;
  
  // DOM element references
  let displayElement = null;
  let startButton = null;
  let stopButton = null;
  let resetButton = null;
  let completeElement = null;

  /**
   * Format seconds into MM:SS format
   * @param {number} seconds - Total seconds to format
   * @returns {string} - Formatted time string (e.g., "25:00")
   */
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update the timer display with current remaining time
   */
  function updateDisplay() {
    if (displayElement) {
      displayElement.textContent = formatTime(remainingSeconds);
    }
  }

  /**
   * Update button states based on timer state
   */
  function updateButtonStates() {
    if (startButton) {
      startButton.disabled = isRunning;
    }
    if (stopButton) {
      stopButton.disabled = !isRunning;
    }
    if (resetButton) {
      resetButton.disabled = false; // Always enabled
    }
  }

  /**
   * Handle timer completion (reached zero)
   */
  function onComplete() {
    isRunning = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    // Show completion message
    if (completeElement) {
      completeElement.hidden = false;
    }
    
    updateButtonStates();
  }

  /**
   * Countdown tick - decrement by 1 second
   */
  function tick() {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
      
      if (remainingSeconds === 0) {
        onComplete();
      }
    }
  }

  /**
   * Start the timer countdown
   */
  function start() {
    if (isRunning) {
      return; // Already running
    }
    
    // Hide completion message if visible
    if (completeElement) {
      completeElement.hidden = true;
    }
    
    isRunning = true;
    intervalId = setInterval(tick, 1000);
    updateButtonStates();
  }

  /**
   * Stop (pause) the timer countdown
   */
  function stop() {
    if (!isRunning) {
      return; // Already stopped
    }
    
    isRunning = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    updateButtonStates();
  }

  /**
   * Reset the timer to initial state
   */
  function reset() {
    // Stop the timer if running
    if (isRunning) {
      isRunning = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
    
    // Reset to current totalSeconds (which may be configured)
    remainingSeconds = totalSeconds;
    
    // Hide completion message
    if (completeElement) {
      completeElement.hidden = true;
    }
    
    updateDisplay();
    updateButtonStates();
  }

  /**
   * Initialize the TimerModule
   * @param {HTMLElement} containerElement - Container element with timer display and controls
   */
  function init(containerElement) {
    if (!containerElement) {
      console.error('TimerModule: Container element not found');
      return;
    }

    // Get references to DOM elements
    displayElement = containerElement.querySelector('.timer-display');
    startButton = containerElement.querySelector('.btn-start');
    stopButton = containerElement.querySelector('.btn-stop');
    resetButton = containerElement.querySelector('.btn-reset');
    completeElement = containerElement.querySelector('.timer-complete');

    // Set up event listeners
    if (startButton) {
      startButton.addEventListener('click', start);
    }
    if (stopButton) {
      stopButton.addEventListener('click', stop);
    }
    if (resetButton) {
      resetButton.addEventListener('click', reset);
    }

    // Initial display update
    updateDisplay();
    updateButtonStates();
  }

  /**
   * Destroy the TimerModule and clean up resources
   */
  function destroy() {
    // Clear interval if running
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    // Remove event listeners
    if (startButton) {
      startButton.removeEventListener('click', start);
    }
    if (stopButton) {
      stopButton.removeEventListener('click', stop);
    }
    if (resetButton) {
      resetButton.removeEventListener('click', reset);
    }
    
    // Reset state
    remainingSeconds = totalSeconds;
    isRunning = false;
    
    // Clear DOM references
    displayElement = null;
    startButton = null;
    stopButton = null;
    resetButton = null;
    completeElement = null;
  }

  /**
   * Update the timer duration (only when timer is not running)
   * @param {number} minutes - Duration in minutes
   * @returns {boolean} - True if updated successfully, false if timer is running
   */
  function updateDuration(minutes) {
    if (isRunning) {
      // Don't update during active countdown
      return false;
    }
    
    // Convert minutes to seconds and update totalSeconds
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    
    // Update display to show new time
    updateDisplay();
    
    return true;
  }

  /**
   * Get the current timer duration in minutes
   * @returns {number} - Current duration in minutes
   */
  function getDuration() {
    return Math.floor(totalSeconds / 60);
  }

  // Public API
  return {
    init,
    start,
    stop,
    reset,
    destroy,
    updateDuration,
    getDuration,
    // Export for testing
    formatTime
  };
})();

// ============================================================================
// TaskModule - Task management with CRUD operations
// ============================================================================

const TaskModule = (function() {
  const STORAGE_KEY = 'dashboard_tasks';
  const MAX_TEXT_LENGTH = 500;
  
  let tasks = [];
  
  // DOM element references
  let containerElement = null;
  let formElement = null;
  let inputElement = null;
  let listElement = null;
  let emptyElement = null;

  /**
   * Generate unique ID using timestamp + random string
   * @returns {string} - Unique identifier
   */
  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate task text
   * @param {string} text - Task text to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateText(text) {
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= MAX_TEXT_LENGTH;
  }

  /**
   * Save tasks to Local Storage
   */
  function saveToStorage() {
    StorageModule.save(STORAGE_KEY, tasks);
  }

  /**
   * Update the display to show/hide empty state message
   */
  function updateEmptyState() {
    if (emptyElement) {
      emptyElement.hidden = tasks.length > 0;
    }
  }

  /**
   * Create DOM element for a single task
   * @param {Object} task - Task object
   * @returns {HTMLElement} - Task list item element
   */
  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('data-id', task.id);
    
    if (task.completed) {
      li.classList.add('completed');
    }

    // Checkbox for completion toggle
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('click', () => toggleComplete(task.id));

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    // Edit button
    const editButton = document.createElement('button');
    editButton.className = 'btn-edit';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => enterEditMode(task.id));

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(editButton);
    li.appendChild(deleteButton);

    return li;
  }

  /**
   * Render all tasks to the DOM
   */
  function renderTasks() {
    if (!listElement) {
      return;
    }

    // Clear existing tasks
    listElement.innerHTML = '';

    // Render each task
    tasks.forEach(task => {
      const taskElement = renderTask(task);
      listElement.appendChild(taskElement);
    });

    updateEmptyState();
  }

  /**
   * Add a new task
   * @param {string} text - Task text
   * @returns {boolean} - True if added successfully, false otherwise
   */
  function addTask(text) {
    if (!validateText(text)) {
      return false;
    }

    const task = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    };

    tasks.push(task);
    saveToStorage();
    renderTasks();
    return true;
  }

  /**
   * Toggle task completion status
   * @param {string} id - Task ID
   */
  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveToStorage();
      renderTasks();
    }
  }

  /**
   * Delete a task
   * @param {string} id - Task ID
   */
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    renderTasks();
  }

  /**
   * Enter edit mode for a task
   * @param {string} id - Task ID
   */
  function enterEditMode(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return;
    }

    const taskElement = listElement.querySelector(`[data-id="${id}"]`);
    if (!taskElement) {
      return;
    }

    // Add editing class
    taskElement.classList.add('task-editing');

    // Clear existing content
    taskElement.innerHTML = '';

    // Create edit input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.text;

    // Create save button
    const saveButton = document.createElement('button');
    saveButton.className = 'btn-save';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => saveEdit(id, editInput.value));

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn-cancel';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => cancelEdit());

    // Handle Enter key to save
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit(id, editInput.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });

    taskElement.appendChild(editInput);
    taskElement.appendChild(saveButton);
    taskElement.appendChild(cancelButton);

    // Focus and select the input
    editInput.focus();
    editInput.select();
  }

  /**
   * Save edited task text
   * @param {string} id - Task ID
   * @param {string} newText - New task text
   */
  function saveEdit(id, newText) {
    if (!validateText(newText)) {
      // Invalid text, don't save
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = newText.trim();
      saveToStorage();
      renderTasks();
    }
  }

  /**
   * Cancel edit mode and restore original display
   */
  function cancelEdit() {
    renderTasks();
  }

  /**
   * Edit an existing task (public API)
   * @param {string} id - Task ID
   * @param {string} newText - New task text
   * @returns {boolean} - True if edited successfully, false otherwise
   */
  function editTask(id, newText) {
    if (!validateText(newText)) {
      return false;
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = newText.trim();
      saveToStorage();
      renderTasks();
      return true;
    }
    return false;
  }

  /**
   * Load tasks from Local Storage
   */
  function loadTasks() {
    const savedTasks = StorageModule.load(STORAGE_KEY);
    if (Array.isArray(savedTasks)) {
      tasks = savedTasks;
    } else {
      tasks = []; // Fallback to empty array
    }
    renderTasks();
  }

  /**
   * Handle form submission to add new task
   * @param {Event} event - Form submit event
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!inputElement) {
      return;
    }

    const text = inputElement.value;
    if (addTask(text)) {
      // Clear input on successful add
      inputElement.value = '';
    }
  }

  /**
   * Initialize the TaskModule
   * @param {HTMLElement} container - Container element with task form and list
   */
  function init(container) {
    if (!container) {
      console.error('TaskModule: Container element not found');
      return;
    }

    containerElement = container;
    formElement = container.querySelector('.task-form');
    inputElement = container.querySelector('.task-input');
    listElement = container.querySelector('.task-list');
    emptyElement = container.querySelector('.task-empty');

    // Set up form submission handler
    if (formElement) {
      formElement.addEventListener('submit', handleFormSubmit);
    }

    // Initial render
    renderTasks();
  }

  // Public API
  return {
    init,
    addTask,
    editTask,
    toggleComplete,
    deleteTask,
    loadTasks,
    // Export for testing
    generateId,
    validateText
  };
})();

// ============================================================================
// LinksModule - Quick access links management
// ============================================================================

const LinksModule = (function() {
  const STORAGE_KEY = 'dashboard_links';
  const MAX_NAME_LENGTH = 50;
  
  let links = [];
  
  // DOM element references
  let containerElement = null;
  let formElement = null;
  let nameInputElement = null;
  let urlInputElement = null;
  let listElement = null;
  let emptyElement = null;

  /**
   * Generate unique ID using timestamp + random string
   * @returns {string} - Unique identifier
   */
  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize URL by adding https:// if protocol is missing
   * @param {string} url - URL to normalize
   * @returns {string|null} - Normalized URL or null if invalid
   */
  function normalizeUrl(url) {
    let normalized = url.trim();
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    
    // Validate using URL constructor
    try {
      new URL(normalized);
      return normalized;
    } catch (e) {
      return null;
    }
  }

  /**
   * Validate link name and URL
   * @param {string} name - Link name to validate
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateLink(name, url) {
    const trimmedName = name.trim();
    const normalizedUrl = normalizeUrl(url);
    
    return trimmedName.length > 0 && 
           trimmedName.length <= MAX_NAME_LENGTH && 
           normalizedUrl !== null;
  }

  /**
   * Save links to Local Storage
   */
  function saveToStorage() {
    StorageModule.save(STORAGE_KEY, links);
  }

  /**
   * Update the display to show/hide empty state message
   */
  function updateEmptyState() {
    if (emptyElement) {
      emptyElement.hidden = links.length > 0;
    }
  }

  /**
   * Handle link click - open in new tab with security attributes
   * @param {string} url - URL to open
   */
  function handleLinkClick(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Create DOM element for a single link
   * @param {Object} link - Link object
   * @returns {HTMLElement} - Link item element
   */
  function renderLink(link) {
    const div = document.createElement('div');
    div.className = 'link-item';
    div.setAttribute('data-id', link.id);

    // Link button
    const linkButton = document.createElement('a');
    linkButton.href = link.url;
    linkButton.className = 'link-button';
    linkButton.textContent = link.name;
    linkButton.target = '_blank';
    linkButton.rel = 'noopener noreferrer';
    linkButton.addEventListener('click', (e) => {
      e.preventDefault();
      handleLinkClick(link.url);
    });

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete-link';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => deleteLink(link.id));

    div.appendChild(linkButton);
    div.appendChild(deleteButton);

    return div;
  }

  /**
   * Render all links to the DOM
   */
  function renderLinks() {
    if (!listElement) {
      return;
    }

    // Clear existing links
    listElement.innerHTML = '';

    // Render each link
    links.forEach(link => {
      const linkElement = renderLink(link);
      listElement.appendChild(linkElement);
    });

    updateEmptyState();
  }

  /**
   * Add a new link
   * @param {string} name - Link name
   * @param {string} url - Link URL
   * @returns {boolean} - True if added successfully, false otherwise
   */
  function addLink(name, url) {
    const trimmedName = name.trim();
    const normalizedUrl = normalizeUrl(url);
    
    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH || !normalizedUrl) {
      return false;
    }

    const link = {
      id: generateId(),
      name: trimmedName,
      url: normalizedUrl
    };

    links.push(link);
    saveToStorage();
    renderLinks();
    return true;
  }

  /**
   * Delete a link
   * @param {string} id - Link ID
   */
  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveToStorage();
    renderLinks();
  }

  /**
   * Load links from Local Storage
   */
  function loadLinks() {
    const savedLinks = StorageModule.load(STORAGE_KEY);
    if (Array.isArray(savedLinks)) {
      links = savedLinks;
    } else {
      links = []; // Fallback to empty array
    }
    renderLinks();
  }

  /**
   * Handle form submission to add new link
   * @param {Event} event - Form submit event
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!nameInputElement || !urlInputElement) {
      return;
    }

    const name = nameInputElement.value;
    const url = urlInputElement.value;
    
    if (addLink(name, url)) {
      // Clear inputs on successful add
      nameInputElement.value = '';
      urlInputElement.value = '';
    }
  }

  /**
   * Initialize the LinksModule
   * @param {HTMLElement} container - Container element with links form and list
   */
  function init(container) {
    if (!container) {
      console.error('LinksModule: Container element not found');
      return;
    }

    containerElement = container;
    formElement = container.querySelector('.links-form');
    nameInputElement = container.querySelector('.link-name-input');
    urlInputElement = container.querySelector('.link-url-input');
    listElement = container.querySelector('.links-list');
    emptyElement = container.querySelector('.links-empty');

    // Set up form submission handler
    if (formElement) {
      formElement.addEventListener('submit', handleFormSubmit);
    }

    // Initial render
    renderLinks();
  }

  // Public API
  return {
    init,
    addLink,
    deleteLink,
    loadLinks,
    // Export for testing
    generateId,
    validateLink,
    normalizeUrl
  };
})();


// ============================================================================
// Application Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage module first to check availability
  StorageModule.init();
  
  // Initialize settings module BEFORE other modules
  // This ensures theme is applied and preferences are loaded
  SettingsModule.init(document.querySelector('.settings-container'));
  
  // Initialize all modules
  GreetingModule.init(document.querySelector('.greeting-container'));
  TimerModule.init(document.querySelector('.timer-container'));
  TaskModule.init(document.querySelector('.task-container'));
  LinksModule.init(document.querySelector('.links-container'));
  
  // Load persisted data
  TaskModule.loadTasks();
  LinksModule.loadLinks();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  GreetingModule.destroy();
  TimerModule.destroy();
});
