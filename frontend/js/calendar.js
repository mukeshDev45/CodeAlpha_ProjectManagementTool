// ProjectFlow Calendar View Controller

const CALENDAR_STATE = {
  currentDate: new Date(),
  tasks: [],
  selectedProjectId: 'all',
};

async function loadCalendarView() {
  populateCalendarProjectDropdown();
  await fetchCalendarTasks();
  renderCalendarView();
}

function populateCalendarProjectDropdown() {
  const select = document.getElementById('calendarProjectFilter');
  if (!select) return;

  const projects = STATE.projects || [];
  let html = '<option value="all">All Projects</option>';
  projects.forEach((p) => {
    html += `<option value="${p._id}" ${CALENDAR_STATE.selectedProjectId === p._id ? 'selected' : ''}>${UI.escapeHTML(p.name)}</option>`;
  });
  select.innerHTML = html;
}

async function fetchCalendarTasks() {
  try {
    const res = await API.get('/tasks/my-tasks');
    CALENDAR_STATE.tasks = res.tasks || [];
  } catch (error) {
    console.error('Failed to load tasks for calendar:', error);
    CALENDAR_STATE.tasks = [];
  }
}

function calendarNavigate(direction) {
  CALENDAR_STATE.currentDate.setMonth(CALENDAR_STATE.currentDate.getMonth() + direction);
  renderCalendarView();
}

function calendarToday() {
  CALENDAR_STATE.currentDate = new Date();
  renderCalendarView();
}

function renderCalendarView() {
  const gridEl = document.getElementById('calendarDaysGrid');
  const titleEl = document.getElementById('calendarMonthTitle');
  const filterSelect = document.getElementById('calendarProjectFilter');

  if (filterSelect) {
    CALENDAR_STATE.selectedProjectId = filterSelect.value;
  }

  if (!gridEl) return;

  const year = CALENDAR_STATE.currentDate.getFullYear();
  const month = CALENDAR_STATE.currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (titleEl) {
    titleEl.textContent = `${monthNames[month]} ${year}`;
  }

  // First day of month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Filter tasks for calendar
  const filteredTasks = (CALENDAR_STATE.tasks || []).filter((task) => {
    if (!task.dueDate) return false;
    if (CALENDAR_STATE.selectedProjectId !== 'all') {
      const pId = task.project ? (task.project._id || task.project) : null;
      if (pId !== CALENDAR_STATE.selectedProjectId) return false;
    }
    return true;
  });

  // Group tasks by date string YYYY-MM-DD
  const tasksByDate = {};
  filteredTasks.forEach((task) => {
    const dStr = new Date(task.dueDate).toISOString().split('T')[0];
    if (!tasksByDate[dStr]) tasksByDate[dStr] = [];
    tasksByDate[dStr].push(task);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  let cellsHTML = '';

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    cellsHTML += `
      <div class="calendar-day-cell other-month">
        <span class="day-num">${dayNum}</span>
      </div>
    `;
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dayStr === todayStr;
    const dayTasks = tasksByDate[dayStr] || [];

    cellsHTML += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''}">
        <span class="day-num">${day}</span>
        <div class="calendar-tasks-chips">
          ${dayTasks
            .slice(0, 3)
            .map((t) => {
              const priorityClass = (t.priority || 'medium').toLowerCase();
              return `
                <div class="calendar-task-chip ${priorityClass} ${t.status === 'Completed' ? 'completed' : ''}" onclick="openTaskDetailsModalById('${t._id}')" title="${UI.escapeHTML(t.title)} (${t.status})">
                  ${UI.escapeHTML(t.title)}
                </div>
              `;
            })
            .join('')}
          ${
            dayTasks.length > 3
              ? `<div style="font-size: 10px; color: var(--text-muted); font-weight: 600; padding: 2px 4px;">+${dayTasks.length - 3} more</div>`
              : ''
          }
        </div>
      </div>
    `;
  }

  // Next month leading days to fill complete rows (multiple of 7)
  const totalRendered = firstDayIndex + totalDays;
  const remainingCells = (7 - (totalRendered % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    cellsHTML += `
      <div class="calendar-day-cell other-month">
        <span class="day-num">${i}</span>
      </div>
    `;
  }

  gridEl.innerHTML = cellsHTML;
}
