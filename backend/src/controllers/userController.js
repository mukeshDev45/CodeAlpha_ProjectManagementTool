const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all users (searchable by query)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { jobTitle: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query).select('name email role jobTitle avatar bio createdAt');

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID with projects & task stats
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email role jobTitle avatar bio createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const projectCount = await Project.countDocuments({
      $or: [{ owner: user._id }, { 'members.user': user._id }],
    });

    const assignedTasksCount = await Task.countDocuments({ assignedTo: user._id });
    const completedTasksCount = await Task.countDocuments({
      assignedTo: user._id,
      status: 'Completed',
    });

    res.json({
      success: true,
      user,
      stats: {
        projects: projectCount,
        assignedTasks: assignedTasksCount,
        completedTasks: completedTasksCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
};
