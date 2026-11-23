const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Attach Socket.IO to app so controllers can access via req.app.get('io')
app.set('io', io);

// Socket.IO event handling
io.on('connection', (socket) => {
  // User joins their personal room for direct notifications
  socket.on('user:join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Client joins a project room to receive real-time updates for that project
  socket.on('project:join', (projectId) => {
    if (projectId) {
      socket.join(`project:${projectId}`);
    }
  });

  // Client leaves project room
  socket.on('project:leave', (projectId) => {
    if (projectId) {
      socket.leave(`project:${projectId}`);
    }
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // allow loading local scripts, styles and Socket.IO smoothly
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Serve static uploaded task attachments
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProjectFlow API is running smoothly',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Catch-all route to serve index.html for SPA client navigation
app.get('*', (req, res, next) => {
  // If it's an API route, uploaded file, or static file extension that wasn't found, return 404
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || path.extname(req.path)) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` ProjectFlow Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` WebSocket Real-Time Server active on port ${PORT}`);
    console.log(`=======================================================`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
