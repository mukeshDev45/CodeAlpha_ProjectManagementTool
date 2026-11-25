// ProjectFlow User Profile & Security Controller

function populateProfileUI(user, stats = null) {
  if (!user) return;

  const avatarUrl = UI.getAvatar(user);
  const avatarPreview = document.getElementById('profAvatarPreview');
  const cardName = document.getElementById('profCardName');
  const cardEmail = document.getElementById('profCardEmail');
  const cardRole = document.getElementById('profCardRoleBadge');
  const cardJob = document.getElementById('profCardJobTitle');
  const cardJoined = document.getElementById('profCardJoinedDate');

  if (avatarPreview) avatarPreview.src = avatarUrl;
  if (cardName) cardName.textContent = user.name || 'User';
  if (cardEmail) cardEmail.textContent = user.email || '';
  if (cardRole) cardRole.textContent = (user.role || 'Member').toUpperCase();
  if (cardJob) cardJob.textContent = user.jobTitle || 'Team Member';
  if (cardJoined) {
    cardJoined.textContent = user.createdAt
      ? `Member since ${UI.formatDate(user.createdAt)}`
      : 'Active Member';
  }

  if (stats) {
    const pCount = document.getElementById('profCardProjectsCount');
    const tCount = document.getElementById('profCardTasksCount');
    const cCount = document.getElementById('profCardCompletedTasksCount');
    if (pCount) pCount.textContent = stats.projects !== undefined ? stats.projects : 0;
    if (tCount) tCount.textContent = stats.assignedTasks !== undefined ? stats.assignedTasks : 0;
    if (cCount) cCount.textContent = stats.completedTasks !== undefined ? stats.completedTasks : 0;
  }

  // Populate Personal Details Form
  const pName = document.getElementById('profName');
  const pEmail = document.getElementById('profEmail');
  const pRole = document.getElementById('profRoleSelect');
  const pJobTitle = document.getElementById('profJobTitle');
  const pAvatar = document.getElementById('profAvatarUrl');
  const pBio = document.getElementById('profBio');

  if (pName) pName.value = user.name || '';
  if (pEmail) pEmail.value = user.email || '';
  if (pRole) pRole.value = user.role || 'member';
  if (pJobTitle) pJobTitle.value = user.jobTitle || '';
  if (pAvatar) pAvatar.value = user.avatar || '';
  if (pBio) pBio.value = user.bio || '';

  // Also sync sidebar mini-profile
  renderCurrentUserInUI();
}

async function loadProfileView() {
  // Step 1: Immediately render existing cached user from STATE/localStorage with ZERO latency
  let user = STATE.getUser();
  if (user) {
    populateProfileUI(user);
  }

  // Step 2: Fetch fresh data and stats from MongoDB in parallel
  try {
    const res = await API.get('/auth/me');
    if (res && res.success && res.user) {
      user = res.user;
      STATE.setUser(user);
      populateProfileUI(user);
    }

    if (user && user._id) {
      try {
        const statsRes = await API.get(`/users/${user._id}`);
        if (statsRes && statsRes.success && statsRes.stats) {
          populateProfileUI(user, statsRes.stats);
        }
      } catch (e) {
        console.warn('Could not fetch user stats:', e.message);
      }
    }
  } catch (error) {
    console.error('Failed to refresh profile from server:', error.message);
  }
}

function selectAvatarPreset(url) {
  const avatarInput = document.getElementById('profAvatarUrl');
  const avatarPreview = document.getElementById('profAvatarPreview');
  if (avatarInput) avatarInput.value = url;
  if (avatarPreview) avatarPreview.src = url;
  UI.showToast('Avatar selected! Click "Save Profile Changes" to save to MongoDB.', 'info');
}

function previewAvatar(url) {
  const avatarPreview = document.getElementById('profAvatarPreview');
  if (avatarPreview && url && url.startsWith('http')) {
    avatarPreview.src = url;
  }
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('profName').value.trim();
  const jobTitle = document.getElementById('profJobTitle').value.trim();
  const bio = document.getElementById('profBio').value.trim();
  const avatar = document.getElementById('profAvatarUrl').value.trim();
  const role = document.getElementById('profRoleSelect').value;
  const btn = document.getElementById('btnSaveProfile');

  if (!name || name.length < 2) {
    UI.showToast('Please provide your valid full name (at least 2 characters)', 'warning', 'Validation Error');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving Changes...';
    }

    const res = await API.put('/auth/profile', {
      name,
      jobTitle,
      bio,
      avatar,
      role,
    });

    if (res && res.success && res.user) {
      STATE.setUser(res.user);

      // Re-populate Hero card and Form immediately
      populateProfileUI(res.user);
      renderCurrentUserInUI();

      UI.showToast('Profile changes saved successfully to MongoDB!', 'success');
    }
  } catch (error) {
    UI.showToast(error.message, 'error', 'Profile Update Failed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Save Profile Changes';
    }
  }
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  const currentPassword = document.getElementById('currentPass').value;
  const newPassword = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  const btn = document.getElementById('btnUpdatePassword');

  if (!currentPassword || !newPassword || !confirmPass) {
    UI.showToast('Please fill in all password fields', 'warning');
    return;
  }

  if (newPassword.length < 6) {
    UI.showToast('New password must be at least 6 characters long', 'warning');
    return;
  }

  if (newPassword !== confirmPass) {
    UI.showToast('New passwords do not match! Please check and retry.', 'error', 'Validation Error');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Updating Password...';
    }

    const res = await API.put('/auth/password', { currentPassword, newPassword });
    if (res && res.token) {
      API.setToken(res.token);
    }

    document.getElementById('passwordForm').reset();
    UI.showToast('Password updated successfully and stored securely in MongoDB!', 'success');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Password Change Failed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Update Password';
    }
  }
}

window.populateProfileUI = populateProfileUI;
window.loadProfileView = loadProfileView;
window.selectAvatarPreset = selectAvatarPreset;
window.previewAvatar = previewAvatar;
window.handleProfileSubmit = handleProfileSubmit;
window.handlePasswordSubmit = handlePasswordSubmit;
