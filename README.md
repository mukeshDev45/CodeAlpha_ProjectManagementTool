# ProjectFlow — Collaborative Project Management & Kanban Platform

> **CodeAlpha Full Stack Development Internship — Task 3**  
> Suggested Repository Name: `CodeAlpha_ProjectManagementTool`  
> Live Stack: **Node.js • Express.js • MongoDB • Mongoose • HTML5 • CSS3 • JavaScript (ES6+) • Socket.IO • JWT**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-forestgreen.svg)](https://www.mongodb.com/)
[![Real-time](https://img.shields.io/badge/WebSockets-Socket.IO-black.svg)](https://socket.io/)
[![Security](https://img.shields.io/badge/Auth-JWT%20%26%20bcrypt-blue.svg)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 1. Project Overview

**ProjectFlow** is a modern, high-performance, collaborative Project Management SaaS application designed for agile teams, engineering squads, and cross-functional organizations. Inspired by industry-standard platforms like **Trello, Asana, and Linear**, ProjectFlow provides an intuitive **Kanban board workflow**, real-time task updates via **Socket.IO**, rich task commenting, team member management, and proactive in-app notifications.

---

## ✨ 2. Key Features

### 🔐 1. Authentication & Security
- **JWT-Based Authentication**: Secure Bearer token storage and request authorization.
- **Password Hashing**: Strong salting and hashing powered by `bcryptjs`.
- **Protected Routes & Middleware**: Unauthorized visitors cannot view private workspace boards or APIs.
- **User Profile Management**: Update full name, job title, bio, and change account passwords.
- **One-Click Demo Logins**: Instant login buttons for evaluator demonstration (`alex@projectflow.dev`, `sarah@projectflow.dev`, `marcus@projectflow.dev`).

### 📊 2. Dynamic SaaS Dashboard
- **Top Metric Cards**:
  - Total Projects count
  - Total Tasks across all boards
  - To Do / Pending Tasks
  - In Progress Tasks
  - Completed Tasks count
- **Recent Projects Showcase**: Interactive project cards with progress bars and member stacks.
- **Upcoming Deadlines Panel**: Highlights tasks nearing their due dates.
- **Live Activity Feed**: Real-time event log tracking who created, edited, moved, or commented on tasks.

### 📁 3. Group Project Management
- Create, view, edit, and delete collaborative group projects.
- Set project priority (`Low`, `Medium`, `High`), category (`Web App`, `Mobile App`, `Design`, `DevOps`, `Marketing`), and deadline.
- Color themes per project for visual identification.
- Member role assignment (`owner`, `admin`, `member`, `viewer`).
- Secure ownership transfer and member removal with proper permission guards.

### 📋 4. Trello-Style Kanban Board
- **4 Dedicated Columns**:
  - 🔘 **To Do**
  - 🟡 **In Progress**
  - 🟠 **Review**
  - 🟢 **Completed**
- **HTML5 Drag-and-Drop**: Smooth, responsive card dragging between columns.
- **Mobile / Touch Accessibility**: Quick status move dropdown for seamless tablet and smartphone operation without needing touch-drag gestures.
- **Instant Search & Filter**: Filter cards by priority level and live text search.
- **Column Task Counters**: Real-time card count badges per column.

### 📝 5. Comprehensive Task Management
- Create tasks with title, description, priority, assignee, due date, and tags.
- Detailed task modal with status badges and creation metadata.
- Automatic overdue warning indicators for tasks past their due dates.

### 💬 6. Task Comments & Communication
- Embedded commenting thread inside every task card modal.
- Author profile avatar, job title, and relative timestamp (`just now`, `5m ago`, `yesterday`).
- Edit or delete permissions for your own comments.
- Stored permanently in MongoDB and synchronized live across connected team members.

### 👥 7. Team Directory & Assignment
- Browse all registered workspace users.
- Live search members by name, email, or job title.
- View user profile cards with roles, active projects count, and assigned tasks count.
- One-click "+ Add to Project" member invitation.

### 🔔 8. Real-Time Notification Center (Bonus Feature)
- Dedicated Notifications page + Interactive top navbar dropdown.
- Unread notification counter badges with pulse animation.
- Instant triggers for:
  - New task assignment
  - Project invitations / team additions
  - Comments on your assigned tasks
  - Task column status updates
- "Mark All as Read" and individual read status toggle.

### ⚡ 9. Real-Time Updates via Socket.IO (Bonus Feature)
- Instant synchronization across all connected clients without page reloads:
  - Dragging a task updates other teammates' boards instantly.
  - New comments appear on open task modals in real-time.
  - In-app toast alerts pop up when you are assigned or mentioned.

---

## 🛠️ 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Design System, CSS Variables, Flexbox/Grid), JavaScript (Vanilla ES6+ Modular) |
| **Backend** | Node.js, Express.js (REST APIs, MVC pattern) |
| **Database** | MongoDB, Mongoose ODM |
| **Real-Time** | Socket.IO (WebSockets with automatic fallback) |
| **Authentication**| JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Security** | Helmet.js, CORS, Input validation, Protected Express Middleware |
| **Logging** | Morgan HTTP Logger |

---

## 📂 4. Project Folder Structure

```
ProjectFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection logic
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, login, profile
│   │   │   ├── dashboardController.js# Dashboard statistics & activity feed
│   │   │   ├── projectController.js  # Project CRUD, members management
│   │   │   ├── taskController.js     # Task CRUD, status updates, my-tasks
│   │   │   ├── commentController.js  # Comment create, edit, delete
│   │   │   ├── notificationController.js # Notifications read/mark
│   │   │   └── userController.js     # User directory & search
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT Bearer token authentication guard
│   │   │   ├── projectAuth.js        # Project membership & ownership checks
│   │   │   └── errorHandler.js       # Centralized API error handling
│   │   ├── models/
│   │   │   ├── User.js               # User model with bcrypt pre-save hook
│   │   │   ├── Project.js            # Project model with members schema
│   │   │   ├── Task.js               # Task model with status enum & priority
│   │   │   ├── Comment.js            # Task comment model
│   │   │   ├── Notification.js       # In-app notification model
│   │   │   └── Activity.js           # Audit activity log model
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth endpoints
│   │   │   ├── dashboardRoutes.js    # /api/dashboard endpoints
│   │   │   ├── projectRoutes.js      # /api/projects endpoints
│   │   │   ├── taskRoutes.js         # /api/tasks endpoints
│   │   │   ├── commentRoutes.js      # /api/comments endpoints
│   │   │   ├── notificationRoutes.js # /api/notifications endpoints
│   │   │   └── userRoutes.js         # /api/users endpoints
│   │   ├── utils/
│   │   │   ├── jwt.js                # JWT token signing utility
│   │   │   └── activityLogger.js     # Activity logger & notification emitter
│   │   ├── seed.js                   # Realistic demo database seeder
│   │   └── server.js                 # Express server & Socket.IO initialization
│   ├── test-suite.js                 # Comprehensive automated integration test suite
│   ├── .env                          # Local environment variables
│   ├── .env.example                  # Example environment config
│   └── package.json                  # Backend dependencies & npm scripts
├── frontend/
│   ├── index.html                    # Single-Page Application (SPA) shell
│   ├── css/
│   │   ├── styles.css                # SaaS theme, typography, cards, modals, toasts
│   │   ├── kanban.css                # Trello-style Kanban board & drag-and-drop
│   │   └── responsive.css            # Mobile drawer, tablet layouts, touch rules
│   ├── js/
│   │   ├── config.js                 # API endpoints & constants
│   │   ├── api.js                    # Fetch wrapper with auto-Bearer auth
│   │   ├── state.js                  # Reactive client memory store
│   │   ├── ui.js                     # Toasts, modals, formatters, alerts
│   │   ├── auth.js                   # Sign In, Register, Demo Logins
│   │   ├── socket.js                 # Socket.IO client & real-time events
│   │   ├── dashboard.js              # Stats calculations & feeds
│   │   ├── projects.js               # Projects management & team modals
│   │   ├── board.js                  # Kanban board & drag-and-drop engine
│   │   ├── tasks.js                  # Task modals, CRUD & my-tasks view
│   │   ├── comments.js               # Discussion thread controller
│   │   ├── team.js                   # Directory & member searching
│   │   ├── notifications.js          # In-app notification center
│   │   ├── profile.js                # Account details & password changes
│   │   └── app.js                    # App startup & view router
│   └── assets/
│       └── favicon.svg               # Vector brand icon
├── .env.example
├── .gitignore
├── README.md
└── package.json                      # Workspace root scripts
```

---

## 🚀 5. Installation & Setup Guide

### Step 1: Prerequisites
Make sure you have installed on your computer:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI.

### Step 2: Clone or Open Project
```bash
git clone https://github.com/<your-username>/CodeAlpha_ProjectManagementTool.git
cd CodeAlpha_ProjectManagementTool
```
*(Or navigate into the `ProjectFlow` directory)*

### Step 3: Install Dependencies
From the `ProjectFlow` directory:
```bash
npm run install:backend
```
*(Or directly inside `backend`)*:
```bash
cd backend
npm install
```

### Step 4: Configure Environment Variables
Inside `backend/`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/projectflow
JWT_SECRET=projectflow_super_secret_jwt_key_2026_dev_alpha
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5000
NODE_ENV=development
```

### Step 5: Seed Demo Data (Recommended)
Populate the database with realistic demo projects, team members, tasks in all Kanban columns, comments, and activities:
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
The server will output:
```
=======================================================
 ProjectFlow Server running in development mode
 Local URL: http://localhost:5000
 WebSocket Real-Time Server active on port 5000
=======================================================
```

Open your browser and navigate to:  
👉 **`http://localhost:5000`**

### Demo Login Accounts:
You can log in instantly using the one-click demo buttons on the login screen, or type:
- **Mukesh (Project Lead / Admin)**: `alex@projectflow.dev` / `password123`
- **Sarah Chen (Frontend Engineer)**: `sarah@projectflow.dev` / `password123`
- **Marcus Miller (Backend Engineer)**: `marcus@projectflow.dev` / `password123`
- **Priya Sharma (UI/UX Designer)**: `priya@projectflow.dev` / `password123`
- **David Kim (Full Stack Engineer)**: `david@projectflow.dev` / `password123`

---

## 🧪 7. Automated Testing

ProjectFlow includes a comprehensive automated full-stack integration test suite (`test-suite.js`) covering 22 individual test assertions across all features:

To run the automated tests:
```bash
cd backend
node test-suite.js
```

### Test Coverage Summary:
- ✅ **API Health & Database Check**
- ✅ **Static Frontend SPA Asset Delivery**
- ✅ **User Authentication & JWT Verification**
- ✅ **Protected Profile Routes (`/api/auth/me`)**
- ✅ **Team User Directory & Regex Search**
- ✅ **Project Creation, Member Addition & Role Assignment**
- ✅ **Kanban Column Task Creation (`To Do`, `In Progress`, `Review`, `Completed`)**
- ✅ **Drag-and-Drop Task Status Movement**
- ✅ **Task Comment Thread Creation & Editing**
- ✅ **In-App Real-Time Notification Delivery & Read State**
- ✅ **Dashboard Aggregations & Completion Rate Calculation**
- ✅ **Security: 401 Unauthorized Block on Protected Endpoints**

---

## 📡 8. REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login user & return JWT token
- `GET /api/auth/me` — Get authenticated user details *(Protected)*
- `PUT /api/auth/profile` — Update user profile *(Protected)*
- `PUT /api/auth/password` — Change password *(Protected)*

### Projects
- `POST /api/projects` — Create group project *(Protected)*
- `GET /api/projects` — Get projects for current user *(Protected)*
- `GET /api/projects/:id` — Get single project details & member stats *(Protected)*
- `PUT /api/projects/:id` — Update project metadata *(Owner / Admin)*
- `DELETE /api/projects/:id` — Delete project & related data *(Owner Only)*
- `POST /api/projects/:id/members` — Add member to project *(Owner / Admin)*
- `DELETE /api/projects/:id/members/:userId` — Remove member *(Owner / Admin)*
- `PUT /api/projects/:id/transfer-owner` — Transfer project ownership *(Owner Only)*
- `GET /api/projects/:id/activities` — Get recent project activity trail *(Protected)*

### Tasks & Kanban
- `POST /api/projects/:projectId/tasks` — Create new task in project *(Protected)*
- `GET /api/projects/:projectId/tasks` — Get tasks for project *(Protected)*
- `GET /api/tasks/:id` — Get task details with comments *(Protected)*
- `PUT /api/tasks/:id` — Update task details *(Protected)*
- `PATCH /api/tasks/:id/status` — Quick status move (Kanban drag-and-drop) *(Protected)*
- `DELETE /api/tasks/:id` — Delete task *(Protected)*
- `GET /api/tasks/my-tasks` — Get all tasks assigned to logged-in user *(Protected)*

### Comments & Discussion
- `POST /api/tasks/:taskId/comments` — Add comment to task *(Protected)*
- `GET /api/tasks/:taskId/comments` — Get comments for task *(Protected)*
- `PUT /api/comments/:id` — Edit own comment *(Author Only)*
- `DELETE /api/comments/:id` — Delete comment *(Author / Project Admin)*

### Notifications & Dashboard
- `GET /api/notifications` — List notifications for user *(Protected)*
- `PATCH /api/notifications/:id/read` — Mark notification read *(Protected)*
- `PATCH /api/notifications/read-all` — Mark all notifications read *(Protected)*
- `GET /api/dashboard/stats` — Dashboard counters & analytics *(Protected)*

---

## 🛡️ 9. Security & Best Practices

1. **Password Safety**: Passwords are never stored in plain text; they are encrypted with 10 salt rounds of `bcryptjs`.
2. **Token Protection**: JWTs have expiration limits (`7d`) and are validated on every private request via Express middleware.
3. **Sensitive Data Protection**: Passwords are set with `select: false` on Mongoose schemas to avoid accidental API exposure.
4. **Environment Isolation**: `.env` is omitted from version control using `.gitignore`.
5. **Role-Based Authorization**: Only owners or admins can remove members or delete projects.

---

## 👨‍💻 10. Author & Acknowledgements

Developed as part of the **CodeAlpha Full Stack Web Development Internship (Task 3)**.

- **Developer**: Full Stack Development Intern
- **Project**: CodeAlpha Task 3 — Project Management Tool
- **GitHub Repository**: `CodeAlpha_ProjectManagementTool`
- **Application**: ProjectFlow
