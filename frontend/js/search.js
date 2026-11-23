// ProjectFlow Global Search Controller

let searchDebounceTimer = null;

function handleGlobalSearchInput(event) {
  const query = event.target.value.trim();
  clearTimeout(searchDebounceTimer);

  if (!query || query.length < 2) {
    hideGlobalSearchResults();
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    executeGlobalSearch(query);
  }, 250);
}

function handleGlobalSearchFocus() {
  const input = document.getElementById('globalSearchInput');
  if (input && input.value.trim().length >= 2) {
    const dropdown = document.getElementById('globalSearchResults');
    if (dropdown && dropdown.innerHTML.trim() !== '') {
      dropdown.style.display = 'block';
    }
  }
}

async function executeGlobalSearch(query) {
  const dropdown = document.getElementById('globalSearchResults');
  if (!dropdown) return;

  try {
    dropdown.innerHTML = '<div style="padding: 12px; font-size: 13px; color: var(--text-muted); text-align: center;">Searching...</div>';
    dropdown.style.display = 'block';

    const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
    const { projects = [], tasks = [], users = [] } = res.results || {};

    const total = projects.length + tasks.length + users.length;
    if (total === 0) {
      dropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No matching projects, tasks, or members found for "<strong>${UI.escapeHTML(query)}</strong>"
        </div>
      `;
      return;
    }

    let html = '';

    // Projects section
    if (projects.length > 0) {
      html += `<div class="search-category-title">Projects (${projects.length})</div>`;
      projects.forEach((p) => {
        html += `
          <div class="search-result-item" onclick="selectSearchResult('project', '${p._id}')">
            <div class="search-icon-box" style="background: ${p.color || '#4f46e5'}20; color: ${p.color || '#4f46e5'};">📁</div>
            <div style="flex: 1; overflow: hidden;">
              <div class="search-title">${UI.escapeHTML(p.name)}</div>
              <div class="search-subtitle">${UI.escapeHTML(p.category || 'Project')} &bull; Status: ${p.status || 'Active'}</div>
            </div>
          </div>
        `;
      });
    }

    // Tasks section
    if (tasks.length > 0) {
      html += `<div class="search-category-title">Tasks (${tasks.length})</div>`;
      tasks.forEach((t) => {
        const priorityColor = t.priority === 'High' ? 'var(--danger)' : t.priority === 'Medium' ? 'var(--warning)' : 'var(--success)';
        html += `
          <div class="search-result-item" onclick="selectSearchResult('task', '${t._id}')">
            <div class="search-icon-box" style="background: #eef2ff; color: var(--primary);">✓</div>
            <div style="flex: 1; overflow: hidden;">
              <div class="search-title">${UI.escapeHTML(t.title)}</div>
              <div class="search-subtitle">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${priorityColor}; margin-right:4px;"></span>
                ${t.status} &bull; ${t.project ? UI.escapeHTML(t.project.name || '') : 'Project'}
              </div>
            </div>
          </div>
        `;
      });
    }

    // Users / Team section
    if (users.length > 0) {
      html += `<div class="search-category-title">Team Members (${users.length})</div>`;
      users.forEach((u) => {
        html += `
          <div class="search-result-item" onclick="selectSearchResult('user', '${u._id}')">
            <img class="search-avatar" src="${UI.getAvatar(u)}" alt="${UI.escapeHTML(u.name)}">
            <div style="flex: 1; overflow: hidden;">
              <div class="search-title">${UI.escapeHTML(u.name)}</div>
              <div class="search-subtitle">${UI.escapeHTML(u.role || 'Member')} &bull; ${UI.escapeHTML(u.email || '')}</div>
            </div>
          </div>
        `;
      });
    }

    dropdown.innerHTML = html;
  } catch (error) {
    console.error('Search error:', error);
    dropdown.innerHTML = `<div style="padding: 12px; font-size: 13px; color: var(--danger); text-align: center;">Search failed</div>`;
  }
}

function selectSearchResult(type, id) {
  hideGlobalSearchResults();
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = '';

  if (type === 'project') {
    openProjectBoard(id);
  } else if (type === 'task') {
    openTaskDetailsModalById(id);
  } else if (type === 'user') {
    navigateTo('team');
  }
}

function hideGlobalSearchResults() {
  const dropdown = document.getElementById('globalSearchResults');
  if (dropdown) dropdown.style.display = 'none';
}

// Global keyboard shortcut (Ctrl+K or Cmd+K) to focus search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.focus();
      input.select();
    }
  } else if (e.key === 'Escape') {
    hideGlobalSearchResults();
  }
});

// Close search dropdown on click outside
document.addEventListener('click', (e) => {
  const container = document.querySelector('.global-search-container');
  if (container && !container.contains(e.target)) {
    hideGlobalSearchResults();
  }
});
