// routes/events.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventById);

router.post(
  '/',
  protect,
  role(['admin', 'organizer']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('startDateTime').isISO8601().withMessage('Valid start date is required'),
    body('endDateTime').isISO8601().withMessage('Valid end date is required'),
    body('ticketPrice').isFloat({ min: 0 }).withMessage('Ticket price must be non-negative'),
    body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1')
  ],
  validator,
  createEvent
);

router.put('/:id', protect, role(['admin', 'organizer']), updateEvent);
router.delete('/:id', protect, role(['admin', 'organizer']), deleteEvent);

module.exports = router;
