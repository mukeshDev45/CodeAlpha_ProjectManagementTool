const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const autoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[AutoSeed] Database already contains ${userCount} users. Skipping auto-seed.`);
      return;
    }

    console.log('[AutoSeed] Empty database detected on startup. Auto-seeding initial demo data...');

    // 1. Create demo users (passwords hashed by User model pre-save hook)
    const users = await User.create([
      {
        name: 'Mukesh',
        email: 'mukesh@projectflow.dev',
        password: 'password123',
        role: 'admin',
        jobTitle: 'Project Lead & Architect',
        bio: 'Senior Lead driving engineering excellence and scalable architecture.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@projectflow.dev',
        password: 'password123',
        role: 'developer',
        jobTitle: 'Senior Frontend Developer',
        bio: 'Passionate about responsive design, smooth animations, and web accessibility.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        name: 'Marcus Miller',
        email: 'marcus@projectflow.dev',
        password: 'password123',
        role: 'developer',
        jobTitle: 'Backend & Cloud Engineer',
        bio: 'Distributed systems, MongoDB query optimization, and RESTful APIs.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@projectflow.dev',
        password: 'password123',
        role: 'designer',
        jobTitle: 'Lead UI/UX Designer',
        bio: 'Crafting intuitive user interfaces, design systems, and micro-interactions.',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        name: 'David Kim',
        email: 'david@projectflow.dev',
        password: 'password123',
        role: 'member',
        jobTitle: 'Full Stack Developer',
        bio: 'Building end-to-end features with Node.js and modern JavaScript.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      },
    ]);

    const [alex, sarah, marcus, priya, david] = users;

    // 2. Demo projects
    const inTwoWeeks = new Date(Date.now() + 14 * 86400000);
    const inOneMonth = new Date(Date.now() + 30 * 86400000);
    const inTwoMonths = new Date(Date.now() + 60 * 86400000);

    const project1 = await Project.create({
      name: 'ProjectFlow SaaS Platform',
      description: 'Collaborative real-time project management and Kanban task tracking system for modern agile engineering teams.',
      owner: alex._id,
      members: [
        { user: alex._id, role: 'owner', joinedAt: new Date() },
        { user: sarah._id, role: 'admin', joinedAt: new Date() },
        { user: marcus._id, role: 'member', joinedAt: new Date() },
        { user: priya._id, role: 'member', joinedAt: new Date() },
        { user: david._id, role: 'member', joinedAt: new Date() },
      ],
      status: 'Active',
      priority: 'High',
      category: 'Web App',
      deadline: inTwoWeeks,
      color: '#4f46e5',
    });

    const project2 = await Project.create({
      name: 'Cloud Infrastructure & DevOps CI/CD',
      description: 'Automating multi-region deployment pipelines, Docker container orchestration, and real-time observability telemetry.',
      owner: marcus._id,
      members: [
        { user: marcus._id, role: 'owner', joinedAt: new Date() },
        { user: alex._id, role: 'admin', joinedAt: new Date() },
        { user: david._id, role: 'member', joinedAt: new Date() },
      ],
      status: 'Active',
      priority: 'Medium',
      category: 'DevOps',
      deadline: inOneMonth,
      color: '#0ea5e9',
    });

    const project3 = await Project.create({
      name: 'Modern Design System 2.0',
      description: 'Cross-platform component library with dark/light tokens, accessible ARIA widgets, and Figma Code Connect mappings.',
      owner: priya._id,
      members: [
        { user: priya._id, role: 'owner', joinedAt: new Date() },
        { user: sarah._id, role: 'admin', joinedAt: new Date() },
        { user: alex._id, role: 'member', joinedAt: new Date() },
      ],
      status: 'Planning',
      priority: 'High',
      category: 'Design',
      deadline: inTwoMonths,
      color: '#ec4899',
    });

    // 3. Demo tasks for Project 1
    const p1Tasks = await Task.create([
      {
        title: 'Implement OAuth2 Google & GitHub Sign-In',
        description: 'Configure Passport.js / OAuth2 social providers for frictionless developer registration and secure token handoff.',
        project: project1._id,
        status: 'To Do',
        priority: 'High',
        assignedTo: marcus._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() + 5 * 86400000),
        order: 0,
        tags: ['Security', 'OAuth', 'Backend'],
      },
      {
        title: 'Write Automated Cypress E2E Test Suite',
        description: 'Cover project creation, Kanban drag-and-drop card movements, and comment posting scenarios.',
        project: project1._id,
        status: 'To Do',
        priority: 'Medium',
        assignedTo: david._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        order: 1,
        tags: ['Testing', 'QA'],
      },
      {
        title: 'Real-Time Notification Banner & Dropdown',
        description: 'Connect Socket.IO client to listen for real-time notifications and display smooth toast popups with sounds.',
        project: project1._id,
        status: 'In Progress',
        priority: 'High',
        assignedTo: sarah._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() + 3 * 86400000),
        order: 0,
        tags: ['WebSocket', 'Frontend', 'UI'],
      },
      {
        title: 'Optimize MongoDB Aggregation for Dashboard Stats',
        description: 'Add compound indexes to Task and Project collections to ensure sub-10ms response times on dashboard loads.',
        project: project1._id,
        status: 'In Progress',
        priority: 'Medium',
        assignedTo: marcus._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() + 4 * 86400000),
        order: 1,
        tags: ['MongoDB', 'Performance'],
      },
      {
        title: 'Kanban Board Drag-and-Drop Animation Polish',
        description: 'Fine-tune card drop animations, placeholder ghost styles, and touch support for mobile tablets.',
        project: project1._id,
        status: 'Review',
        priority: 'High',
        assignedTo: priya._id,
        createdBy: sarah._id,
        dueDate: new Date(Date.now() + 2 * 86400000),
        order: 0,
        tags: ['UX', 'Kanban', 'Design'],
      },
      {
        title: 'REST API Authentication & JWT Middleware',
        description: 'Created register, login, profile routes with bcrypt password hashing and Bearer token verification.',
        project: project1._id,
        status: 'Completed',
        priority: 'High',
        assignedTo: marcus._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() - 2 * 86400000),
        order: 0,
        tags: ['Backend', 'Security'],
      },
      {
        title: 'Modern SaaS UI Shell & Responsive Navigation',
        description: 'Designed clean sidebar navigation, top header with user avatar menu, and responsive layout for all screens.',
        project: project1._id,
        status: 'Completed',
        priority: 'Medium',
        assignedTo: sarah._id,
        createdBy: alex._id,
        dueDate: new Date(Date.now() - 4 * 86400000),
        order: 1,
        tags: ['Frontend', 'Responsive'],
      },
    ]);

    // Tasks for Project 2
    await Task.create([
      {
        title: 'Dockerize Node.js and MongoDB Services',
        description: 'Write production multi-stage Dockerfile and docker-compose.yml for unified local dev and cloud deployment.',
        project: project2._id,
        status: 'In Progress',
        priority: 'High',
        assignedTo: marcus._id,
        createdBy: marcus._id,
        dueDate: new Date(Date.now() + 6 * 86400000),
        order: 0,
        tags: ['Docker', 'DevOps'],
      },
      {
        title: 'Setup GitHub Actions CI Test Workflow',
        description: 'Automate linting, unit tests, and build checks on pull request merge.',
        project: project2._id,
        status: 'Completed',
        priority: 'Medium',
        assignedTo: alex._id,
        createdBy: marcus._id,
        dueDate: new Date(Date.now() - 1 * 86400000),
        order: 0,
        tags: ['CI/CD', 'GitHub'],
      },
    ]);

    // 4. Demo comments
    const reviewTask = p1Tasks[4];
    const notifTask = p1Tasks[2];

    await Comment.create([
      {
        task: reviewTask._id,
        user: sarah._id,
        content: 'I have tested the drag-and-drop on Safari and Chrome. The drop shadows feel super snappy!',
      },
      {
        task: reviewTask._id,
        user: priya._id,
        content: 'Awesome! Added a subtle hover transition on cards as well. Ready for final review merge.',
      },
      {
        task: notifTask._id,
        user: alex._id,
        content: 'Please make sure toast notifications automatically dismiss after 4 seconds.',
      },
      {
        task: notifTask._id,
        user: sarah._id,
        content: 'Done! Added progress bar indicator on the toast as well.',
      },
    ]);

    // 5. Demo activity & notifications
    await Activity.create([
      {
        project: project1._id,
        user: alex._id,
        action: 'created_project',
        details: 'Created project "ProjectFlow SaaS Platform"',
        target: project1.name,
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        project: project1._id,
        user: sarah._id,
        action: 'moved_task',
        details: 'Moved "Kanban Board Drag-and-Drop Animation Polish" to Review',
        target: 'Kanban Board Drag-and-Drop Animation Polish',
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
      {
        project: project1._id,
        user: priya._id,
        action: 'added_comment',
        details: 'Commented on "Kanban Board Drag-and-Drop Animation Polish"',
        target: 'Kanban Board Drag-and-Drop Animation Polish',
        createdAt: new Date(Date.now() - 1 * 3600000),
      },
      {
        project: project2._id,
        user: marcus._id,
        action: 'created_task',
        details: 'Created task "Dockerize Node.js and MongoDB Services"',
        target: 'Dockerize Node.js and MongoDB Services',
        createdAt: new Date(Date.now() - 6 * 3600000),
      },
    ]);

    await Notification.create([
      {
        recipient: alex._id,
        sender: priya._id,
        type: 'new_comment',
        title: 'New Comment on Task',
        message: 'Priya Sharma commented on "Kanban Board Drag-and-Drop Animation Polish"',
        relatedProject: project1._id,
        relatedTask: reviewTask._id,
        isRead: false,
      },
      {
        recipient: alex._id,
        sender: sarah._id,
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: 'Sarah Chen moved "Modern SaaS UI Shell & Responsive Navigation" to Completed',
        relatedProject: project1._id,
        relatedTask: p1Tasks[6]._id,
        isRead: false,
      },
      {
        recipient: alex._id,
        sender: marcus._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'Marcus Miller assigned you to "Setup GitHub Actions CI Test Workflow"',
        relatedProject: project2._id,
        isRead: true,
      },
    ]);

    console.log('[AutoSeed] Demo data seeded successfully into database!');
  } catch (error) {
    console.error('[AutoSeed Error]:', error.message);
  }
};

module.exports = autoSeed;
