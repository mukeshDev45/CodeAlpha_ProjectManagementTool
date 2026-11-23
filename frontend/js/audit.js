// ProjectFlow Audit Logs & Security Trail Controller

const AUDIT_STATE = {
  page: 1,
  limit: 15,
  totalPages: 1,
  action: '',
};

async function loadAuditLogs(page = 1) {
  AUDIT_STATE.page = page;
  const actionFilter = document.getElementById('auditActionFilter');
  if (actionFilter) {
    AUDIT_STATE.action = actionFilter.value;
  }

  const tbody = document.getElementById('auditLogsTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Loading audit trail...</td></tr>';
  }

  try {
    let url = `/audit-logs?page=${AUDIT_STATE.page}&limit=${AUDIT_STATE.limit}`;
    if (AUDIT_STATE.action) {
      url += `&action=${encodeURIComponent(AUDIT_STATE.action)}`;
    }

    const res = await API.get(url);
    const { activities = [], pagination = {} } = res;
    AUDIT_STATE.totalPages = pagination.pages || 1;

    renderAuditTable(activities);
    updateAuditPagination(pagination);
  } catch (error) {
    console.error('Audit load error:', error);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--danger);">Failed to load audit logs: ${UI.escapeHTML(error.message)}</td></tr>`;
    }
  }
}

function renderAuditTable(activities) {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  if (activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">No audit events recorded for this criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = activities
    .map((act) => {
      const u = act.user || {};
      const proj = act.project || {};
      const actionBadge = getAuditActionBadge(act.action);

      return `
        <tr>
          <td style="font-size: 12px; color: var(--text-light); white-space: nowrap;">
            ${formatAuditTimestamp(act.createdAt)}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img class="avatar" style="width: 24px; height: 24px;" src="${UI.getAvatar(u)}" alt="${UI.escapeHTML(u.name || 'User')}">
              <span style="font-weight: 600; font-size: 13px;">${UI.escapeHTML(u.name || 'System')}</span>
            </div>
          </td>
          <td>${actionBadge}</td>
          <td style="font-size: 13px; color: var(--text-main);">${UI.escapeHTML(act.details || '-')}</td>
          <td style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${UI.escapeHTML(proj.name || 'Workspace')}</td>
        </tr>
      `;
    })
    .join('');
}

function getAuditActionBadge(action) {
  const map = {
    task_created: '<span class="audit-badge audit-create">Task Created</span>',
    task_updated: '<span class="audit-badge audit-update">Task Updated</span>',
    task_status_changed: '<span class="audit-badge audit-move">Status Changed</span>',
    task_deleted: '<span class="audit-badge audit-delete">Task Deleted</span>',
    project_created: '<span class="audit-badge audit-create">Project Created</span>',
    project_updated: '<span class="audit-badge audit-update">Project Updated</span>',
    project_deleted: '<span class="audit-badge audit-delete">Project Deleted</span>',
    member_added: '<span class="audit-badge audit-member">Member Added</span>',
    member_removed: '<span class="audit-badge audit-delete">Member Removed</span>',
    comment_added: '<span class="audit-badge audit-comment">Comment Added</span>',
    attachment_uploaded: '<span class="audit-badge audit-create">File Attached</span>',
    attachment_deleted: '<span class="audit-badge audit-delete">File Deleted</span>',
    invitation_sent: '<span class="audit-badge audit-member">Invite Sent</span>',
  };
  return map[action] || `<span class="audit-badge audit-update">${UI.escapeHTML(action || 'Action')}</span>`;
}

function formatAuditTimestamp(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function updateAuditPagination(pagination) {
  const indicator = document.getElementById('auditPageIndicator');
  const btnPrev = document.getElementById('btnAuditPrev');
  const btnNext = document.getElementById('btnAuditNext');

  if (indicator) {
    indicator.textContent = `Page ${pagination.page || 1} of ${pagination.pages || 1} (${pagination.total || 0} events)`;
  }
  if (btnPrev) {
    btnPrev.disabled = (pagination.page || 1) <= 1;
  }
  if (btnNext) {
    btnNext.disabled = (pagination.page || 1) >= (pagination.pages || 1);
  }
}

function auditPrevPage() {
  if (AUDIT_STATE.page > 1) {
    loadAuditLogs(AUDIT_STATE.page - 1);
  }
}

function auditNextPage() {
  if (AUDIT_STATE.page < AUDIT_STATE.totalPages) {
    loadAuditLogs(AUDIT_STATE.page + 1);
  }
}
