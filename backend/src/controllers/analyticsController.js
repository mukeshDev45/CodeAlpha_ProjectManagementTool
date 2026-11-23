const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get comprehensive project analytics and weekly completion reports
// @route   GET /api/analytics/overview
// @access  Private
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    const projectIds = accessibleProjects.map((p) => p._id);

    // 1. Project progress breakdown
    const projectProgress = await Promise.all(
      accessibleProjects.map(async (p) => {
        const total = await Task.countDocuments({ project: p._id });
        const completed = await Task.countDocuments({ project: p._id, status: 'Completed' });
        const inProgress = await Task.countDocuments({ project: p._id, status: 'In Progress' });
        const todo = await Task.countDocuments({ project: p._id, status: 'To Do' });
        const overdue = await Task.countDocuments({
          project: p._id,
          status: { $ne: 'Completed' },
          dueDate: { $ne: null, $lt: new Date() },
        });
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
          id: p._id,
          name: p.name,
          color: p.color || '#4f46e5',
          category: p.category || 'General',
          total,
          completed,
          inProgress,
          todo,
          overdue,
          progress,
        };
      })
    );

    // 2. Status distribution across all tasks
    const statusCounts = {
      'To Do': await Task.countDocuments({ project: { $in: projectIds }, status: 'To Do' }),
      'In Progress': await Task.countDocuments({ project: { $in: projectIds }, status: 'In Progress' }),
      Review: await Task.countDocuments({ project: { $in: projectIds }, status: 'Review' }),
      Completed: await Task.countDocuments({ project: { $in: projectIds }, status: 'Completed' }),
    };

    // 3. Priority distribution
    const priorityCounts = {
      High: await Task.countDocuments({ project: { $in: projectIds }, priority: 'High' }),
      Medium: await Task.countDocuments({ project: { $in: projectIds }, priority: 'Medium' }),
      Low: await Task.countDocuments({ project: { $in: projectIds }, priority: 'Low' }),
    };

    // 4. Weekly task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const completedTasksLast7Days = await Task.find({
      project: { $in: projectIds },
      status: 'Completed',
      updatedAt: { $gte: sevenDaysAgo },
    }).select('updatedAt');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const count = completedTasksLast7Days.filter((t) => {
        return t.updatedAt && t.updatedAt.toISOString().split('T')[0] === dateStr;
      }).length;

      weeklyTrend.push({ day: dayName, date: dateStr, count });
    }

    // 5. Overdue tasks list
    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $lt: new Date() },
    })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 })
      .limit(10);

    const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const totalCompleted = statusCounts['Completed'] || 0;
    const overallProgress = totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

    res.json({
      success: true,
      analytics: {
        totalProjects: accessibleProjects.length,
        totalTasks,
        totalCompleted,
        totalOverdue: overdueTasks.length,
        overallProgress,
        summary: {
          activeProjects: accessibleProjects.length,
          totalTasks,
          totalCompleted,
          overdueTasks: overdueTasks.length,
          completionRate: overallProgress,
        },
        projectProgress,
        statusCounts,
        statusDistribution: statusCounts,
        priorityCounts,
        weeklyTrend,
        weeklyCompletion: weeklyTrend.map((w) => ({ day: w.day, date: w.date, completed: w.count })),
        overdueTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview,
};
