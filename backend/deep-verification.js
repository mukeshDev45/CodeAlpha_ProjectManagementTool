const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const { io: ioClient } = require('socket.io-client');

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

async function runDeepVerification() {
  console.log('================================================================');
  console.log('   PROJECTFLOW DEEP FUNCTIONALITY & SECURITY VERIFICATION SUITE ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}${details ? ` -> ${details}` : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `qa_engineer_${timestamp}@projectflow.dev`;
  let testUserToken = null;
  let testUserId = null;
  let alexToken = null;
  let alexId = null;
  let createdProjectId = null;
  let testTaskId = null;
  let testCommentId = null;

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION & SECURITY
    // -------------------------------------------------------------
    console.log('[SECTION 1] Authentication & Security Verification');

    // 1.1 Fresh User Registration
    const regRes = await request('POST', '/api/auth/register', {
      name: 'QA Automation Bot',
      email: testEmail,
      password: 'password123',
      role: 'developer',
      jobTitle: 'QA Lead',
    });
    assert(regRes.status === 201 && regRes.data.token, '1.1 User Registration succeeded with JWT token');
    testUserToken = regRes.data?.token;
    testUserId = regRes.data?.user?._id;

    // 1.2 Prevent Duplicate Email Registration
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Duplicate Bot',
      email: testEmail,
      password: 'password123',
    });
    assert(dupRes.status === 400, '1.2 Duplicate email registration rejected with 400 Bad Request');

    // 1.3 Reject Invalid Password Login
    const badLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrong_password_xyz',
    });
    assert(badLogin.status === 401, '1.3 Invalid password rejected with 401 Unauthorized');

    // 1.4 Valid User Login
    const validLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123',
    });
    assert(validLogin.status === 200 && validLogin.data.user.email === testEmail, '1.4 Valid Login succeeded and returned user object');

    // 1.5 Login as Alex (Lead Admin) for collaborative testing
    const alexLogin = await request('POST', '/api/auth/login', {
      email: 'alex@projectflow.dev',
      password: 'password123',
    });
    assert(alexLogin.status === 200 && alexLogin.data.token, '1.5 Admin Alex login succeeded');
    alexToken = alexLogin.data.token;
    alexId = alexLogin.data.user._id;

    // 1.6 Protected Profile Access (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me', null, testUserToken);
    assert(meRes.status === 200 && meRes.data.user.email === testEmail, '1.6 Protected route /api/auth/me accessible with valid Bearer token');

    // 1.7 Profile Details Update
    const updateProfileRes = await request('PUT', '/api/auth/profile', {
      name: 'QA Automation Lead',
      bio: 'Automated test agent verifying system reliability',
    }, testUserToken);
    assert(updateProfileRes.status === 200 && updateProfileRes.data.user.name === 'QA Automation Lead', '1.7 Profile update (/api/auth/profile) succeeded');

    // 1.8 Password Change
    const changePassRes = await request('PUT', '/api/auth/password', {
      currentPassword: 'password123',
      newPassword: 'new_secure_pass_456',
    }, testUserToken);
    assert(changePassRes.status === 200 && changePassRes.data.token, '1.8 Password change (/api/auth/password) succeeded');
    testUserToken = changePassRes.data.token; // update token

    // -------------------------------------------------------------
    // 2. GROUP PROJECT MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n[SECTION 2] Group Project Management Verification');

    // 2.1 Create Group Project with Metadata
    const projectRes = await request('POST', '/api/projects', {
      name: `Verification Project ${timestamp}`,
      description: 'Project created during full system functionality check',
      category: 'Web App',
      priority: 'High',
      color: '#4f46e5',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    }, testUserToken);
    assert(projectRes.status === 201 && projectRes.data.project.name.includes('Verification Project'), '2.1 Create group project succeeded');
    createdProjectId = projectRes.data?.project?._id;

    // 2.2 Get User Projects List
    const userProjects = await request('GET', '/api/projects', null, testUserToken);
    assert(userProjects.status === 200 && userProjects.data.projects.some(p => p._id === createdProjectId), '2.2 Get user projects returns the newly created project');

    // 2.3 Get Project Details by ID
    const projectDetails = await request('GET', `/api/projects/${createdProjectId}`, null, testUserToken);
    assert(projectDetails.status === 200 && projectDetails.data.project.owner._id === testUserId, '2.3 Get project details returns populated owner and members');

    // 2.4 Add Team Member (Alex) to Project
    const addMemberRes = await request('POST', `/api/projects/${createdProjectId}/members`, {
      userId: alexId,
      role: 'admin',
    }, testUserToken);
    assert(addMemberRes.status === 200 && addMemberRes.data.project.members.some(m => m.user._id === alexId), '2.4 Added team member Alex to project with role "admin"');

    // 2.5 Prevent Duplicate Member Addition
    const dupMemberRes = await request('POST', `/api/projects/${createdProjectId}/members`, {
      userId: alexId,
      role: 'member',
    }, testUserToken);
    assert(dupMemberRes.status === 400, '2.5 Prevented duplicate member addition with 400 Bad Request');

    // 2.6 Prevent Removing Project Owner
    const removeOwnerRes = await request('DELETE', `/api/projects/${createdProjectId}/members/${testUserId}`, null, testUserToken);
    assert(removeOwnerRes.status === 400, '2.6 Protected project owner from accidental removal');

    // 2.7 Update Project Metadata
    const updateProjectRes = await request('PUT', `/api/projects/${createdProjectId}`, {
      priority: 'Medium',
      description: 'Updated project description',
    }, testUserToken);
    assert(updateProjectRes.status === 200 && updateProjectRes.data.project.priority === 'Medium', '2.7 Project details updated successfully');

    // -------------------------------------------------------------
    // 3. KANBAN BOARD & TASK MANAGEMENT (ALL 4 COLUMNS)
    // -------------------------------------------------------------
    console.log('\n[SECTION 3] Kanban Board & Task Management Verification');

    const statuses = ['To Do', 'In Progress', 'Review', 'Completed'];
    const createdTasks = [];

    // 3.1 Create Tasks in all 4 Kanban Columns
    for (const status of statuses) {
      const taskRes = await request('POST', `/api/projects/${createdProjectId}/tasks`, {
        title: `Task in ${status} Column`,
        description: `Testing task functionality in column ${status}`,
        status,
        priority: 'High',
        assignedTo: alexId,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        tags: [status, 'QA'],
      }, testUserToken);

      assert(taskRes.status === 201 && taskRes.data.task.status === status, `3.1 Task created in Kanban column: "${status}"`);
      createdTasks.push(taskRes.data.task);
    }

    testTaskId = createdTasks[0]._id; // 'To Do' task

    // 3.2 Fetch all tasks for Project
    const allTasksRes = await request('GET', `/api/projects/${createdProjectId}/tasks`, null, testUserToken);
    assert(allTasksRes.status === 200 && allTasksRes.data.tasks.length === 4, '3.2 Fetched all 4 project tasks across all columns');

    // 3.3 Verify Kanban Drag-and-Drop Status Movement
    // Move 'To Do' task -> 'In Progress' -> 'Review' -> 'Completed'
    for (const targetStatus of ['In Progress', 'Review', 'Completed']) {
      const moveRes = await request('PATCH', `/api/tasks/${testTaskId}/status`, { status: targetStatus }, testUserToken);
      assert(moveRes.status === 200 && moveRes.data.task.status === targetStatus, `3.3 Drag-and-drop moved task to: "${targetStatus}"`);
    }

    // 3.4 Update Task Details (Assignee & Priority)
    const updateTaskRes = await request('PUT', `/api/tasks/${testTaskId}`, {
      priority: 'Low',
      description: 'Updated task description after review',
    }, testUserToken);
    assert(updateTaskRes.status === 200 && updateTaskRes.data.task.priority === 'Low', '3.4 Task details updated successfully');

    // 3.5 My Tasks Endpoint
    const myTasksAlex = await request('GET', '/api/tasks/my-tasks', null, alexToken);
    assert(myTasksAlex.status === 200 && myTasksAlex.data.tasks.length > 0, `3.5 /api/tasks/my-tasks returned tasks assigned to user (count: ${myTasksAlex.data.tasks.length})`);

    // -------------------------------------------------------------
    // 4. TASK COMMENTS & DISCUSSION
    // -------------------------------------------------------------
    console.log('\n[SECTION 4] Task Comments & Discussion Verification');

    // 4.1 Add Comment to Task
    const addCommentRes = await request('POST', `/api/tasks/${testTaskId}/comments`, {
      content: 'This is an automated verification comment on the task.',
    }, testUserToken);
    assert(addCommentRes.status === 201 && addCommentRes.data.comment.content.includes('automated verification'), '4.1 Task comment created successfully');
    testCommentId = addCommentRes.data?.comment?._id;

    // 4.2 Fetch Comments for Task
    const getCommentsRes = await request('GET', `/api/tasks/${testTaskId}/comments`, null, testUserToken);
    assert(getCommentsRes.status === 200 && getCommentsRes.data.comments.some(c => c._id === testCommentId), '4.2 Retrieved task comments list containing new comment');

    // 4.3 Edit Own Comment
    const editCommentRes = await request('PUT', `/api/comments/${testCommentId}`, {
      content: 'Edited comment content by original author',
    }, testUserToken);
    assert(editCommentRes.status === 200 && editCommentRes.data.comment.content.includes('Edited comment content'), '4.3 Author successfully edited comment');

    // 4.4 Non-Author Cannot Edit Comment
    const unauthorizedEdit = await request('PUT', `/api/comments/${testCommentId}`, {
      content: 'Malicious modification attempt',
    }, alexToken);
    assert(unauthorizedEdit.status === 403, '4.4 Non-author blocked from editing comment with 403 Forbidden');

    // 4.5 Delete Comment
    const deleteCommentRes = await request('DELETE', `/api/comments/${testCommentId}`, null, testUserToken);
    assert(deleteCommentRes.status === 200, '4.5 Comment deleted successfully by author');

    // -------------------------------------------------------------
    // 5. NOTIFICATION SYSTEM
    // -------------------------------------------------------------
    console.log('\n[SECTION 5] In-App Notification System Verification');

    // Alex was assigned tasks by testUser, so Alex should have notifications
    const alexNotifsRes = await request('GET', '/api/notifications', null, alexToken);
    assert(alexNotifsRes.status === 200 && alexNotifsRes.data.notifications.length > 0, `5.1 Alex has received task notifications (count: ${alexNotifsRes.data.notifications.length})`);

    const sampleNotifId = alexNotifsRes.data.notifications[0]._id;

    // 5.2 Mark Single Notification as Read
    const markReadRes = await request('PATCH', `/api/notifications/${sampleNotifId}/read`, null, alexToken);
    assert(markReadRes.status === 200 && markReadRes.data.notification.isRead === true, '5.2 Marked individual notification as read');

    // 5.3 Mark All Notifications as Read
    const markAllReadRes = await request('PATCH', '/api/notifications/read-all', null, alexToken);
    assert(markAllReadRes.status === 200, '5.3 Marked all notifications as read');

    // -------------------------------------------------------------
    // 6. REAL-TIME SOCKET.IO ENGINE
    // -------------------------------------------------------------
    console.log('\n[SECTION 6] Real-Time Socket.IO Synchronization Verification');

    const socketClientPromise = new Promise((resolve) => {
      const client = ioClient(BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      let receivedStatusEvent = false;

      client.on('connect', () => {
        // Join project room
        client.emit('project:join', createdProjectId);

        // Listen for task status change
        client.on('task:status_changed', (data) => {
          if (data && data.taskId === testTaskId) {
            receivedStatusEvent = true;
            client.disconnect();
            resolve({ connected: true, receivedEvent: true });
          }
        });

        // Trigger a task move via REST API to see if Socket event arrives
        setTimeout(async () => {
          await request('PATCH', `/api/tasks/${testTaskId}/status`, { status: 'To Do' }, testUserToken);
        }, 300);
      });

      client.on('connect_error', (err) => {
        resolve({ connected: false, error: err.message });
      });

      setTimeout(() => {
        client.disconnect();
        resolve({ connected: true, receivedEvent: receivedStatusEvent, timeout: true });
      }, 3500);
    });

    const socketResult = await socketClientPromise;
    assert(socketResult.connected, '6.1 Socket.IO client connected to WebSocket server');
    assert(socketResult.receivedEvent, '6.2 Real-time "task:status_changed" event received by Socket.IO client');

    // -------------------------------------------------------------
    // 7. AUTHORIZATION & SECURITY
    // -------------------------------------------------------------
    console.log('\n[SECTION 7] Security & Role-Based Access Control Verification');

    // 7.1 Unauthenticated requests are rejected
    const noAuthReq = await request('GET', '/api/projects');
    assert(noAuthReq.status === 401, '7.1 Unauthenticated request returns 401');

    // 7.2 Invalid token rejected
    const badTokenReq = await request('GET', '/api/projects', null, 'invalid_token_12345');
    assert(badTokenReq.status === 401, '7.2 Invalid JWT token returns 401');

    // 7.3 Non-owner cannot delete project
    const unauthorizedDelete = await request('DELETE', `/api/projects/${createdProjectId}`, null, alexToken);
    assert(unauthorizedDelete.status === 403, '7.3 Non-owner blocked from deleting project with 403 Forbidden');

    // -------------------------------------------------------------
    // 8. DASHBOARD STATISTICS AGGREGATION
    // -------------------------------------------------------------
    console.log('\n[SECTION 8] Dashboard Aggregations Verification');

    const dashRes = await request('GET', '/api/dashboard/stats', null, testUserToken);
    assert(
      dashRes.status === 200 &&
      dashRes.data.stats.totalProjects >= 1 &&
      dashRes.data.stats.totalTasks >= 4,
      '8.1 Dashboard stats aggregation accurately calculates total projects and tasks'
    );

    // -------------------------------------------------------------
    // 9. CLEANUP TEST DATA
    // -------------------------------------------------------------
    console.log('\n[SECTION 9] Clean-Up Verification');

    // Delete project as owner (cascades to tasks, comments, activities)
    const delProjRes = await request('DELETE', `/api/projects/${createdProjectId}`, null, testUserToken);
    assert(delProjRes.status === 200, '9.1 Project and all child tasks deleted cleanly by owner');

  } catch (error) {
    console.error('Deep verification error:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(` DEEP VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runDeepVerification();
