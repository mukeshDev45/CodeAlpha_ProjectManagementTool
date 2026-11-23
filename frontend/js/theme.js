// ProjectFlow Theme Controller (Dark / Light Mode)

const THEME_KEY = 'pf_theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon('☀️');
  } else {
    document.documentElement.removeAttribute('data-theme');
    updateThemeIcon('🌙');
  }
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  UI.showToast(`Switched to ${newTheme} mode`, 'info', 'Theme');
}

function updateThemeIcon(icon) {
  const iconEl = document.getElementById('themeToggleIcon');
  if (iconEl) {
    iconEl.textContent = icon;
  }
}

// Auto-initialize theme on script execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
