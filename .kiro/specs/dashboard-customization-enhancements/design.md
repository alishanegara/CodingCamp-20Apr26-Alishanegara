# Design Document: Dashboard Customization Enhancements

## Overview

The Dashboard Customization Enhancements feature extends the existing Todo List Life Dashboard with three personalization capabilities: theme switching (light/dark mode), custom user names in greetings, and configurable Pomodoro timer durations. This feature maintains the application's vanilla JavaScript architecture and client-side data persistence model while adding a new SettingsModule to manage user preferences.

### Design Philosophy

- **Consistency with Existing Architecture**: Follow the established modular pattern used by GreetingModule, TimerModule, TaskModule, and LinksModule
- **CSS Custom Properties for Theming**: Use CSS variables for efficient theme switching without JavaScript DOM manipulation
- **Centralized Preference Management**: Single SettingsModule manages all customization state and persistence
- **Backward Compatibility**: Preserve existing functionality and data; gracefully handle missing preferences
- **Performance First**: Theme changes apply instantly (<100ms) using CSS class toggling
- **Accessibility**: Maintain WCAG AA compliance across both themes with proper ARIA support

### Technology Stack

- **HTML5**: Semantic markup for settings controls
- **CSS3 Custom Properties**: CSS variables for theme color management
- **Vanilla JavaScript (ES6+)**: SettingsModule following existing patterns
- **Local Storage API**: Preference persistence alongside existing data
- **No external dependencies**: Self-contained enhancement

### Integration Points

The feature integrates with existing modules:
- **GreetingModule**: Receives custom name from SettingsModule for personalized greetings
- **TimerModule**: Receives Pomodoro duration from SettingsModule for configurable timer length
- **StorageModule**: Used by SettingsModule for preference persistence
- **CSS Stylesheet**: Extended with CSS custom properties and dark theme rules

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Dashboard Container                   │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │        Settings Component (NEW)              │  │ │
│  │  │  (Theme Switcher, Name Input, Duration)     │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │        Greeting Component                    │  │ │
│  │  │  (Time, Date, Personalized Greeting)        │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │        Focus Timer Component                 │  │ │
│  │  │  (Configurable Duration Countdown)          │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │        Task List Component                   │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │        Quick Links Component                 │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   app.js (js/)        │
              │                       │
              │  ┌─────────────────┐ │
              │  │ SettingsModule  │◄├─── NEW MODULE
              │  │  (Preferences)  │ │
              │  └────────┬────────┘ │
              │           │          │
              │  ┌────────▼────────┐ │
              │  │ GreetingModule  │ │◄─ Receives customName
              │  └─────────────────┘ │
              │  ┌─────────────────┐ │
              │  │  TimerModule    │ │◄─ Receives pomodoroDuration
              │  └─────────────────┘ │
              │  ┌─────────────────┐ │
              │  │  TaskModule     │ │
              │  └─────────────────┘ │
              │  ┌─────────────────┐ │
              │  │  LinksModule    │ │
              │  └─────────────────┘ │
              │  ┌─────────────────┐ │
              │  │ StorageModule   │ │◄─ Used by SettingsModule
              │  └─────────────────┘ │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Browser Local Storage│
              │  ┌─────────────────┐  │
              │  │  tasks: [...]   │  │
              │  │  links: [...]   │  │
              │  │  settings: {...}│  │◄─ NEW
              │  └─────────────────┘  │
              └───────────────────────┘
```

### Module Communication Flow

**Theme Change Flow**:
```
User clicks theme toggle
    ↓
SettingsModule.setTheme('dark')
    ↓
Update internal state
    ↓
Save to StorageModule
    ↓
Toggle CSS class on <body>
    ↓
CSS custom properties apply new colors
```

**Custom Name Flow**:
```
User enters name and saves
    ↓
SettingsModule.setCustomName('John')
    ↓
Validate and update state
    ↓
Save to StorageModule
    ↓
Call GreetingModule.updateCustomName('John')
    ↓
GreetingModule re-renders greeting
```

**Pomodoro Duration Flow**:
```
User selects duration (e.g., 30 minutes)
    ↓
SettingsModule.setPomodoroDuration(30)
    ↓
Update internal state
    ↓
Save to StorageModule
    ↓
Call TimerModule.updateDuration(30)
    ↓
TimerModule updates totalSeconds (if not running)
```

### Component Responsibilities

**SettingsModule (NEW)**:
- Manage user preferences state (theme, customName, pomodoroDuration)
- Validate preference values before saving
- Persist preferences to Local Storage via StorageModule
- Notify other modules when preferences change
- Provide public API for getting/setting preferences
- Handle settings UI interactions

**GreetingModule (MODIFIED)**:
- Accept custom name from SettingsModule
- Display personalized greeting when custom name exists
- Fall back to generic greeting when no custom name

**TimerModule (MODIFIED)**:
- Accept configurable duration from SettingsModule
- Initialize with saved duration preference
- Use configured duration for reset operations
- Prevent duration changes during active countdown

## Components and Interfaces

### 1. SettingsModule (NEW)

**Purpose**: Centralized management of user preferences with persistence

**State**:
```javascript
{
  preferences: {
    theme: string,              // 'light' | 'dark'
    customName: string,         // User's name (0-50 chars)
    pomodoroDuration: number    // Minutes: 15, 25, 30, or 45
  }
}
```

**Public Interface**:
```javascript
SettingsModule.init(containerElement)
SettingsModule.getTheme() → string
SettingsModule.setTheme(theme: string) → boolean
SettingsModule.getCustomName() → string
SettingsModule.setCustomName(name: string) → boolean
SettingsModule.getPomodoroDuration() → number
SettingsModule.setPomodoroDuration(minutes: number) → boolean
SettingsModule.loadPreferences()
SettingsModule.resetToDefaults()
```

**Private Methods**:
```javascript
_validateTheme(theme) → boolean
_validateCustomName(name) → boolean
_validatePomodoroDuration(minutes) → boolean
_saveToStorage()
_applyTheme(theme)
_renderSettings()
_handleThemeToggle()
_handleNameSubmit(event)
_handleDurationChange(event)
```

**DOM Structure**:
```html
<div class="settings-container">
  <h2 class="settings-title">Settings</h2>
  
  <!-- Theme Switcher -->
  <div class="setting-item">
    <label for="theme-toggle" class="setting-label">
      <span class="setting-name">Theme</span>
      <span class="setting-description">Switch between light and dark mode</span>
    </label>
    <button 
      id="theme-toggle" 
      class="theme-toggle" 
      aria-label="Toggle theme"
      aria-pressed="false">
      <span class="theme-icon theme-icon-light">☀️</span>
      <span class="theme-icon theme-icon-dark">🌙</span>
    </button>
  </div>
  
  <!-- Custom Name Input -->
  <div class="setting-item">
    <label for="custom-name-input" class="setting-label">
      <span class="setting-name">Your Name</span>
      <span class="setting-description">Personalize your greeting</span>
    </label>
    <form class="custom-name-form">
      <input 
        type="text" 
        id="custom-name-input"
        class="custom-name-input" 
        placeholder="Enter your name"
        maxlength="50">
      <button type="submit" class="btn-save-name">Save</button>
    </form>
  </div>
  
  <!-- Pomodoro Duration Selector -->
  <div class="setting-item">
    <label for="duration-select" class="setting-label">
      <span class="setting-name">Focus Timer Duration</span>
      <span class="setting-description">Choose your preferred session length</span>
    </label>
    <select id="duration-select" class="duration-select">
      <option value="15">15 minutes</option>
      <option value="25" selected>25 minutes</option>
      <option value="30">30 minutes</option>
      <option value="45">45 minutes</option>
    </select>
  </div>
  
  <!-- Save Confirmation (shown temporarily) -->
  <div class="settings-saved" hidden aria-live="polite">
    ✓ Settings saved
  </div>
</div>
```

**Default Values**:
```javascript
const DEFAULT_PREFERENCES = {
  theme: 'light',
  customName: '',
  pomodoroDuration: 25
};
```

### 2. GreetingModule (MODIFIED)

**New State**:
```javascript
{
  currentTime: Date,
  updateInterval: number,
  customName: string  // NEW: User's custom name
}
```

**New Public Interface**:
```javascript
GreetingModule.updateCustomName(name: string)  // NEW
```

**Modified Private Methods**:
```javascript
_updateDisplay()  // MODIFIED: Include custom name in greeting
_formatGreeting(hour, customName) → string  // MODIFIED: Accept customName parameter
```

**Greeting Format Logic**:
```javascript
// Without custom name
"Good morning"

// With custom name
"Good morning, John"
```

### 3. TimerModule (MODIFIED)

**Modified State**:
```javascript
{
  totalSeconds: number,      // MODIFIED: Now configurable (900, 1500, 1800, 2700)
  remainingSeconds: number,
  isRunning: boolean,
  intervalId: number | null
}
```

**New Public Interface**:
```javascript
TimerModule.updateDuration(minutes: number)  // NEW: Update timer duration
TimerModule.getDuration() → number           // NEW: Get current duration in minutes
```

**Modified Private Methods**:
```javascript
_reset()  // MODIFIED: Use current totalSeconds value
```

**Duration Update Logic**:
```javascript
function updateDuration(minutes) {
  // Only update if timer is not running
  if (isRunning) {
    return false;
  }
  
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  updateDisplay();
  return true;
}
```

## Data Models

### User Preferences Model

```javascript
{
  theme: string,              // 'light' | 'dark'
  customName: string,         // User's name (trimmed, 0-50 chars)
  pomodoroDuration: number    // Minutes: 15, 25, 30, or 45
}
```

**Validation Rules**:
- `theme`: Must be exactly 'light' or 'dark'
- `customName`: Trimmed string, 0-50 characters (empty string allowed)
- `pomodoroDuration`: Must be one of [15, 25, 30, 45]

**Default Values**:
```javascript
{
  theme: 'light',
  customName: '',
  pomodoroDuration: 25
}
```

**Example**:
```javascript
{
  theme: 'dark',
  customName: 'John',
  pomodoroDuration: 30
}
```

### Local Storage Schema

**Key: `dashboard_settings`**
```json
{
  "theme": "dark",
  "customName": "John",
  "pomodoroDuration": 30
}
```

**Backward Compatibility**:
- If key doesn't exist: Use default values
- If key exists but missing properties: Merge with defaults
- If key exists with invalid values: Use defaults for invalid properties

**Merge Logic Example**:
```javascript
// Stored data (missing pomodoroDuration)
{
  "theme": "dark",
  "customName": "John"
}

// After merge with defaults
{
  "theme": "dark",
  "customName": "John",
  "pomodoroDuration": 25  // Default value
}
```

## UI/UX Design

### Settings Section Layout

The settings section appears at the top of the dashboard, above the greeting component:

```
┌────────────────────────────────────┐
│         Settings Section           │
│  [Theme Toggle] [Name Input]       │
│  [Duration Selector]               │
├────────────────────────────────────┤
│         Greeting Section           │
│    (Time, Date, Greeting)          │
├────────────────────────────────────┤
│         Timer Section              │
│    (Display + Controls)            │
└────────────────────────────────────┘
```

### Theme Switcher Design

**Visual Design**:
- Toggle button with sun (☀️) and moon (🌙) icons
- Current theme icon highlighted
- Smooth transition animation
- Clear visual feedback on click

**Interaction States**:
- Default: Shows current theme icon
- Hover: Slight scale increase, cursor pointer
- Active: Brief scale down animation
- Focus: Blue outline for keyboard navigation

**Accessibility**:
- `aria-label="Toggle theme"`
- `aria-pressed="true|false"` indicates current state
- Keyboard operable (Enter/Space to toggle)
- Screen reader announces theme changes via aria-live region

### Custom Name Input Design

**Visual Design**:
- Text input with placeholder "Enter your name"
- Save button adjacent to input
- Inline form layout
- Clear label and description

**Interaction States**:
- Input focus: Blue border, subtle shadow
- Save button: Primary blue color
- Save button hover: Darker blue, slight elevation
- Validation feedback: Inline message for errors

**Behavior**:
- Enter key submits form
- Escape key clears input
- Auto-trim whitespace on save
- Show temporary "Saved" confirmation

### Pomodoro Duration Selector Design

**Visual Design**:
- Dropdown select with 4 options
- Clear label and description
- Consistent styling with other inputs

**Options**:
- 15 minutes
- 25 minutes (default)
- 30 minutes
- 45 minutes

**Interaction States**:
- Focus: Blue outline
- Hover: Subtle background change
- Selected: Checkmark indicator

**Behavior**:
- Auto-save on selection change
- Show temporary "Saved" confirmation
- Update timer display immediately (if not running)

### Theme Color Schemes

**Light Mode (Default)**:
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #212121;
  --text-secondary: #616161;
  --border-color: #E0E0E0;
  --primary-blue: #4A90E2;
  --success-green: #5CB85C;
  --danger-red: #D9534F;
}
```

**Dark Mode**:
```css
body.dark-theme {
  --bg-primary: #1E1E1E;
  --bg-secondary: #2D2D2D;
  --text-primary: #E0E0E0;
  --text-secondary: #B0B0B0;
  --border-color: #404040;
  --primary-blue: #5BA3F5;
  --success-green: #6FCF6F;
  --danger-red: #E57373;
}
```

**Contrast Ratios (WCAG AA Compliance)**:
- Light mode text on background: 16.1:1 (AAA)
- Dark mode text on background: 12.6:1 (AAA)
- Interactive elements: Minimum 4.5:1 (AA)

## Implementation Details

### CSS Custom Properties Approach

**Base CSS Structure**:
```css
/* Define CSS custom properties in :root */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #212121;
  --text-secondary: #616161;
  --border-color: #E0E0E0;
  --primary-blue: #4A90E2;
  --primary-blue-dark: #357ABD;
  --success-green: #5CB85C;
  --success-green-dark: #4A9D4A;
  --danger-red: #D9534F;
  --danger-red-dark: #C9302C;
  --neutral-gray-100: #F5F5F5;
  --neutral-gray-200: #E0E0E0;
  --neutral-gray-300: #BDBDBD;
  --neutral-gray-400: #9E9E9E;
}

/* Override for dark theme */
body.dark-theme {
  --bg-primary: #1E1E1E;
  --bg-secondary: #2D2D2D;
  --text-primary: #E0E0E0;
  --text-secondary: #B0B0B0;
  --border-color: #404040;
  --primary-blue: #5BA3F5;
  --primary-blue-dark: #4A8FE0;
  --success-green: #6FCF6F;
  --success-green-dark: #5EBE5E;
  --danger-red: #E57373;
  --danger-red-dark: #D96666;
  --neutral-gray-100: #2D2D2D;
  --neutral-gray-200: #404040;
  --neutral-gray-300: #5A5A5A;
  --neutral-gray-400: #707070;
}

/* Apply variables to components */
body {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.greeting-container,
.timer-container,
.task-container,
.links-container,
.settings-container {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.task-text {
  color: var(--text-primary);
}

.btn-start {
  background-color: var(--primary-blue);
}

.btn-start:hover {
  background-color: var(--primary-blue-dark);
}
```

**Theme Toggle Implementation**:
```javascript
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  
  // Update toggle button state
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.setAttribute('aria-pressed', theme === 'dark');
  }
  
  // Announce to screen readers
  announceThemeChange(theme);
}

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
```

### SettingsModule Implementation

**Initialization**:
```javascript
function init(containerElement) {
  if (!containerElement) {
    console.error('SettingsModule: Container element not found');
    return;
  }
  
  // Load preferences from storage
  loadPreferences();
  
  // Apply theme immediately (before render)
  applyTheme(preferences.theme);
  
  // Get DOM references
  themeToggle = containerElement.querySelector('#theme-toggle');
  nameForm = containerElement.querySelector('.custom-name-form');
  nameInput = containerElement.querySelector('.custom-name-input');
  durationSelect = containerElement.querySelector('.duration-select');
  savedMessage = containerElement.querySelector('.settings-saved');
  
  // Set initial values
  if (nameInput) {
    nameInput.value = preferences.customName;
  }
  if (durationSelect) {
    durationSelect.value = preferences.pomodoroDuration.toString();
  }
  
  // Attach event listeners
  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
  }
  if (nameForm) {
    nameForm.addEventListener('submit', handleNameSubmit);
  }
  if (durationSelect) {
    durationSelect.addEventListener('change', handleDurationChange);
  }
  
  // Notify other modules of initial preferences
  notifyGreetingModule();
  notifyTimerModule();
}
```

**Preference Validation**:
```javascript
function validateTheme(theme) {
  return theme === 'light' || theme === 'dark';
}

function validateCustomName(name) {
  const trimmed = name.trim();
  return trimmed.length >= 0 && trimmed.length <= 50;
}

function validatePomodoroDuration(minutes) {
  return [15, 25, 30, 45].includes(minutes);
}
```

**Preference Setters**:
```javascript
function setTheme(theme) {
  if (!validateTheme(theme)) {
    return false;
  }
  
  preferences.theme = theme;
  applyTheme(theme);
  saveToStorage();
  showSavedMessage();
  return true;
}

function setCustomName(name) {
  if (!validateCustomName(name)) {
    return false;
  }
  
  preferences.customName = name.trim();
  saveToStorage();
  notifyGreetingModule();
  showSavedMessage();
  return true;
}

function setPomodoroDuration(minutes) {
  if (!validatePomodoroDuration(minutes)) {
    return false;
  }
  
  preferences.pomodoroDuration = minutes;
  saveToStorage();
  notifyTimerModule();
  showSavedMessage();
  return true;
}
```

**Storage Operations**:
```javascript
function saveToStorage() {
  StorageModule.save(STORAGE_KEY, preferences);
}

function loadPreferences() {
  const saved = StorageModule.load(STORAGE_KEY);
  
  if (saved && typeof saved === 'object') {
    // Merge with defaults for missing properties
    preferences = {
      theme: validateTheme(saved.theme) ? saved.theme : DEFAULT_PREFERENCES.theme,
      customName: validateCustomName(saved.customName) ? saved.customName : DEFAULT_PREFERENCES.customName,
      pomodoroDuration: validatePomodoroDuration(saved.pomodoroDuration) ? saved.pomodoroDuration : DEFAULT_PREFERENCES.pomodoroDuration
    };
  } else {
    // Use defaults
    preferences = { ...DEFAULT_PREFERENCES };
  }
}
```

**Module Notification**:
```javascript
function notifyGreetingModule() {
  if (typeof GreetingModule !== 'undefined' && GreetingModule.updateCustomName) {
    GreetingModule.updateCustomName(preferences.customName);
  }
}

function notifyTimerModule() {
  if (typeof TimerModule !== 'undefined' && TimerModule.updateDuration) {
    TimerModule.updateDuration(preferences.pomodoroDuration);
  }
}
```

**UI Feedback**:
```javascript
function showSavedMessage() {
  if (!savedMessage) return;
  
  savedMessage.hidden = false;
  
  // Hide after 2 seconds
  setTimeout(() => {
    savedMessage.hidden = true;
  }, 2000);
}
```

### GreetingModule Modifications

**Updated Greeting Display**:
```javascript
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

function formatGreetingWithName(baseGreeting, name) {
  if (name && name.trim().length > 0) {
    return `${baseGreeting}, ${name}`;
  }
  return baseGreeting;
}

function updateCustomName(name) {
  customName = name;
  updateDisplay();
}
```

### TimerModule Modifications

**Updated Initialization**:
```javascript
function init(containerElement) {
  // ... existing code ...
  
  // totalSeconds will be set by SettingsModule.notifyTimerModule()
  // after preferences are loaded
}

function updateDuration(minutes) {
  if (isRunning) {
    // Don't update during active countdown
    return false;
  }
  
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  updateDisplay();
  return true;
}

function getDuration() {
  return Math.floor(totalSeconds / 60);
}

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
```

### Application Initialization Order

**Critical: Settings must load before other modules**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage module first
  StorageModule.init();
  
  // Initialize settings module BEFORE other modules
  // This ensures theme is applied and preferences are loaded
  SettingsModule.init(document.querySelector('.settings-container'));
  
  // Initialize other modules (they will receive preferences from SettingsModule)
  GreetingModule.init(document.querySelector('.greeting-container'));
  TimerModule.init(document.querySelector('.timer-container'));
  TaskModule.init(document.querySelector('.task-container'));
  LinksModule.init(document.querySelector('.links-container'));
  
  // Load persisted data
  TaskModule.loadTasks();
  LinksModule.loadLinks();
});
```

