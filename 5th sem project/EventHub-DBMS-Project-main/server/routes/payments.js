// routes/payments.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  getMyPayments
} = require('../controllers/paymentController');

const router = express.Router();

router.use(protect); // All payment routes require auth

router.get('/', role(['admin']), getAllPayments);
router.get('/mine', getMyPayments);
router.get('/:id', getPaymentById);

router.post(
  '/',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('method')
      .optional()
      .isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'cash'])
      .withMessage('Invalid payment method')
  ],
  validator,
  createPayment
);

module.exports = router;
