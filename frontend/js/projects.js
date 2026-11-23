// ProjectFlow Projects Controller & Management

async function loadProjects() {
  try {
    const res = await API.get('/projects');
    if (res.success) {
      STATE.projects = res.projects || [];
      renderProjectsGrid(STATE.projects);

      // Update sidebar counter
      const counter = document.getElementById('sidebarProjectCount');
      if (counter) counter.textContent = STATE.projects.length;

      // Update project options in Create Task Modal dropdown
      updateCreateTaskProjectOptions();
      return STATE.projects;
    }
    return [];
  } catch (error) {
    UI.showToast(error.message, 'error', 'Failed to Load Projects');
    return [];
  }
}

function renderProjectsGrid(projects) {
  const container = document.getElementById('projectsGrid');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <h4>No Projects Found</h4>
        <p>You haven't joined or created any projects yet. Start by creating your first group workspace.</p>
        <button class="btn btn-primary btn-sm" onclick="openCreateProjectModal()">Create Project</button>
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
            <div style="display: flex; gap: 6px;">
              <span class="badge-priority ${p.priority ? p.priority.toLowerCase() : 'medium'}">${p.priority}</span>
              <span class="badge-tag">${p.status}</span>
            </div>
          </div>

          <h4 class="project-card-title" onclick="openProjectBoard('${p._id}')">${UI.escapeHTML(p.name)}</h4>
          <p class="project-card-desc">${UI.escapeHTML(p.description || 'No description provided')}</p>

          <div class="project-card-progress">
            <div class="project-progress-label">
              <span>Task Progress</span>
              <span>${p.progress}% (${p.completedTasks}/${p.totalTasks})</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${p.progress}%; background: ${p.color || '#4f46e5'};"></div>
            </div>
          </div>

          <div class="project-card-footer">
            <div class="avatar-stack">
              ${(p.members || [])
                .slice(0, 4)
                .map(
                  (m) =>
                    `<img class="avatar" src="${UI.getAvatar(m.user)}" title="${UI.escapeHTML(
                      m.user ? m.user.name : 'Member'
                    )}" alt="Member">`
                )
                .join('')}
              ${
                (p.members || []).length > 4
                  ? `<span class="avatar-more">+${p.members.length - 4}</span>`
                  : ''
              }
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              ${UI.getDueDateStatus(p.deadline).badge}
              <button class="btn btn-secondary btn-sm" onclick="openProjectBoard('${p._id}')">
                Open Board &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function handleProjectsFilter() {
  const search = (document.getElementById('projectsSearchInput').value || '').toLowerCase().trim();
  const status = document.getElementById('projectsStatusFilter').value;
  const priority = document.getElementById('projectsPriorityFilter').value;

  const filtered = STATE.projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      (p.description && p.description.toLowerCase().includes(search));

    const matchesStatus = status === 'all' || p.status === status;
    const matchesPriority = priority === 'all' || p.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  renderProjectsGrid(filtered);
}

function openCreateProjectModal() {
  document.getElementById('createProjectForm').reset();
  UI.openModal('modalCreateProject');
}

async function handleCreateProjectSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('cpName').value.trim();
  const description = document.getElementById('cpDescription').value.trim();
  const category = document.getElementById('cpCategory').value;
  const priority = document.getElementById('cpPriority').value;
  const deadline = document.getElementById('cpDeadline').value || null;
  const color = document.getElementById('cpColor').value;

  try {
    const res = await API.post('/projects', {
      name,
      description,
      category,
      priority,
      deadline,
      color,
    });

    UI.closeModal('modalCreateProject');
    UI.showToast(`Project "${name}" created!`, 'success');

    // Reload projects and switch directly to its board
    await loadProjects();
    openProjectBoard(res.project._id);
  } catch (error) {
    UI.showToast(error.message, 'error', 'Creation Failed');
  }
}

function openEditProjectModal() {
  const project = STATE.currentProject;
  if (!project) return;

  document.getElementById('epId').value = project._id;
  document.getElementById('epName').value = project.name || '';
  document.getElementById('epDescription').value = project.description || '';
  document.getElementById('epStatus').value = project.status || 'Active';
  document.getElementById('epPriority').value = project.priority || 'Medium';
  document.getElementById('epCategory').value = project.category || 'General';

  if (project.deadline) {
    const d = new Date(project.deadline);
    document.getElementById('epDeadline').value = d.toISOString().split('T')[0];
  } else {
    document.getElementById('epDeadline').value = '';
  }

  UI.openModal('modalEditProject');
}

async function handleEditProjectSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('epId').value;
  const name = document.getElementById('epName').value.trim();
  const description = document.getElementById('epDescription').value.trim();
  const status = document.getElementById('epStatus').value;
  const priority = document.getElementById('epPriority').value;
  const category = document.getElementById('epCategory').value;
  const deadline = document.getElementById('epDeadline').value || null;

  try {
    const res = await API.put(`/projects/${id}`, {
      name,
      description,
      status,
      priority,
      category,
      deadline,
    });

    UI.closeModal('modalEditProject');
    UI.showToast('Project updated successfully', 'success');

    STATE.currentProject = res.project;
    updateBoardHeaderUI(res.project);
    loadProjects();
  } catch (error) {
    UI.showToast(error.message, 'error', 'Update Failed');
  }
}

function confirmDeleteCurrentProject() {
  const project = STATE.currentProject;
  if (!project) return;

  UI.confirm(
    'Delete Project Permanently?',
    `Are you sure you want to delete "${project.name}" and all of its tasks and comments? This cannot be undone.`,
    async () => {
      try {
        await API.delete(`/projects/${project._id}`);
        UI.closeModal('modalEditProject');
        UI.showToast('Project deleted successfully', 'info');
        STATE.currentProject = null;
        await loadProjects();
        navigateTo('projects');
      } catch (error) {
        UI.showToast(error.message, 'error', 'Delete Failed');
      }
    }
  );
}

// Manage Team Modal
async function openManageTeamModal() {
  const project = STATE.currentProject;
  if (!project) return;

  try {
    // Refresh project details to get latest members
    const res = await API.get(`/projects/${project._id}`);
    STATE.currentProject = res.project;
    renderProjectMembersList(res.project.members || []);

    // Populate user select dropdown with workspace users not yet in project
    await populateAddMemberSelect(res.project.members || []);

    // Load invitations
    loadProjectInvitations(res.project._id);

    UI.openModal('modalManageTeam');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

function renderProjectMembersList(members) {
  const container = document.getElementById('projectMemberList');
  if (!container) return;

  const currentUserId = STATE.getUser()?._id;
  const isOwner = STATE.currentProject?.owner?._id === currentUserId || STATE.currentProject?.owner === currentUserId;

  container.innerHTML = members
    .map((m) => {
      const u = m.user;
      if (!u) return '';
      const isThisOwner = m.role === 'owner' || (STATE.currentProject?.owner?._id === u._id);

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #ffffff; border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img class="avatar" src="${UI.getAvatar(u)}" style="width: 32px; height: 32px;" alt="Avatar">
            <div>
              <div style="font-size: 13px; font-weight: 600;">${UI.escapeHTML(u.name)}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${UI.escapeHTML(u.email)}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-tag" style="text-transform: capitalize;">${m.role}</span>
            ${
              !isThisOwner && isOwner
                ? `<button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: 4px;" onclick="handleRemoveMemberFromProject('${u._id}')">Remove</button>`
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('');
}

async function populateAddMemberSelect(existingMembers) {
  const select = document.getElementById('teamAddUserSelect');
  if (!select) return;

  try {
    if (STATE.allUsers.length === 0) {
      const res = await API.get('/users');
      STATE.allUsers = res.users || [];
    }

    const existingIds = new Set(existingMembers.map((m) => (m.user ? m.user._id : m.user)));
    const eligible = STATE.allUsers.filter((u) => !existingIds.has(u._id));

    select.innerHTML = '<option value="">Select team member...</option>' +
      eligible
        .map((u) => `<option value="${u._id}">${UI.escapeHTML(u.name)} (${UI.escapeHTML(u.jobTitle || u.role)})</option>`)
        .join('');
  } catch (error) {
    console.error(error);
  }
}

async function handleAddMemberToProject() {
  const userId = document.getElementById('teamAddUserSelect').value;
  const role = document.getElementById('teamAddRoleSelect').value;

  if (!userId) {
    UI.showToast('Please select a user to add', 'warning');
    return;
  }

  try {
    const res = await API.post(`/projects/${STATE.currentProject._id}/members`, {
      userId,
      role,
    });

    STATE.currentProject = res.project;
    UI.showToast(res.message, 'success');
    renderProjectMembersList(res.project.members || []);
    await populateAddMemberSelect(res.project.members || []);
    updateBoardHeaderUI(res.project);
  } catch (error) {
    UI.showToast(error.message, 'error', 'Could Not Add Member');
  }
}

async function handleRemoveMemberFromProject(userId) {
  UI.confirm('Remove Team Member?', 'Are you sure you want to remove this member from the project?', async () => {
    try {
      await API.delete(`/projects/${STATE.currentProject._id}/members/${userId}`);
      UI.showToast('Member removed from project', 'info');

      // Refresh
      const res = await API.get(`/projects/${STATE.currentProject._id}`);
      STATE.currentProject = res.project;
      renderProjectMembersList(res.project.members || []);
      await populateAddMemberSelect(res.project.members || []);
      updateBoardHeaderUI(res.project);
    } catch (error) {
      UI.showToast(error.message, 'error', 'Could Not Remove Member');
    }
  });
}

async function handleSendProjectInvitation() {
  const emailInput = document.getElementById('inviteEmailInput');
  const roleSelect = document.getElementById('inviteRoleSelect');
  if (!emailInput || !emailInput.value.trim() || !STATE.currentProject) {
    UI.showToast('Please enter an email address to invite', 'warning');
    return;
  }
  const email = emailInput.value.trim();
  const role = roleSelect ? roleSelect.value : 'member';

  try {
    const res = await API.post(`/projects/${STATE.currentProject._id}/invitations`, { email, role });
    UI.showToast(`Invitation sent to ${email} as ${role}!`, 'success', 'Invitation Sent');
    emailInput.value = '';
    loadProjectInvitations(STATE.currentProject._id);
  } catch (error) {
    UI.showToast(error.message, 'error', 'Invite Failed');
  }
}

async function loadProjectInvitations(projectId) {
  const container = document.getElementById('projectInvitationsList');
  if (!container) return;
  try {
    const res = await API.get(`/projects/${projectId}/invitations`);
    const invites = res.invitations || [];
    if (invites.length === 0) {
      container.innerHTML = '<div style="font-size:11px; color:var(--text-muted); font-style:italic;">No pending invitations</div>';
      return;
    }
    container.innerHTML = `
      <div style="font-size:12px; font-weight:600; margin-bottom:6px; color:var(--text-main);">Pending Email Invitations (${invites.length}):</div>
      ${invites.map((inv) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 10px; background:#fff; border:1px solid var(--border-light); border-radius:4px; margin-bottom:4px; font-size:12px;">
          <span>📧 <strong>${UI.escapeHTML(inv.email)}</strong> (${inv.role})</span>
          <span class="badge-tag" style="background:#fef3c7; color:#92400e;">Pending</span>
        </div>
      `).join('')}
    `;
  } catch (err) {
    console.warn('Failed to load invitations:', err);
  }
}

window.loadProjects = loadProjects;
window.renderProjectsGrid = renderProjectsGrid;
window.handleProjectsFilter = handleProjectsFilter;
window.openCreateProjectModal = openCreateProjectModal;
window.handleCreateProjectSubmit = handleCreateProjectSubmit;
window.openEditProjectModal = openEditProjectModal;
window.handleEditProjectSubmit = handleEditProjectSubmit;
window.confirmDeleteCurrentProject = confirmDeleteCurrentProject;
window.openManageTeamModal = openManageTeamModal;
window.handleAddMemberToProject = handleAddMemberToProject;
window.handleRemoveMemberFromProject = handleRemoveMemberFromProject;
window.handleSendProjectInvitation = handleSendProjectInvitation;
window.loadProjectInvitations = loadProjectInvitations;
