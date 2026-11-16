// routes/bookings.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

router.use(protect); // All booking routes require auth

router.get('/', role(['admin']), getAllBookings);
router.get('/mine', getMyBookings);
router.get('/:id', getBookingById);

router.post(
  '/',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('numberOfTickets').isInt({ min: 1 }).withMessage('At least 1 ticket required')
  ],
  validator,
  createBooking
);

router.patch('/:id/cancel', cancelBooking);

module.exports = router;
