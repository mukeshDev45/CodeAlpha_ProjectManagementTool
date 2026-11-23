// ProjectFlow Team Members Directory Controller

async function loadTeamMembers() {
  try {
    const res = await API.get('/users');
    if (res.success) {
      STATE.allUsers = res.users || [];
      renderTeamGrid(STATE.allUsers);
    }
  } catch (error) {
    console.error('Failed to load team members:', error.message);
  }
}

function renderTeamGrid(users) {
  const container = document.getElementById('teamMembersGrid');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>No team members found matching your search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = users
    .map((u) => {
      return `
        <div class="project-card" style="padding: 24px; text-align: center;">
          <img class="avatar" src="${UI.getAvatar(u)}" style="width: 64px; height: 64px; margin: 0 auto 14px; border: 2px solid var(--primary-border);" alt="User">
          <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${UI.escapeHTML(u.name)}</h4>
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">${UI.escapeHTML(u.jobTitle || 'Team Member')}</div>
          <span class="badge-tag" style="text-transform: capitalize; margin-bottom: 14px; display: inline-block;">${u.role}</span>
          <div style="font-size: 12px; color: var(--text-light); margin-bottom: 16px;">
            📧 ${UI.escapeHTML(u.email)}
          </div>
          ${
            u.bio
              ? `<p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 16px; font-style: italic;">"${UI.escapeHTML(u.bio)}"</p>`
              : ''
          }
          <div style="border-top: 1px solid var(--border-light); padding-top: 12px;">
            <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="openAddMemberForUser('${u._id}')">
              + Add to Project
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

function handleTeamSearch() {
  const query = (document.getElementById('teamSearchInput').value || '').toLowerCase().trim();
  const filtered = STATE.allUsers.filter((u) => {
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query))
    );
  });
  renderTeamGrid(filtered);
}

function openAddMemberForUser(userId) {
  if (!STATE.currentProject && STATE.projects.length === 0) {
    UI.showToast('Please create a project first before adding team members', 'warning');
    openCreateProjectModal();
    return;
  }

  // If viewing a project, open manage team modal with this user selected
  if (STATE.currentProject) {
    openManageTeamModal();
    setTimeout(() => {
      const select = document.getElementById('teamAddUserSelect');
      if (select) select.value = userId;
    }, 200);
  } else {
    // If not viewing a project, open first project
    openProjectBoard(STATE.projects[0]._id);
  }
}

window.loadTeamMembers = loadTeamMembers;
window.renderTeamGrid = renderTeamGrid;
window.handleTeamSearch = handleTeamSearch;
window.openAddMemberForUser = openAddMemberForUser;
