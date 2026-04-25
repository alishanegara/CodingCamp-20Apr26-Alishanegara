# Implementation Plan: Dashboard Customization Enhancements

## Overview

This implementation plan extends the existing Todo List Life Dashboard with three personalization capabilities: theme switching (light/dark mode), custom user names in greetings, and configurable Pomodoro timer durations. The implementation follows the established modular pattern using vanilla JavaScript, HTML5, and CSS3. All customization preferences persist in Local Storage alongside existing task and link data.

## Tasks

- [x] 1. Create CSS custom properties and dark theme styles
  - [x] 1.1 Define CSS custom properties for theme colors in :root
    - Add CSS variables for backgrounds, text colors, borders, and interactive elements
    - Ensure variables cover all existing component colors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 1.2 Create dark theme color overrides in body.dark-theme selector
    - Define dark mode color values for all CSS custom properties
    - Ensure WCAG AA contrast ratios for text and backgrounds
    - Adjust interactive element colors for dark mode
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 1.3 Update existing component styles to use CSS custom properties
    - Replace hardcoded colors with CSS variables in all components
    - Update greeting, timer, task, and links component styles
    - Ensure consistent theming across all elements
    - _Requirements: 2.4, 3.5, 14.1, 14.2, 14.3, 14.4_

- [x] 2. Create settings UI component in HTML
  - [x] 2.1 Add settings container markup to index.html
    - Create settings-container div above greeting component
    - Add semantic HTML structure for settings section
    - Include heading and setting items
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 2.2 Add theme switcher control markup
    - Create toggle button with sun and moon icons
    - Add appropriate ARIA labels and attributes
    - Include theme icon spans for visual feedback
    - _Requirements: 1.1, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 2.3 Add custom name input markup
    - Create form with text input and save button
    - Add label with setting name and description
    - Set maxlength attribute to 50 characters
    - _Requirements: 4.1, 9.3_
  
  - [x] 2.4 Add Pomodoro duration selector markup
    - Create select element with 4 duration options (15, 25, 30, 45 minutes)
    - Add label with setting name and description
    - Set default selected value to 25 minutes
    - _Requirements: 6.1, 6.2, 9.3_
  
  - [x] 2.5 Add settings saved confirmation message
    - Create hidden div with aria-live="polite" for accessibility
    - Add checkmark icon and "Settings saved" text
    - _Requirements: 9.4_

- [x] 3. Style settings component with CSS
  - [x] 3.1 Create base settings container styles
    - Add padding, margins, and background using CSS variables
    - Ensure consistent styling with other components
    - Add responsive styles for mobile devices
    - _Requirements: 9.1, 9.2, 9.5, 14.1, 14.2_
  
  - [x] 3.2 Style theme switcher button
    - Create toggle button styles with hover and focus states
    - Style theme icons (sun/moon) with transitions
    - Add pressed state styling for current theme
    - Ensure touch-friendly size (min 44px) on mobile
    - _Requirements: 10.2, 10.3, 15.1_
  
  - [x] 3.3 Style custom name input and form
    - Style text input with focus indicators
    - Style save button with hover and active states
    - Ensure keyboard accessibility with visible focus
    - _Requirements: 15.2_
  
  - [x] 3.4 Style Pomodoro duration selector
    - Style select element consistently with other inputs
    - Add focus indicators for keyboard navigation
    - Ensure dropdown is accessible and readable in both themes
    - _Requirements: 15.3_
  
  - [x] 3.5 Style settings saved confirmation message
    - Create temporary notification styling
    - Add fade-in/fade-out animations (respect prefers-reduced-motion)
    - Position appropriately within settings container
    - _Requirements: 9.4_

- [x] 4. Implement SettingsModule core functionality
  - [x] 4.1 Create SettingsModule with state and constants
    - Define STORAGE_KEY constant ('dashboard_settings')
    - Define DEFAULT_PREFERENCES object (theme: 'light', customName: '', pomodoroDuration: 25)
    - Initialize preferences state object
    - Initialize DOM element references
    - _Requirements: 11.1, 11.2, 16.1, 16.3_
  
  - [x] 4.2 Implement preference validation functions
    - Create _validateTheme(theme) - check for 'light' or 'dark'
    - Create _validateCustomName(name) - check length 0-50 after trim
    - Create _validatePomodoroDuration(minutes) - check for [15, 25, 30, 45]
    - _Requirements: 5.1, 5.2, 5.3, 16.2_
  
  - [x] 4.3 Implement storage operations
    - Create _saveToStorage() - serialize preferences to JSON and save via StorageModule
    - Create loadPreferences() - load from storage, validate, merge with defaults
    - Handle corrupted data by falling back to defaults
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.5_
  
  - [x] 4.4 Implement theme application logic
    - Create _applyTheme(theme) - toggle 'dark-theme' class on body
    - Update theme toggle button aria-pressed attribute
    - Create announceThemeChange(theme) - add aria-live announcement
    - Ensure theme applies within 100ms
    - _Requirements: 1.2, 1.3, 13.1, 15.5_

- [x] 5. Implement SettingsModule public API and UI handlers
  - [x] 5.1 Implement theme getter and setter
    - Create getTheme() - return current theme preference
    - Create setTheme(theme) - validate, update state, apply, save, show feedback
    - _Requirements: 1.2, 1.4_
  
  - [x] 5.2 Implement custom name getter and setter
    - Create getCustomName() - return current custom name
    - Create setCustomName(name) - validate, trim, update state, save, notify GreetingModule
    - _Requirements: 4.2, 4.3, 5.3_
  
  - [x] 5.3 Implement Pomodoro duration getter and setter
    - Create getPomodoroDuration() - return current duration
    - Create setPomodoroDuration(minutes) - validate, update state, save, notify TimerModule
    - _Requirements: 6.3, 6.4_
  
  - [x] 5.4 Implement UI event handlers
    - Create _handleThemeToggle() - toggle theme on button click
    - Create _handleNameSubmit(event) - prevent default, get input value, call setCustomName
    - Create _handleDurationChange(event) - get selected value, call setPomodoroDuration
    - _Requirements: 1.1, 1.2, 4.1, 6.1_
  
  - [x] 5.5 Implement UI feedback helper
    - Create showSavedMessage() - show confirmation, hide after 2 seconds
    - Ensure message is announced to screen readers
    - _Requirements: 9.4, 13.2, 13.3_
  
  - [x] 5.6 Implement module notification methods
    - Create notifyGreetingModule() - call GreetingModule.updateCustomName with current name
    - Create notifyTimerModule() - call TimerModule.updateDuration with current duration
    - Handle cases where modules may not be initialized yet
    - _Requirements: 11.5_

- [x] 6. Implement SettingsModule initialization
  - [x] 6.1 Create init(containerElement) method
    - Validate container element exists
    - Load preferences from storage
    - Apply theme immediately (before other modules render)
    - Get DOM element references (toggle, form, inputs, select, message)
    - Set initial input values from loaded preferences
    - Attach event listeners to all controls
    - _Requirements: 1.5, 11.1, 11.2, 11.3_
  
  - [x] 6.2 Implement resetToDefaults() method
    - Reset preferences to DEFAULT_PREFERENCES
    - Apply default theme
    - Update all UI controls
    - Save to storage
    - Notify other modules
    - _Requirements: 16.3_

- [x] 7. Modify GreetingModule to support custom names
  - [x] 7.1 Add customName state to GreetingModule
    - Initialize customName as empty string
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.2 Create updateCustomName(name) public method
    - Accept name parameter
    - Update customName state
    - Call updateDisplay() to re-render greeting
    - _Requirements: 4.3, 11.5_
  
  - [x] 7.3 Modify _updateDisplay() to include custom name
    - Update greeting text to include custom name if present
    - Format as "Good morning, John" when name exists
    - Format as "Good morning" when name is empty
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 8. Modify TimerModule to support configurable duration
  - [x] 8.1 Make totalSeconds configurable in TimerModule
    - Change TOTAL_SECONDS from constant to variable
    - Initialize with default 1500 seconds (25 minutes)
    - _Requirements: 6.4, 6.5, 7.1_
  
  - [x] 8.2 Create updateDuration(minutes) public method
    - Accept minutes parameter
    - Return false if timer is currently running
    - Convert minutes to seconds and update totalSeconds
    - Update remainingSeconds to match new totalSeconds
    - Call updateDisplay() to show new time
    - Return true on success
    - _Requirements: 7.2, 7.3_
  
  - [x] 8.3 Create getDuration() public method
    - Return current totalSeconds converted to minutes
    - _Requirements: 7.4_
  
  - [x] 8.4 Modify reset() to use current totalSeconds
    - Update reset logic to use totalSeconds instead of hardcoded constant
    - Ensure reset uses configured duration
    - _Requirements: 7.1, 7.4_

- [ ] 9. Update application initialization order
  - [ ] 9.1 Modify DOMContentLoaded handler in app.js
    - Initialize StorageModule first (existing)
    - Initialize SettingsModule BEFORE other modules
    - Initialize GreetingModule, TimerModule, TaskModule, LinksModule (existing order)
    - Load persisted data for tasks and links (existing)
    - _Requirements: 1.5, 11.1, 11.4, 12.3, 12.4_
  
  - [ ] 9.2 Ensure settings container exists in initialization
    - Add error handling if settings container not found
    - Log warning but continue initialization for backward compatibility
    - _Requirements: 12.2, 12.4_

- [ ] 10. Checkpoint - Test basic customization functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add comprehensive error handling
  - [ ] 11.1 Add Local Storage error handling for settings
    - Handle QuotaExceededError when saving preferences
    - Handle JSON parse errors when loading preferences
    - Fall back to defaults on any storage errors
    - _Requirements: 8.5, 12.5_
  
  - [ ] 11.2 Add validation error handling in UI
    - Show inline error messages for invalid custom names
    - Prevent saving invalid preferences
    - Provide user feedback for validation failures
    - _Requirements: 5.2, 5.5_
  
  - [ ] 11.3 Add graceful degradation for missing modules
    - Check if GreetingModule exists before calling updateCustomName
    - Check if TimerModule exists before calling updateDuration
    - Log warnings but don't throw errors
    - _Requirements: 11.5, 12.4_

- [ ] 12. Ensure backward compatibility
  - [ ] 12.1 Test dashboard with no settings in Local Storage
    - Verify default theme (light) applies
    - Verify greeting displays without custom name
    - Verify timer uses default 25-minute duration
    - _Requirements: 2.5, 4.4, 6.5, 12.2_
  
  - [ ] 12.2 Test dashboard with existing tasks and links data
    - Verify tasks load and display correctly
    - Verify links load and display correctly
    - Verify settings don't interfere with existing data
    - _Requirements: 12.1, 12.3, 12.4_
  
  - [ ] 12.3 Test settings with partial preference data
    - Manually create Local Storage entry with only theme
    - Verify missing properties merge with defaults
    - Verify all features work with partial data
    - _Requirements: 8.4, 16.5_

- [ ] 13. Verify performance requirements
  - [ ] 13.1 Test theme switching performance
    - Measure time from button click to visual change
    - Verify theme applies within 100ms
    - Test on various devices and browsers
    - _Requirements: 1.3, 13.1_
  
  - [ ] 13.2 Test settings save performance
    - Measure time from input to storage save
    - Verify saves complete within 100ms
    - Ensure no blocking of other interactions
    - _Requirements: 13.2, 13.3, 13.5_
  
  - [ ] 13.3 Test initial load performance
    - Measure time to load and apply preferences
    - Verify preferences apply within 500ms
    - Test with and without existing preferences
    - _Requirements: 13.4_

- [ ] 14. Verify accessibility compliance
  - [ ] 14.1 Test keyboard navigation for all settings controls
    - Verify Tab navigation through all controls
    - Verify Enter/Space activate theme toggle
    - Verify Enter submits custom name form
    - Verify arrow keys navigate duration selector
    - _Requirements: 10.4, 15.1, 15.2, 15.3_
  
  - [ ] 14.2 Test screen reader announcements
    - Verify theme changes are announced
    - Verify settings saved message is announced
    - Verify all controls have proper labels
    - Test with NVDA or JAWS
    - _Requirements: 10.5, 15.4, 15.5_
  
  - [ ] 14.3 Verify focus indicators
    - Check visible focus outlines on all controls
    - Verify focus indicators work in both themes
    - Test with keyboard-only navigation
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 14.4 Test color contrast in both themes
    - Verify WCAG AA compliance for light mode
    - Verify WCAG AA compliance for dark mode
    - Check all text, buttons, and interactive elements
    - _Requirements: 2.3, 3.3, 14.3_


