const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { logActivity, createNotification } = require('../utils/activityLogger');

// @desc    Create new task in project
// @route   POST /api/projects/:projectId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate, tags, labels, recurring } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check membership authorization
    const userId = req.user._id.toString();
    const isMember =
      project.owner.toString() === userId ||
      project.members.some((m) => m.user.toString() === userId) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You must be a project member to create tasks',
      });
    }

    // If assignedTo provided, check if valid user
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findById(assignedTo);
    }

    // Get current count in status column for ordering
    const columnCount = await Task.countDocuments({
      project: projectId,
      status: status || 'To Do',
    });

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      order: columnCount,
      tags: Array.isArray(tags) ? tags : [],
      labels: Array.isArray(labels) ? labels : [],
      recurring: recurring || 'none',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    const io = req.app.get('io');

    // Send notification if assigned to another user
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you to task "${task.title}" in ${project.name}`,
        relatedProject: project._id,
        relatedTask: task._id,
        io,
      });
    }

    // Log project activity
    await logActivity({
      project: project._id,
      task: task._id,
      user: req.user._id,
      action: 'created_task',
      details: `Created task "${task.title}" [${task.status}]`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${projectId}`).emit('task:created', {
        ...populatedTask.toObject(),
        commentCount: 0,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: {
        ...populatedTask.toObject(),
        commentCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo, search } = req.query;

    let filter = { project: projectId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort({ order: 1, createdAt: -1 });

    // Attach comments count for each task
    const tasksWithCommentCount = await Promise.all(
      tasks.map(async (t) => {
        const commentCount = await Comment.countDocuments({ task: t._id });
        return {
          ...t.toObject(),
          commentCount,
        };
      })
    );

    res.json({
      success: true,
      count: tasksWithCommentCount.length,
      tasks: tasksWithCommentCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task details with comments
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar')
      .populate('project', 'name color members owner');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comments = await Comment.find({ task: task._id })
      .populate('user', 'name email avatar jobTitle')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      task: {
        ...task.toObject(),
        comments,
        commentCount: comments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, tags, labels, recurring } = req.body;
    let task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;
    const previousStatus = task.status;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : [];
    if (labels !== undefined) task.labels = Array.isArray(labels) ? labels : [];
    if (recurring !== undefined) task.recurring = recurring;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    const commentCount = await Comment.countDocuments({ task: task._id });
    const fullTaskObj = { ...updatedTask.toObject(), commentCount };

    const io = req.app.get('io');

    // Notify new assignee if changed
    const newAssignee = assignedTo ? assignedTo.toString() : null;
    if (newAssignee && newAssignee !== previousAssignee && newAssignee !== req.user._id.toString()) {
      await createNotification({
        recipient: newAssignee,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned To You',
        message: `${req.user.name} assigned you to "${task.title}"`,
        relatedProject: task.project._id,
        relatedTask: task._id,
        io,
      });
    }

    // Notify if status changed
    if (status && status !== previousStatus && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `Task "${task.title}" status changed from "${previousStatus}" to "${status}"`,
        relatedProject: task.project._id,
        relatedTask: task._id,
        io,
      });
    }

    // Log activity
    await logActivity({
      project: task.project._id,
      task: task._id,
      user: req.user._id,
      action: 'updated_task',
      details: `Updated task "${task.title}"`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${task.project._id.toString()}`).emit('task:updated', fullTaskObj);
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: fullTaskObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update status (Kanban column drag and drop)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;

    if (!status || !['To Do', 'In Progress', 'Review', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid task status is required' });
    }

    let task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousStatus = task.status;
    task.status = status;
    if (order !== undefined) task.order = Number(order);

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    const commentCount = await Comment.countDocuments({ task: task._id });
    const fullTaskObj = { ...updatedTask.toObject(), commentCount };

    const io = req.app.get('io');

    // Notify assignee if someone else moved the task
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'task_status_changed',
        title: 'Task Moved',
        message: `${req.user.name} moved "${task.title}" to ${status}`,
        relatedProject: task.project._id,
        relatedTask: task._id,
        io,
      });
    }

    await logActivity({
      project: task.project._id,
      task: task._id,
      user: req.user._id,
      action: 'moved_task',
      details: `Moved "${task.title}" from ${previousStatus} -> ${status}`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${task.project._id.toString()}`).emit('task:status_changed', {
        taskId: task._id,
        previousStatus,
        newStatus: status,
        task: fullTaskObj,
      });
    }

    // Feature 8: Recurring Task Auto-Schedule
    if (status === 'Completed' && previousStatus !== 'Completed' && task.recurring && task.recurring !== 'none') {
      try {
        let nextDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
        if (task.recurring === 'daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurring === 'weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurring === 'monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        const nextTask = await Task.create({
          title: `${task.title.replace(' (Recurring)', '')} (Recurring)`,
          description: task.description,
          project: task.project._id,
          status: 'To Do',
          priority: task.priority,
          assignedTo: task.assignedTo,
          createdBy: req.user._id,
          dueDate: nextDueDate,
          tags: task.tags,
          labels: task.labels,
          recurring: task.recurring,
        });

        const popNextTask = await Task.findById(nextTask._id)
          .populate('assignedTo', 'name email avatar jobTitle')
          .populate('createdBy', 'name email avatar');

        await logActivity({
          project: task.project._id,
          task: nextTask._id,
          user: req.user._id,
          action: 'created_task',
          details: `Auto-generated recurring task for ${task.recurring} schedule`,
          target: nextTask.title,
          io,
        });

        if (io) {
          io.to(`project:${task.project._id.toString()}`).emit('task:created', {
            task: { ...popNextTask.toObject(), commentCount: 0 },
            column: 'To Do',
          });
        }
      } catch (recErr) {
        console.warn('Recurring task generation warning:', recErr.message);
      }
    }

    res.json({
      success: true,
      message: `Task moved to ${status}`,
      task: fullTaskObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const projectId = task.project;
    const taskTitle = task.title;

    // Delete comments
    await Comment.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(task._id);

    const io = req.app.get('io');

    await logActivity({
      project: projectId,
      user: req.user._id,
      action: 'deleted_task',
      details: `Deleted task "${taskTitle}"`,
      target: taskTitle,
      io,
    });

    if (io) {
      io.to(`project:${projectId.toString()}`).emit('task:deleted', {
        taskId: task._id,
        projectId,
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      taskId: task._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks assigned to current user across all projects
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    let query = { assignedTo: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate('project', 'name color deadline')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });

    const tasksWithCommentCount = await Promise.all(
      tasks.map(async (t) => {
        const commentCount = await Comment.countDocuments({ task: t._id });
        return {
          ...t.toObject(),
          commentCount,
        };
      })
    );

    res.json({
      success: true,
      count: tasksWithCommentCount.length,
      tasks: tasksWithCommentCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity timeline for a task
// @route   GET /api/tasks/:id/activities
// @access  Private
const getTaskActivities = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const Activity = require('../models/Activity');
    const activities = await Activity.find({
      $or: [
        { task: task._id },
        { target: task.title, project: task.project }
      ]
    })
      .populate('user', 'name email avatar jobTitle')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload task attachment file
// @route   POST /api/tasks/:id/attachments
// @access  Private
const uploadTaskAttachment = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const attachment = {
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar')
      .populate('project', 'name color');

    const io = req.app.get('io');
    await logActivity({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'uploaded_attachment',
      details: `Uploaded attachment "${file.originalname}"`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${task.project.toString()}`).emit('task:updated', populatedTask);
    }

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      attachment: task.attachments[task.attachments.length - 1],
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task attachment file
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const attIndex = task.attachments.findIndex((a) => a._id.toString() === attachmentId);
    if (attIndex === -1) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const attachment = task.attachments[attIndex];
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Could not delete attachment file:', err.message);
      }
    }

    task.attachments.splice(attIndex, 1);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar jobTitle')
      .populate('createdBy', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar')
      .populate('project', 'name color');

    const io = req.app.get('io');
    await logActivity({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'deleted_attachment',
      details: `Removed attachment "${attachment.originalName}"`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${task.project.toString()}`).emit('task:updated', populatedTask);
    }

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
  getTaskActivities,
  uploadTaskAttachment,
  deleteTaskAttachment,
};
