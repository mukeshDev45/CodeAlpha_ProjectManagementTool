// ProjectFlow Real-Time WebSocket Client (Socket.IO)

let socket = null;

function initSocketConnection() {
  const user = STATE.getUser();
  if (!user || typeof io === 'undefined') return;

  if (socket && socket.connected) {
    socket.emit('user:join', user._id);
    return;
  }

  socket = io();

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected with ID:', socket.id);
    socket.emit('user:join', user._id);

    // If currently viewing a project board, join its room
    if (STATE.currentProject) {
      socket.emit('project:join', STATE.currentProject._id);
    }
  });

  // REAL-TIME NOTIFICATION EVENT
  socket.on('notification:new', (notification) => {
    STATE.notifications.unshift(notification);
    STATE.unreadNotifsCount++;
    renderNotificationBadges();

    // Show instant toast notification
    UI.showToast(notification.message, 'info', notification.title);
  });

  // REAL-TIME ACTIVITY EVENT
  socket.on('activity:new', (activity) => {
    if (STATE.activeView === 'dashboard') {
      appendActivityToDashboard(activity);
    }
  });

  // REAL-TIME KANBAN TASK CREATED
  socket.on('task:created', (task) => {
    if (STATE.currentProject && task.project && (task.project._id === STATE.currentProject._id || task.project === STATE.currentProject._id)) {
      STATE.updateTaskInState(task);
      renderKanbanCards();
      UI.showToast(`New task added: "${task.title}"`, 'info', 'Task Created');
    }
  });

  // REAL-TIME KANBAN TASK STATUS CHANGED (Drag & Drop Move)
  socket.on('task:status_changed', (data) => {
    const { taskId, newStatus, task } = data;
    if (STATE.currentProject) {
      STATE.updateTaskInState(task);
      renderKanbanCards();

      // If this task is open in details modal, update status badge and select
      if (STATE.activeTask && STATE.activeTask._id === taskId) {
        STATE.activeTask.status = newStatus;
        const statSelect = document.getElementById('tdStatusSelect');
        const statBadge = document.getElementById('tdStatusBadge');
        if (statSelect) statSelect.value = newStatus;
        if (statBadge) statBadge.textContent = newStatus;
      }
    }
  });

  // REAL-TIME TASK UPDATED
  socket.on('task:updated', (task) => {
    if (STATE.currentProject) {
      STATE.updateTaskInState(task);
      renderKanbanCards();

      if (STATE.activeTask && STATE.activeTask._id === task._id) {
        populateTaskDetailsModal(task);
      }
    }
  });

  // REAL-TIME TASK DELETED
  socket.on('task:deleted', (data) => {
    const { taskId } = data;
    if (STATE.currentProject) {
      STATE.removeTaskFromState(taskId);
      renderKanbanCards();

      if (STATE.activeTask && STATE.activeTask._id === taskId) {
        UI.closeModal('modalTaskDetails');
        UI.showToast('This task was deleted by a team member', 'warning');
      }
    }
  });

  // REAL-TIME COMMENT ADDED
  socket.on('comment:added', (data) => {
    const { taskId, comment } = data;

    // Increment comment count on task card
    const task = STATE.currentTasks.find((t) => t._id === taskId);
    if (task) {
      task.commentCount = (task.commentCount || 0) + 1;
      renderKanbanCards();
    }

    // If modal is open for this task, append comment smoothly
    if (STATE.activeTask && STATE.activeTask._id === taskId) {
      if (!STATE.activeTask.comments) STATE.activeTask.comments = [];
      STATE.activeTask.comments.push(comment);
      STATE.activeTask.commentCount = (STATE.activeTask.commentCount || 0) + 1;
      appendCommentToModal(comment);

      const countEl = document.getElementById('tdCommentCount');
      if (countEl) countEl.textContent = STATE.activeTask.commentCount;
    }
  });

  // REAL-TIME COMMENT DELETED
  socket.on('comment:deleted', (data) => {
    const { taskId, commentId } = data;
    const task = STATE.currentTasks.find((t) => t._id === taskId);
    if (task && task.commentCount > 0) {
      task.commentCount--;
      renderKanbanCards();
    }

    if (STATE.activeTask && STATE.activeTask._id === taskId) {
      if (STATE.activeTask.comments) {
        STATE.activeTask.comments = STATE.activeTask.comments.filter((c) => c._id !== commentId);
      }
      STATE.activeTask.commentCount = Math.max(0, (STATE.activeTask.commentCount || 1) - 1);
      renderCommentsList(STATE.activeTask.comments || []);

      const countEl = document.getElementById('tdCommentCount');
      if (countEl) countEl.textContent = STATE.activeTask.commentCount;
    }
  });

  window.SOCKET = socket;
}

function joinProjectRoom(projectId) {
  if (socket && socket.connected && projectId) {
    socket.emit('project:join', projectId);
  }
}

function leaveProjectRoom(projectId) {
  if (socket && socket.connected && projectId) {
    socket.emit('project:leave', projectId);
  }
}

window.initSocketConnection = initSocketConnection;
window.joinProjectRoom = joinProjectRoom;
window.leaveProjectRoom = leaveProjectRoom;
