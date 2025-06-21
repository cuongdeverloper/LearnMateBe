const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true }, // Cloudinary path
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', materialSchema);
