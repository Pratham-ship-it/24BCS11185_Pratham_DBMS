const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  numberOfTickets: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  bookingStatus: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' },
  status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' },
  bookingDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'pending', 'completed', 'expired'], default: 'pending' },
  expiresAt: {
    type: Date,
    default: function () {
      if (this.paymentStatus === 'pending') {
        return new Date(Date.now() + 5 * 60 * 1000);
      }
      return null;
    }
  }
});

// Synchronize bookingStatus and status fields on save
bookingSchema.pre('save', function (next) {
  if (this.isModified('bookingStatus') && !this.isModified('status')) {
    this.status = this.bookingStatus;
  } else if (this.isModified('status') && !this.isModified('bookingStatus')) {
    this.bookingStatus = this.status;
  }
  next();
});

// Indexes for fast lookup
bookingSchema.index({ user: 1, event: 1 });
bookingSchema.index({ paymentStatus: 1, expiresAt: 1 });
bookingSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
