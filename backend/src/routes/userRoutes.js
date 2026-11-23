const express = require('express');
const router = express.Router();
const { getUsers, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // All user routes are protected

router.get('/', getUsers);
router.get('/:id', getUserById);

module.exports = router;
