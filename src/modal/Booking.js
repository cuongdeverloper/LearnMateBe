const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }],
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  amount: { type: Number, required: true },
  numberOfSessions: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);