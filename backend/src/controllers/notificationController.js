const Notification = require('../models/Notification');
const Task = require('../models/Task');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    // Check for approaching deadlines or overdue tasks assigned to this user
    try {
      const alertTasks = await Task.find({
        assignedTo: req.user._id,
        status: { $ne: 'Completed' },
        dueDate: { $ne: null, $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      }).populate('project', 'name');

      for (const t of alertTasks) {
        const existingNotice = await Notification.findOne({
          recipient: req.user._id,
          relatedTask: t._id,
          type: 'deadline_approaching',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (!existingNotice) {
          const isOverdue = new Date(t.dueDate) < new Date();
          await Notification.create({
            recipient: req.user._id,
            type: 'deadline_approaching',
            title: isOverdue ? '⚠️ Task Overdue Alert' : '⏰ Due Date Reminder',
            message: isOverdue
              ? `Task "${t.title}" is overdue in ${t.project ? t.project.name : 'project'}!`
              : `Task "${t.title}" is due within 24h in ${t.project ? t.project.name : 'project'}!`,
            relatedProject: t.project?._id || t.project,
            relatedTask: t._id,
          });
        }
      }
    } catch (reminderErr) {
      console.warn('Due-date reminder check warning:', reminderErr.message);
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email avatar')
      .populate('relatedProject', 'name color')
      .populate('relatedTask', 'title status priority')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
