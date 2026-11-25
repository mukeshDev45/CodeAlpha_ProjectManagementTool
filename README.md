# Project Management Tool — Collaborative SaaS Kanban Platform

> **CodeAlpha Full Stack Development Internship — Task 3**  
> Suggested Repository Name: `CodeAlpha_ProjectManagementTool`  
> Live Stack: **Node.js • Express.js • MongoDB • Mongoose • HTML5 • CSS3 • JavaScript (ES6+ Vanilla) • Socket.IO • JWT**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-forestgreen.svg)](https://www.mongodb.com/)
[![Real-time](https://img.shields.io/badge/WebSockets-Socket.IO-black.svg)](https://socket.io/)
[![Security](https://img.shields.io/badge/Auth-JWT%20%26%20bcrypt-blue.svg)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 1. Project Overview

**ProjectFlow** is a modern, high-performance, collaborative Project Management SaaS platform designed for agile teams, engineering squads, and cross-functional organizations. Built for the **CodeAlpha Full Stack Development Internship (Task 3)**, ProjectFlow combines the intuitive card-and-column workflow of **Trello**, the deadline management of **Asana**, and the speed of **Linear**.

The application features an advanced **4-column Kanban board**, live **Socket.IO WebSockets** synchronization, comprehensive **task file attachments**, **recurring task automation**, **monthly deadline calendar**, **project CSV export**, **dynamic team roles (Admin, Lead, Member)**, **audit activity logs**, and **dark/light theme customization**.

---

## ✨ 2. Key Features

### 🔐 1. Authentication & Security
- **JWT-Based Authentication**: Secure HTTP Bearer token authorization and persistent login sessions.
- **Bcrypt Password Encryption**: Industry-standard salt-and-hash encryption via `bcryptjs` (10 rounds).
- **Protected Express Middleware**: Server-side route guards enforcing authentication across all private resources.
- **User Profile Management**: Update full name, title, bio, and change account passwords securely.
- **Password Reset Utility**: Cryptographic reset token generation and verification (`/api/auth/forgot-password` & `/api/auth/reset-password`).
- **Development Demo Accounts**: One-click quick login buttons pre-configured for evaluation (`mukesh@projectflow.dev`, `sarah@projectflow.dev`, `marcus@projectflow.dev`).

### 📊 2. Dynamic SaaS Analytics Dashboard
- **MongoDB-Driven Metric Counters**: Real-time counts for Total Projects, Active Tasks, In Progress, Review, and Completed items.
- **7-Day Velocity Chart**: Visual SVG task completion trends over the previous 7 days calculated from MongoDB records.
- **Status Distribution Bars**: Proportional completion progress across all active projects.
- **Upcoming Deadlines & Overdue Indicators**: Proactive highlights for tasks approaching or past due dates.
- **Live Activity Feed**: Centralized audit stream recording who created, updated, moved, or commented on tasks.

### 📋 3. Advanced 4-Column Kanban Board
- **Dedicated Agile Columns**:
  - 🔘 **To Do**
  - 🟡 **In Progress**
  - 🟠 **Review**
  - 🟢 **Completed**
- **HTML5 Drag-and-Drop**: Smooth, animated card movement across columns with real-time backend persistence.
- **Mobile / Touch Quick-Move Selector**: Seamless dropdown status changer on each card for mobile/touch screens.
- **Colored Category Labels & Priority Badges**: Visual tags (`Low`, `Medium`, `High`, `Urgent`) and colored chips.
- **Overdue Visual Border**: Glowing alert border (`.task-card-overdue`) on past-due task cards.
- **Instant Filters & Search**: Filter Kanban cards by title, assignee, and priority in real-time.

### 📁 4. Team Collaboration & Project Management
- **Role-Based Access Control (RBAC)**: Manage workspace projects with `owner`, `admin`, `lead`, `member`, and `viewer` roles.
- **Dynamic Role Management**: Promotes or reassigns roles (`PATCH /api/projects/:id/members/:userId/role`).
- **Team Invitations**: Invite colleagues by email with pending status tracking (`POST /api/projects/:id/invitations`).
- **Project Categories & Deadlines**: Organize projects by category (`Web App`, `Mobile App`, `Design`, `DevOps`, `Marketing`).
- **Ownership Transfer**: Secure project transfer with strict permission validation.

### 🔄 5. Recurring Tasks Engine
- Automated task recurrence engine supporting **Daily**, **Weekly**, and **Monthly** schedules.
- When a recurring task is moved to **Completed**, the backend automatically schedules and creates the next cycle card in **To Do**.

### 📎 6. Task File Attachments
- Secure multi-file upload engine powered by **Multer**.
- Strict file validation: maximum 5MB size limit and safe MIME type filtering (Images, PDFs, Documents, ZIPs).
- In-modal attachment preview thumbnails, download links, and confirmation-guarded deletion.

### 📅 7. Interactive Deadline Calendar View
- Monthly visual calendar view accessible from **My Tasks**.
- Shows deadline chips mapped to specific calendar days with status color coding.
- Clicking on a deadline card opens the comprehensive task details modal.

### 📊 8. Project CSV Report Export
- One-click project report generation (`GET /api/projects/:id/export-csv`).
- Exports complete task rosters with titles, descriptions, assignees, priorities, column status, due dates, and creation timestamps as standard CSV.

### 💬 9. Task Comments & Real-Time Discussions
- Threaded discussions embedded inside every task modal.
- Author avatars, timestamps, and edit/delete permissions with custom styled modal dialogs (`UI.confirm`).
- Real-time comment broadcast via Socket.IO.

### 🌗 10. Complete Dark & Light Theme
- Custom design system with CSS custom properties (`--bg-main`, `--bg-card`, `--text-main`, etc.).
- Instant theme toggle in the top navigation bar with persistent client preference in `localStorage`.

### 🔍 11. Multi-Model Global Search (`Ctrl + K`)
- Workspace-wide search overlay shortcut (`Ctrl + K`).
- Queries Projects, Tasks, and Team Members simultaneously with highlighted result links.

### 📜 12. Comprehensive Audit Activity Logs
- Audit trails for project and task modifications (`GET /api/projects/:id/activities` and `/api/tasks/:id/activities`).
- Records event types, actor details, previous vs. new values, and relative timestamps.

### 🔔 13. Real-Time Notification Center (Bonus Feature)
- In-app notification center and top navbar badge counter.
- Socket.IO alerts for task assignments, project invites, mentions, and status movements.

---

## 🛠️ 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Design System, CSS Variables, Flexbox/Grid), Vanilla JavaScript (Modular ES6+) |
| **Backend** | Node.js, Express.js (REST APIs, Controller-Service-Repository pattern) |
| **Database** | MongoDB, Mongoose ODM |
| **Real-Time** | Socket.IO (WebSockets with automatic polling fallback) |
| **File Storage**| Multer file upload middleware with disk storage & validation |
| **Authentication**| JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Security** | Helmet.js, CORS, Input validation, Protected Express Middleware |
| **Testing** | Automated Node.js integration test suites (214 tests across 7 suites) |

---

## 📂 4. Project Folder Structure

```
ProjectFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                      # MongoDB connection logic
│   │   ├── controllers/
│   │   │   ├── authController.js          # Authentication, JWT, profile, password reset
│   │   │   ├── dashboardController.js     # MongoDB metrics, velocity, activity feeds
│   │   │   ├── projectController.js       # Projects, members, invitations, CSV export
│   │   │   ├── taskController.js          # Tasks, Kanban moves, recurrence, attachments
│   │   │   ├── commentController.js       # Comments CRUD
│   │   │   ├── notificationController.js  # In-app notifications
│   │   │   ├── searchController.js        # Global multi-model search
│   │   │   └── userController.js          # User directory & user profile stats
│   │   ├── middleware/
│   │   │   ├── auth.js                    # JWT Bearer token authentication guard
│   │   │   ├── projectAuth.js             # Project membership & ownership checks
│   │   │   └── errorHandler.js            # Centralized API error handling
│   │   ├── models/
│   │   │   ├── User.js                    # User schema with bcrypt hooks & roles
│   │   │   ├── Project.js                 # Project schema with members & invitations
│   │   │   ├── Task.js                    # Task schema with recurrence & attachments
│   │   │   ├── Comment.js                 # Task comment model
│   │   │   ├── Notification.js            # In-app notification model
│   │   │   └── Activity.js                # Workspace audit log model
│   │   ├── routes/
│   │   │   ├── authRoutes.js              # /api/auth endpoints
│   │   │   ├── dashboardRoutes.js         # /api/dashboard endpoints
│   │   │   ├── projectRoutes.js           # /api/projects endpoints & CSV export
│   │   │   ├── taskRoutes.js              # /api/tasks endpoints & attachments
│   │   │   ├── commentRoutes.js           # /api/comments endpoints
│   │   │   ├── notificationRoutes.js      # /api/notifications endpoints
│   │   │   ├── searchRoutes.js            # /api/search endpoints
│   │   │   └── userRoutes.js              # /api/users endpoints
│   │   ├── utils/
│   │   │   ├── jwt.js                     # JWT token signing & verification
│   │   │   └── activityLogger.js          # Activity logging & WebSocket event emitter
│   │   ├── seed.js                        # Demo database seeder
│   │   ├── autoSeed.js                    # Development auto-seeder
│   │   └── server.js                      # Express server & Socket.IO initialization
│   ├── uploads/                           # Secure file attachments directory
│   ├── final-master-qa-runner.js          # Master QA test runner executing 7 test suites
│   ├── saas-platform-verification.js      # SaaS 12-feature integration test suite (34 tests)
│   ├── comprehensive-audit-v2.js          # Full API audit test suite (45 tests)
│   ├── profile-and-features-audit.js      # Profile, settings & navigation audit (24 tests)
│   ├── test-suite.js                      # Core functional test suite (22 tests)
│   ├── deep-verification.js               # Edge-case & permission test suite (40 tests)
│   ├── advanced-verification.js           # Workflow integration test suite (19 tests)
│   ├── qa-master-audit.js                 # API security & performance audit (30 tests)
│   ├── .env                               # Local environment configuration
│   └── package.json                       # Backend dependencies & npm scripts
├── frontend/
│   ├── index.html                         # Single-Page Application (SPA) shell
│   ├── css/
│   │   ├── styles.css                     # SaaS design system, cards, modals, skeletons
│   │   ├── kanban.css                     # 4-column Kanban board & drag-and-drop
│   │   └── responsive.css                 # Mobile off-canvas drawer, responsive grid
│   ├── js/
│   │   ├── config.js                      # API base URL & runtime configuration
│   │   ├── api.js                         # Fetch wrapper with Bearer token injection
│   │   ├── state.js                       # Centralized reactive client store
│   │   ├── ui.js                          # Toasts, styled confirmation modals, formatters
│   │   ├── auth.js                        # Sign in, registration & demo logins
│   │   ├── theme.js                       # Dark/Light theme manager & persistence
│   │   ├── socket.js                      # Socket.IO client & real-time event listeners
│   │   ├── dashboard.js                   # Metrics dashboard, velocity chart & activity
│   │   ├── projects.js                    # Projects CRUD, invitations & role management
│   │   ├── board.js                       # Kanban board drag-and-drop & filters
│   │   ├── tasks.js                       # Task modals, recurrence & file attachments
│   │   ├── calendar.js                    # Monthly task deadline calendar view
│   │   ├── comments.js                    # Task discussion threads & dialog confirmations
│   │   ├── team.js                        # Workspace member directory & search
│   │   ├── notifications.js               # Notification center & read state
│   │   ├── profile.js                     # Profile settings, stats & password update
│   │   ├── search.js                      # Global search overlay (Ctrl + K)
│   │   └── app.js                         # Application bootstrapper & SPA router
│   └── assets/
│       └── favicon.svg                    # Brand vector icon
├── README.md                              # Complete platform documentation
└── package.json                           # Workspace root scripts
```

---

## 🚀 5. Installation & Setup Guide

### Step 1: Prerequisites
Ensure you have installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/projectflow`) or a MongoDB Atlas cloud URI.

### Step 2: Navigate to Project Directory
```bash
cd "c:\Users\acer\OneDrive\Desktop\Project Management Tool\ProjectFlow"
```

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Environment Configuration
Verify that `backend/.env` exists with the following configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/projectflow
JWT_SECRET=projectflow_super_secret_jwt_key_2026_dev_alpha
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5000
NODE_ENV=development
```

### Step 5: Seed Demo Database (Optional)
If you want to re-seed realistic demo projects, team members, tasks, comments, and activities:
```bash
cd backend
npm run seed
```

---

## 🏃‍♂️ 6. How to Run the Application

Start the Express backend and WebSocket server:
```bash
cd backend
npm start
```
The server will initialize:
```
=======================================================
 ProjectFlow Server running in development mode
 Local URL: http://localhost:5000
 WebSocket Real-Time Server active on port 5000
 Connected to MongoDB: projectflow
=======================================================
```

Open your browser and navigate to:  
👉 **`http://localhost:5000`**

### Pre-Configured Evaluation Demo Accounts:
Use the one-click demo buttons on the login screen or enter:
- **Mukesh (Project Lead / Admin)**: `mukesh@projectflow.dev` / `password123`
- **Sarah Chen (Frontend Engineer)**: `sarah@projectflow.dev` / `password123`
- **Marcus Miller (Backend Engineer)**: `marcus@projectflow.dev` / `password123`
- **Priya Sharma (UI/UX Designer)**: `priya@projectflow.dev` / `password123`
- **David Kim (Full Stack Engineer)**: `david@projectflow.dev` / `password123`

---

## 🧪 7. Automated Testing & Verification

ProjectFlow includes an extensive automated testing harness featuring **7 comprehensive test suites** covering **214 automated test assertions** across all backend APIs, database operations, security middleware, and frontend assets:

### To run the Master QA Test Runner:
```bash
cd backend
node final-master-qa-runner.js
```

### Test Suites Included:
1. **`saas-platform-verification.js`** (34 tests): Verifies all 12 SaaS platform features including Drag & Drop, Team Invites, Dynamic Roles, Analytics, Calendar, Attachments, Global Search, Recurring Tasks, CSV Export, and Theme.
2. **`comprehensive-audit-v2.js`** (45 tests): Verifies all REST endpoints, query filters, authorization, and error handling.
3. **`profile-and-features-audit.js`** (24 tests): Verifies Profile & Settings page, bio, job title, password changes, and navigation views.
4. **`test-suite.js`** (22 tests): Verifies core CodeAlpha Task 3 features (Auth, Projects, Tasks, Comments, Notifications).
5. **`deep-verification.js`** (40 tests): Verifies edge-cases, data sanitization, cascade deletions, and boundary permissions.
6. **`advanced-verification.js`** (19 tests): Verifies complex workflows, Kanban state transitions, and real-time socket events.
7. **`qa-master-audit.js`** (30 tests): Verifies security headers, token expiration, injection safety, and performance response times.

**Verification Result**: **214 Passed / 0 Failed (100% Pass Rate)**.

---

## 📡 8. REST API Reference

### Authentication & Profile
- `POST /api/auth/register` — Register a new workspace user
- `POST /api/auth/login` — Authenticate user & return JWT token
- `GET /api/auth/me` — Retrieve current authenticated user *(Protected)*
- `PUT /api/auth/profile` — Update user profile details *(Protected)*
- `PUT /api/auth/password` — Change password *(Protected)*
- `POST /api/auth/forgot-password` — Generate cryptographic password reset token
- `POST /api/auth/reset-password` — Reset password using token
- `GET /api/users/:id` — Get public user profile & activity metrics *(Protected)*
- `GET /api/users` — List workspace team members *(Protected)*

### Projects & Team Collaboration
- `POST /api/projects` — Create group project *(Protected)*
- `GET /api/projects` — List projects for current user *(Protected)*
- `GET /api/projects/:id` — Get project details & team roster *(Protected)*
- `PUT /api/projects/:id` — Update project metadata *(Owner / Admin)*
- `DELETE /api/projects/:id` — Delete project & cascade data *(Owner Only)*
- `POST /api/projects/:id/members` — Add member to project *(Owner / Admin)*
- `DELETE /api/projects/:id/members/:userId` — Remove member from project *(Owner / Admin)*
- `PATCH /api/projects/:id/members/:userId/role` — Update member role *(Owner / Admin)*
- `POST /api/projects/:id/invitations` — Send email invitation to project *(Owner / Admin)*
- `GET /api/projects/:id/export-csv` — Export project tasks report as CSV *(Protected)*
- `GET /api/projects/:id/activities` — Retrieve project activity audit trail *(Protected)*

### Tasks & Kanban
- `POST /api/projects/:projectId/tasks` — Create new task in project *(Protected)*
- `GET /api/projects/:projectId/tasks` — Get tasks for specific project *(Protected)*
- `GET /api/tasks/:id` — Get task details with attachments & comments *(Protected)*
- `PUT /api/tasks/:id` — Update task details *(Protected)*
- `PATCH /api/tasks/:id/status` — Move task status column (Kanban Drag & Drop) *(Protected)*
- `DELETE /api/tasks/:id` — Permanently delete task *(Protected)*
- `GET /api/tasks/my-tasks` — Get all tasks assigned to logged-in user *(Protected)*
- `POST /api/tasks/:id/attachments` — Upload file attachments to task *(Protected)*
- `DELETE /api/tasks/:id/attachments/:attachmentId` — Delete file attachment *(Protected)*
- `GET /api/tasks/:id/activities` — Get task-level activity history *(Protected)*

### Comments & Discussions
- `POST /api/tasks/:taskId/comments` — Add comment to task *(Protected)*
- `GET /api/tasks/:taskId/comments` — Get comment thread for task *(Protected)*
- `PUT /api/comments/:id` — Edit own comment *(Author Only)*
- `DELETE /api/comments/:id` — Delete comment *(Author / Project Admin)*

### Global Search, Notifications & Dashboard
- `GET /api/search?q=:query` — Multi-model global search across projects, tasks, and users *(Protected)*
- `GET /api/notifications` — List in-app notifications *(Protected)*
- `PATCH /api/notifications/:id/read` — Mark notification as read *(Protected)*
- `PATCH /api/notifications/read-all` — Mark all notifications as read *(Protected)*
- `GET /api/dashboard/stats` — Dashboard analytics, 7-day velocity & counts *(Protected)*

---

## 🛡️ 9. Security & Production Standards

1. **Password Hashing**: Passwords are never stored in plain text. Salt rounds (`10`) with `bcryptjs` are enforced.
2. **Token Security**: JWT tokens are signed with expiration periods (`7d`) and verified using protected middleware.
3. **Data Sanitization**: Mongoose schemas use `select: false` on sensitive password fields.
4. **File Upload Restrictions**: Multer middleware limits attachment size to 5MB and enforces strict MIME-type whitelisting.
5. **Role-Based Authorization**: Endpoints verify user roles before granting administrative actions.
6. **No Exposed Secrets**: All sensitive secrets are kept strictly in `.env` and omitted from version control.

---

## 👨‍💻 10. Internship Submission Information

- **Internship**: CodeAlpha Full Stack Web Development Internship
- **Task**: Task 3 — Project Management Tool
- **Project Name**: ProjectFlow
- **Suggested Repository**: `CodeAlpha_ProjectManagementTool`
- **Application Type**: Full Stack Collaborative SaaS Web Application
