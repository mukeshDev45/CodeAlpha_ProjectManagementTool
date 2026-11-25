const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
  getTaskActivities,
  uploadTaskAttachment,
  deleteTaskAttachment,
} = require('../controllers/taskController');

const {
  addComment,
  getComments,
} = require('../controllers/commentController');

const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my', getMyTasks);
router.get('/my-tasks', getMyTasks);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/status')
  .patch(updateTaskStatus)
  .put(updateTaskStatus);
router.get('/:id/activities', getTaskActivities);

// Attachments
router.post('/:id/attachments', upload.any(), uploadTaskAttachment);
router.delete('/:id/attachments/:attachmentId', deleteTaskAttachment);

// Comments nested under tasks
router.route('/:taskId/comments')
  .post(addComment)
  .get(getComments);

module.exports = router;
