// controllers/eventController.js
const Event = require('../models/Event');
const { computeEventStatus } = require('../utils/eventStatus');
const { releaseExpiredBookings } = require('../utils/bookingExpiry');

const formatEventWithStatus = (evt) => {
  if (!evt) return evt;
  const obj = typeof evt.toObject === 'function' ? evt.toObject() : { ...evt };
  obj.status = computeEventStatus(obj);
  return obj;
};

exports.getAllEvents = async (req, res, next) => {
  try {
    // Release any expired pending bookings before fetching events
    await releaseExpiredBookings();

    const events = await Event.find()
      .populate('organizer', 'name email');

    const formattedEvents = events.map((evt) => {
      const computed = computeEventStatus(evt);
      if (evt.status !== computed && evt.status !== 'cancelled') {
        Event.findByIdAndUpdate(evt._id, { status: computed }).catch(() => {});
      }
      return formatEventWithStatus(evt);
    });

    res.json(formattedEvents);
  } catch (err) {
    next(err);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    // Release any expired pending bookings before fetching event details
    await releaseExpiredBookings();

    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const computed = computeEventStatus(event);
    if (event.status !== computed && event.status !== 'cancelled') {
      Event.findByIdAndUpdate(event._id, { status: computed }).catch(() => {});
    }

    res.json(formatEventWithStatus(event));
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const data = { ...req.body, organizer: req.user.id };
    if (data.availableSeats === undefined) {
      data.availableSeats = data.totalSeats;
    }
    if (!data.status || data.status !== 'cancelled') {
      data.status = computeEventStatus(data);
    }
    const event = await Event.create(data);
    res.status(201).json(formatEventWithStatus(event));
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only the organizer who created it or an admin can update
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updateData = { ...req.body };
    if (updateData.status !== 'cancelled') {
      const mergedForStatus = { ...event.toObject(), ...updateData };
      updateData.status = computeEventStatus(mergedForStatus);
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    res.json(formatEventWithStatus(updated));
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};
