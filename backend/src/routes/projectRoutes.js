const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/projectController');

const {
  createTask,
  getProjectTasks,
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');

router.use(protect); // All project routes require authentication

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId/role', updateMemberRole);
router.put('/:id/transfer-owner', transferOwner);

// Invitations & Export
router.post('/:id/invitations', inviteProjectMember);
router.get('/:id/invitations', getProjectInvitations);
router.get('/:id/export-csv', exportProjectCSV);

// Activities
router.get('/:id/activities', getProjectActivities);

// Nested task routes for project
router.route('/:projectId/tasks')
  .post(createTask)
  .get(getProjectTasks);

module.exports = router;
