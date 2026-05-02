# ProExam System - Online Examination Platform

A scalable, dependency-free online examination system built with pure HTML, CSS, and JavaScript. Features dynamic test loading via JSON files, persistent state management, timer functionality, and detailed review with explanations.

⚠️ **IMPORTANT: Must run via local server** - See [How to Run](#how-to-run) section below.

---

## Quick Start

1. **Use a local server** (required for JSON loading):
   ```bash
   npx serve .
   # or
   python -m http.server 3000
   ```
2. Open `http://localhost:3000` in your browser
3. Select a test and start examination!

---

## Features

- **Dynamic Test Loading**: Tests are loaded from JSON files - add/remove tests without code changes
- **Dashboard**: Browse all available tests with best score tracking
- **Test Interface**: MCQ exam with countdown timer and intuitive navigation
- **Question Palette**: Visual grid showing answered (green), visited (red), and unvisited (gray) questions
- **Persistent State**: Progress auto-saved to localStorage - resume anytime
- **Dark Mode**: Toggle between light and dark themes
- **Detailed Review**: Post-exam review with correct answers, explanations, and performance stats
- **Responsive Design**: Fully functional on desktop, tablet, and mobile devices

---

## Folder Structure

```
/project-root
├── index.html              # Main HTML structure with all screen templates
├── style.css               # Complete styling with light/dark themes
├── script.js               # Application logic and dynamic test loading
├── data/                   # Test data directory
│   ├── tests-list.json     # Registry of all available tests
│   ├── web-dev-basics.json # Test 1: Web Development Basics
│   ├── react-fundamentals.json # Test 2: React Fundamentals
│   └── css-mastery.json    # Test 3: CSS Mastery
└── README.md               # This file
```

---

## How It Works

### Application Flow

1. **Dashboard**: App loads `tests-list.json` and displays all available tests
2. **Test Selection**: Clicking a test loads its JSON file and shows instructions
3. **Start Exam**: Questions are shuffled, timer begins, exam starts
4. **During Exam**: Navigate via Prev/Next, jump via palette, answers auto-saved
5. **Submit**: Manual submit or auto-submit on timer expiry
6. **Results**: Score breakdown with circular progress visualization
7. **Review Mode**: Detailed analysis with correct/incorrect markings and explanations

### State Persistence

Exam progress is automatically saved to localStorage:
- Current question index and visited status
- Selected answers
- Time remaining
- Test history (scores, dates)
- Dark mode preference

**Resume capability**: Refresh during an exam - you'll return to the exact question with all answers preserved.

---

## How to Run

### Option 1: Direct File Open
Simply double-click `index.html` or open it in a browser.

### Option 2: HTTP Server (Recommended)
For best experience (especially for JSON loading):

```bash
# Using Node.js
npx serve .

# Using Python 3
python -m http.server 3000

# Using PHP
php -S localhost:3000
```

Then open `http://localhost:3000` in your browser.

---

## Code Structure

### HTML (`index.html`)
Contains static templates for all 4 screens:
- `dashboard-screen`: Test selection grid
- `start-screen`: Test details and start button
- `exam-screen`: Question area + palette sidebar
- `results-screen`: Score card + review interface

Screens are shown/hidden via CSS classes. Dynamic content is injected via JavaScript.

### CSS (`style.css`)
- **CSS Variables**: Light/dark theme colors defined as custom properties
- **Component Styles**: Buttons, cards, forms, palettes
- **Screen Layouts**: Flexbox/Grid for responsive design
- **Animations**: Fade-in transitions, pulse for urgent timer
- **Responsive**: Mobile-first breakpoints

### JavaScript (`script.js`)

#### Key Modules:

**Test Data Management**:
```javascript
loadTestsList()      // Fetch data/tests-list.json
loadTestById(id)     // Fetch individual test JSON
```

**State Management**:
```javascript
state = {
  status,              // 'dashboard' | 'start' | 'running' | 'results'
  selectedTestId,
  answers,             // { questionId: selectedOptionIndex }
  visited,             // { questionIndex: boolean }
  timeRemaining,
  shuffledQuestions,   // Randomized question order
  history              // Past exam results
}
```

**Rendering Functions**:
```javascript
renderDashboard()      // Display test cards
renderExamScreen()     // Show current question
renderResultsScreen()  // Display scores
renderReviewSection() // Show question review
```

---

## How to Add a New Test

### Step 1: Create Test JSON File

Create a new file in the `data/` folder (e.g., `data/javascript-advanced.json`):

```json
{
  "id": "javascript-advanced",
  "title": "JavaScript Advanced Concepts",
  "description": "Test your knowledge of closures, prototypes, async/await, and ES6+ features.",
  "time": 900,
  "questions": [
    {
      "id": 1,
      "question": "What is a closure in JavaScript?",
      "options": [
        "A function bundled with its lexical environment",
        "A way to close browser windows",
        "A method to end loops",
        "A type of CSS selector"
      ],
      "answer": 0,
      "explanation": "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
    },
    {
      "id": 2,
      "question": "What does the 'await' keyword do?",
      "options": [
        "Pauses function execution until Promise settles",
        "Makes code run faster",
        "Creates a new thread",
        "Stops the browser from loading"
      ],
      "answer": 0,
      "explanation": "The await keyword pauses the execution of an async function until a Promise is resolved or rejected."
    }
  ]
}
```

### JSON Format Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (no spaces) |
| `title` | string | Display name of the test |
| `description` | string | Short description shown on cards |
| `time` | number | Time limit in seconds |
| `questions` | array | Array of question objects |
| `questions[].id` | number | Unique question ID |
| `questions[].question` | string | Question text |
| `questions[].options` | string[] | Array of 4 answer choices |
| `questions[].answer` | number | Index (0-3) of correct answer |
| `questions[].explanation` | string | Explanation shown in review mode |

### Step 2: Register in tests-list.json

Add an entry to `data/tests-list.json`:

```json
[
  {
    "id": "web-dev-basics",
    "title": "Web Development Basics",
    "description": "Test your knowledge of core HTML, CSS, and JavaScript concepts.",
    "file": "data/web-dev-basics.json"
  },
  {
    "id": "javascript-advanced",
    "title": "JavaScript Advanced Concepts",
    "description": "Test your knowledge of closures, prototypes, async/await, and ES6+ features.",
    "file": "data/javascript-advanced.json"
  }
]
```

### Step 3: Done!

Refresh the browser - your new test will appear on the dashboard automatically.

---

## How to Remove a Test

1. Delete the test JSON file from `data/` folder
2. Remove the corresponding entry from `data/tests-list.json`

No code changes required.

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| iOS Safari | 14+ | ✅ Fully Supported |
| Chrome Mobile | 90+ | ✅ Fully Supported |

---

## Troubleshooting

### "Failed to load tests" Error
- Ensure `data/tests-list.json` exists
- If using direct file open (`file://` protocol), browser may block fetch requests
- **Solution**: Use a local HTTP server (see "How to Run" section)

### Tests Not Appearing
- Check browser console for JSON parsing errors
- Validate JSON syntax using [jsonlint.com](https://jsonlint.com)
- Ensure `id` fields are unique across all test files

### State Not Persisting
- localStorage may be disabled or full
- Check browser settings for cookie/storage blocking
- Incognito/private mode may prevent persistence

---

## License

This project is open source and available for educational and personal use.

---

## Technical Notes

- Uses `fetch()` API for JSON loading (requires modern browser)
- Icons provided by [Phosphor Icons](https://phosphoricons.com/) via CDN
- Fonts loaded from Google Fonts CDN
- Pure vanilla JavaScript - no frameworks or build step
