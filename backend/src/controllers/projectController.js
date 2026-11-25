const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { logActivity, createNotification } = require('../utils/activityLogger');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description, deadline, priority, category, color, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    // Prepare initial members list (owner is automatically owner)
    const members = [
      {
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date(),
      },
    ];

    // Add additional members if provided
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      for (const mId of memberIds) {
        if (mId.toString() !== req.user._id.toString()) {
          const userExists = await User.findById(mId);
          if (userExists) {
            members.push({
              user: mId,
              role: 'member',
              joinedAt: new Date(),
            });
          }
        }
      }
    }

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id,
      members,
      deadline: deadline || null,
      priority: priority || 'Medium',
      category: category || 'General',
      color: color || '#4f46e5',
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    // Notify added members
    const io = req.app.get('io');
    for (const mem of members) {
      if (mem.user.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: mem.user,
          sender: req.user._id,
          type: 'project_invitation',
          title: 'Added to New Project',
          message: `${req.user.name} added you to the project "${project.name}"`,
          relatedProject: project._id,
          io,
        });
      }
    }

    // Log activity
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'created_project',
      details: `Created project "${project.name}"`,
      target: project.name,
      io,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const userId = req.user._id;

    // Filter projects where user is owner or a member
    let query = {
      $or: [{ owner: userId }, { 'members.user': userId }],
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle')
      .sort({ updatedAt: -1 });

    // Calculate task stats for each project (total, completed)
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ project: p._id });
        const completedTasks = await Task.countDocuments({
          project: p._id,
          status: 'Completed',
        });
        const overdueTasks = await Task.countDocuments({
          project: p._id,
          status: { $ne: 'Completed' },
          dueDate: { $ne: null, $lt: new Date() },
        });
        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        return {
          ...p.toObject(),
          totalTasks,
          completedTasks,
          overdueTasks,
          progress,
        };
      })
    );

    res.json({
      success: true,
      count: projectsWithStats.length,
      projects: projectsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check membership authorization
    const userId = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some((m) => m.user && m.user._id.toString() === userId);

    if (!isOwner && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this project',
      });
    }

    // Stats
    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({
      project: project._id,
      status: 'Completed',
    });
    const inProgressTasks = await Task.countDocuments({
      project: project._id,
      status: 'In Progress',
    });
    const reviewTasks = await Task.countDocuments({
      project: project._id,
      status: 'Review',
    });
    const todoTasks = await Task.countDocuments({
      project: project._id,
      status: 'To Do',
    });
    const overdueTasks = await Task.countDocuments({
      project: project._id,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $lt: new Date() },
    });

    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    res.json({
      success: true,
      project: {
        ...project.toObject(),
        stats: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          progress,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner / Admin)
const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, category, deadline, color } = req.body;
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check authorization (Owner or admin role in project)
    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberObj = project.members.find((m) => m.user.toString() === userId);
    const isAdmin = memberObj && memberObj.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only project owners and admins can edit this project',
      });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (category) project.category = category;
    if (deadline !== undefined) project.deadline = deadline;
    if (color) project.color = color;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id.toString()}`).emit('project:updated', updatedProject);
    }

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'updated_project',
      details: `Updated project details`,
      target: project.name,
      io,
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only project owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the project owner can delete this project',
      });
    }

    // Delete tasks, comments, activities
    const taskIds = await Task.find({ project: project._id }).distinct('_id');
    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id.toString()}`).emit('project:deleted', { projectId: project._id });
    }

    res.json({
      success: true,
      message: 'Project and all related tasks and comments were deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Owner / Admin)
const addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check authorization
    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const adminMember = project.members.find(
      (m) => m.user.toString() === currentUserId && m.role === 'admin'
    );

    if (!isOwner && !adminMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only project owner or admin can add team members',
      });
    }

    // Verify user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User to add not found' });
    }

    // Check if already a member
    const alreadyMember = project.members.some((m) => m.user.toString() === userId.toString());
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: `${userToAdd.name} is already a member of this project`,
      });
    }

    project.members.push({
      user: userId,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    const io = req.app.get('io');

    // Notify newly added user
    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'project_invitation',
      title: 'Added to Project',
      message: `${req.user.name} added you to project "${project.name}" as ${role || 'member'}`,
      relatedProject: project._id,
      io,
    });

    // Log activity
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'added_member',
      details: `Added ${userToAdd.name} to the team`,
      target: userToAdd.name,
      io,
    });

    if (io) {
      io.to(`project:${project._id.toString()}`).emit('member:added', {
        projectId: project._id,
        user: userToAdd,
        role: role || 'member',
      });
    }

    res.json({
      success: true,
      message: `${userToAdd.name} added to the project`,
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner / Admin / Self)
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Cannot remove project owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner from the project',
      });
    }

    // Check authorization: must be owner, project admin, or the user removing themselves
    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const isSelf = currentUserId === userId;
    const adminMember = project.members.find(
      (m) => m.user.toString() === currentUserId && m.role === 'admin'
    );

    if (!isOwner && !isSelf && !adminMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to remove this member',
      });
    }

    const memberUser = await User.findById(userId);

    // Filter out the member
    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    // Also unassign tasks assigned to this user in this project
    await Task.updateMany({ project: project._id, assignedTo: userId }, { assignedTo: null });

    const io = req.app.get('io');
    if (memberUser && !isSelf) {
      await createNotification({
        recipient: userId,
        sender: req.user._id,
        type: 'member_removed',
        title: 'Removed from Project',
        message: `You were removed from project "${project.name}"`,
        relatedProject: project._id,
        io,
      });
    }

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'removed_member',
      details: `${isSelf ? 'Left' : `Removed ${memberUser ? memberUser.name : 'user'}`} the project`,
      target: memberUser ? memberUser.name : 'member',
      io,
    });

    if (io) {
      io.to(`project:${project._id.toString()}`).emit('member:removed', {
        projectId: project._id,
        userId,
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully from project',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign new project owner
// @route   PUT /api/projects/:id/transfer-owner
// @access  Private (Owner only)
const transferOwner = async (req, res, next) => {
  try {
    const { newOwnerId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the current project owner can transfer project ownership',
      });
    }

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Set new owner
    project.owner = newOwner._id;

    // Update roles in members array
    project.members = project.members.map((m) => {
      if (m.user.toString() === newOwnerId.toString()) {
        m.role = 'owner';
      } else if (m.user.toString() === req.user._id.toString()) {
        m.role = 'admin'; // previous owner becomes admin
      }
      return m;
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    const io = req.app.get('io');
    await createNotification({
      recipient: newOwnerId,
      sender: req.user._id,
      type: 'system',
      title: 'Project Ownership Transferred',
      message: `${req.user.name} made you the owner of project "${project.name}"`,
      relatedProject: project._id,
      io,
    });

    res.json({
      success: true,
      message: `Ownership transferred to ${newOwner.name}`,
      project: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project activity history
// @route   GET /api/projects/:id/activities
// @access  Private
const getProjectActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export project tasks as CSV report
// @route   GET /api/projects/:id/export-csv
// @access  Private
const exportProjectCSV = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Task ID',
      'Title',
      'Status',
      'Priority',
      'Assigned Member',
      'Due Date',
      'Recurring',
      'Tags',
      'Created By',
      'Created Date',
    ];

    const rows = tasks.map((t) => [
      escapeCSV(t._id),
      escapeCSV(t.title),
      escapeCSV(t.status),
      escapeCSV(t.priority),
      escapeCSV(t.assignedTo ? `${t.assignedTo.name} (${t.assignedTo.email})` : 'Unassigned'),
      escapeCSV(t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'None'),
      escapeCSV(t.recurring || 'none'),
      escapeCSV((t.tags || []).join(', ')),
      escapeCSV(t.createdBy ? t.createdBy.name : 'Unknown'),
      escapeCSV(t.createdAt ? t.createdAt.toISOString().split('T')[0] : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const filename = `ProjectFlow_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Invite team member by email with role (Admin, Lead, Member, Viewer)
// @route   POST /api/projects/:id/invitations
// @access  Private
const inviteProjectMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validRoles = ['admin', 'lead', 'member', 'viewer'];
    const chosenRole = validRoles.includes(role) ? role : 'member';

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: Only Owner, Admin, Manager, or Lead can invite members
    const userId = req.user._id.toString();
    const ownerId = project.owner ? (project.owner._id ? project.owner._id.toString() : project.owner.toString()) : '';
    const isOwner = ownerId === userId;
    const currentMember = project.members.find((m) => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === userId);
    const canInvite =
      isOwner || ['admin', 'manager', 'lead'].includes(req.user.role) || (currentMember && ['admin', 'lead', 'owner'].includes(currentMember.role));

    if (!canInvite) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only Project Owners, Admins, or Leads can invite members',
      });
    }

    // Check if user is already a member
    const alreadyMember = project.members.some((m) => m.user && m.user.email === cleanEmail);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'This user is already a project member' });
    }

    // Check if user exists in DB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      project.members.push({
        user: existingUser._id,
        role: chosenRole,
        joinedAt: new Date(),
      });
      await project.save();

      const io = req.app.get('io');
      await createNotification({
        recipient: existingUser._id,
        sender: req.user._id,
        type: 'project_invitation',
        title: 'Added to Project',
        message: `${req.user.name} added you to "${project.name}" as ${chosenRole}`,
        relatedProject: project._id,
        io,
      });

      await logActivity({
        project: project._id,
        user: req.user._id,
        action: 'added_member',
        details: `Added ${existingUser.name} as ${chosenRole}`,
        target: existingUser.name,
        io,
      });

      const updatedProject = await Project.findById(project._id)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');

      return res.status(201).json({
        success: true,
        message: `${existingUser.name} added to project as ${chosenRole}`,
        member: updatedProject.members[updatedProject.members.length - 1],
        project: updatedProject,
      });
    }

    // If user does not exist yet, store as pending invitation
    if (!project.invitations) project.invitations = [];
    const existingInvite = project.invitations.find((i) => i.email === cleanEmail && i.status === 'pending');
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'Invitation has already been sent to this email' });
    }

    project.invitations.push({
      email: cleanEmail,
      role: chosenRole,
      invitedBy: req.user._id,
      invitedAt: new Date(),
      status: 'pending',
    });
    await project.save();

    res.status(201).json({
      success: true,
      message: `Invitation recorded for ${cleanEmail} as ${chosenRole}`,
      invitations: project.invitations,
    });
  } catch (error) {
    next(error);
  }
};

const getProjectInvitations = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('invitations.invitedBy', 'name email avatar');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({
      success: true,
      invitations: project.invitations || [],
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const validRoles = ['admin', 'lead', 'member', 'viewer'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, lead, member, or viewer' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const currentMember = project.members.find((m) => m.user.toString() === currentUserId);
    const isAdmin = currentMember && currentMember.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied: Only Owner or Admin can change member roles' });
    }

    const memberToUpdate = project.members.find((m) => m.user.toString() === userId.toString());
    if (!memberToUpdate) {
      return res.status(404).json({ success: false, message: 'Member not found in this project' });
    }

    memberToUpdate.role = role;
    await project.save();

    const io = req.app.get('io');
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'member_updated',
      details: `Updated role of member to ${role}`,
      target: role,
      io,
    });

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar jobTitle')
      .populate('members.user', 'name email avatar jobTitle');

    res.json({
      success: true,
      message: `Member role updated to ${role}`,
      project: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  transferOwner,
  getProjectActivities,
  exportProjectCSV,
  inviteProjectMember,
  getProjectInvitations,
};
