const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { logActivity, createNotification } = require('../utils/activityLogger');

// @desc    Add comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name email avatar jobTitle'
    );

    const io = req.app.get('io');

    // Notify task assignee if someone else commented
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'new_comment',
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}"`,
        relatedProject: task.project._id,
        relatedTask: task._id,
        io,
      });
    }

    // Also notify task creator if different from commenter and assignee
    if (
      task.createdBy &&
      task.createdBy.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo.toString() !== task.createdBy.toString())
    ) {
      await createNotification({
        recipient: task.createdBy,
        sender: req.user._id,
        type: 'new_comment',
        title: 'New Comment on Task You Created',
        message: `${req.user.name} commented on "${task.title}"`,
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
      action: 'added_comment',
      details: `Commented on task "${task.title}"`,
      target: task.title,
      io,
    });

    if (io) {
      io.to(`project:${task.project._id.toString()}`).emit('comment:added', {
        taskId,
        comment: populatedComment,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatar jobTitle')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (Author only)
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const comment = await Comment.findById(id).populate('task');
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check author
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own comments',
      });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'user',
      'name email avatar jobTitle'
    );

    const io = req.app.get('io');
    if (io && comment.task && comment.task.project) {
      io.to(`project:${comment.task.project.toString()}`).emit('comment:updated', {
        taskId: comment.task._id,
        comment: populated,
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Author or Project Admin)
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id).populate({
      path: 'task',
      populate: { path: 'project' },
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isOwner =
      comment.task &&
      comment.task.project &&
      comment.task.project.owner &&
      comment.task.project.owner.toString() === req.user._id.toString();

    if (!isAuthor && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own comments',
      });
    }

    const taskId = comment.task ? comment.task._id : null;
    const projectId = comment.task && comment.task.project ? comment.task.project._id : null;

    await Comment.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io && projectId) {
      io.to(`project:${projectId.toString()}`).emit('comment:deleted', {
        taskId,
        commentId: id,
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      commentId: id,
      taskId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
};
