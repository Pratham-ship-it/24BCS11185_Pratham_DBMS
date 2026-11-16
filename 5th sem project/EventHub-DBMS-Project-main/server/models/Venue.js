const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  amenities: [{ type: String }],
  pricePerDay: { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('Venue', venueSchema);
