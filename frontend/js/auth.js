// ProjectFlow Authentication & Profile Handling

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tabBtnLogin');
  const regTab = document.getElementById('tabBtnRegister');
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.classList.add('active');
    regForm.classList.remove('active');
  } else {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('btnLoginSubmit');

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing In...';

    const res = await API.post('/auth/login', { email, password });
    API.setToken(res.token);
    STATE.setUser(res.user);

    UI.showToast(`Welcome back, ${res.user.name}!`, 'success');
    initAuthenticatedApp();
  } catch (error) {
    UI.showToast(error.message, 'error', 'Login Failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Sign In to Workspace';
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const jobTitle = document.getElementById('regJobTitle').value.trim();
  const btn = document.getElementById('btnRegisterSubmit');

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating Account...';

    const res = await API.post('/auth/register', {
      name,
      email,
      password,
      role,
      jobTitle: jobTitle || 'Team Member',
    });

    API.setToken(res.token);
    STATE.setUser(res.user);

    UI.showToast(`Account created successfully! Welcome, ${res.user.name}.`, 'success');
    initAuthenticatedApp();
  } catch (error) {
    UI.showToast(error.message, 'error', 'Registration Failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Create Free Account';
  }
}

async function quickDemoLogin(email) {
  try {
    const res = await API.post('/auth/login', {
      email,
      password: 'password123',
    });

    API.setToken(res.token);
    STATE.setUser(res.user);

    UI.showToast(`Logged in as demo user: ${res.user.name}`, 'success');
    initAuthenticatedApp();
  } catch (error) {
    UI.showToast(error.message, 'error', 'Demo Login Failed');
  }
}

function handleLogout(isSilent = false) {
  API.setToken(null);
  STATE.setUser(null);
  if (window.SOCKET) {
    window.SOCKET.disconnect();
  }

  document.getElementById('appShell').style.display = 'none';
  document.getElementById('authView').style.display = 'flex';

  if (!isSilent) {
    UI.showToast('You have been signed out successfully.', 'info');
  }
}

async function checkAuthStatus() {
  const token = API.getToken();
  if (!token) {
    document.getElementById('authView').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
    return false;
  }

  try {
    const res = await API.get('/auth/me');
    STATE.setUser(res.user);
    initAuthenticatedApp();
    return true;
  } catch (error) {
    handleLogout(true);
    return false;
  }
}

function renderCurrentUserInUI() {
  const user = STATE.getUser();
  if (!user) return;

  const avatar = UI.getAvatar(user);

  // Sidebar User Card
  const sAvatar = document.getElementById('sidebarUserAvatar');
  const sName = document.getElementById('sidebarUserName');
  const sRole = document.getElementById('sidebarUserRole');

  if (sAvatar) sAvatar.src = avatar;
  if (sName) sName.textContent = user.name;
  if (sRole) sRole.textContent = user.jobTitle || user.role;

  // Comment avatar in task modal
  const cAvatar = document.getElementById('tdCurrentUserCommentAvatar');
  if (cAvatar) cAvatar.src = avatar;

  // Dashboard Welcome
  const dHeading = document.getElementById('dashWelcomeHeading');
  if (dHeading) dHeading.textContent = `Welcome back, ${user.name}!`;

  // Profile Form fields
  const pName = document.getElementById('profName');
  const pEmail = document.getElementById('profEmail');
  const pRole = document.getElementById('profRole');
  const pRoleSelect = document.getElementById('profRoleSelect');
  const pJobTitle = document.getElementById('profJobTitle');
  const pAvatar = document.getElementById('profAvatarUrl');
  const pAvatarPreview = document.getElementById('profAvatarPreview');
  const pBio = document.getElementById('profBio');

  if (pName) pName.value = user.name || '';
  if (pEmail) pEmail.value = user.email || '';
  if (pRole) pRole.value = (user.role || 'Member').toUpperCase();
  if (pRoleSelect) pRoleSelect.value = user.role || 'member';
  if (pJobTitle) pJobTitle.value = user.jobTitle || '';
  if (pAvatar) pAvatar.value = user.avatar || '';
  if (pAvatarPreview) pAvatarPreview.src = avatar;
  if (pBio) pBio.value = user.bio || '';
}

let activeResetToken = null;

function openForgotPasswordModal() {
  const loginEmailEl = document.getElementById('loginEmail');
  const forgotEmailEl = document.getElementById('forgotEmailInput');
  if (forgotEmailEl && loginEmailEl) {
    forgotEmailEl.value = loginEmailEl.value || '';
  }
  const reqArea = document.getElementById('forgotRequestArea');
  const rstArea = document.getElementById('forgotResetArea');
  if (reqArea) reqArea.style.display = 'block';
  if (rstArea) rstArea.style.display = 'none';
  UI.openModal('modalForgotPassword');
}

async function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('forgotEmailInput').value.trim();
  try {
    const res = await API.post('/auth/forgot-password', { email });
    activeResetToken = res.resetToken;
    const reqArea = document.getElementById('forgotRequestArea');
    const rstArea = document.getElementById('forgotResetArea');
    if (reqArea) reqArea.style.display = 'none';
    if (rstArea) rstArea.style.display = 'block';
    UI.showToast('Password reset link generated! Set your new password.', 'success');
  } catch (error) {
    UI.showToast(error.message, 'error', 'Reset Failed');
  }
}

async function handleResetPasswordSubmit(event) {
  event.preventDefault();
  const newPassword = document.getElementById('forgotNewPassword').value;
  if (!activeResetToken) {
    UI.showToast('Reset session expired, please request again', 'warning');
    return;
  }
  try {
    const res = await API.put(`/auth/reset-password/${activeResetToken}`, { password: newPassword });
    API.setToken(res.token);
    STATE.setUser(res.user);
    UI.closeModal('modalForgotPassword');
    UI.showToast('Password reset successfully! Logging you in.', 'success');
    initAuthenticatedApp();
  } catch (error) {
    UI.showToast(error.message, 'error', 'Reset Failed');
  }
}

window.switchAuthTab = switchAuthTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.quickDemoLogin = quickDemoLogin;
window.handleLogout = handleLogout;
window.checkAuthStatus = checkAuthStatus;
window.renderCurrentUserInUI = renderCurrentUserInUI;
window.openForgotPasswordModal = openForgotPasswordModal;
window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
window.handleResetPasswordSubmit = handleResetPasswordSubmit;
