// Global Client State Management
const STATE = {
  currentUser: null,
  activeView: 'dashboard',
  projects: [],
  currentProject: null,
  currentTasks: [],
  activeTask: null,
  allUsers: [],
  notifications: [],
  unreadNotifsCount: 0,

  setUser(user) {
    this.currentUser = user;
    if (user) {
      if (user.name === 'Alex Johnson' || user.name === 'Alex') {
        user.name = 'Mukesh Prajapati';
      }
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
      if (typeof renderCurrentUserInUI === 'function') {
        renderCurrentUserInUI();
      }
    } else {
      localStorage.removeItem(CONFIG.USER_KEY);
    }
  },

  getUser() {
    if (!this.currentUser) {
      const stored = localStorage.getItem(CONFIG.USER_KEY);
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          if (this.currentUser && (this.currentUser.name === 'Alex Johnson' || this.currentUser.name === 'Alex')) {
            this.currentUser.name = 'Mukesh Prajapati';
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(this.currentUser));
          }
        } catch (e) {
          this.currentUser = null;
        }
      }
    }
    return this.currentUser;
  },

  setCurrentProject(project) {
    this.currentProject = project;
  },

  setTasks(tasks) {
    this.currentTasks = tasks || [];
  },

  updateTaskInState(updatedTask) {
    const idx = this.currentTasks.findIndex((t) => t._id === updatedTask._id);
    if (idx !== -1) {
      this.currentTasks[idx] = { ...this.currentTasks[idx], ...updatedTask };
    } else {
      this.currentTasks.push(updatedTask);
    }
    if (this.activeTask && this.activeTask._id === updatedTask._id) {
      this.activeTask = { ...this.activeTask, ...updatedTask };
    }
  },

  removeTaskFromState(taskId) {
    this.currentTasks = this.currentTasks.filter((t) => t._id !== taskId);
    if (this.activeTask && this.activeTask._id === taskId) {
      this.activeTask = null;
    }
  },
};

window.STATE = STATE;
