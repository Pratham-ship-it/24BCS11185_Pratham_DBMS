// routes/users.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);
router.get('/', role(['admin']), getAllUsers);
router.get('/:id', role(['admin', 'organizer']), getUserById);
router.put(
  '/:id',
  role(['admin', 'organizer']),
  [body('name').optional().notEmpty(), body('phone').optional()],
  validator,
  updateUser
);
router.delete('/:id', role(['admin']), deleteUser);

module.exports = router;
