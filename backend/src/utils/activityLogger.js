const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

/**
 * Log activity for a project and emit via Socket.IO if available
 */
const logActivity = async ({ project, task = null, user, action, details = '', target = '', io = null }) => {
  try {
    const activity = await Activity.create({
      project,
      task: task ? (task._id || task) : null,
      user,
      action,
      details,
      target,
    });

    const populatedActivity = await Activity.findById(activity._id).populate('user', 'name email avatar');

    if (io) {
      io.to(`project:${project.toString()}`).emit('activity:new', populatedActivity);
    }

    return populatedActivity;
  } catch (error) {
    console.error('Error logging activity:', error.message);
  }
};

/**
 * Send in-app notification and emit to user's real-time socket room
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  relatedProject = null,
  relatedTask = null,
  io = null,
}) => {
  try {
    // Avoid sending notification to self
    if (recipient && sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedProject,
      relatedTask,
    });

    const populated = await Notification.findById(notification._id)
      .populate('sender', 'name email avatar')
      .populate('relatedProject', 'name color')
      .populate('relatedTask', 'title status priority');

    if (io) {
      io.to(`user:${recipient.toString()}`).emit('notification:new', populated);
    }

    return populated;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

module.exports = {
  logActivity,
  createNotification,
};
