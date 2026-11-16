// controllers/venueController.js
const Venue = require('../models/Venue');

exports.getAllVenues = async (req, res, next) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (err) {
    next(err);
  }
};

exports.getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    next(err);
  }
};

exports.createVenue = async (req, res, next) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
};

exports.updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    next(err);
  }
};

exports.deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json({ message: 'Venue deleted' });
  } catch (err) {
    next(err);
  }
};
