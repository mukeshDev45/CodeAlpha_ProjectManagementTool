// ProjectFlow Notifications & Alert Center Controller

async function loadNotifications() {
  try {
    const res = await API.get('/notifications');
    if (res.success) {
      STATE.notifications = res.notifications || [];
      STATE.unreadNotifsCount = res.unreadCount || 0;

      renderNotificationBadges();
      renderNotificationDropdown();
      renderNotificationPage();
    }
  } catch (error) {
    console.error('Failed to load notifications:', error.message);
  }
}

function renderNotificationBadges() {
  const navBadge = document.getElementById('navNotifBadge');
  const sideBadge = document.getElementById('sidebarNotifBadge');

  const count = STATE.unreadNotifsCount || 0;

  if (navBadge) {
    if (count > 0) {
      navBadge.style.display = 'flex';
      navBadge.textContent = count > 99 ? '99+' : count;
    } else {
      navBadge.style.display = 'none';
    }
  }

  if (sideBadge) {
    if (count > 0) {
      sideBadge.style.display = 'inline-block';
      sideBadge.textContent = count;
    } else {
      sideBadge.style.display = 'none';
    }
  }
}

function toggleNotifDropdown(force) {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;

  if (force !== undefined) {
    if (force) dd.classList.add('open');
    else dd.classList.remove('open');
  } else {
    dd.classList.toggle('open');
  }
}

function renderNotificationDropdown() {
  const container = document.getElementById('notifDropdownList');
  if (!container) return;

  if (STATE.notifications.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No notifications yet.
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.notifications
    .slice(0, 8)
    .map((n) => {
      const typeIcons = {
        task_assigned: '📌',
        task_status_changed: '🔄',
        new_comment: '💬',
        project_invitation: '📁',
        system: '⚡',
      };
      const icon = typeIcons[n.type] || '🔔';

      return `
        <div class="notif-item ${!n.isRead ? 'unread' : ''}" onclick="handleNotificationClick('${n._id}', '${n.relatedProject?._id || n.relatedProject || ''}', '${n.relatedTask?._id || n.relatedTask || ''}')">
          <div class="notif-item-icon">${icon}</div>
          <div style="flex:1;">
            <div class="notif-item-title">${UI.escapeHTML(n.title)}</div>
            <div class="notif-item-desc">${UI.escapeHTML(n.message)}</div>
            <div class="notif-item-time">${UI.timeAgo(n.createdAt)}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderNotificationPage() {
  const container = document.getElementById('notificationsPageList');
  if (!container) return;

  if (STATE.notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <h4>All Caught Up!</h4>
        <p>You have no notifications at this time.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.notifications
    .map((n) => {
      const typeIcons = {
        task_assigned: '📌',
        task_status_changed: '🔄',
        new_comment: '💬',
        project_invitation: '📁',
        system: '⚡',
      };
      const icon = typeIcons[n.type] || '🔔';

      return `
        <div class="notif-item ${!n.isRead ? 'unread' : ''}" style="padding: 18px 24px;" onclick="handleNotificationClick('${n._id}', '${n.relatedProject?._id || n.relatedProject || ''}', '${n.relatedTask?._id || n.relatedTask || ''}')">
          <div class="notif-item-icon" style="width: 40px; height: 40px; font-size: 18px;">${icon}</div>
          <div style="flex:1;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h5 style="font-size: 14px; font-weight: 700; color: var(--text-main);">${UI.escapeHTML(n.title)}</h5>
              <span style="font-size: 12px; color: var(--text-light);">${UI.timeAgo(n.createdAt)}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-muted); margin: 4px 0 8px;">${UI.escapeHTML(n.message)}</div>
            <div style="display: flex; gap: 8px;">
              ${!n.isRead ? `<span class="badge-tag" style="background: var(--primary-light); color: var(--primary);">Unread</span>` : ''}
              ${n.relatedProject ? `<span class="badge-tag">Project: ${UI.escapeHTML(n.relatedProject.name || 'View')}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

async function markAllNotificationsRead() {
  try {
    await API.patch('/notifications/read-all');
    STATE.notifications.forEach((n) => (n.isRead = true));
    STATE.unreadNotifsCount = 0;
    renderNotificationBadges();
    renderNotificationDropdown();
    renderNotificationPage();
    UI.showToast('All notifications marked as read', 'info');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

async function handleNotificationClick(notifId, projectId, taskId) {
  try {
    // Mark as read
    await API.patch(`/notifications/${notifId}/read`);
    const n = STATE.notifications.find((item) => item._id === notifId);
    if (n && !n.isRead) {
      n.isRead = true;
      STATE.unreadNotifsCount = Math.max(0, STATE.unreadNotifsCount - 1);
      renderNotificationBadges();
      renderNotificationDropdown();
      renderNotificationPage();
    }

    toggleNotifDropdown(false);

    // Navigate to related task or project
    if (taskId) {
      openTaskDetailsModalById(taskId);
    } else if (projectId) {
      openProjectBoard(projectId);
    }
  } catch (error) {
    console.error(error);
  }
}

// Close notification dropdown if clicked outside
document.addEventListener('click', (e) => {
  const bell = document.getElementById('notifBellBtn');
  const dd = document.getElementById('notifDropdown');
  if (bell && dd && !bell.contains(e.target) && !dd.contains(e.target)) {
    dd.classList.remove('open');
  }
});

window.loadNotifications = loadNotifications;
window.renderNotificationBadges = renderNotificationBadges;
window.toggleNotifDropdown = toggleNotifDropdown;
window.markAllNotificationsRead = markAllNotificationsRead;
window.handleNotificationClick = handleNotificationClick;
