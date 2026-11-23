const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// @desc    Get dashboard statistics and overview
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Projects the user has access to
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    // Counts
    const totalProjects = projectIds.length;
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    const pendingTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'To Do',
    });
    const inProgressTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'In Progress',
    });
    const reviewTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'Review',
    });
    const completedTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'Completed',
    });

    // My Assigned Tasks stats
    const myAssignedTasksCount = await Task.countDocuments({
      assignedTo: userId,
    });
    const myCompletedTasksCount = await Task.countDocuments({
      assignedTo: userId,
      status: 'Completed',
    });
    const myPendingTasksCount = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ['To Do', 'In Progress'] },
    });

    // Recent 5 projects
    const recentProjects = await Project.find({
      _id: { $in: projectIds },
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Attach task count & progress for recent projects
    const recentProjectsWithStats = await Promise.all(
      recentProjects.map(async (p) => {
        const pTotal = await Task.countDocuments({ project: p._id });
        const pDone = await Task.countDocuments({ project: p._id, status: 'Completed' });
        const progress = pTotal === 0 ? 0 : Math.round((pDone / pTotal) * 100);
        return {
          ...p.toObject(),
          totalTasks: pTotal,
          completedTasks: pDone,
          progress,
        };
      })
    );

    // Recent activities across accessible projects
    const recentActivities = await Activity.find({
      project: { $in: projectIds },
    })
      .populate('user', 'name email avatar')
      .populate('project', 'name color')
      .sort({ createdAt: -1 })
      .limit(10);

    // Upcoming deadline tasks
    const upcomingTasks = await Task.find({
      project: { $in: projectIds },
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $gte: new Date() },
    })
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .limit(5);

    // Unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        reviewTasks,
        completedTasks,
        completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
        myTasks: {
          total: myAssignedTasksCount,
          completed: myCompletedTasksCount,
          pending: myPendingTasksCount,
        },
        unreadNotifications,
      },
      recentProjects: recentProjectsWithStats,
      recentActivities,
      upcomingTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
