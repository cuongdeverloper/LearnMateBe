// modal/Material.js

const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  // Liên kết tài liệu này với một booking cụ thể
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Có thể là URL của file (PDF, Doc, Video) hoặc một liên kết bên ngoài
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  // Loại tài liệu (ví dụ: 'pdf', 'video', 'link', 'document')
  fileType: {
    type: String,
    enum: ['pdf', 'video', 'link', 'document', 'image', 'other'],
    default: 'link'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('Material', materialSchema);