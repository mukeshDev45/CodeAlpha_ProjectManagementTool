// ProjectFlow Trello-Style Kanban Board Controller

let draggedTaskId = null;

async function openProjectBoard(projectId) {
  try {
    // Leave previous project socket room if any
    if (STATE.currentProject && STATE.currentProject._id !== projectId) {
      leaveProjectRoom(STATE.currentProject._id);
    }

    // Fetch project details
    const pRes = await API.get(`/projects/${projectId}`);
    STATE.currentProject = pRes.project;

    // Fetch project tasks
    const tRes = await API.get(`/projects/${projectId}/tasks`);
    STATE.setTasks(tRes.tasks || []);

    // Join Socket.IO real-time project room
    joinProjectRoom(projectId);

    // Update UI
    updateBoardHeaderUI(STATE.currentProject);
    populateBoardMemberFilter(STATE.currentProject);
    renderKanbanCards();

    // Navigate to board view
    navigateTo('board');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Failed to Open Board');
  }
}

function updateBoardHeaderUI(project) {
  if (!project) return;

  const titleEl = document.getElementById('boardProjectTitle');
  const catEl = document.getElementById('boardCategoryBadge');
  const statEl = document.getElementById('boardStatusBadge');
  const deadEl = document.getElementById('boardDeadlineBadge');
  const colorEl = document.getElementById('boardColorTag');
  const teamStack = document.getElementById('boardTeamStack');

  if (titleEl) titleEl.textContent = project.name;
  if (catEl) catEl.textContent = project.category || 'General';
  if (statEl) statEl.textContent = project.status || 'Active';
  if (colorEl) colorEl.style.backgroundColor = project.color || '#4f46e5';

  if (deadEl) {
    if (project.deadline) {
      const isOverdue = new Date(project.deadline) < new Date();
      deadEl.innerHTML = `📅 ${isOverdue ? '<span style="color:var(--danger)">Overdue</span>' : UI.formatDate(project.deadline)}`;
    } else {
      deadEl.textContent = '📅 No deadline';
    }
  }

  if (teamStack) {
    teamStack.innerHTML = (project.members || [])
      .map(
        (m) =>
          `<img class="avatar" src="${UI.getAvatar(m.user)}" title="${UI.escapeHTML(
            m.user ? m.user.name : 'Member'
          )} (${m.role})" alt="Member">`
      )
      .join('');
  }

  updateBoardAnalytics(STATE.currentTasks || [], project);
}

function populateBoardMemberFilter(project) {
  const memberSelect = document.getElementById('boardMemberFilter');
  if (!memberSelect) return;

  const members = (project && project.members) || [];
  let html = '<option value="all">All Assignees</option><option value="unassigned">👤 Unassigned</option>';

  members.forEach((m) => {
    if (m.user) {
      html += `<option value="${m.user._id}">${UI.escapeHTML(m.user.name)}</option>`;
    }
  });

  memberSelect.innerHTML = html;
}

function updateBoardAnalytics(tasks, project) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'To Do').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const review = tasks.filter((t) => t.status === 'Review').length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const overdue = tasks.filter((t) => {
    return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed';
  }).length;

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const elTotal = document.getElementById('bStatTotal');
  const elTodo = document.getElementById('bStatTodo');
  const elProg = document.getElementById('bStatInProgress');
  const elRev = document.getElementById('bStatReview');
  const elComp = document.getElementById('bStatCompleted');
  const elOver = document.getElementById('bStatOverdue');
  const elBar = document.getElementById('boardProgressFill');
  const elText = document.getElementById('boardProgressText');

  if (elTotal) elTotal.textContent = total;
  if (elTodo) elTodo.textContent = todo;
  if (elProg) elProg.textContent = inProgress;
  if (elRev) elRev.textContent = review;
  if (elComp) elComp.textContent = completed;
  if (elOver) elOver.textContent = overdue;
  if (elBar) elBar.style.width = `${progress}%`;
  if (elText) elText.textContent = `${progress}%`;
}

function renderKanbanCards() {
  const tasks = STATE.currentTasks || [];
  updateBoardAnalytics(tasks, STATE.currentProject);

  const columns = {
    'To Do': { el: document.getElementById('cards-todo'), countEl: document.getElementById('count-todo'), items: [] },
    'In Progress': { el: document.getElementById('cards-inprogress'), countEl: document.getElementById('count-inprogress'), items: [] },
    'Review': { el: document.getElementById('cards-review'), countEl: document.getElementById('count-review'), items: [] },
    'Completed': { el: document.getElementById('cards-completed'), countEl: document.getElementById('count-completed'), items: [] },
  };

  // Group tasks by status
  tasks.forEach((task) => {
    const col = columns[task.status] || columns['To Do'];
    col.items.push(task);
  });

  // Render each column
  Object.keys(columns).forEach((statusKey) => {
    const col = columns[statusKey];
    if (!col.el) return;

    if (col.countEl) {
      col.countEl.textContent = col.items.length;
    }

    if (col.items.length === 0) {
      col.el.innerHTML = `
        <div style="text-align: center; color: var(--text-light); font-size: 12px; padding: 24px 0;">
          No tasks in ${statusKey}
        </div>
      `;
      return;
    }

    col.el.innerHTML = col.items
      .map((task) => renderSingleTaskCard(task))
      .join('');
  });
}

function renderSingleTaskCard(task) {
  const priorityClass = task.priority ? task.priority.toLowerCase() : 'medium';
  const dueStatus = UI.getDueDateStatus(task.dueDate, task.status);
  const labelsHtml = (task.labels || [])
    .map(l => `<span class="badge-tag" style="background:${l.color || '#4f46e5'}20; color:${l.color || '#4f46e5'}; font-weight:600;">🏷️ ${UI.escapeHTML(l.name)}</span>`)
    .join('');
  const recurringHtml = task.recurring && task.recurring !== 'none'
    ? `<span class="badge-tag" style="background:#fef3c7; color:#92400e; font-weight:600;" title="Recurring: ${task.recurring}">🔁 ${task.recurring}</span>`
    : '';
  const attachmentsCount = (task.attachments || []).length;
  const attachmentsHtml = attachmentsCount > 0
    ? `<span style="font-size: 11px; color: var(--text-muted); font-weight: 600;" title="${attachmentsCount} attachments">📎 ${attachmentsCount}</span>`
    : '';

  return `
    <div class="task-card" id="task-card-${task._id}" draggable="true" ondragstart="handleDragStart(event, '${task._id}')" ondragend="handleDragEnd(event)" onclick="openTaskDetailsModalById('${task._id}')">
      <div class="task-card-tags">
        <span class="badge-priority ${priorityClass}">${task.priority}</span>
        ${recurringHtml}
        ${labelsHtml}
        ${(task.tags || []).slice(0, 2).map((tg) => `<span class="badge-tag">${UI.escapeHTML(tg)}</span>`).join('')}
      </div>

      <div class="task-card-title">${UI.escapeHTML(task.title)}</div>

      ${task.description ? `<div class="task-card-desc">${UI.escapeHTML(task.description)}</div>` : ''}

      <div class="task-card-footer">
        <div class="task-due-date">
          ${dueStatus.badge}
        </div>

        <div class="task-meta-right">
          ${attachmentsHtml}
          ${
            task.commentCount > 0
              ? `<span class="task-comments-count" title="${task.commentCount} comments">💬 ${task.commentCount}</span>`
              : ''
          }
          ${
            task.assignedTo
              ? `<img class="task-card-avatar" src="${UI.getAvatar(task.assignedTo)}" title="Assigned to ${UI.escapeHTML(task.assignedTo.name)}" alt="Assignee">`
              : `<span style="font-size: 11px; color: var(--text-light);" title="Unassigned">👤</span>`
          }
        </div>
      </div>

      <!-- Quick Move Selector for Mobile / Touch Accessibility -->
      <select class="task-move-select" onclick="event.stopPropagation()" onchange="quickMoveTaskStatus('${task._id}', this.value)">
        <option value="" disabled selected>Move column...</option>
        <option value="To Do" ${task.status === 'To Do' ? 'disabled' : ''}>To Do</option>
        <option value="In Progress" ${task.status === 'In Progress' ? 'disabled' : ''}>In Progress</option>
        <option value="Review" ${task.status === 'Review' ? 'disabled' : ''}>Review</option>
        <option value="Completed" ${task.status === 'Completed' ? 'disabled' : ''}>Completed</option>
      </select>
    </div>
  `;
}

// CSV Export Handler
async function handleExportProjectCSV() {
  if (!STATE.currentProject) {
    UI.showToast('Please select a project first', 'warning');
    return;
  }
  const projectId = STATE.currentProject._id;
  try {
    const token = API.getToken();
    const url = `${CONFIG.API_BASE_URL}/projects/${projectId}/export-csv`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`CSV Export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${(STATE.currentProject.name || 'project').toLowerCase().replace(/\s+/g, '_')}_tasks.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    UI.showToast('Project report downloaded successfully!', 'success', 'CSV Export');
  } catch (err) {
    console.error('CSV export error:', err);
    UI.showToast(err.message, 'error', 'Export Failed');
  }
}

// Drag & Drop Handlers
function handleDragStart(event, taskId) {
  draggedTaskId = taskId;
  event.dataTransfer.setData('text/plain', taskId);
  event.dataTransfer.effectAllowed = 'move';

  const card = document.getElementById(`task-card-${taskId}`);
  if (card) {
    setTimeout(() => card.classList.add('dragging'), 0);
  }
}

function handleDragEnd(event) {
  if (draggedTaskId) {
    const card = document.getElementById(`task-card-${draggedTaskId}`);
    if (card) card.classList.remove('dragging');
  }
  document.querySelectorAll('.kanban-column').forEach((col) => col.classList.remove('drag-over'));
  draggedTaskId = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const col = event.currentTarget;
  if (!col.classList.contains('drag-over')) {
    col.classList.add('drag-over');
  }
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

async function handleDrop(event) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('drag-over');

  const newStatus = col.getAttribute('data-column-status');
  const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;

  if (!taskId || !newStatus) return;

  const task = STATE.currentTasks.find((t) => t._id === taskId);
  if (!task || task.status === newStatus) return;

  // Optimistic UI update
  task.status = newStatus;
  renderKanbanCards();

  try {
    const res = await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
    STATE.updateTaskInState(res.task);
    renderKanbanCards();
    UI.showToast(`Task moved to ${newStatus}`, 'info');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Could not move task');
    // Re-fetch tasks if failed
    if (STATE.currentProject) {
      const tRes = await API.get(`/projects/${STATE.currentProject._id}/tasks`);
      STATE.setTasks(tRes.tasks || []);
      renderKanbanCards();
    }
  }
}

async function quickMoveTaskStatus(taskId, newStatus) {
  if (!taskId || !newStatus) return;
  try {
    const res = await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
    STATE.updateTaskInState(res.task);
    renderKanbanCards();
    UI.showToast(`Task moved to ${newStatus}`, 'info');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

function filterBoardCards() {
  const search = (document.getElementById('boardSearchInput')?.value || '').toLowerCase().trim();
  const priority = document.getElementById('boardPriorityFilter')?.value || 'all';
  const member = document.getElementById('boardMemberFilter')?.value || 'all';
  const status = document.getElementById('boardStatusFilter')?.value || 'all';

  const originalTasks = STATE.currentTasks || [];

  const filtered = originalTasks.filter((t) => {
    // 1. Text search across title, description, and tags
    const matchSearch =
      !search ||
      (t.title && t.title.toLowerCase().includes(search)) ||
      (t.description && t.description.toLowerCase().includes(search)) ||
      (t.tags && t.tags.some((tg) => tg.toLowerCase().includes(search)));

    // 2. Priority filter
    const matchPriority = priority === 'all' || t.priority === priority;

    // 3. Member filter
    let matchMember = true;
    if (member === 'unassigned') {
      matchMember = !t.assignedTo;
    } else if (member !== 'all') {
      const aId = t.assignedTo ? (t.assignedTo._id || t.assignedTo) : null;
      matchMember = aId && aId.toString() === member.toString();
    }

    // 4. Status filter
    const matchStatus = status === 'all' || t.status === status;

    return matchSearch && matchPriority && matchMember && matchStatus;
  });

  const columns = {
    'To Do': { el: document.getElementById('cards-todo'), countEl: document.getElementById('count-todo'), items: [] },
    'In Progress': { el: document.getElementById('cards-inprogress'), countEl: document.getElementById('count-inprogress'), items: [] },
    'Review': { el: document.getElementById('cards-review'), countEl: document.getElementById('count-review'), items: [] },
    'Completed': { el: document.getElementById('cards-completed'), countEl: document.getElementById('count-completed'), items: [] },
  };

  filtered.forEach((task) => {
    const col = columns[task.status] || columns['To Do'];
    col.items.push(task);
  });

  Object.keys(columns).forEach((statusKey) => {
    const col = columns[statusKey];
    if (!col.el) return;

    if (col.countEl) {
      col.countEl.textContent = col.items.length;
    }

    if (col.items.length === 0) {
      col.el.innerHTML = `
        <div style="text-align: center; color: var(--text-light); font-size: 12px; padding: 24px 8px;">
          No tasks match filters in ${statusKey}
        </div>
      `;
    } else {
      col.el.innerHTML = col.items.map((t) => renderSingleTaskCard(t)).join('');
    }
  });

  // Update analytics with filtered or total
  updateBoardAnalytics(filtered, STATE.currentProject);
}

function resetBoardFilters() {
  const searchInput = document.getElementById('boardSearchInput');
  const priorityFilter = document.getElementById('boardPriorityFilter');
  const memberFilter = document.getElementById('boardMemberFilter');
  const statusFilter = document.getElementById('boardStatusFilter');

  if (searchInput) searchInput.value = '';
  if (priorityFilter) priorityFilter.value = 'all';
  if (memberFilter) memberFilter.value = 'all';
  if (statusFilter) statusFilter.value = 'all';

  renderKanbanCards();
}

window.openProjectBoard = openProjectBoard;
window.updateBoardHeaderUI = updateBoardHeaderUI;
window.populateBoardMemberFilter = populateBoardMemberFilter;
window.updateBoardAnalytics = updateBoardAnalytics;
window.renderKanbanCards = renderKanbanCards;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.quickMoveTaskStatus = quickMoveTaskStatus;
window.filterBoardCards = filterBoardCards;
window.resetBoardFilters = resetBoardFilters;
