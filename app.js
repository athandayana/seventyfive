/* ==========================================================================
   HYPER-MINIMALIST ALL-LOWERCASE SERIF APP ENGINE
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = '75_hard_tracker_v6_dates';
  const WATER_GOAL = 2.0;
  const WEEKLY_WORKOUT_GOAL = 12;

  const defaultDayObject = () => ({
    waterLiters: 0,
    workout1: false,
    workout2: false,
    task1Text: '',
    task1Done: false,
    task2Text: '',
    task2Done: false,
    task3Text: '',
    task3Done: false,
    read10Pages: false,
    isCompleted: false
  });

  let state = {
    currentDay: 1,
    startDate: Date.now(),
    book: {
      title: '',
      currentPage: 0,
      totalPages: 0
    },
    days: {}
  };

  function initDaysState() {
    if (!state.startDate) {
      state.startDate = Date.now();
    }
    for (let i = 1; i <= 75; i++) {
      if (!state.days[i]) {
        state.days[i] = defaultDayObject();
      }
    }
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.warn('failed to load state', e);
    }
    initDaysState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('failed to save state', e);
    }
  }

  const DOM = {
    currentDayLabel: document.getElementById('currentDayLabel'),
    currentDateLabel: document.getElementById('currentDateLabel'),
    btnPrevDay: document.getElementById('btnPrevDay'),
    btnNextDay: document.getElementById('btnNextDay'),
    btnMarkDayComplete: document.getElementById('btnMarkDayComplete'),
    btnResetChallenge: document.getElementById('btnResetChallenge'),

    statStreak: document.getElementById('statStreak'),
    statOverallProgress: document.getElementById('statOverallProgress'),
    statWeeklyWorkouts: document.getElementById('statWeeklyWorkouts'),
    statWaterDrank: document.getElementById('statWaterDrank'),

    waterLitersText: document.getElementById('waterLitersText'),
    waterGoalText: document.getElementById('waterGoalText'),
    btnResetWater: document.getElementById('btnResetWater'),
    waterAddBtns: document.querySelectorAll('.btn-add-water'),

    chkWorkout1: document.getElementById('chkWorkout1'),
    chkWorkout2: document.getElementById('chkWorkout2'),
    weeklyDaysGrid: document.getElementById('weeklyDaysGrid'),

    taskRow1: document.getElementById('taskRow1'),
    taskRow2: document.getElementById('taskRow2'),
    taskRow3: document.getElementById('taskRow3'),
    taskInput1: document.getElementById('taskInput1'),
    taskInput2: document.getElementById('taskInput2'),
    taskInput3: document.getElementById('taskInput3'),
    taskChk1: document.getElementById('taskChk1'),
    taskChk2: document.getElementById('taskChk2'),
    taskChk3: document.getElementById('taskChk3'),

    bookTitleInput: document.getElementById('bookTitleInput'),
    bookCurrentPageInput: document.getElementById('bookCurrentPageInput'),
    bookTotalPagesInput: document.getElementById('bookTotalPagesInput'),
    readingProgressText: document.getElementById('readingProgressText'),
    chkRead10Pages: document.getElementById('chkRead10Pages'),

    matrix75Grid: document.getElementById('matrix75Grid'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Calculate formatted date corresponding to active day (Day 1 = start date, Day X = start date + X-1 days)
  function getDateForDay(dayNum) {
    const start = new Date(state.startDate || Date.now());
    const targetDate = new Date(start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return targetDate.toLocaleDateString('en-US', options).toLowerCase();
  }

  function getActiveDayData() {
    if (!state.days[state.currentDay]) {
      state.days[state.currentDay] = defaultDayObject();
    }
    return state.days[state.currentDay];
  }

  function calculateStreak() {
    let streak = 0;
    for (let i = 1; i <= 75; i++) {
      if (state.days[i] && state.days[i].isCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function calculateOverallProgress() {
    let completedCount = 0;
    for (let i = 1; i <= 75; i++) {
      if (state.days[i] && state.days[i].isCompleted) {
        completedCount++;
      }
    }
    return Math.round((completedCount / 75) * 100);
  }

  function getWeekDayRange(dayNum) {
    const weekIndex = Math.floor((dayNum - 1) / 7);
    const startDay = weekIndex * 7 + 1;
    const endDay = Math.min(startDay + 6, 75);
    return { startDay, endDay };
  }

  function calculateWeeklyWorkoutsSoFar() {
    const { startDay, endDay } = getWeekDayRange(state.currentDay);
    let totalWorkouts = 0;
    for (let i = startDay; i <= endDay; i++) {
      const d = state.days[i];
      if (d) {
        if (d.workout1) totalWorkouts++;
        if (d.workout2) totalWorkouts++;
      }
    }
    return totalWorkouts;
  }

  function renderUI() {
    const activeData = getActiveDayData();

    DOM.currentDayLabel.textContent = `day ${state.currentDay} / 75`;
    if (DOM.currentDateLabel) {
      DOM.currentDateLabel.textContent = getDateForDay(state.currentDay);
    }

    DOM.btnPrevDay.disabled = state.currentDay <= 1;
    DOM.btnNextDay.disabled = state.currentDay >= 75;

    if (activeData.isCompleted) {
      DOM.btnMarkDayComplete.textContent = 'day completed ✓';
    } else {
      DOM.btnMarkDayComplete.textContent = 'complete day';
    }

    const streak = calculateStreak();
    DOM.statStreak.textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;

    const overallPct = calculateOverallProgress();
    DOM.statOverallProgress.textContent = `${overallPct}%`;

    const weeklyWorkoutsSoFar = calculateWeeklyWorkoutsSoFar();
    DOM.statWeeklyWorkouts.textContent = `${weeklyWorkoutsSoFar} / ${WEEKLY_WORKOUT_GOAL}`;
    DOM.statWaterDrank.textContent = `${activeData.waterLiters.toFixed(2)} l`;

    DOM.waterLitersText.textContent = `${activeData.waterLiters.toFixed(2)} l`;
    DOM.waterGoalText.textContent = `/ ${WATER_GOAL.toFixed(1)} l`;

    toggleCheckboxUI(DOM.chkWorkout1, activeData.workout1);
    toggleCheckboxUI(DOM.chkWorkout2, activeData.workout2);
    renderWeeklyDaysGrid();

    DOM.taskInput1.value = activeData.task1Text || '';
    DOM.taskInput2.value = activeData.task2Text || '';
    DOM.taskInput3.value = activeData.task3Text || '';

    toggleTaskRowUI(DOM.taskRow1, DOM.taskChk1, activeData.task1Done);
    toggleTaskRowUI(DOM.taskRow2, DOM.taskChk2, activeData.task2Done);
    toggleTaskRowUI(DOM.taskRow3, DOM.taskChk3, activeData.task3Done);

    DOM.bookTitleInput.value = state.book.title || '';
    DOM.bookCurrentPageInput.value = state.book.currentPage || '';
    DOM.bookTotalPagesInput.value = state.book.totalPages || '';

    const curPage = parseInt(state.book.currentPage, 10) || 0;
    const totPage = parseInt(state.book.totalPages, 10) || 0;

    DOM.readingProgressText.textContent = `page ${curPage} of ${totPage}`;
    toggleCheckboxUI(DOM.chkRead10Pages, activeData.read10Pages);

    renderMasterMatrix();
  }

  function toggleCheckboxUI(element, isChecked) {
    if (isChecked) {
      element.classList.add('checked');
    } else {
      element.classList.remove('checked');
    }
  }

  function toggleTaskRowUI(rowElement, checkElement, isCompleted) {
    if (isCompleted) {
      rowElement.classList.add('completed');
      checkElement.classList.add('checked');
    } else {
      rowElement.classList.remove('completed');
      checkElement.classList.remove('checked');
    }
  }

  function renderWeeklyDaysGrid() {
    const { startDay } = getWeekDayRange(state.currentDay);
    DOM.weeklyDaysGrid.innerHTML = '';

    for (let offset = 0; offset < 7; offset++) {
      const dayNum = startDay + offset;
      if (dayNum > 75) break;

      const dayData = state.days[dayNum] || defaultDayObject();
      const workoutsDone = (dayData.workout1 ? 1 : 0) + (dayData.workout2 ? 1 : 0);

      const pill = document.createElement('div');
      pill.className = `day-pill-simple ${workoutsDone > 0 ? 'done' : ''}`;
      pill.textContent = `d${dayNum}`;

      pill.addEventListener('click', () => {
        state.currentDay = dayNum;
        saveState();
        renderUI();
      });

      DOM.weeklyDaysGrid.appendChild(pill);
    }
  }

  function renderMasterMatrix() {
    DOM.matrix75Grid.innerHTML = '';
    for (let i = 1; i <= 75; i++) {
      const d = state.days[i] || defaultDayObject();
      const item = document.createElement('div');

      const isCompleted = d.isCompleted ? 'completed' : '';
      const isActive = i === state.currentDay ? 'active' : '';

      item.className = `matrix-item ${isCompleted} ${isActive}`;
      item.textContent = i;

      item.addEventListener('click', () => {
        state.currentDay = i;
        saveState();
        renderUI();
      });

      DOM.matrix75Grid.appendChild(item);
    }
  }

  function setupEventListeners() {
    DOM.btnPrevDay.addEventListener('click', () => {
      if (state.currentDay > 1) {
        state.currentDay--;
        saveState();
        renderUI();
      }
    });

    DOM.btnNextDay.addEventListener('click', () => {
      if (state.currentDay < 75) {
        state.currentDay++;
        saveState();
        renderUI();
      }
    });

    DOM.btnMarkDayComplete.addEventListener('click', () => {
      const activeData = getActiveDayData();
      activeData.isCompleted = !activeData.isCompleted;

      if (activeData.isCompleted) {
        if (!activeData.workout1) activeData.workout1 = true;
        if (!activeData.workout2) activeData.workout2 = true;
        if (!activeData.read10Pages) activeData.read10Pages = true;
        if (activeData.waterLiters < WATER_GOAL) activeData.waterLiters = WATER_GOAL;
        showToast(`day ${state.currentDay} marked complete`);
      }

      saveState();
      renderUI();
    });

    if (DOM.btnResetChallenge) {
      DOM.btnResetChallenge.addEventListener('click', () => {
        if (confirm('are you sure you want to reset back to day 1? all progress will be cleared.')) {
          state.currentDay = 1;
          state.startDate = Date.now();
          state.days = {};
          state.book = { title: '', currentPage: 0, totalPages: 0 };
          initDaysState();
          saveState();
          renderUI();
          showToast('reset back to day 1');
        }
      });
    }

    DOM.waterAddBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const amount = parseFloat(btn.getAttribute('data-amount'));
        const activeData = getActiveDayData();
        activeData.waterLiters = Math.round((activeData.waterLiters + amount) * 100) / 100;
        saveState();
        renderUI();
      });
    });

    DOM.btnResetWater.addEventListener('click', () => {
      const activeData = getActiveDayData();
      activeData.waterLiters = 0;
      saveState();
      renderUI();
    });

    DOM.chkWorkout1.addEventListener('click', () => {
      const activeData = getActiveDayData();
      activeData.workout1 = !activeData.workout1;
      saveState();
      renderUI();
    });

    DOM.chkWorkout2.addEventListener('click', () => {
      const activeData = getActiveDayData();
      activeData.workout2 = !activeData.workout2;
      saveState();
      renderUI();
    });

    const bindTaskEvents = (inputEl, chkEl, textProp, doneProp) => {
      inputEl.addEventListener('input', () => {
        const activeData = getActiveDayData();
        activeData[textProp] = inputEl.value;
        saveState();
      });

      chkEl.addEventListener('click', () => {
        const activeData = getActiveDayData();
        activeData[doneProp] = !activeData[doneProp];
        saveState();
        renderUI();
      });
    };

    bindTaskEvents(DOM.taskInput1, DOM.taskChk1, 'task1Text', 'task1Done');
    bindTaskEvents(DOM.taskInput2, DOM.taskChk2, 'task2Text', 'task2Done');
    bindTaskEvents(DOM.taskInput3, DOM.taskChk3, 'task3Text', 'task3Done');

    DOM.bookTitleInput.addEventListener('input', () => {
      state.book.title = DOM.bookTitleInput.value;
      saveState();
    });

    DOM.bookCurrentPageInput.addEventListener('input', () => {
      state.book.currentPage = parseInt(DOM.bookCurrentPageInput.value, 10) || 0;
      saveState();
      renderUI();
    });

    DOM.bookTotalPagesInput.addEventListener('input', () => {
      state.book.totalPages = parseInt(DOM.bookTotalPagesInput.value, 10) || 0;
      saveState();
      renderUI();
    });

    DOM.chkRead10Pages.addEventListener('click', () => {
      const activeData = getActiveDayData();
      activeData.read10Pages = !activeData.read10Pages;
      saveState();
      renderUI();
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function init() {
    loadState();
    setupEventListeners();
    renderUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
