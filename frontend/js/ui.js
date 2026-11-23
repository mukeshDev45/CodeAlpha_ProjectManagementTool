// ProjectFlow UI Components & Utilities
const UI = {
  // Toast Notification System
  showToast(message, type = 'info', title = '', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
    };

    const finalTitle = title || titles[type] || 'Notice';

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${this.escapeHTML(finalTitle)}</div>
        <div class="toast-message">${this.escapeHTML(message)}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  // Modal Open / Close
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // Confirmation Modal
  confirm(title, message, onConfirm) {
    const titleEl = document.getElementById('confirmModalTitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const btn = document.getElementById('confirmModalActionBtn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (btn) {
      // Remove old listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.onclick = () => {
        this.closeModal('modalConfirm');
        if (typeof onConfirm === 'function') onConfirm();
      };
    }

    this.openModal('modalConfirm');
  },

  // HTML Escaping
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Relative Time Formatter (e.g. "5m ago", "2h ago", "yesterday")
  timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 30) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  // Date Formatter (e.g. "Dec 15, 2026")
  formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  // Avatar Helper
  getAvatar(user) {
    if (user && user.avatar) return user.avatar;
    const name = user ? user.name || 'User' : 'User';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=4f46e5,0ea5e9,10b981,8b5cf6`;
  },

  // Due Date & Overdue Status Calculator
  getDueDateStatus(dateString, status) {
    if (status === 'Completed') {
      return {
        text: 'Completed',
        className: 'due-completed',
        icon: '✅',
        badge: `<span class="due-badge due-completed">✅ Completed</span>`,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: false,
      };
    }
    if (!dateString) {
      return {
        text: 'No deadline',
        className: 'due-none',
        icon: '📅',
        badge: `<span class="due-badge due-none">📅 No deadline</span>`,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: false,
      };
    }
    const due = new Date(dateString);
    if (isNaN(due)) {
      return {
        text: 'Invalid date',
        className: 'due-none',
        icon: '📅',
        badge: `<span class="due-badge due-none">📅 Invalid date</span>`,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: false,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateClean = new Date(due);
    dueDateClean.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDateClean - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOver = Math.abs(diffDays);
      const text = daysOver === 1 ? 'Overdue (1d ago)' : `Overdue (${daysOver}d ago)`;
      return {
        text,
        className: 'due-overdue',
        icon: '⚠️',
        badge: `<span class="due-badge due-overdue" title="${text}">⚠️ ${text}</span>`,
        isOverdue: true,
        isDueToday: false,
        isDueSoon: false,
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Due Today',
        className: 'due-today',
        icon: '⏰',
        badge: `<span class="due-badge due-today" title="Due today">⏰ Due Today</span>`,
        isOverdue: false,
        isDueToday: true,
        isDueSoon: true,
      };
    }
    if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        className: 'due-tomorrow',
        icon: '⏳',
        badge: `<span class="due-badge due-tomorrow" title="Due tomorrow">⏳ Due Tomorrow</span>`,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: true,
      };
    }
    if (diffDays <= 3) {
      return {
        text: `Due in ${diffDays}d`,
        className: 'due-soon',
        icon: '⏳',
        badge: `<span class="due-badge due-soon" title="Due in ${diffDays} days">⏳ Due in ${diffDays}d</span>`,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: true,
      };
    }

    const formatted = this.formatDate(dateString);
    return {
      text: formatted,
      className: 'due-normal',
      icon: '📅',
      badge: `<span class="due-badge due-normal">📅 ${formatted}</span>`,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
    };
  },
};

window.UI = UI;
window.openModal = UI.openModal.bind(UI);
window.closeModal = UI.closeModal.bind(UI);
