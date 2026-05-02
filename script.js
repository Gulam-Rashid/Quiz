/**
 * ProExam System - Vanilla JavaScript Implementation
 * Online Examination System with persistent state, timer, and review functionality
 * 
 * This version uses dynamic JSON loading for tests.
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  testsListFile: 'data/tests-list.json'
};

// ============================================
// State Management
// ============================================
const defaultState = {
  status: 'dashboard', // 'dashboard' | 'start' | 'running' | 'results'
  selectedTestId: null,
  selectedTestName: null,
  answers: {},
  visited: { 0: true },
  timeRemaining: 0,
  currentQuestionIndex: 0,
  reviewQuestionIndex: 0,
  shuffledQuestions: [],
  isDarkMode: false,
  history: []
};

let state = { ...defaultState };
let timerInterval = null;
let confirmAction = null; // 'submit' | 'restart' | 'dashboard' | null

// ============================================
// DOM Element Cache
// ============================================
const elements = {
  // Screens
  dashboardScreen: document.getElementById('dashboard-screen'),
  startScreen: document.getElementById('start-screen'),
  examScreen: document.getElementById('exam-screen'),
  resultsScreen: document.getElementById('results-screen'),
  
  // Header
  timerDisplay: document.getElementById('timer-display'),
  timerText: document.getElementById('timer-text'),
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  
  // Dashboard
  testGrid: document.getElementById('test-grid'),
  
  // Start Screen
  startTestName: document.getElementById('start-test-name'),
  startTestDesc: document.getElementById('start-test-desc'),
  startQuestionCount: document.getElementById('start-question-count'),
  startTimeLimit: document.getElementById('start-time-limit'),
  startExamBtn: document.getElementById('start-exam-btn'),
  backToDashboard: document.getElementById('back-to-dashboard'),
  
  // Exam Screen
  questionCounter: document.getElementById('question-counter'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  prevBtn: document.getElementById('prev-btn'),
  clearBtn: document.getElementById('clear-btn'),
  saveNextBtn: document.getElementById('save-next-btn'),
  submitExamBtn: document.getElementById('submit-exam-btn'),
  questionPalette: document.getElementById('question-palette'),
  sidebarSubmitBtn: document.getElementById('sidebar-submit-btn'),
  
  // Results Screen
  progressCircle: document.getElementById('progress-circle'),
  scorePercentage: document.getElementById('score-percentage'),
  statTotal: document.getElementById('stat-total'),
  statTime: document.getElementById('stat-time'),
  statCorrect: document.getElementById('stat-correct'),
  statIncorrect: document.getElementById('stat-incorrect'),
  retakeBtn: document.getElementById('retake-btn'),
  resultsDashboardBtn: document.getElementById('results-dashboard-btn'),
  
  // Review
  reviewStatus: document.getElementById('review-status'),
  reviewStatusIcon: document.getElementById('review-status-icon'),
  reviewStatusTitle: document.getElementById('review-status-title'),
  reviewStatusSubtitle: document.getElementById('review-status-subtitle'),
  reviewQuestion: document.getElementById('review-question'),
  reviewOptions: document.getElementById('review-options'),
  reviewExplanation: document.getElementById('review-explanation'),
  reviewPrevBtn: document.getElementById('review-prev-btn'),
  reviewNextBtn: document.getElementById('review-next-btn'),
  reviewPalette: document.getElementById('review-palette'),
  
  // Modal
  confirmModal: document.getElementById('confirm-modal'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmCancel: document.getElementById('confirm-cancel'),
  confirmActionBtn: document.getElementById('confirm-action')
};

// ============================================
// Utility Functions
// ============================================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ============================================
// Test Data Management (Dynamic Loading)
// ============================================
let testsList = []; // Cache for tests-list.json
let currentTestData = null; // Cache for currently loaded test

/**
 * Check if running via file:// protocol (local file access)
 */
function isLocalFileProtocol() {
  return window.location.protocol === 'file:';
}

/**
 * Get detailed error message based on error type
 */
function getErrorMessage(error, filePath) {
  if (isLocalFileProtocol()) {
    return `
      <div style="text-align: center; padding: 2rem; max-width: 500px; margin: 0 auto;">
        <h3 style="color: var(--color-danger); margin-bottom: 1rem;">⚠️ Server Required</h3>
        <p style="margin-bottom: 1rem;">This app cannot run directly from a file. Please use a local server:</p>
        <div style="background: var(--color-bg-secondary); padding: 1rem; border-radius: 8px; text-align: left; font-family: monospace; font-size: 0.9rem;">
          <p style="margin: 0.5rem 0;"><strong>Option 1 - VS Code Live Server:</strong><br>Click "Go Live" in VS Code status bar</p>
          <p style="margin: 0.5rem 0;"><strong>Option 2 - Node.js:</strong><br>npx serve .</p>
          <p style="margin: 0.5rem 0;"><strong>Option 3 - Python:</strong><br>python -m http.server 3000</p>
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-secondary);">
          Then open: <code>http://localhost:3000</code> or <code>http://127.0.0.1:3000</code>
        </p>
      </div>
    `;
  }
  
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return `
      <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p style="color: var(--color-danger);"><strong>Network Error:</strong> Cannot connect to server.</p>
        <p style="color: var(--color-text-secondary);">File: ${filePath}</p>
      </div>
    `;
  }
  
  if (error instanceof SyntaxError) {
    return `
      <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p style="color: var(--color-danger);"><strong>Invalid JSON Format:</strong> ${filePath}</p>
        <p style="color: var(--color-text-secondary);">Please validate your JSON syntax.</p>
      </div>
    `;
  }
  
  if (error.message.includes('HTTP error')) {
    return `
      <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p style="color: var(--color-danger);"><strong>File Not Found:</strong> ${filePath}</p>
        <p style="color: var(--color-text-secondary);">Status: ${error.message}</p>
      </div>
    `;
  }
  
  return `
    <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
      <p style="color: var(--color-danger);"><strong>Error loading:</strong> ${filePath}</p>
      <p style="color: var(--color-text-secondary);">${error.message}</p>
    </div>
  `;
}

/**
 * Load the tests list from tests-list.json
 */
async function loadTestsList() {
  console.log('[DEBUG] Loading tests list from:', CONFIG.testsListFile);
  
  if (isLocalFileProtocol()) {
    console.error('[ERROR] Running via file:// protocol - fetch() is blocked by browser security');
    elements.testGrid.innerHTML = getErrorMessage(new Error('Local file protocol'), CONFIG.testsListFile);
    return [];
  }
  
  try {
    const response = await fetch(CONFIG.testsListFile);
    console.log('[DEBUG] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    testsList = await response.json();
    console.log('[DEBUG] Loaded', testsList.length, 'tests:', testsList.map(t => t.name));
    return testsList;
  } catch (error) {
    console.error('[ERROR] Failed to load tests list:', error);
    elements.testGrid.innerHTML = getErrorMessage(error, CONFIG.testsListFile);
    return [];
  }
}

/**
 * Load a specific test by index (0-based)
 */
async function loadTestByIndex(testIndex) {
  console.log('[DEBUG] Loading test at index:', testIndex);
  
  if (testIndex < 0 || testIndex >= testsList.length) {
    console.error('[ERROR] Test index out of range:', testIndex);
    return null;
  }
  
  const testMeta = testsList[testIndex];
  console.log('[DEBUG] Test metadata:', testMeta);
  
  try {
    const response = await fetch(testMeta.file);
    console.log('[DEBUG] Test file response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const testData = await response.json();
    console.log('[DEBUG] Loaded test:', testData.title, '-', testData.questions.length, 'questions');
    currentTestData = testData;
    return testData;
  } catch (error) {
    console.error('[ERROR] Failed to load test file:', testMeta.file, error);
    return null;
  }
}

/**
 * Load a specific test by name (legacy support)
 */
async function loadTestById(testId) {
  // Try to find by name first (new format)
  const testIndex = testsList.findIndex(t => t.name === testId);
  if (testIndex !== -1) {
    return loadTestByIndex(testIndex);
  }
  
  // Fall back to index parsing
  const index = parseInt(testId, 10);
  if (!isNaN(index) && index >= 0 && index < testsList.length) {
    return loadTestByIndex(index);
  }
  
  console.error('[ERROR] Test not found:', testId);
  return null;
}

/**
 * Get currently loaded test data
 */
function getCurrentTest() {
  return currentTestData;
}

/**
 * Get test list entry by ID
 */
function getTestMeta(testId) {
  return testsList.find(t => t.id === testId);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function saveState() {
  localStorage.setItem('examState', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('examState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const loadedQuestions = parsed.shuffledQuestions || [];
        let currentQIdx = parsed.currentQuestionIndex || 0;
        let reviewQIdx = parsed.reviewQuestionIndex || 0;
        
        if (loadedQuestions.length > 0) {
          currentQIdx = Math.min(currentQIdx, loadedQuestions.length - 1);
          reviewQIdx = Math.min(reviewQIdx, loadedQuestions.length - 1);
        } else {
          currentQIdx = 0;
          reviewQIdx = 0;
        }
        
        return {
          ...defaultState,
          ...parsed,
          currentQuestionIndex: currentQIdx,
          reviewQuestionIndex: reviewQIdx,
          visited: parsed.visited || { 0: true }
        };
      }
    } catch (e) {
      console.error('Error parsing local storage', e);
    }
  }
  return { ...defaultState };
}

function calculateScore() {
  let correct = 0;
  state.shuffledQuestions.forEach(q => {
    if (state.answers[q.id] === q.answer) correct++;
  });
  return correct;
}

// ============================================
// Theme Management
// ============================================
function applyTheme() {
  if (state.isDarkMode) {
    document.documentElement.classList.add('dark');
    elements.themeIcon.className = 'ph ph-sun';
  } else {
    document.documentElement.classList.remove('dark');
    elements.themeIcon.className = 'ph ph-moon';
  }
}

function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;
  applyTheme();
  saveState();
}

// ============================================
// Timer Management
// ============================================
function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    if (state.timeRemaining <= 1) {
      clearInterval(timerInterval);
      state.timeRemaining = 0;
      submitExam();
    } else {
      state.timeRemaining--;
      updateTimerDisplay();
      saveState();
    }
  }, 1000);
  
  updateTimerDisplay();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  elements.timerText.textContent = formatTime(state.timeRemaining);
  
  if (state.timeRemaining < 60) {
    elements.timerDisplay.classList.add('urgent');
  } else {
    elements.timerDisplay.classList.remove('urgent');
  }
}

// ============================================
// Screen Navigation
// ============================================
function switchScreen(screenName) {
  // Hide all screens
  elements.dashboardScreen.classList.remove('active');
  elements.startScreen.classList.remove('active');
  elements.examScreen.classList.remove('active');
  elements.resultsScreen.classList.remove('active');
  
  // Show target screen
  switch (screenName) {
    case 'dashboard':
      elements.dashboardScreen.classList.add('active');
      elements.timerDisplay.classList.add('hidden');
      stopTimer();
      renderDashboard();
      break;
    case 'start':
      elements.startScreen.classList.add('active');
      elements.timerDisplay.classList.add('hidden');
      stopTimer();
      renderStartScreen();
      break;
    case 'running':
      elements.examScreen.classList.add('active');
      elements.timerDisplay.classList.remove('hidden');
      startTimer();
      renderExamScreen();
      break;
    case 'results':
      elements.resultsScreen.classList.add('active');
      elements.timerDisplay.classList.add('hidden');
      stopTimer();
      renderResultsScreen();
      break;
  }
}

// ============================================
// Dashboard Rendering
// ============================================
async function renderDashboard() {
  elements.testGrid.innerHTML = '';
  
  // Load tests list if not already loaded
  if (testsList.length === 0) {
    await loadTestsList();
  }
  
  // Check if tests loaded successfully
  if (testsList.length === 0) {
    return; // Error message already shown by loadTestsList
  }
  
  testsList.forEach((test, index) => {
    // Use index as testId for selection
    const testId = index.toString();
    const attempts = (state.history || []).filter(h => h.testId === testId || h.testName === test.name);
    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(h => Math.round((h.score / h.total) * 100)))
      : null;
    
    const card = document.createElement('div');
    card.className = 'test-card';
    card.innerHTML = `
      <div class="test-card-header">
        <h3 class="test-card-title">${test.name}</h3>
        ${bestScore !== null ? `<span class="best-score-badge">Best: ${bestScore}%</span>` : ''}
      </div>
      <p class="test-card-desc">Click to view test details and start examination.</p>
      <div class="test-card-footer">
        <div class="test-meta">
          <div class="test-meta-item">
            <i class="ph ph-clock"></i>
            <span>See details</span>
          </div>
          <div class="test-meta-item">
            <i class="ph ph-check-circle"></i>
            <span>MCQ</span>
          </div>
        </div>
        <button class="btn btn-primary" data-test-id="${testId}">
          Details <i class="ph ph-caret-right"></i>
        </button>
      </div>
    `;
    
    const btn = card.querySelector('button');
    btn.addEventListener('click', () => selectTest(testId, test.name));
    
    elements.testGrid.appendChild(card);
  });
}

async function selectTest(testId, testName = null) {
  state.selectedTestId = testId;
  state.selectedTestName = testName || testsList[parseInt(testId, 10)]?.name || 'Unknown Test';
  state.status = 'start';
  
  console.log('[DEBUG] Selecting test:', testId, '-', state.selectedTestName);
  
  // Load the test data
  await loadTestById(testId);
  const test = getCurrentTest();
  state.timeRemaining = test?.time || 0;
  
  saveState();
  switchScreen('start');
}

// ============================================
// Start Screen Rendering
// ============================================
function renderStartScreen() {
  const test = getCurrentTest();
  if (!test) return;
  
  elements.startTestName.textContent = test.title;
  elements.startTestDesc.textContent = test.description;
  elements.startQuestionCount.textContent = `${test.questions.length} Multiple Choice Questions`;
  elements.startTimeLimit.textContent = `${Math.round(test.time / 60)} Minutes Time Limit`;
}
function startExam() {
  const test = getCurrentTest();
  if (!test) return;
  
  // Shuffle questions
  state.shuffledQuestions = shuffleArray(test.questions);
  state.currentQuestionIndex = 0;
  state.reviewQuestionIndex = 0;
  state.answers = {};
  state.visited = { 0: true };
  state.timeRemaining = test.time;
  state.status = 'running';
  
  saveState();
  switchScreen('running');
}

// ============================================
// Exam Screen Rendering
// ============================================
function renderExamScreen() {
  if (state.shuffledQuestions.length === 0) return;
  
  const q = state.shuffledQuestions[state.currentQuestionIndex];
  const isAnswered = state.answers[q.id] !== undefined;
  
  // Update header
  elements.questionCounter.textContent = `Question ${state.currentQuestionIndex + 1} of ${state.shuffledQuestions.length}`;
  elements.questionText.textContent = q.question;
  
  // Render options
  elements.optionsContainer.innerHTML = '';
  q.options.forEach((option, idx) => {
    const isSelected = state.answers[q.id] === idx;
    
    const btn = document.createElement('button');
    btn.className = `option-btn ${isSelected ? 'selected' : ''}`;
    btn.innerHTML = `
      <div class="option-indicator">
        <div class="option-indicator-inner"></div>
      </div>
      <span class="option-text">${option}</span>
    `;
    btn.addEventListener('click', () => handleAnswer(q.id, idx));
    elements.optionsContainer.appendChild(btn);
  });
  
  // Update navigation buttons
  elements.prevBtn.disabled = state.currentQuestionIndex === 0;
  elements.clearBtn.disabled = !isAnswered;
  
  // Show/hide Save Next vs Submit
  if (state.currentQuestionIndex === state.shuffledQuestions.length - 1) {
    elements.saveNextBtn.classList.add('hidden');
    elements.submitExamBtn.classList.remove('hidden');
  } else {
    elements.saveNextBtn.classList.remove('hidden');
    elements.submitExamBtn.classList.add('hidden');
  }
  
  // Render palette
  renderPalette();
}

function handleAnswer(questionId, optionIndex) {
  state.answers[questionId] = optionIndex;
  saveState();
  renderExamScreen();
}

function clearResponse() {
  const q = state.shuffledQuestions[state.currentQuestionIndex];
  if (!q) return;
  
  delete state.answers[q.id];
  saveState();
  renderExamScreen();
}

function nextQuestion() {
  const nextIdx = Math.min(state.currentQuestionIndex + 1, state.shuffledQuestions.length - 1);
  state.currentQuestionIndex = nextIdx;
  state.visited[nextIdx] = true;
  saveState();
  renderExamScreen();
}

function prevQuestion() {
  const prevIdx = Math.max(state.currentQuestionIndex - 1, 0);
  state.currentQuestionIndex = prevIdx;
  state.visited[prevIdx] = true;
  saveState();
  renderExamScreen();
}

function jumpToQuestion(index) {
  if (state.status === 'results') {
    state.reviewQuestionIndex = index;
  } else {
    state.currentQuestionIndex = index;
    state.visited[index] = true;
  }
  saveState();
  
  if (state.status === 'results') {
    renderReviewSection();
  } else {
    renderExamScreen();
  }
}

function renderPalette() {
  elements.questionPalette.innerHTML = '';
  
  state.shuffledQuestions.forEach((q, idx) => {
    const isAnswered = state.answers[q.id] !== undefined;
    const isVisited = state.visited[idx];
    const isCurrent = state.currentQuestionIndex === idx;
    
    let className = 'palette-btn';
    if (isAnswered) {
      className += ' answered';
    } else if (isVisited) {
      className += ' not-answered';
    }
    if (isCurrent) {
      className += ' current';
    }
    
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = idx + 1;
    btn.addEventListener('click', () => jumpToQuestion(idx));
    elements.questionPalette.appendChild(btn);
  });
}

// ============================================
// Results Screen Rendering
// ============================================
function submitExam() {
  const correct = calculateScore();
  const test = getCurrentTest();
  
  const newHistoryItem = {
    testId: state.selectedTestId,
    testName: state.selectedTestName || test?.title || 'Unknown Test',
    score: correct,
    total: state.shuffledQuestions.length,
    date: new Date().toISOString()
  };
  
  state.status = 'results';
  state.reviewQuestionIndex = 0;
  state.history = [...(state.history || []), newHistoryItem];
  
  saveState();
  switchScreen('results');
}

function renderResultsScreen() {
  if (state.shuffledQuestions.length === 0) return;
  
  const correct = calculateScore();
  const total = state.shuffledQuestions.length;
  const percentage = Math.round((correct / total) * 100);
  const test = getCurrentTest();
  const timeTaken = (test?.time || 0) - state.timeRemaining;
  
  // Update score stats
  elements.scorePercentage.textContent = `${percentage}%`;
  elements.statTotal.textContent = total;
  elements.statTime.textContent = formatTime(timeTaken);
  elements.statCorrect.textContent = correct;
  elements.statIncorrect.textContent = total - correct;
  
  // Update circular progress
  const circumference = 339.292;
  const offset = circumference - (circumference * percentage) / 100;
  elements.progressCircle.style.strokeDashoffset = offset;
  
  // Render review section
  renderReviewSection();
  renderReviewPalette();
}

function renderReviewSection() {
  const q = state.shuffledQuestions[state.reviewQuestionIndex];
  const userAnswer = state.answers[q.id];
  const isCorrect = userAnswer === q.answer;
  const isSkipped = userAnswer === undefined;
  
  // Update status banner
  elements.reviewStatus.className = 'review-status';
  if (isCorrect) {
    elements.reviewStatus.classList.add('correct');
    elements.reviewStatusIcon.className = 'ph ph-check-circle';
    elements.reviewStatusTitle.textContent = 'Correct Answer!';
  } else if (isSkipped) {
    elements.reviewStatus.classList.add('skipped');
    elements.reviewStatusIcon.className = 'ph ph-warning-circle';
    elements.reviewStatusTitle.textContent = 'Not Answered';
  } else {
    elements.reviewStatus.classList.add('incorrect');
    elements.reviewStatusIcon.className = 'ph ph-x-circle';
    elements.reviewStatusTitle.textContent = 'Incorrect Answer';
  }
  elements.reviewStatusSubtitle.textContent = `Question ${state.reviewQuestionIndex + 1} of ${state.shuffledQuestions.length}`;
  
  // Update question
  elements.reviewQuestion.textContent = q.question;
  
  // Render options
  elements.reviewOptions.innerHTML = '';
  q.options.forEach((opt, optIdx) => {
    const isThisCorrect = optIdx === q.answer;
    const isThisUserSelected = optIdx === userAnswer;
    
    let className = 'review-option';
    if (isThisCorrect) {
      className += ' correct';
    } else if (isThisUserSelected && !isCorrect) {
      className += ' incorrect';
    } else {
      className += ' review-option-default';
    }
    
    const div = document.createElement('div');
    div.className = className;
    
    let iconClass = '';
    if (isThisCorrect) {
      iconClass = 'ph ph-check';
    } else if (isThisUserSelected && !isCorrect) {
      iconClass = 'ph ph-x';
    }
    
    div.innerHTML = `
      <div class="review-option-main">
        <div class="review-indicator">
          ${iconClass ? `<i class="${iconClass}"></i>` : ''}
        </div>
        <span class="review-option-text">${opt}</span>
      </div>
    `;
    elements.reviewOptions.appendChild(div);
  });
  
  // Update explanation
  elements.reviewExplanation.textContent = q.explanation;
  
  // Update navigation
  elements.reviewPrevBtn.disabled = state.reviewQuestionIndex === 0;
  elements.reviewNextBtn.disabled = state.reviewQuestionIndex === state.shuffledQuestions.length - 1;
}

function renderReviewPalette() {
  elements.reviewPalette.innerHTML = '';
  
  state.shuffledQuestions.forEach((q, idx) => {
    const isCorrect = state.answers[q.id] === q.answer;
    const isSkipped = state.answers[q.id] === undefined;
    const isCurrent = state.reviewQuestionIndex === idx;
    
    let className = 'palette-btn';
    if (isSkipped) {
      className += ' skipped';
    } else if (isCorrect) {
      className += ' correct';
    } else {
      className += ' incorrect';
    }
    if (isCurrent) {
      className += ' current';
    }
    
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = idx + 1;
    btn.addEventListener('click', () => jumpToQuestion(idx));
    elements.reviewPalette.appendChild(btn);
  });
}

function reviewPrev() {
  state.reviewQuestionIndex = Math.max(0, state.reviewQuestionIndex - 1);
  saveState();
  renderReviewSection();
  renderReviewPalette();
}

function reviewNext() {
  state.reviewQuestionIndex = Math.min(state.shuffledQuestions.length - 1, state.reviewQuestionIndex + 1);
  saveState();
  renderReviewSection();
  renderReviewPalette();
}

// ============================================
// Navigation Actions
// ============================================
function goToDashboard() {
  state.status = 'dashboard';
  state.selectedTestId = null;
  state.answers = {};
  state.visited = { 0: true };
  state.timeRemaining = 0;
  state.currentQuestionIndex = 0;
  state.reviewQuestionIndex = 0;
  state.shuffledQuestions = [];
  saveState();
  switchScreen('dashboard');
}

function requestRestart() {
  showConfirmModal('restart');
}

function executeRestart() {
  const test = getCurrentTest();
  state.status = 'start';
  state.answers = {};
  state.visited = { 0: true };
  state.timeRemaining = test?.time || 0;
  state.currentQuestionIndex = 0;
  state.reviewQuestionIndex = 0;
  state.shuffledQuestions = [];
  saveState();
  switchScreen('start');
}

function requestDashboard() {
  if (state.status === 'running') {
    showConfirmModal('dashboard');
  } else {
    goToDashboard();
  }
}

function requestSubmit() {
  showConfirmModal('submit');
}

// ============================================
// Modal Management
// ============================================
function showConfirmModal(action) {
  confirmAction = action;
  
  const titles = {
    submit: 'Submit Exam',
    restart: 'Restart Exam',
    dashboard: 'Return to Dashboard'
  };
  
  let message = '';
  if (action === 'submit') {
    const unanswered = state.shuffledQuestions.length - Object.keys(state.answers).length;
    if (unanswered > 0) {
      message = `You have unanswered questions (${unanswered} left). Are you sure you want to submit?`;
    } else {
      message = 'You have answered all questions. Are you ready to submit?';
    }
  } else if (action === 'restart') {
    message = 'Are you sure you want to discard your progress and restart?';
  } else if (action === 'dashboard') {
    message = 'Are you sure you want to exit? Your progress will be lost.';
  }
  
  const btnTexts = {
    submit: 'Submit',
    restart: 'Restart',
    dashboard: 'Exit Exam'
  };
  
  const btnClasses = {
    submit: 'btn btn-success',
    restart: 'btn btn-danger',
    dashboard: 'btn btn-danger'
  };
  
  elements.confirmTitle.textContent = titles[action];
  elements.confirmMessage.textContent = message;
  elements.confirmActionBtn.textContent = btnTexts[action];
  elements.confirmActionBtn.className = btnClasses[action];
  
  elements.confirmModal.classList.remove('hidden');
}

function hideConfirmModal() {
  confirmAction = null;
  elements.confirmModal.classList.add('hidden');
}

function executeConfirm() {
  if (confirmAction === 'submit') {
    hideConfirmModal();
    submitExam();
  } else if (confirmAction === 'restart') {
    hideConfirmModal();
    executeRestart();
  } else if (confirmAction === 'dashboard') {
    hideConfirmModal();
    goToDashboard();
  }
}

// ============================================
// Event Listeners
// ============================================
function initEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Start screen
  elements.startExamBtn.addEventListener('click', startExam);
  elements.backToDashboard.addEventListener('click', requestDashboard);
  
  // Exam screen
  elements.prevBtn.addEventListener('click', prevQuestion);
  elements.clearBtn.addEventListener('click', clearResponse);
  elements.saveNextBtn.addEventListener('click', nextQuestion);
  elements.submitExamBtn.addEventListener('click', requestSubmit);
  elements.sidebarSubmitBtn.addEventListener('click', requestSubmit);
  
  // Results screen
  elements.retakeBtn.addEventListener('click', requestRestart);
  elements.resultsDashboardBtn.addEventListener('click', requestDashboard);
  
  // Review navigation
  elements.reviewPrevBtn.addEventListener('click', reviewPrev);
  elements.reviewNextBtn.addEventListener('click', reviewNext);
  
  // Modal
  elements.confirmCancel.addEventListener('click', hideConfirmModal);
  elements.confirmActionBtn.addEventListener('click', executeConfirm);
  elements.confirmModal.addEventListener('click', (e) => {
    if (e.target === elements.confirmModal || e.target.classList.contains('modal-overlay')) {
      hideConfirmModal();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.confirmModal.classList.contains('hidden')) {
      hideConfirmModal();
    }
  });
}

// ============================================
// Initialization
// ============================================
async function init() {
  // Load state from localStorage
  state = loadState();
  
  // Apply theme
  applyTheme();
  
  // Initialize event listeners
  initEventListeners();
  
  // If resuming a test, load the test data first
  if (state.selectedTestId && (state.status === 'start' || state.status === 'running' || state.status === 'results')) {
    // Load tests list first
    await loadTestsList();
    // Then load the specific test
    await loadTestById(state.selectedTestId);
  }
  
  // Initial render
  if (state.status === 'running') {
    switchScreen('running');
  } else if (state.status === 'results') {
    switchScreen('results');
  } else if (state.status === 'start') {
    switchScreen('start');
  } else {
    switchScreen('dashboard');
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
