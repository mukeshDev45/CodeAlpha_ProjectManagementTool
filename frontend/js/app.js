// ProjectFlow Application Master Bootstrapper

const VALID_VIEWS = ['dashboard', 'projects', 'board', 'mytasks', 'team', 'calendar', 'analytics', 'audit', 'notifications', 'profile'];

function navigateTo(viewName) {
  if (!VALID_VIEWS.includes(viewName)) {
    viewName = 'dashboard';
  }

  STATE.activeView = viewName;

  // Update URL hash for persistent browser navigation and bookmarking
  if (window.location.hash !== `#/${viewName}`) {
    history.pushState(null, '', `#/${viewName}`);
  }

  // Update Sidebar active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    }
  });

  // Hide all sections, display the active one
  document.querySelectorAll('.page-view').forEach((view) => {
    view.classList.remove('active');
  });

  const activeSection = document.getElementById(`view-${viewName}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Scroll main content area to top on view change
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
  window.scrollTo(0, 0);

  // Update Top Navbar Title & Breadcrumbs
  const titleEl = document.getElementById('navbarPageTitle');
  const breadcrumbEl = document.getElementById('navbarPageBreadcrumb');

  const titles = {
    dashboard: { title: 'Dashboard', crumb: 'Workspace • Overview' },
    projects: { title: 'Projects', crumb: 'Workspace • Group Projects' },
    board: { title: STATE.currentProject ? STATE.currentProject.name : 'Kanban Board', crumb: 'Project • Tasks Board' },
    mytasks: { title: 'My Tasks', crumb: 'Personal • Assigned Work' },
    team: { title: 'Team Directory', crumb: 'Organization • Members' },
    calendar: { title: 'Calendar View', crumb: 'Planning • Task Deadlines' },
    analytics: { title: 'Analytics & Reports', crumb: 'Insights • Velocity & Progress' },
    audit: { title: 'Audit Trail', crumb: 'Security • Workspace Logs' },
    notifications: { title: 'Notifications', crumb: 'Alerts & Messages' },
    profile: { title: 'Profile & Settings', crumb: 'Account • Credentials' },
  };

  const current = titles[viewName] || { title: 'Project Management Tool', crumb: 'Workspace' };
  if (titleEl) titleEl.textContent = current.title;
  if (breadcrumbEl) breadcrumbEl.textContent = current.crumb;

  // Close mobile sidebar if open
  toggleSidebar(false);

  // Load view-specific data
  switch (viewName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'projects':
      loadProjects();
      break;
    case 'board':
      loadBoardView();
      break;
    case 'mytasks':
      loadMyTasks();
      break;
    case 'team':
      loadTeamMembers();
      break;
    case 'calendar':
      loadCalendarView();
      break;
    case 'analytics':
      loadAnalyticsData();
      break;
    case 'audit':
      loadAuditLogs(1);
      break;
    case 'notifications':
      loadNotifications();
      break;
    case 'profile':
      if (typeof loadProfileView === 'function') {
        loadProfileView();
      } else {
        renderCurrentUserInUI();
      }
      break;
  }
}

async function loadBoardView() {
  if (STATE.currentProject) {
    updateBoardHeaderUI(STATE.currentProject);
    renderKanbanCards();
  } else {
    // If projects are not yet in state, fetch them first
    if (!STATE.projects || STATE.projects.length === 0) {
      await loadProjects();
    }
    if (STATE.projects && STATE.projects.length > 0) {
      openProjectBoard(STATE.projects[0]._id);
    } else {
      navigateTo('projects');
    }
  }
}

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (open) {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  } else {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }
}

async function initAuthenticatedApp() {
  document.getElementById('authView').style.display = 'none';
  document.getElementById('appShell').style.display = 'flex';

  renderCurrentUserInUI();
  initSocketConnection();

  // Load essential initial data
  await loadProjects();
  loadDashboardData();
  loadNotifications();
  loadMyTasks();

  // Check if browser URL already has a target hash (e.g. #/profile or #/board)
  const currentHash = window.location.hash.replace('#/', '').trim();
  if (currentHash && VALID_VIEWS.includes(currentHash)) {
    navigateTo(currentHash);
  } else {
    navigateTo('dashboard');
  }
}

// Browser back and forward button handler
window.addEventListener('popstate', () => {
  const currentHash = window.location.hash.replace('#/', '').trim();
  if (currentHash && VALID_VIEWS.includes(currentHash)) {
    navigateTo(currentHash);
  }
});

// Global modal background click close handler
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Global ESC key modal close handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach((m) => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});

// App startup
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
});

window.navigateTo = navigateTo;
window.loadBoardView = loadBoardView;
window.toggleSidebar = toggleSidebar;
window.initAuthenticatedApp = initAuthenticatedApp;
