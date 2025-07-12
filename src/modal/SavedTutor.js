// models/SavedTutor.js (tạo file mới này)
const mongoose = require('mongoose');

const savedTutorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Tham chiếu đến model User
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor', // Tham chiếu đến model Tutor
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Thêm một chỉ mục duy nhất để ngăn người dùng lưu cùng một gia sư nhiều lần
savedTutorSchema.index({ user: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('SavedTutor', savedTutorSchema);