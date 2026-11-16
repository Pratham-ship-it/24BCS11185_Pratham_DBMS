// controllers/reviewController.js
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

exports.getReviewsByEvent = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/eligibility/:eventId - Check if logged-in user can review
exports.checkReviewEligibility = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const eventStartDate = event.startDateTime || event.startDate || event.date;
    const hasStarted = eventStartDate ? new Date() >= new Date(eventStartDate) : true;

    const existingReview = await Review.findOne({ user: req.user.id, event: eventId });
    const hasReviewed = !!existingReview;

    const validBooking = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      $or: [
        { bookingStatus: 'confirmed' },
        { status: 'confirmed' }
      ],
      paymentStatus: { $in: ['paid', 'completed'] }
    });
    const hasPaidBooking = !!validBooking;

    let canReview = false;
    let reason = '';

    if (hasReviewed) {
      reason = 'You have already reviewed this event';
    } else if (!hasPaidBooking) {
      reason = 'Only verified attendees with a paid booking can review this event.';
    } else if (!hasStarted) {
      reason = 'You can submit a review once the event has started.';
    } else {
      canReview = true;
    }

    res.json({
      canReview,
      hasPaidBooking,
      hasStarted,
      hasReviewed,
      reason
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews – Create review (enforces verified attendee & event timing)
exports.createReview = async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 1. Prevent duplicate reviews from the same user on the same event
    const existingReview = await Review.findOne({ user: req.user.id, event: eventId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }

    // 2. Event date/time check: user can submit a review once the event has started
    const eventStartDate = event.startDateTime || event.startDate || event.date;
    if (eventStartDate && new Date() < new Date(eventStartDate)) {
      return res.status(400).json({ message: 'You can submit a review once the event has started.' });
    }

    // 3. Verify user has at least one confirmed & paid booking for this event
    const validBooking = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      $or: [
        { bookingStatus: 'confirmed' },
        { status: 'confirmed' }
      ],
      paymentStatus: { $in: ['paid', 'completed'] }
    });

    if (!validBooking) {
      return res.status(403).json({
        message: 'Only verified attendees with a paid booking can review this event.'
      });
    }

    const review = await Review.create({
      user: req.user.id,
      event: eventId,
      rating,
      comment,
      isVerifiedAttendee: true
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    await review.save();
    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};
