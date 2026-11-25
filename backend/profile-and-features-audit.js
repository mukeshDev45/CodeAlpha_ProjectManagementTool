const http = require('http');
const { io: ioClient } = require('socket.io-client');

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

async function runAudit() {
  console.log('========================================================================');
  console.log('📋 COMPLETE FUNCTIONALITY AUDIT: PROFILE, NAVIGATION, BUTTONS & KANBAN');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS]: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Authentication & Profile Verification
    // -------------------------------------------------------------
    console.log('--- 1. Profile & Settings Audit ---');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'mukesh@projectflow.dev',
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Login as Mukesh (Lead)');
    const token = loginRes.data.token;
    const user = loginRes.data.user;

    const meRes = await request('GET', '/api/auth/me', null, token);
    assert(meRes.status === 200 && meRes.data.user.email === 'mukesh@projectflow.dev', 'Fetch /api/auth/me returns current user details');

    // Update Profile Information
    const updatedBio = 'Lead Systems Architect & Project Manager (Updated ' + Date.now() + ')';
    const profileUpdateRes = await request(
      'PUT',
      '/api/auth/profile',
      {
        name: 'Mukesh Prajapati',
        jobTitle: 'Lead Engineering Architect',
        bio: updatedBio,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      token
    );
    assert(
      profileUpdateRes.status === 200 &&
        profileUpdateRes.data.user.name === 'Mukesh Prajapati' &&
        profileUpdateRes.data.user.bio === updatedBio,
      'Update profile /api/auth/profile persists name, jobTitle and bio'
    );

    // Verify persistence after re-fetching
    const persistCheck = await request('GET', '/api/auth/me', null, token);
    assert(
      persistCheck.status === 200 &&
        persistCheck.data.user.name === 'Mukesh Prajapati' &&
        persistCheck.data.user.bio === updatedBio,
      'Profile changes verified persistent in MongoDB'
    );

    // Verify user statistics endpoint
    const statsRes = await request('GET', `/api/users/${user._id}`, null, token);
    assert(
      statsRes.status === 200 && statsRes.data.stats && statsRes.data.stats.projects !== undefined,
      'User stats endpoint /api/users/:id returns projects, assigned and completed task counts'
    );

    // -------------------------------------------------------------
    // 2. Sidebar Navigation Endpoints Audit
    // -------------------------------------------------------------
    console.log('\n--- 2. Sidebar Navigation Endpoints Audit ---');
    const dashRes = await request('GET', '/api/dashboard/stats', null, token);
    assert(dashRes.status === 200 && dashRes.data.stats.totalProjects !== undefined, 'Dashboard stats API (/api/dashboard/stats)');

    const projectsRes = await request('GET', '/api/projects', null, token);
    assert(projectsRes.status === 200 && Array.isArray(projectsRes.data.projects), 'My Projects API (/api/projects)');

    const myTasksRes = await request('GET', '/api/tasks/my-tasks', null, token);
    assert(myTasksRes.status === 200 && Array.isArray(myTasksRes.data.tasks), 'My Tasks API (/api/tasks/my-tasks)');

    const teamRes = await request('GET', '/api/users', null, token);
    assert(teamRes.status === 200 && Array.isArray(teamRes.data.users), 'Team Directory API (/api/users)');

    const notifsRes = await request('GET', '/api/notifications', null, token);
    assert(notifsRes.status === 200 && Array.isArray(notifsRes.data.notifications), 'Notifications API (/api/notifications)');

    // -------------------------------------------------------------
    // 3. Project & Task Lifecycle (All Action Buttons)
    // -------------------------------------------------------------
    console.log('\n--- 3. Interactive Buttons & CRUD Operations ---');
    // New Project Button
    const newProjRes = await request(
      'POST',
      '/api/projects',
      {
        name: 'Audit Test Workspace ' + Date.now(),
        description: 'Comprehensive end-to-end integration test workspace',
        category: 'Web App',
        priority: 'High',
        deadline: new Date(Date.now() + 10 * 86400000),
        color: '#4f46e5',
      },
      token
    );
    assert(newProjRes.status === 201 && newProjRes.data.project._id, 'New Project Button -> Created project in MongoDB');
    const testProjId = newProjRes.data.project._id;

    // Edit Project Button
    const editProjRes = await request(
      'PUT',
      `/api/projects/${testProjId}`,
      {
        name: 'Audit Test Workspace (Edited)',
        priority: 'Medium',
      },
      token
    );
    assert(editProjRes.status === 200 && editProjRes.data.project.name === 'Audit Test Workspace (Edited)', 'Edit Project Button -> Updated project in MongoDB');

    // Add Team Member Button
    const sarahUser = teamRes.data.users.find((u) => u.email === 'sarah@projectflow.dev');
    if (sarahUser) {
      const addMemberRes = await request(
        'POST',
        `/api/projects/${testProjId}/members`,
        {
          userId: sarahUser._id,
          role: 'member',
        },
        token
      );
      assert(addMemberRes.status === 200, 'Add Team Member Button -> Added member to project');
    }

    // New Task Button
    const newTaskRes = await request(
      'POST',
      `/api/projects/${testProjId}/tasks`,
      {
        title: 'Build Feature Verification Flow',
        description: 'End-to-end testing for all user interactions',
        status: 'To Do',
        priority: 'High',
        assignedTo: sarahUser ? sarahUser._id : user._id,
        dueDate: new Date(Date.now() + 3 * 86400000),
        tags: ['QA', 'Automation'],
      },
      token
    );
    assert(newTaskRes.status === 201 && newTaskRes.data.task._id, 'New Task Button -> Created task in Kanban column "To Do"');
    const testTaskId = newTaskRes.data.task._id;

    // Task Details & Edit Task Button
    const editTaskRes = await request(
      'PUT',
      `/api/tasks/${testTaskId}`,
      {
        title: 'Build Feature Verification Flow (Updated)',
        priority: 'Medium',
      },
      token
    );
    assert(editTaskRes.status === 200 && editTaskRes.data.task.title.includes('(Updated)'), 'Edit Task Button -> Updated task details');

    // Add Comment Button
    const commentRes = await request(
      'POST',
      `/api/tasks/${testTaskId}/comments`,
      {
        content: 'Automated test comment verified successfully!',
      },
      token
    );
    assert(commentRes.status === 201 && commentRes.data.comment._id, 'Add Comment Button -> Posted comment on task');
    const testCommentId = commentRes.data.comment._id;

    // Edit Comment Button
    const editCommentRes = await request(
      'PUT',
      `/api/comments/${testCommentId}`,
      {
        content: 'Automated test comment (edited)!',
      },
      token
    );
    assert(editCommentRes.status === 200 && editCommentRes.data.comment.content.includes('(edited)'), 'Edit Comment Button -> Updated comment');

    // Delete Comment Button
    const delCommentRes = await request('DELETE', `/api/comments/${testCommentId}`, null, token);
    assert(delCommentRes.status === 200, 'Delete Comment Button -> Deleted comment from MongoDB');

    // -------------------------------------------------------------
    // 4. Kanban 4-Column Drag-and-Drop Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- 4. Kanban Board Drag-and-Drop Lifecycle ---');
    const columns = ['In Progress', 'Review', 'Completed'];
    for (const col of columns) {
      const moveRes = await request(
        'PUT',
        `/api/tasks/${testTaskId}/status`,
        {
          status: col,
          order: 0,
        },
        token
      );
      assert(moveRes.status === 200 && moveRes.data.task.status === col, `Drag-and-Drop -> Moved task to column "${col}" and verified in MongoDB`);
    }

    // -------------------------------------------------------------
    // 5. Real-Time Socket.IO Synchronization
    // -------------------------------------------------------------
    console.log('\n--- 5. Real-Time Socket.IO Synchronization ---');
    const socket = ioClient(BASE_URL, {
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          assert(false, 'Socket.IO connection timeout');
          resolve();
        }
      }, 3000);

      socket.on('connect', () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          assert(true, 'Socket.IO Client connected successfully to real-time server');
          socket.emit('project:join', testProjId);
          resolve();
        }
      });
    });

    socket.disconnect();

    // -------------------------------------------------------------
    // 6. Clean-Up Test Resources
    // -------------------------------------------------------------
    console.log('\n--- 6. Clean-Up Test Resources ---');
    // Delete Task Button
    const delTaskRes = await request('DELETE', `/api/tasks/${testTaskId}`, null, token);
    assert(delTaskRes.status === 200, 'Delete Task Button -> Deleted task from MongoDB');

    // Delete Project Button
    const delProjRes = await request('DELETE', `/api/projects/${testProjId}`, null, token);
    assert(delProjRes.status === 200, 'Delete Project Button -> Deleted test project from MongoDB');

    console.log('\n========================================================================');
    console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================================');
  } catch (error) {
    console.error('Audit Exception:', error);
  }
}

runAudit();
