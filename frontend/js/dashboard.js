// ProjectFlow Dashboard Controller

async function loadDashboardData() {
  try {
    const res = await API.get('/dashboard/stats');
    if (!res.success) return;

    const { stats, recentProjects, recentActivities, upcomingTasks } = res;

    // Welcome heading dynamically synced to active user
    const currentUser = STATE.getUser();
    if (currentUser) {
      const dHeading = document.getElementById('dashWelcomeHeading');
      if (dHeading) dHeading.textContent = `Welcome back, ${currentUser.name}!`;
    }

    // Render Stats Badges
    document.getElementById('statTotalProjects').textContent = stats.totalProjects;
    document.getElementById('statTotalTasks').textContent = stats.totalTasks;
    document.getElementById('statPendingTasks').textContent = stats.pendingTasks;
    document.getElementById('statInProgressTasks').textContent = stats.inProgressTasks;
    document.getElementById('statCompletedTasks').textContent = stats.completedTasks;

    // Render Recent Projects
    renderDashboardRecentProjects(recentProjects || []);

    // Render Upcoming Deadlines
    renderDashboardUpcomingTasks(upcomingTasks || []);

    // Render Recent Activities
    renderDashboardActivities(recentActivities || []);
  } catch (error) {
    console.error('Failed to load dashboard:', error.message);
  }
}

function renderDashboardRecentProjects(projects) {
  const container = document.getElementById('dashRecentProjectsList');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <p>No projects yet. Click "New Project" to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = projects
    .map((p) => {
      const isOverdue = p.deadline && new Date(p.deadline) < new Date();
      return `
        <div class="project-card" style="--card-color: ${p.color || '#4f46e5'};">
          <div class="project-card-header">
            <span class="project-category-badge">${UI.escapeHTML(p.category || 'General')}</span>
            <span class="badge-priority ${p.priority ? p.priority.toLowerCase() : 'medium'}">${p.priority}</span>
          </div>
          <h4 class="project-card-title" onclick="openProjectBoard('${p._id}')">${UI.escapeHTML(p.name)}</h4>
          <p class="project-card-desc">${UI.escapeHTML(p.description || 'No description provided')}</p>
          <div class="project-card-progress">
            <div class="project-progress-label">
              <span>Progress</span>
              <span>${p.progress}% (${p.completedTasks}/${p.totalTasks} tasks)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${p.progress}%; background: ${p.color || '#4f46e5'};"></div>
            </div>
          </div>
          <div class="project-card-footer">
            <div class="avatar-stack">
              ${(p.members || [])
                .slice(0, 3)
                .map(
                  (m) =>
                    `<img class="avatar" src="${UI.getAvatar(m.user)}" title="${UI.escapeHTML(
                      m.user ? m.user.name : 'Member'
                    )}" alt="Member">`
                )
                .join('')}
              ${
                (p.members || []).length > 3
                  ? `<span class="avatar-more">+${p.members.length - 3}</span>`
                  : ''
              }
            </div>
            <span class="project-deadline ${isOverdue ? 'overdue' : ''}">
              ${isOverdue ? '⚠️ Overdue' : `Due: ${UI.formatDate(p.deadline)}`}
            </span>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderDashboardUpcomingTasks(tasks) {
  const container = document.getElementById('dashUpcomingTasksList');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">
        No upcoming task deadlines found.
      </div>
    `;
    return;
  }

  container.innerHTML = tasks
    .map((t) => {
      const dueStatus = UI.getDueDateStatus(t.dueDate, t.status);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light);">
          <div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-main); cursor: pointer;" onclick="openTaskDetailsModalById('${t._id}')">
              ${UI.escapeHTML(t.title)}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 2px;">
              <span>${UI.escapeHTML(t.project ? t.project.name : 'Project')}</span>
              <span>&bull;</span>
              <span class="badge-priority ${t.priority ? t.priority.toLowerCase() : 'medium'}" style="font-size: 10px; padding: 1px 4px;">${t.priority}</span>
            </div>
          </div>
          <div>
            ${dueStatus.badge}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderDashboardActivities(activities) {
  const container = document.getElementById('dashActivityList');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 24px;">
        No team activity recorded yet.
      </div>
    `;
    return;
  }

  container.innerHTML = activities
    .map((a) => {
      return `
        <div class="activity-item">
          <img class="avatar" src="${UI.getAvatar(a.user)}" alt="User">
          <div class="activity-content">
            <div class="activity-text">
              <strong>${UI.escapeHTML(a.user ? a.user.name : 'Team member')}</strong>
              <span>${UI.escapeHTML(a.details || a.action)}</span>
            </div>
            <div class="activity-time">${UI.timeAgo(a.createdAt)}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function appendActivityToDashboard(activity) {
  const container = document.getElementById('dashActivityList');
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'activity-item';
  item.style.animation = 'fadeIn 0.3s ease';

  item.innerHTML = `
    <img class="avatar" src="${UI.getAvatar(activity.user)}" alt="User">
    <div class="activity-content">
      <div class="activity-text">
        <strong>${UI.escapeHTML(activity.user ? activity.user.name : 'Team member')}</strong>
        <span>${UI.escapeHTML(activity.details || activity.action)}</span>
      </div>
      <div class="activity-time">just now</div>
    </div>
  `;

  container.prepend(item);
}

window.loadDashboardData = loadDashboardData;
window.appendActivityToDashboard = appendActivityToDashboard;
