const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Get audit logs across accessible projects
// @route   GET /api/audit-logs
// @access  Private
const getAuditLogs = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Accessible projects
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = accessibleProjects.map((p) => p._id);

    const { projectId, action, limit = 50, page = 1 } = req.query;

    const filter = { project: { $in: projectIds } };
    if (projectId && projectId !== 'all') {
      filter.project = projectId;
    }
    if (action && action !== 'all') {
      filter.action = action;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [activities, totalCount] = await Promise.all([
      Activity.find(filter)
        .populate('user', 'name email avatar jobTitle role')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Activity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: activities.length,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / parseInt(limit, 10)) || 1,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit, 10)) || 1,
        page: parseInt(page, 10),
      },
      activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
