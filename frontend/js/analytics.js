// ProjectFlow Analytics Dashboard Controller

async function loadAnalyticsData() {
  try {
    const res = await API.get('/analytics/overview');
    const data = res.analytics || {};
    renderAnalyticsOverview(data);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    UI.showToast(error.message, 'error', 'Analytics Error');
  }
}

function renderAnalyticsOverview(data) {
  const { summary = {}, weeklyCompletion = [], statusDistribution = {}, overdueTasks = [], projectProgress = [] } = data;

  // Render Top Metric Cards
  const elProj = document.getElementById('anaStatProjects');
  const elTasks = document.getElementById('anaStatTasks');
  const elRate = document.getElementById('anaStatCompletionRate');
  const elOverdue = document.getElementById('anaStatOverdue');

  if (elProj) elProj.textContent = summary.activeProjects || 0;
  if (elTasks) elTasks.textContent = summary.totalTasks || 0;
  if (elRate) elRate.textContent = `${summary.completionRate || 0}%`;
  if (elOverdue) elOverdue.textContent = summary.overdueTasks || 0;

  // Render Weekly Completion Chart (7 days)
  const chartEl = document.getElementById('weeklyCompletionChart');
  if (chartEl) {
    const maxVal = Math.max(...weeklyCompletion.map((w) => w.completed), 1);
    chartEl.innerHTML = weeklyCompletion
      .map((w) => {
        const heightPct = Math.max(Math.round((w.completed / maxVal) * 100), 8);
        return `
          <div class="chart-bar-item" title="${w.date}: ${w.completed} tasks completed">
            <span class="chart-bar-val">${w.completed}</span>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="height: ${heightPct}%;"></div>
            </div>
            <span class="chart-bar-label">${w.day}</span>
          </div>
        `;
      })
      .join('');
  }

  // Render Task Status Distribution Bars
  const statusEl = document.getElementById('statusDistributionBars');
  if (statusEl) {
    const total = summary.totalTasks || 1;
    const statuses = [
      { key: 'To Do', label: 'To Do', count: statusDistribution['To Do'] || 0, color: '#64748b' },
      { key: 'In Progress', label: 'In Progress', count: statusDistribution['In Progress'] || 0, color: '#f59e0b' },
      { key: 'Review', label: 'Review', count: statusDistribution['Review'] || 0, color: '#8b5cf6' },
      { key: 'Completed', label: 'Completed', count: statusDistribution['Completed'] || 0, color: '#10b981' },
    ];

    statusEl.innerHTML = statuses
      .map((s) => {
        const pct = Math.round((s.count / total) * 100);
        return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
              <span>${s.label} (${s.count})</span>
              <span>${pct}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${s.color}; border-radius: 4px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Render Project Velocity & Progress List
  const projListEl = document.getElementById('analyticsProjectList');
  if (projListEl) {
    if (projectProgress.length === 0) {
      projListEl.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px;">No projects available</div>';
    } else {
      projListEl.innerHTML = projectProgress
        .map((p) => `
          <div style="background: var(--bg-main); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); cursor: pointer;" onclick="openProjectBoard('${p._id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 14px; color: var(--text-main);">${UI.escapeHTML(p.name)}</span>
              <span style="font-size: 12px; font-weight: 700; color: var(--primary);">${p.progress}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
              <div style="width: ${p.progress}%; height: 100%; background: ${p.color || '#4f46e5'}; border-radius: 3px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
              <span>${p.completedTasks}/${p.totalTasks} Tasks Completed</span>
              <span>Status: ${p.status}</span>
            </div>
          </div>
        `)
        .join('');
    }
  }

  // Render Overdue Tasks List
  const overdueBadge = document.getElementById('anaOverdueCountBadge');
  if (overdueBadge) {
    overdueBadge.textContent = `${overdueTasks.length} Overdue`;
  }

  const overdueListEl = document.getElementById('analyticsOverdueList');
  if (overdueListEl) {
    if (overdueTasks.length === 0) {
      overdueListEl.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; color: var(--success);">
          <div style="font-size: 24px; margin-bottom: 6px;">🎉</div>
          <div style="font-size: 13px; font-weight: 600;">No overdue tasks! All projects on track.</div>
        </div>
      `;
    } else {
      overdueListEl.innerHTML = overdueTasks
        .map((t) => `
          <div class="search-result-item" style="border-bottom: 1px solid var(--border-light);" onclick="openTaskDetailsModalById('${t._id}')">
            <div class="search-icon-box" style="background: #fee2e2; color: var(--danger);">⚠️</div>
            <div style="flex: 1; overflow: hidden;">
              <div class="search-title" style="color: var(--danger);">${UI.escapeHTML(t.title)}</div>
              <div class="search-subtitle">
                Project: ${t.project ? UI.escapeHTML(t.project.name || '') : '-'} &bull; Due: ${UI.formatDate(t.dueDate)}
              </div>
            </div>
            <span class="badge-priority ${t.priority ? t.priority.toLowerCase() : 'medium'}">${t.priority}</span>
          </div>
        `)
        .join('');
    }
  }
}
