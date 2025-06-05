const mongoose = require('mongoose');
const scheduleSchema = new mongoose.Schema({
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },  // VD: "10:00"
    endTime: { type: String, required: true },    // VD: "11:00"
    isAvailable: { type: Boolean, default: true },
  });
  
  module.exports = mongoose.model('Schedule', scheduleSchema);