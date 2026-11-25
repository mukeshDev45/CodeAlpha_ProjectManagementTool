// ProjectFlow Task Management & Details Controller

function updateCreateTaskProjectOptions() {
  const select = document.getElementById('ctProjectId');
  if (!select) return;

  select.innerHTML = STATE.projects
    .map((p) => `<option value="${p._id}">${UI.escapeHTML(p.name)}</option>`)
    .join('');

  if (STATE.currentProject) {
    select.value = STATE.currentProject._id;
    populateTaskAssigneeOptions(STATE.currentProject._id);
  } else if (STATE.projects.length > 0) {
    populateTaskAssigneeOptions(STATE.projects[0]._id);
  }
}

function populateTaskAssigneeOptions(projectId) {
  const select = document.getElementById('ctAssignedTo');
  if (!select) return;

  const project = STATE.projects.find((p) => p._id === projectId) || STATE.currentProject;
  if (!project) {
    select.innerHTML = '<option value="">Unassigned</option>';
    return;
  }

  select.innerHTML = '<option value="">Unassigned</option>' +
    (project.members || [])
      .map((m) => {
        const u = m.user;
        if (!u) return '';
        return `<option value="${u._id}">${UI.escapeHTML(u.name)}</option>`;
      })
      .join('');
}

function openCreateTaskModal(defaultStatus = 'To Do') {
  if (!STATE.currentProject && STATE.projects.length === 0) {
    UI.showToast('Please create a project first before adding tasks', 'warning');
    openCreateProjectModal();
    return;
  }

  document.getElementById('createTaskForm').reset();
  updateCreateTaskProjectOptions();

  if (STATE.currentProject) {
    document.getElementById('ctProjectId').value = STATE.currentProject._id;
    populateTaskAssigneeOptions(STATE.currentProject._id);
  }

  const statSelect = document.getElementById('ctStatus');
  if (statSelect) statSelect.value = defaultStatus;

  UI.openModal('modalCreateTask');
}

function openQuickCreateTaskModal() {
  openCreateTaskModal('To Do');
}

async function handleCreateTaskSubmit(event) {
  event.preventDefault();
  const projectId = document.getElementById('ctProjectId').value;
  const title = document.getElementById('ctTitle').value.trim();
  const description = document.getElementById('ctDescription').value.trim();
  const status = document.getElementById('ctStatus').value;
  const priority = document.getElementById('ctPriority').value;
  const assignedTo = document.getElementById('ctAssignedTo').value || null;
  const dueDate = document.getElementById('ctDueDate').value || null;
  const recurring = (document.getElementById('ctRecurring') && document.getElementById('ctRecurring').value) || 'none';
  const rawTags = document.getElementById('ctTags').value;
  const rawLabels = (document.getElementById('ctLabels') && document.getElementById('ctLabels').value) || '';

  const tags = rawTags
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const labels = rawLabels
    ? rawLabels.split(',').map((l) => l.trim()).filter(Boolean).map((name) => ({
        name,
        color: '#4f46e5',
      }))
    : [];

  try {
    const res = await API.post(`/projects/${projectId}/tasks`, {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      recurring,
      labels,
      tags,
    });

    UI.closeModal('modalCreateTask');
    UI.showToast(`Task "${title}" created successfully!`, 'success');

    // If currently on this project's board, update cards
    if (STATE.currentProject && STATE.currentProject._id === projectId) {
      STATE.updateTaskInState(res.task);
      renderKanbanCards();
    } else {
      // Switch to this project's board
      openProjectBoard(projectId);
    }
  } catch (error) {
    UI.showToast(error.message, 'error', 'Task Creation Failed');
  }
}

async function openTaskDetailsModalById(taskId) {
  try {
    const res = await API.get(`/tasks/${taskId}`);
    const task = res.task;
    STATE.activeTask = task;

    populateTaskDetailsModal(task);
    UI.openModal('modalTaskDetails');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Failed to Load Task');
  }
}

function populateTaskDetailsModal(task) {
  if (!task) return;

  const titleEl = document.getElementById('tdTitle');
  const descEl = document.getElementById('tdDescription');
  const pBadge = document.getElementById('tdPriorityBadge');
  const sBadge = document.getElementById('tdStatusBadge');
  const sSelect = document.getElementById('tdStatusSelect');
  const pSelect = document.getElementById('tdPrioritySelect');
  const aSelect = document.getElementById('tdAssigneeSelect');
  const dInput = document.getElementById('tdDueDateInput');
  const createdBy = document.getElementById('tdCreatedByText');
  const createdAt = document.getElementById('tdCreatedAtText');
  const commentCountEl = document.getElementById('tdCommentCount');

  // Reset inline edit mode
  toggleTaskEditMode(false);
  const editTitleInput = document.getElementById('tdEditTitleInput');
  const editDescInput = document.getElementById('tdEditDescInput');
  if (editTitleInput) editTitleInput.value = task.title || '';
  if (editDescInput) editDescInput.value = task.description || '';

  if (titleEl) titleEl.textContent = task.title;
  if (descEl) descEl.textContent = task.description || 'No description provided.';

  if (pBadge) {
    pBadge.className = `badge-priority ${task.priority ? task.priority.toLowerCase() : 'medium'}`;
    pBadge.textContent = task.priority;
  }

  if (sBadge) sBadge.textContent = task.status;
  if (sSelect) sSelect.value = task.status;
  if (pSelect) pSelect.value = task.priority || 'Medium';

  if (dInput) {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      dInput.value = d.toISOString().split('T')[0];
    } else {
      dInput.value = '';
    }
  }

  // Due Date status badge
  const dueStatus = UI.getDueDateStatus(task.dueDate, task.status);
  const tdDueBadge = document.getElementById('tdDueDateBadge');
  if (tdDueBadge) {
    tdDueBadge.className = `due-badge ${dueStatus.className}`;
    tdDueBadge.innerHTML = `${dueStatus.icon} ${dueStatus.text}`;
  }
  const tdDueHelper = document.getElementById('tdDueStatusHelper');
  if (tdDueHelper) {
    tdDueHelper.innerHTML = dueStatus.badge;
  }

  if (createdBy) createdBy.textContent = task.createdBy ? task.createdBy.name : 'Unknown';
  if (createdAt) createdAt.textContent = UI.formatDate(task.createdAt);
  if (commentCountEl) commentCountEl.textContent = (task.comments || []).length;

  // Populate Assignee Select
  if (aSelect) {
    const project = task.project || STATE.currentProject;
    aSelect.innerHTML = '<option value="">Unassigned</option>' +
      ((project && project.members) || [])
        .map((m) => {
          const u = m.user;
          if (!u) return '';
          const isSelected = task.assignedTo && (task.assignedTo._id === u._id || task.assignedTo === u._id);
          return `<option value="${u._id}" ${isSelected ? 'selected' : ''}>${UI.escapeHTML(u.name)}</option>`;
        })
        .join('');
  }

  // Populate Recurring Selector
  const recSelect = document.getElementById('tdRecurringSelect');
  if (recSelect) {
    recSelect.value = task.recurring || 'none';
  }

  // Populate Labels
  const labelsContainer = document.getElementById('tdLabelsContainer');
  if (labelsContainer) {
    if ((task.labels || []).length === 0) {
      labelsContainer.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">None</span>';
    } else {
      labelsContainer.innerHTML = task.labels
        .map((l) => `<span class="badge-tag" style="background:${l.color || '#4f46e5'}20; color:${l.color || '#4f46e5'}; font-weight:600;">🏷️ ${UI.escapeHTML(l.name)}</span>`)
        .join(' ');
    }
  }

  // Populate Attachments
  renderTaskAttachments(task.attachments || []);

  // Switch to comments tab by default & render comments
  switchTaskModalTab('comments');
  renderCommentsList(task.comments || []);

  // Fetch and render task activity timeline
  loadTaskActivities(task._id);
}

async function handleTaskStatusChange(newStatus) {
  if (!STATE.activeTask) return;
  try {
    const res = await API.patch(`/tasks/${STATE.activeTask._id}/status`, { status: newStatus });
    STATE.activeTask = res.task;
    STATE.updateTaskInState(res.task);
    renderKanbanCards();

    const sBadge = document.getElementById('tdStatusBadge');
    if (sBadge) sBadge.textContent = newStatus;

    const dueStatus = UI.getDueDateStatus(res.task.dueDate, res.task.status);
    const tdDueBadge = document.getElementById('tdDueDateBadge');
    if (tdDueBadge) {
      tdDueBadge.className = `due-badge ${dueStatus.className}`;
      tdDueBadge.innerHTML = `${dueStatus.icon} ${dueStatus.text}`;
    }
    const tdDueHelper = document.getElementById('tdDueStatusHelper');
    if (tdDueHelper) {
      tdDueHelper.innerHTML = dueStatus.badge;
    }

    loadTaskActivities(STATE.activeTask._id);
    UI.showToast(`Task status updated to ${newStatus}`, 'info');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

async function handleTaskFieldUpdate(fields) {
  if (!STATE.activeTask) return;
  try {
    const res = await API.put(`/tasks/${STATE.activeTask._id}`, fields);
    STATE.activeTask = res.task;
    STATE.updateTaskInState(res.task);
    renderKanbanCards();

    if (fields.priority) {
      const pBadge = document.getElementById('tdPriorityBadge');
      if (pBadge) {
        pBadge.className = `badge-priority ${fields.priority.toLowerCase()}`;
        pBadge.textContent = fields.priority;
      }
    }

    const dueStatus = UI.getDueDateStatus(res.task.dueDate, res.task.status);
    const tdDueBadge = document.getElementById('tdDueDateBadge');
    if (tdDueBadge) {
      tdDueBadge.className = `due-badge ${dueStatus.className}`;
      tdDueBadge.innerHTML = `${dueStatus.icon} ${dueStatus.text}`;
    }
    const tdDueHelper = document.getElementById('tdDueStatusHelper');
    if (tdDueHelper) {
      tdDueHelper.innerHTML = dueStatus.badge;
    }

    loadTaskActivities(STATE.activeTask._id);
    UI.showToast('Task updated', 'success');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

function toggleTaskEditMode(force) {
  const form = document.getElementById('tdEditForm');
  if (!form) return;
  if (force !== undefined) {
    form.style.display = force ? 'block' : 'none';
  } else {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

async function saveTaskInfoEdit() {
  if (!STATE.activeTask) return;
  const newTitle = document.getElementById('tdEditTitleInput').value.trim();
  const newDesc = document.getElementById('tdEditDescInput').value.trim();

  if (!newTitle) {
    UI.showToast('Task title cannot be empty', 'warning');
    return;
  }

  try {
    const res = await API.put(`/tasks/${STATE.activeTask._id}`, {
      title: newTitle,
      description: newDesc,
    });

    STATE.activeTask = res.task;
    STATE.updateTaskInState(res.task);
    renderKanbanCards();

    document.getElementById('tdTitle').textContent = res.task.title;
    document.getElementById('tdDescription').textContent = res.task.description || 'No description provided.';
    toggleTaskEditMode(false);
    loadTaskActivities(res.task._id);

    UI.showToast('Task title and description saved!', 'success');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Failed to save task');
  }
}

function confirmDeleteCurrentTask() {
  if (!STATE.activeTask) return;
  const taskId = STATE.activeTask._id;
  const taskTitle = STATE.activeTask.title;

  UI.confirm(
    'Delete Task?',
    `Are you sure you want to permanently delete "${taskTitle}"?`,
    async () => {
      try {
        await API.delete(`/tasks/${taskId}`);
        UI.closeModal('modalTaskDetails');
        UI.showToast('Task deleted successfully', 'info');

        STATE.removeTaskFromState(taskId);
        renderKanbanCards();
      } catch (error) {
        UI.showToast(error.message, 'error', 'Delete Failed');
      }
    }
  );
}

// My Tasks View
let myTasksCache = [];

async function loadMyTasks() {
  try {
    const res = await API.get('/tasks/my-tasks');
    myTasksCache = res.tasks || [];

    const counter = document.getElementById('sidebarMyTasksCount');
    if (counter) counter.textContent = myTasksCache.length;

    populateMyTasksProjectFilter();
    renderMyTasksView();
  } catch (error) {
    console.error('Failed to load my tasks:', error.message);
  }
}

function populateMyTasksProjectFilter() {
  const sel = document.getElementById('myTasksProjectFilter');
  if (!sel) return;
  const currentVal = sel.value || 'all';
  const projects = STATE.projects || [];
  let html = '<option value="all">All Projects</option>';
  projects.forEach((p) => {
    html += `<option value="${p._id}" ${currentVal === p._id ? 'selected' : ''}>${UI.escapeHTML(p.name)}</option>`;
  });
  sel.innerHTML = html;
}

function renderMyTasksView() {
  const container = document.getElementById('myTasksList');
  if (!container) return;

  const search = (document.getElementById('myTasksSearchInput')?.value || '').toLowerCase().trim();
  const projectFilter = document.getElementById('myTasksProjectFilter')?.value || 'all';
  const statusFilter = document.getElementById('myTasksStatusFilter')?.value || 'all';
  const priorityFilter = document.getElementById('myTasksPriorityFilter')?.value || 'all';
  const sortBy = document.getElementById('myTasksSortBy')?.value || 'dueDate';

  let filtered = myTasksCache.filter((t) => {
    const matchSearch =
      !search ||
      (t.title && t.title.toLowerCase().includes(search)) ||
      (t.description && t.description.toLowerCase().includes(search)) ||
      (t.project && t.project.name && t.project.name.toLowerCase().includes(search));

    const matchProject =
      projectFilter === 'all' ||
      (t.project && (t.project._id === projectFilter || t.project === projectFilter));

    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchSearch && matchProject && matchStatus && matchPriority;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const weights = { High: 3, Medium: 2, Low: 1 };
      return (weights[b.priority] || 0) - (weights[a.priority] || 0);
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <h4>No Assigned Tasks Found</h4>
        <p>No tasks matched your search and filter criteria.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetMyTasksFilters()" style="margin-top: 8px;">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((task) => {
      const pColor = task.project ? task.project.color || '#4f46e5' : '#4f46e5';
      const dueStatus = UI.getDueDateStatus(task.dueDate, task.status);

      return `
        <div class="project-card" style="--card-color: ${pColor};">
          <div class="project-card-header">
            <span class="project-category-badge">${UI.escapeHTML(task.project ? task.project.name : 'Project')}</span>
            <div style="display: flex; gap: 6px;">
              <span class="badge-priority ${task.priority ? task.priority.toLowerCase() : 'medium'}">${task.priority}</span>
              <span class="badge-tag">${task.status}</span>
            </div>
          </div>
          <h4 class="project-card-title" onclick="openTaskDetailsModalById('${task._id}')">${UI.escapeHTML(task.title)}</h4>
          <p class="project-card-desc">${UI.escapeHTML(task.description || 'No description provided')}</p>
          <div class="project-card-footer">
            <span class="project-deadline">
              ${dueStatus.badge}
            </span>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${task.commentCount > 0 ? `<span class="task-comments-count">💬 ${task.commentCount}</span>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="openTaskDetailsModalById('${task._id}')">
                Details &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function resetMyTasksFilters() {
  const sInput = document.getElementById('myTasksSearchInput');
  const pFilter = document.getElementById('myTasksProjectFilter');
  const stFilter = document.getElementById('myTasksStatusFilter');
  const prFilter = document.getElementById('myTasksPriorityFilter');
  const sortSel = document.getElementById('myTasksSortBy');

  if (sInput) sInput.value = '';
  if (pFilter) pFilter.value = 'all';
  if (stFilter) stFilter.value = 'all';
  if (prFilter) prFilter.value = 'all';
  if (sortSel) sortSel.value = 'dueDate';

  renderMyTasksView();
}

function switchTaskModalTab(tabName) {
  const btnComments = document.getElementById('tabBtnComments');
  const btnActivities = document.getElementById('tabBtnActivities');
  const paneComments = document.getElementById('paneComments');
  const paneActivities = document.getElementById('paneActivities');

  if (tabName === 'activities') {
    if (btnComments) btnComments.classList.remove('active');
    if (btnActivities) btnActivities.classList.add('active');
    if (paneComments) paneComments.style.display = 'none';
    if (paneActivities) paneActivities.style.display = 'block';
  } else {
    if (btnComments) btnComments.classList.add('active');
    if (btnActivities) btnActivities.classList.remove('active');
    if (paneComments) paneComments.style.display = 'block';
    if (paneActivities) paneActivities.style.display = 'none';
  }
}

async function loadTaskActivities(taskId) {
  const container = document.getElementById('tdActivityTimelineList');
  const countEl = document.getElementById('tdActivityCount');
  if (!container) return;

  try {
    const res = await API.get(`/tasks/${taskId}/activities`);
    const activities = res.activities || [];

    if (countEl) countEl.textContent = activities.length;

    if (activities.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-light); font-size: 13px; padding: 24px;">
          No activity recorded for this task yet.
        </div>
      `;
      return;
    }

    container.innerHTML = activities
      .map((a) => {
        const u = a.user || {};
        return `
          <div class="timeline-item">
            <img class="timeline-avatar" src="${UI.getAvatar(u)}" alt="${UI.escapeHTML(u.name || 'User')}">
            <div class="timeline-body">
              <div class="timeline-header">
                <span class="timeline-author">${UI.escapeHTML(u.name || 'Member')}</span>
                <span class="timeline-time">${UI.timeAgo(a.createdAt)}</span>
              </div>
              <div class="timeline-desc">${UI.escapeHTML(a.details || a.action)}</div>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.warn('Could not load task activities:', error.message);
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-light); font-size: 12px; padding: 16px;">
          Activity timeline unavailable
        </div>
      `;
    }
  }
}

// Task Attachments Handlers
function renderTaskAttachments(attachments = []) {
  const listEl = document.getElementById('tdAttachmentsList');
  const countEl = document.getElementById('tdAttachmentCount');
  if (countEl) countEl.textContent = attachments.length;
  if (!listEl) return;

  if (attachments.length === 0) {
    listEl.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px;">No files attached to this task yet.</div>';
    return;
  }

  listEl.innerHTML = attachments
    .map((att) => {
      const isImg = att.mimetype && att.mimetype.startsWith('image/');
      const sizeKb = Math.round((att.size || 0) / 1024);
      const uploader = att.uploadedBy ? (att.uploadedBy.name || 'Member') : 'Member';
      const fileUrl = `${CONFIG.API_BASE_URL.replace('/api', '')}${att.url}`;

      return `
        <div class="attachment-item">
          ${
            isImg
              ? `<a href="${fileUrl}" target="_blank"><img class="attachment-thumb" src="${fileUrl}" alt="${UI.escapeHTML(att.originalName)}"></a>`
              : `<div class="attachment-thumb" style="display:flex; align-items:center; justify-content:center; background:#e0e7ff; color:#4338ca; font-weight:700; font-size:11px;">FILE</div>`
          }
          <div class="attachment-info">
            <div class="attachment-name" title="${UI.escapeHTML(att.originalName)}">${UI.escapeHTML(att.originalName)}</div>
            <div class="attachment-meta">${sizeKb} KB &bull; Uploaded by ${UI.escapeHTML(uploader)}</div>
          </div>
          <div class="attachment-actions">
            <a href="${fileUrl}" download="${UI.escapeHTML(att.originalName)}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;">
              Download
            </a>
            <button type="button" class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="confirmDeleteAttachment('${att._id}')">
              &times;
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

async function handleAttachmentUpload(files) {
  if (!files || files.length === 0 || !STATE.activeTask) return;
  const taskId = STATE.activeTask._id;
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('attachments', files[i]);
  }

  try {
    UI.showToast('Uploading attachment(s)...', 'info');
    const res = await API.upload(`/tasks/${taskId}/attachments`, formData);
    STATE.activeTask = res.task;
    STATE.updateTaskInState(res.task);
    renderTaskAttachments(res.task.attachments || []);
    renderKanbanCards();
    loadTaskActivities(taskId);
    UI.showToast('Attachment uploaded successfully!', 'success');
  } catch (error) {
    console.error('Attachment upload failed:', error);
    UI.showToast(error.message, 'error', 'Upload Error');
  } finally {
    const fileInput = document.getElementById('tdFileInput');
    if (fileInput) fileInput.value = '';
  }
}

function handleAttachmentDrop(event) {
  event.preventDefault();
  const dropzone = document.getElementById('tdAttachmentsDropzone');
  if (dropzone) dropzone.classList.remove('drag-over');
  if (event.dataTransfer && event.dataTransfer.files) {
    handleAttachmentUpload(event.dataTransfer.files);
  }
}

async function confirmDeleteAttachment(attachmentId) {
  if (!STATE.activeTask) return;
  const taskId = STATE.activeTask._id;
  UI.confirm(
    'Remove File Attachment?',
    'Are you sure you want to permanently delete this file attachment?',
    async () => {
      try {
        const res = await API.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
        STATE.activeTask = res.task;
        STATE.updateTaskInState(res.task);
        renderTaskAttachments(res.task.attachments || []);
        renderKanbanCards();
        loadTaskActivities(taskId);
        UI.showToast('Attachment removed', 'info');
      } catch (error) {
        UI.showToast(error.message, 'error', 'Delete Failed');
      }
    }
  );
}

window.updateCreateTaskProjectOptions = updateCreateTaskProjectOptions;
window.populateTaskAssigneeOptions = populateTaskAssigneeOptions;
window.openCreateTaskModal = openCreateTaskModal;
window.openQuickCreateTaskModal = openQuickCreateTaskModal;
window.handleCreateTaskSubmit = handleCreateTaskSubmit;
window.openTaskDetailsModalById = openTaskDetailsModalById;
window.populateTaskDetailsModal = populateTaskDetailsModal;
window.handleTaskStatusChange = handleTaskStatusChange;
window.handleTaskFieldUpdate = handleTaskFieldUpdate;
window.confirmDeleteCurrentTask = confirmDeleteCurrentTask;
window.toggleTaskEditMode = toggleTaskEditMode;
window.saveTaskInfoEdit = saveTaskInfoEdit;
window.loadMyTasks = loadMyTasks;
window.renderMyTasksView = renderMyTasksView;
window.resetMyTasksFilters = resetMyTasksFilters;
window.switchTaskModalTab = switchTaskModalTab;
window.loadTaskActivities = loadTaskActivities;
window.renderTaskAttachments = renderTaskAttachments;
window.handleAttachmentUpload = handleAttachmentUpload;
window.handleAttachmentDrop = handleAttachmentDrop;
window.confirmDeleteAttachment = confirmDeleteAttachment;
