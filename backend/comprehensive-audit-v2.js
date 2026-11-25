// Comprehensive ProjectFlow Quality & Feature Verification Audit v2
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

async function runAudit() {
  console.log('=== COMPREHENSIVE PROJECTFLOW AUDIT & VERIFICATION ===\n');

  // TEST 1: Login with Mukesh (Lead)
  console.log('1. Authentication & Consistent User Identity');
  const loginRes = await request('POST', '/auth/login', {
    email: 'mukesh@projectflow.dev',
    password: 'password123',
  });
  assert(loginRes.status === 200 && loginRes.body.token, 'Mukesh login successful');
  assert(loginRes.body.user.name === 'Mukesh Prajapati', `Consistent user name: "${loginRes.body.user.name}" (No Alex Johnson discrepancy)`);
  assert(loginRes.body.user.email === 'mukesh@projectflow.dev', 'User email is mukesh@projectflow.dev');
  const token = loginRes.body.token;
  const userId = loginRes.body.user._id;

  // TEST 2: /auth/me returns consistent Mukesh user
  const meRes = await request('GET', '/auth/me', null, token);
  assert(meRes.status === 200 && meRes.body.user.name === 'Mukesh Prajapati', 'GET /auth/me returns Mukesh Prajapati');

  // TEST 3: User Statistics for Profile page (/users/:id)
  console.log('\n2. Profile Page & Real Statistics');
  const userStatsRes = await request('GET', `/users/${userId}`, null, token);
  assert(userStatsRes.status === 200, 'GET /users/:id returned 200 OK');
  assert(typeof userStatsRes.body.stats.projects === 'number', `Stats projects count: ${userStatsRes.body.stats.projects}`);
  assert(typeof userStatsRes.body.stats.assignedTasks === 'number', `Stats assigned tasks: ${userStatsRes.body.stats.assignedTasks}`);
  assert(typeof userStatsRes.body.stats.completedTasks === 'number', `Stats completed tasks: ${userStatsRes.body.stats.completedTasks}`);

  // TEST 4: Profile Update (/auth/profile)
  const profileUpdateRes = await request('PUT', '/auth/profile', {
    name: 'Mukesh Prajapati',
    jobTitle: 'Lead Architect & Engineer',
    bio: 'Leading high-velocity engineering and full-stack architecture.',
    role: 'admin',
  }, token);
  assert(profileUpdateRes.status === 200 && profileUpdateRes.body.user.jobTitle === 'Lead Architect & Engineer', 'PUT /auth/profile saved and returned updated jobTitle');

  // TEST 5: Password Change Functionality (/auth/password)
  console.log('\n3. Password Change & Security');
  // First test incorrect current password
  const badPassRes = await request('PUT', '/auth/password', {
    currentPassword: 'wrongpassword',
    newPassword: 'newpassword123',
  }, token);
  assert(badPassRes.status === 401, 'PUT /auth/password correctly rejects wrong current password (401)');

  // Then change password
  const changePassRes = await request('PUT', '/auth/password', {
    currentPassword: 'password123',
    newPassword: 'password123', // maintain same password for continued test stability
  }, token);
  assert(changePassRes.status === 200 && changePassRes.body.token, 'PUT /auth/password succeeds with valid credentials and issues new token');

  // TEST 6: Dashboard Statistics from Real MongoDB Data
  console.log('\n4. Real MongoDB Dashboard Data');
  const dashRes = await request('GET', '/dashboard/stats', null, token);
  assert(dashRes.status === 200, 'GET /dashboard/stats returned 200 OK');
  const dStats = dashRes.body.stats;
  assert(typeof dStats.totalProjects === 'number' && dStats.totalProjects >= 1, `Dashboard total projects: ${dStats.totalProjects}`);
  assert(typeof dStats.totalTasks === 'number', `Dashboard total tasks: ${dStats.totalTasks}`);
  assert(Array.isArray(dashRes.body.recentProjects), `Recent projects list: ${dashRes.body.recentProjects.length} items`);
  assert(Array.isArray(dashRes.body.recentActivities), `Recent team activities: ${dashRes.body.recentActivities.length} items`);
  assert(Array.isArray(dashRes.body.upcomingTasks), `Upcoming deadlines: ${dashRes.body.upcomingTasks.length} items`);

  // TEST 7: Analytics Overview (/analytics/overview)
  console.log('\n5. Analytics & Progress Velocity');
  const anaRes = await request('GET', '/analytics/overview', null, token);
  assert(anaRes.status === 200, 'GET /analytics/overview returned 200 OK');
  const anaData = anaRes.body.analytics;
  assert(anaData.summary && typeof anaData.summary.completionRate === 'number', `Analytics completion rate: ${anaData.summary.completionRate}%`);
  assert(Array.isArray(anaData.projectProgress), `Project velocity items: ${anaData.projectProgress.length}`);
  assert(Array.isArray(anaData.weeklyCompletion) && anaData.weeklyCompletion.length === 7, 'Weekly task completion trend has 7-day data');
  assert(typeof anaData.summary.overdueTasks === 'number', `Overdue tasks count: ${anaData.summary.overdueTasks}`);

  // TEST 8: Group Projects CRUD
  console.log('\n6. Projects CRUD & Team Collaboration');
  const newProjRes = await request('POST', '/projects', {
    name: 'Audit Project ' + Date.now(),
    description: 'Project created for complete functionality test',
    category: 'Web App',
    priority: 'High',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    color: '#10b981',
  }, token);
  assert(newProjRes.status === 201 && newProjRes.body.project._id, 'POST /projects created new collaborative workspace');
  const testProjectId = newProjRes.body.project._id;

  // TEST 9: Task Creation with Due Date, Priority, Labels, Tags
  console.log('\n7. Tasks Creation, Details & Timeline');
  const pastDueDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]; // Overdue task
  const newTaskRes = await request('POST', `/projects/${testProjectId}/tasks`, {
    title: 'Verify Search and Overdue Filters',
    description: 'Ensure all filters by status, priority, and member function correctly.',
    status: 'To Do',
    priority: 'High',
    dueDate: pastDueDate,
    assignedTo: userId,
    tags: ['QA', 'FilterTest', 'MongoDB'],
    labels: [{ name: 'Critical', color: '#ef4444' }],
  }, token);
  assert(newTaskRes.status === 201 && newTaskRes.body.task._id, 'POST /projects/:id/tasks created task with overdue date & tags');
  const testTaskId = newTaskRes.body.task._id;

  // TEST 10: Task Search & Filters (Backend verification)
  console.log('\n8. Task Search and Multi-Filter Verification');
  // Search by title keyword
  const searchTitleRes = await request('GET', `/projects/${testProjectId}/tasks?search=Overdue`, null, token);
  assert(searchTitleRes.status === 200 && searchTitleRes.body.tasks.length >= 1, 'Task search by title "Overdue" returned matching task');

  // Search by tag keyword
  const searchTagRes = await request('GET', `/projects/${testProjectId}/tasks?search=FilterTest`, null, token);
  assert(searchTagRes.status === 200 && searchTagRes.body.tasks.length >= 1, 'Task search by tag "FilterTest" returned matching task');

  // Filter by priority
  const filterPrioRes = await request('GET', `/projects/${testProjectId}/tasks?priority=High`, null, token);
  assert(filterPrioRes.status === 200 && filterPrioRes.body.tasks.some(t => t.priority === 'High'), 'Filter by priority "High" matched');

  // Filter by status
  const filterStatusRes = await request('GET', `/projects/${testProjectId}/tasks?status=To Do`, null, token);
  assert(filterStatusRes.status === 200 && filterStatusRes.body.tasks.some(t => t.status === 'To Do'), 'Filter by status "To Do" matched');

  // Filter by assignedTo
  const filterAssigneeRes = await request('GET', `/projects/${testProjectId}/tasks?assignedTo=${userId}`, null, token);
  assert(filterAssigneeRes.status === 200 && filterAssigneeRes.body.tasks.length >= 1, 'Filter by assigned member matched');

  // TEST 11: Task Status Movement (Kanban Drag and Drop)
  console.log('\n9. Kanban Board Drag & Drop Status Transition');
  const moveRes = await request('PATCH', `/tasks/${testTaskId}/status`, { status: 'In Progress' }, token);
  assert(moveRes.status === 200 && moveRes.body.task.status === 'In Progress', 'PATCH /tasks/:id/status moved task to "In Progress"');

  const moveCompletedRes = await request('PUT', `/tasks/${testTaskId}/status`, { status: 'Review' }, token);
  assert(moveCompletedRes.status === 200 && moveCompletedRes.body.task.status === 'Review', 'PUT /tasks/:id/status moved task to "Review"');

  // TEST 12: Task Activity Timeline (/tasks/:id/activities)
  console.log('\n10. Complete Task Activity Timeline');
  const actRes = await request('GET', `/tasks/${testTaskId}/activities`, null, token);
  assert(actRes.status === 200 && actRes.body.activities.length >= 2, `Task activity timeline has ${actRes.body.activities.length} recorded events`);
  assert(actRes.body.activities.some(a => a.details.includes('Created task')), 'Timeline includes creation event');
  assert(actRes.body.activities.some(a => a.details.includes('In Progress') || a.details.includes('Review')), 'Timeline includes status movement event');

  // TEST 13: Task Comments CRUD
  console.log('\n11. Comments CRUD & Discussion');
  const addCommentRes = await request('POST', `/tasks/${testTaskId}/comments`, {
    content: 'Automated test comment verifying discussion feed functionality.',
  }, token);
  assert(addCommentRes.status === 201 && addCommentRes.body.comment._id, 'POST /tasks/:id/comments posted comment');
  const commentId = addCommentRes.body.comment._id;

  const editCommentRes = await request('PUT', `/comments/${commentId}`, {
    content: 'Updated comment content via automated test.',
  }, token);
  assert(editCommentRes.status === 200 && editCommentRes.body.comment.content.includes('Updated'), 'PUT /comments/:id updated comment');

  const getCommentsRes = await request('GET', `/tasks/${testTaskId}/comments`, null, token);
  assert(getCommentsRes.status === 200 && getCommentsRes.body.comments.length >= 1, 'GET /tasks/:id/comments retrieved comment discussion');

  // TEST 14: My Tasks and Calendar Endpoint (/tasks/my-tasks and /tasks/my)
  console.log('\n12. My Tasks & Calendar Endpoints');
  const myTasksRes = await request('GET', '/tasks/my-tasks', null, token);
  assert(myTasksRes.status === 200 && Array.isArray(myTasksRes.body.tasks), `GET /tasks/my-tasks returned ${myTasksRes.body.tasks.length} personal tasks`);

  const myTasksAliasRes = await request('GET', '/tasks/my', null, token);
  assert(myTasksAliasRes.status === 200 && Array.isArray(myTasksAliasRes.body.tasks), 'GET /tasks/my alias returned 200 OK (no CastError for Calendar)');

  // TEST 15: Notifications and Due-Date Reminders (/notifications)
  console.log('\n13. Notifications & Due-Date Reminders');
  const notifRes = await request('GET', '/notifications', null, token);
  assert(notifRes.status === 200 && Array.isArray(notifRes.body.notifications), `GET /notifications returned ${notifRes.body.notifications.length} notifications`);
  assert(typeof notifRes.body.unreadCount === 'number', `Unread notifications count: ${notifRes.body.unreadCount}`);
  // Check if deadline_approaching or overdue notification exists
  const hasDeadlineReminder = notifRes.body.notifications.some(n => n.type === 'deadline_approaching');
  assert(hasDeadlineReminder, 'Due-date reminder / overdue alert automatically generated in notifications');

  // TEST 16: Clean up test artifacts
  console.log('\n14. Clean-up & Audit Trail Integrity');
  const delCommentRes = await request('DELETE', `/comments/${commentId}`, null, token);
  assert(delCommentRes.status === 200, 'DELETE /comments/:id removed comment');

  const delTaskRes = await request('DELETE', `/tasks/${testTaskId}`, null, token);
  assert(delTaskRes.status === 200, 'DELETE /tasks/:id deleted task');

  const delProjRes = await request('DELETE', `/projects/${testProjectId}`, null, token);
  assert(delProjRes.status === 200, 'DELETE /projects/:id deleted test project');

  // Summary
  console.log('\n=======================================================');
  console.log(` AUDIT SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('=======================================================');

  if (failed === 0) {
    console.log('\nALL FEATURES & REQUIREMENTS VERIFIED SUCCESSFULLY (100% PASS)!');
    process.exit(0);
  } else {
    console.error(`\nAUDIT FAILED WITH ${failed} DEFECT(S)!`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
