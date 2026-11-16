// routes/venues.js
const express = require('express');
const { protect } = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue
} = require('../controllers/venueController');

const router = express.Router();

router.get('/', getAllVenues);
router.get('/:id', getVenueById);

router.post(
  '/',
  protect,
  role(['admin', 'organizer']),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be non-negative')
  ],
  validator,
  createVenue
);

router.put('/:id', protect, role(['admin', 'organizer']), updateVenue);
router.delete('/:id', protect, role(['admin']), deleteVenue);

module.exports = router;
