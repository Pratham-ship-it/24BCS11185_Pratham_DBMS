const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  venue: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  ticketPrice: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['upcoming','ongoing','completed','cancelled'], default: 'upcoming' },
  imageUrl: { type: String }
});

// Indexes for queries
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ venue: 1 });

module.exports = mongoose.model('Event', eventSchema);
