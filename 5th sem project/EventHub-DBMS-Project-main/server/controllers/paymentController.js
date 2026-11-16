// controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { releaseExpiredBookings } = require('../utils/bookingExpiry');

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('booking');
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('booking');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// POST /api/payments – Record a payment for a booking
exports.createPayment = async (req, res, next) => {
  try {
    const { bookingId, method, transactionId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validate if booking is already cancelled or expired
    if (
      booking.bookingStatus === 'cancelled' ||
      booking.status === 'cancelled' ||
      booking.paymentStatus === 'expired'
    ) {
      return res.status(400).json({
        message: 'This booking reservation has expired or been cancelled. Please book tickets again.'
      });
    }

    // Check if the 5-minute payment window has elapsed
    if (
      booking.expiresAt &&
      new Date(booking.expiresAt) <= new Date() &&
      booking.paymentStatus === 'pending'
    ) {
      await releaseExpiredBookings();
      return res.status(400).json({
        message: 'Reservation window has expired. Seats have been automatically released.'
      });
    }

    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    const payment = await Payment.create({
      booking: bookingId,
      user: req.user.id,
      amount: booking.totalAmount,
      method,
      transactionId,
      status: 'success'
    });

    // Update booking payment status and clear expiresAt
    booking.paymentStatus = 'paid';
    booking.expiresAt = null;
    await booking.save();

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('booking')
      .sort({ paidAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};
