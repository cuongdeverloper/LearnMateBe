const mongoose = require('mongoose');

const tutorApplicationSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor'
  },
  cvFile: {
    type: String,
    required: true
  },
  certificates: [{
    type: String
  }],
  experience: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  bio: {
    type: String,
    required: true
  },
  pricePerHour: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  languages: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('TutorApplication', tutorApplicationSchema); 