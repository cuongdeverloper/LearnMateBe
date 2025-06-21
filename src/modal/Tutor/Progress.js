const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true }, // Nội dung giảng dạy
  week: { type: Number, required: true }, // Tuần số
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
