const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // This should likely reference 'Tutor' if a Tutor document exists
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  learnerId : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },  // "10:00"
  endTime: { type: String, required: true },    // "11:00"
  attended: { type: Boolean, default: false } // NEW: Field to track attendance
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);