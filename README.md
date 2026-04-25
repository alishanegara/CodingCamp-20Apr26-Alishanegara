# Todo List Life Dashboard

A personal productivity dashboard that combines time awareness, focus management, task tracking, and quick website access in a single, minimal interface. Built with vanilla JavaScript, HTML5, and CSS3 with no external dependencies.

## Features

### 🕐 Time Awareness
- **Live Clock**: Real-time display in 12-hour format with AM/PM indicator
- **Current Date**: Day of week, month, and day display
- **Dynamic Greeting**: Contextual greetings that change based on time of day
  - Morning (5:00 AM - 11:59 AM)
  - Afternoon (12:00 PM - 4:59 PM)
  - Evening (5:00 PM - 8:59 PM)
  - Night (9:00 PM - 4:59 AM)

### ⏱️ Focus Timer
- **25-Minute Pomodoro Timer**: Countdown timer for focused work sessions
- **Full Controls**: Start, stop, and reset functionality
- **Visual Feedback**: Clear MM:SS display format
- **Completion Alert**: Visual indication when session completes

### ✅ Task Management
- **Add Tasks**: Create new to-do items with text descriptions
- **Edit Tasks**: Modify existing task text inline
- **Mark Complete**: Toggle completion status with visual strikethrough
- **Delete Tasks**: Remove tasks that are no longer needed
- **Persistent Storage**: Tasks automatically saved to browser Local Storage

### 🔗 Quick Links
- **Favorite Websites**: Add buttons for frequently visited sites
- **One-Click Access**: Open links in new tabs with a single click
- **Easy Management**: Add and remove links as needed
- **Persistent Storage**: Links automatically saved to browser Local Storage

## Installation

No installation or build process required! This is a static web application that runs entirely in your browser.

### Option 1: Download and Open Locally

1. Download or clone this repository:
   ```bash
   git clone https://github.com/yourusername/todo-list-life-dashboard.git
   cd todo-list-life-dashboard
   ```

2. Open `index.html` in your web browser:
   - Double-click the file, or
   - Right-click and select "Open with" your preferred browser

### Option 2: Use a Local Web Server

For a more production-like environment, serve the files with a local web server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy to Static Hosting

Deploy to any static hosting service:
- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the project folder
- **Vercel**: Import the repository
- **Cloudflare Pages**: Connect your Git repository

## Usage

### Getting Started

1. **Open the Dashboard**: Launch `index.html` in your browser
2. **Check the Time**: The current time, date, and greeting appear at the top
3. **Start a Focus Session**: Click "Start" on the timer to begin a 25-minute session
4. **Add Your First Task**: Type a task description and click "Add"
5. **Add Quick Links**: Enter a website name and URL, then click "Add Link"

### Managing Tasks

**Add a Task:**
1. Type your task description in the input field
2. Press Enter or click the "Add" button
3. The task appears in the list below

**Edit a Task:**
1. Click the "Edit" button next to any task
2. Modify the text in the input field
3. Click "Save" to confirm or "Cancel" to discard changes

**Complete a Task:**
1. Click the checkbox next to a task
2. The task text will show a strikethrough
3. Click again to mark as incomplete

**Delete a Task:**
1. Click the "Delete" button next to any task
2. The task is immediately removed

### Using the Focus Timer

**Start a Session:**
- Click the "Start" button to begin the 25-minute countdown
- The timer updates every second

**Pause a Session:**
- Click the "Stop" button to pause the countdown
- Your remaining time is preserved

**Reset the Timer:**
- Click the "Reset" button to restore the full 25 minutes
- Works whether the timer is running or stopped

**Session Complete:**
- When the timer reaches 00:00, a completion message appears
- The timer automatically stops

### Managing Quick Links

**Add a Link:**
1. Enter a display name (e.g., "GitHub")
2. Enter the URL (e.g., "github.com" or "https://github.com")
3. Click "Add Link"
4. The link appears as a clickable button

**Open a Link:**
- Click any link button to open the website in a new tab

**Delete a Link:**
- Click the "×" button next to any link to remove it

### Data Persistence

All your tasks and links are automatically saved to your browser's Local Storage:
- **Automatic Saving**: Changes save instantly without manual action
- **Persistent Across Sessions**: Data remains when you close and reopen the browser
- **Private and Local**: All data stays on your device, never sent to a server

**Note**: If you use private/incognito browsing mode, data will not persist after closing the browser.

## Browser Compatibility

The dashboard works in all modern browsers:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 90+            | ✅ Fully Supported |
| Firefox | 88+            | ✅ Fully Supported |
| Edge    | 90+            | ✅ Fully Supported |
| Safari  | 14+            | ✅ Fully Supported |

### Required Web APIs

The application uses standard Web APIs supported by all target browsers:
- Local Storage API (data persistence)
- Date API (time and date display)
- JSON API (data serialization)
- DOM API (user interface)
- Timer APIs (clock updates and countdown)
- URL API (link validation)

### Private Browsing Mode

The dashboard works in private/incognito mode with one limitation:
- ⚠️ **Data will not persist** after closing the browser
- A warning banner appears when Local Storage is unavailable
- All features remain functional during the session

## File Structure

```
todo-list-life-dashboard/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css         # All application styles
├── js/
│   └── app.js             # All application logic
├── test/                  # Test files
│   ├── setup.js           # Test configuration
│   ├── GreetingModule.test.js
│   ├── TimerModule.test.js
│   ├── TaskModule.test.js
│   ├── LinksModule.test.js
│   └── StorageModule.test.js
├── package.json           # Development dependencies
├── vitest.config.js       # Test runner configuration
└── README.md              # This file
```

### Architecture Overview

The application follows a modular component-based architecture:

**HTML Structure** (`index.html`):
- Semantic HTML5 markup
- Four main component sections: Greeting, Timer, Tasks, Links
- Minimal inline content (populated by JavaScript)

**Styles** (`css/styles.css`):
- Single stylesheet for all components
- CSS custom properties for theming
- Responsive design with mobile support
- Consistent visual hierarchy

**JavaScript** (`js/app.js`):
- Five independent modules:
  - **GreetingModule**: Time, date, and greeting display
  - **TimerModule**: 25-minute countdown timer
  - **TaskModule**: Task CRUD operations
  - **LinksModule**: Quick link management
  - **StorageModule**: Local Storage abstraction with error handling
- No external dependencies
- ES6+ modern JavaScript
- Event-driven architecture

## Development

### Running Tests

The project includes comprehensive tests using Vitest and fast-check:

```bash
# Install dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite includes:
- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: Universal properties across all inputs
- **Integration Tests**: Module interactions and storage operations

### Code Organization

Each module in `js/app.js` follows this pattern:
1. **State**: Private variables for component state
2. **Public Interface**: Exported methods for external use
3. **Private Methods**: Internal helper functions
4. **Initialization**: Setup and event listener attachment

## Technical Details

### Data Models

**Task Object:**
```javascript
{
  id: string,           // Unique identifier
  text: string,         // Task description (1-500 chars)
  completed: boolean,   // Completion status
  createdAt: number     // Unix timestamp
}
```

**Link Object:**
```javascript
{
  id: string,      // Unique identifier
  name: string,    // Display name (1-50 chars)
  url: string      // Full URL with protocol
}
```

### Local Storage Keys

- `dashboard_tasks`: JSON array of task objects
- `dashboard_links`: JSON array of link objects

### Performance Characteristics

- **Initial Load**: < 1 second on standard broadband
- **User Actions**: < 100ms response time
- **Timer Updates**: < 50ms per tick
- **Storage Operations**: < 50ms (non-blocking)

## Troubleshooting

### Data Not Persisting

**Problem**: Tasks or links disappear after closing the browser

**Solutions**:
- Check if you're using private/incognito mode (data won't persist)
- Verify Local Storage is enabled in browser settings
- Check browser storage quota (clear old data if full)
- Look for a warning banner indicating storage issues

### Timer Not Working

**Problem**: Timer doesn't count down or buttons don't respond

**Solutions**:
- Refresh the page to reset the timer state
- Check browser console for JavaScript errors
- Ensure you're using a supported browser version
- Try opening in a different browser

### Links Not Opening

**Problem**: Clicking link buttons doesn't open websites

**Solutions**:
- Check if pop-up blocker is preventing new tabs
- Verify the URL includes the protocol (http:// or https://)
- Try editing the link to add "https://" prefix
- Check browser console for errors

### Visual Issues

**Problem**: Layout looks broken or elements overlap

**Solutions**:
- Clear browser cache and reload
- Zoom to 100% (Ctrl+0 or Cmd+0)
- Try a different browser
- Check if browser extensions are interfering

## Contributing

This is a learning project, but contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure nothing breaks (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built as a personal productivity tool
- Inspired by the Pomodoro Technique for time management
- Designed with simplicity and usability in mind

---

**Made with ❤️ using vanilla JavaScript, HTML, and CSS**
