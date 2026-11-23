// ProjectFlow User Profile & Security Controller

async function loadProfileView() {
  try {
    // 1. Fetch fresh authenticated user details from MongoDB
    const res = await API.get('/auth/me');
    if (!res.success || !res.user) return;

    const user = res.user;
    STATE.setUser(user);

    // 2. Fetch user stats (projects, assigned tasks, completed tasks)
    let stats = { projects: 0, assignedTasks: 0, completedTasks: 0 };
    try {
      const statsRes = await API.get(`/users/${user._id}`);
      if (statsRes.success && statsRes.stats) {
        stats = statsRes.stats;
      }
    } catch (e) {
      console.warn('Could not fetch user stats:', e.message);
    }

    // 3. Populate Hero Profile Card
    const avatarUrl = UI.getAvatar(user);
    const avatarPreview = document.getElementById('profAvatarPreview');
    const cardName = document.getElementById('profCardName');
    const cardEmail = document.getElementById('profCardEmail');
    const cardRole = document.getElementById('profCardRoleBadge');
    const cardJob = document.getElementById('profCardJobTitle');
    const cardJoined = document.getElementById('profCardJoinedDate');
    const pCount = document.getElementById('profCardProjectsCount');
    const tCount = document.getElementById('profCardTasksCount');
    const cCount = document.getElementById('profCardCompletedTasksCount');

    if (avatarPreview) avatarPreview.src = avatarUrl;
    if (cardName) cardName.textContent = user.name || 'User';
    if (cardEmail) cardEmail.textContent = user.email || '';
    if (cardRole) cardRole.textContent = (user.role || 'Member').toUpperCase();
    if (cardJob) cardJob.textContent = user.jobTitle || 'Team Member';
    if (cardJoined) cardJoined.textContent = `Member since ${UI.formatDate(user.createdAt)}`;
    if (pCount) pCount.textContent = stats.projects;
    if (tCount) tCount.textContent = stats.assignedTasks;
    if (cCount) cCount.textContent = stats.completedTasks;

    // 4. Populate Personal Details Form
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

    // Also update sidebar mini-profile
    renderCurrentUserInUI();
  } catch (error) {
    console.error('Failed to load profile view:', error.message);
    UI.showToast(error.message, 'error', 'Profile Load Error');
  }
}

function selectAvatarPreset(url) {
  const avatarInput = document.getElementById('profAvatarUrl');
  const avatarPreview = document.getElementById('profAvatarPreview');
  if (avatarInput) avatarInput.value = url;
  if (avatarPreview) avatarPreview.src = url;
  UI.showToast('Avatar selected! Click "Save Profile Changes" to confirm.', 'info');
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

  if (!name) {
    UI.showToast('Please provide your full name', 'warning');
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

    STATE.setUser(res.user);

    // Update Hero card and UI
    loadProfileView();
    renderCurrentUserInUI();

    UI.showToast('Profile changes saved successfully to MongoDB!', 'success');
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
      btn.innerHTML = '<span class="spinner"></span> Updating...';
    }

    const res = await API.put('/auth/password', { currentPassword, newPassword });
    API.setToken(res.token);

    document.getElementById('passwordForm').reset();
    UI.showToast('Password updated successfully and stored securely!', 'success');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Password Change Failed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Update Password';
    }
  }
}

window.loadProfileView = loadProfileView;
window.selectAvatarPreset = selectAvatarPreset;
window.previewAvatar = previewAvatar;
window.handleProfileSubmit = handleProfileSubmit;
window.handlePasswordSubmit = handlePasswordSubmit;
