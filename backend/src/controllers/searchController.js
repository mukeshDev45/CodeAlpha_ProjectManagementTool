const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Global search across projects, tasks, and team members
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        results: { projects: [], tasks: [], members: [] },
      });
    }

    const userId = req.user._id;
    const regex = new RegExp(query, 'i');

    // 1. Projects user has access to
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = accessibleProjects.map((p) => p._id);

    // Matching Projects
    const projects = await Project.find({
      _id: { $in: projectIds },
      $or: [{ name: regex }, { description: regex }, { category: regex }],
    })
      .select('name description category status priority color')
      .limit(6);

    // Matching Tasks
    const tasks = await Task.find({
      project: { $in: projectIds },
      $or: [{ title: regex }, { description: regex }, { tags: regex }],
    })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .select('title status priority dueDate project assignedTo')
      .limit(8);

    // Matching Members
    const members = await User.find({
      $or: [{ name: regex }, { email: regex }, { jobTitle: regex }],
    })
      .select('name email avatar jobTitle role')
      .limit(6);

    res.json({
      success: true,
      query,
      results: {
        projects,
        tasks,
        members,
        users: members,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
