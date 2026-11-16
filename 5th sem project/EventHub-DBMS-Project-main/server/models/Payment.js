const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash'], default: 'credit_card' },
  transactionId: { type: String },
  status: { type: String, enum: ['success', 'failed', 'pending', 'refunded'], default: 'pending' },
  paidAt: { type: Date, default: Date.now }
});

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
