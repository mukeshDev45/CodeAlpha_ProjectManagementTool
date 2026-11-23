const Project = require('../models/Project');

/**
 * Checks if logged-in user is a member or owner of the project.
 * Supports finding project via req.params.projectId or req.params.id
 */
const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberEntry = project.members.find(
      (m) => m.user.toString() === userId
    );

    if (!isOwner && !memberEntry && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }

    req.project = project;
    req.userProjectRole = isOwner ? 'owner' : memberEntry ? memberEntry.role : 'member';
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Checks if logged-in user is the project owner or has admin privileges
 */
const checkProjectAdminOrOwner = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = req.project || (await Project.findById(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberEntry = project.members.find(
      (m) => m.user.toString() === userId && m.role === 'admin'
    );

    if (!isOwner && !memberEntry && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only project owner or project admin can perform this action',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Checks if user is the direct owner of the project
 */
const checkProjectOwnerOnly = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = req.project || (await Project.findById(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the project owner can perform this action',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkProjectMember,
  checkProjectAdminOrOwner,
  checkProjectOwnerOnly,
};
