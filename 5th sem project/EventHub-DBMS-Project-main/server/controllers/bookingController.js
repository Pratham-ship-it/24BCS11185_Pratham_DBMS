// controllers/bookingController.js
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { isEventEnded } = require('../utils/eventStatus');
const { releaseExpiredBookings } = require('../utils/bookingExpiry');

exports.releaseExpiredBookings = releaseExpiredBookings;

exports.getAllBookings = async (req, res, next) => {
  try {
    await releaseExpiredBookings();
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('event', 'title startDateTime endDateTime ticketPrice venue status');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    await releaseExpiredBookings();
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title startDateTime endDateTime ticketPrice venue status')
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    await releaseExpiredBookings();
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event', 'title startDateTime endDateTime ticketPrice venue status');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings – Book tickets with seat-availability check (transaction)
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { eventId, numberOfTickets } = req.body;

    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Event not found' });
    }

    if (isEventEnded(event)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot book tickets for an event that has already ended' });
    }

    if (event.status && event.status.toLowerCase() === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot book tickets for a cancelled event' });
    }

    if (event.availableSeats < numberOfTickets) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    event.availableSeats -= numberOfTickets;
    await event.save({ session });

    // 5 minutes payment countdown window
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const booking = await Booking.create(
      [
        {
          user: req.user.id,
          event: eventId,
          numberOfTickets,
          totalAmount: numberOfTickets * event.ticketPrice,
          bookingStatus: 'confirmed',
          status: 'confirmed',
          paymentStatus: 'pending',
          expiresAt
        }
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(booking[0]);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.bookingStatus === 'cancelled' || booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    // Restore seats
    await Event.findByIdAndUpdate(
      booking.event,
      { $inc: { availableSeats: booking.numberOfTickets } },
      { session }
    );

    booking.bookingStatus = 'cancelled';
    booking.status = 'cancelled';
    booking.expiresAt = null;
    await booking.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
