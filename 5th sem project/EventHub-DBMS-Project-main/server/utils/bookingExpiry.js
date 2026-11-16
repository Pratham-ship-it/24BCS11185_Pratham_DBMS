const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

/**
 * Releases expired pending bookings atomically and restores event seats.
 * Finds all bookings where paymentStatus === 'pending', status !== 'cancelled',
 * and expiresAt <= new Date().
 */
const releaseExpiredBookings = async () => {
  try {
    const now = new Date();
    const expiredBookings = await Booking.find({
      paymentStatus: 'pending',
      bookingStatus: { $ne: 'cancelled' },
      status: { $ne: 'cancelled' },
      expiresAt: { $lte: now, $ne: null }
    });

    if (!expiredBookings || expiredBookings.length === 0) {
      return [];
    }

    const released = [];

    for (const b of expiredBookings) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // Atomically update booking status to cancelled & paymentStatus to expired
        const updatedBooking = await Booking.findOneAndUpdate(
          {
            _id: b._id,
            paymentStatus: 'pending',
            bookingStatus: { $ne: 'cancelled' },
            status: { $ne: 'cancelled' }
          },
          {
            $set: {
              bookingStatus: 'cancelled',
              status: 'cancelled',
              paymentStatus: 'expired'
            }
          },
          { session, new: true }
        );

        if (updatedBooking) {
          // Increment event seats back by the booking's ticket count
          await Event.findByIdAndUpdate(
            updatedBooking.event,
            { $inc: { availableSeats: updatedBooking.numberOfTickets } },
            { session }
          );

          await session.commitTransaction();
          released.push(updatedBooking);
        } else {
          await session.abortTransaction();
        }
      } catch (txnError) {
        await session.abortTransaction();
        console.error(`[releaseExpiredBookings] Error releasing booking ${b._id}:`, txnError.message);
      } finally {
        session.endSession();
      }
    }

    return released;
  } catch (err) {
    console.error('[releaseExpiredBookings] Execution error:', err.message);
    return [];
  }
};

module.exports = {
  releaseExpiredBookings
};
