// routes/categories.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post(
  '/',
  protect,
  role(['admin']),
  [body('name').notEmpty().withMessage('Category name is required')],
  validator,
  createCategory
);

router.put('/:id', protect, role(['admin']), updateCategory);
router.delete('/:id', protect, role(['admin']), deleteCategory);

module.exports = router;
