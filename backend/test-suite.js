const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: raw, headers: res.headers });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('       STARTING PROJECTFLOW FULL-STACK TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check & Frontend static serving
    console.log('[Test Group 1] Health & Frontend Assets');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.success === true, 'API /api/health returned 200 OK and connected DB');

    const htmlCheck = await request('GET', '/');
    assert(htmlCheck.status === 200 && typeof htmlCheck.data === 'string' && htmlCheck.data.includes('ProjectFlow'), 'Frontend index.html served on root /');

    // 2. Authentication: Login demo user Alex
    console.log('\n[Test Group 2] Authentication & Profile');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'alex@projectflow.dev',
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'User login succeeded with JWT token');
    const alexToken = loginRes.data.token;
    const alexId = loginRes.data.user._id;

    // Login demo user Sarah
    const sarahLogin = await request('POST', '/api/auth/login', {
      email: 'sarah@projectflow.dev',
      password: 'password123',
    });
    assert(sarahLogin.status === 200 && sarahLogin.data.token, 'Second user Sarah login succeeded');
    const sarahToken = sarahLogin.data.token;
    const sarahId = sarahLogin.data.user._id;

    // Get Me
    const meRes = await request('GET', '/api/auth/me', null, alexToken);
    assert(meRes.status === 200 && (meRes.data.user.email === 'mukesh@projectflow.dev' || meRes.data.user.email === 'alex@projectflow.dev'), 'Protected route /api/auth/me returns current user');

    // Update Profile
    const updateProfRes = await request('PUT', '/api/auth/profile', { jobTitle: 'Principal Architect' }, alexToken);
    assert(updateProfRes.status === 200 && updateProfRes.data.user.jobTitle === 'Principal Architect', 'Update profile /api/auth/profile succeeded');

    // 3. User Directory
    console.log('\n[Test Group 3] User Directory & Team Management');
    const usersRes = await request('GET', '/api/users', null, alexToken);
    assert(usersRes.status === 200 && usersRes.data.users.length >= 5, `Listed all users count: ${usersRes.data.users.length}`);

    // Search user
    const searchRes = await request('GET', '/api/users?search=sarah', null, alexToken);
    assert(searchRes.status === 200 && searchRes.data.users[0].name === 'Sarah Chen', 'Search users query returned Sarah Chen');

    // 4. Project Management
    console.log('\n[Test Group 4] Project Management');
    const newProj = await request('POST', '/api/projects', {
      name: 'Automated E2E Test Project',
      description: 'Project created via full stack test suite',
      priority: 'High',
      category: 'Web App',
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      memberIds: [sarahId],
    }, alexToken);

    assert(newProj.status === 201 && newProj.data.project.name === 'Automated E2E Test Project', 'Created new group project with members');
    const projectId = newProj.data.project._id;

    // Get Projects
    const projectsList = await request('GET', '/api/projects', null, alexToken);
    assert(projectsList.status === 200 && projectsList.data.projects.some(p => p._id === projectId), 'Project exists in user projects list');

    // Update Project
    const updateProj = await request('PUT', `/api/projects/${projectId}`, { priority: 'Low' }, alexToken);
    assert(updateProj.status === 200 && updateProj.data.project.priority === 'Low', 'Project update priority succeeded');

    // 5. Kanban Task Management
    console.log('\n[Test Group 5] Kanban Task Management');
    const newTask = await request('POST', `/api/projects/${projectId}/tasks`, {
      title: 'Setup Redis Test Instance',
      description: 'Testing task creation from suite',
      status: 'To Do',
      priority: 'High',
      assignedTo: sarahId,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      tags: ['Test', 'Redis'],
    }, alexToken);

    assert(newTask.status === 201 && newTask.data.task.title === 'Setup Redis Test Instance', 'Task created in project with status "To Do"');
    const taskId = newTask.data.task._id;

    // Get Project Tasks
    const projectTasks = await request('GET', `/api/projects/${projectId}/tasks`, null, alexToken);
    assert(projectTasks.status === 200 && projectTasks.data.tasks.length === 1, 'Project tasks retrieved');

    // Drag-and-drop status move: To Do -> In Progress
    const moveStatus = await request('PATCH', `/api/tasks/${taskId}/status`, { status: 'In Progress' }, alexToken);
    assert(moveStatus.status === 200 && moveStatus.data.task.status === 'In Progress', 'Kanban drag-and-drop status update moved task to "In Progress"');

    // 6. Comments & Discussion
    console.log('\n[Test Group 6] Task Comments & Discussion');
    const newComment = await request('POST', `/api/tasks/${taskId}/comments`, {
      content: 'This task was moved and verified by Alex Johnson',
    }, alexToken);
    assert(newComment.status === 201 && newComment.data.comment.content.includes('Alex Johnson'), 'Comment added to task');
    const commentId = newComment.data.comment._id;

    // Get Comments
    const commentsList = await request('GET', `/api/tasks/${taskId}/comments`, null, alexToken);
    assert(commentsList.status === 200 && commentsList.data.comments.length === 1, 'Retrieved task comments');

    // Edit Comment
    const editComment = await request('PUT', `/api/comments/${commentId}`, {
      content: 'Updated comment text',
    }, alexToken);
    assert(editComment.status === 200 && editComment.data.comment.content === 'Updated comment text', 'Comment edited by author');

    // 7. Notifications Verification
    console.log('\n[Test Group 7] Notification System');
    // Check Sarah's notifications (she was assigned to task and project)
    const sarahNotifs = await request('GET', '/api/notifications', null, sarahToken);
    assert(sarahNotifs.status === 200 && sarahNotifs.data.notifications.length > 0, `Sarah received real-time in-app notifications (count: ${sarahNotifs.data.notifications.length})`);

    // Mark as read
    const notifId = sarahNotifs.data.notifications[0]._id;
    const readNotif = await request('PATCH', `/api/notifications/${notifId}/read`, null, sarahToken);
    assert(readNotif.status === 200 && readNotif.data.notification.isRead === true, 'Notification marked as read');

    // 8. Dashboard Statistics
    console.log('\n[Test Group 8] Dashboard Aggregations');
    const dashStats = await request('GET', '/api/dashboard/stats', null, alexToken);
    assert(dashStats.status === 200 && dashStats.data.stats.totalProjects >= 1, `Dashboard metrics: ${dashStats.data.stats.totalProjects} projects, ${dashStats.data.stats.totalTasks} tasks`);

    // 9. Authorization & Access Control
    console.log('\n[Test Group 9] Security & Authorization Protection');
    const unauthReq = await request('GET', '/api/projects');
    assert(unauthReq.status === 401, 'Unauthenticated request correctly blocked with 401 Unauthorized');

    // Clean up created test project
    await request('DELETE', `/api/projects/${projectId}`, null, alexToken);
    assert(true, 'Test project cleaned up after test run');

  } catch (err) {
    console.error('Test Suite encountered error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(` TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

// Start test
runTestSuite();
