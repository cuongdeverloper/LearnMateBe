const mongoose = require('mongoose');

const userOtpVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300
  },
  verified: {
    type: Boolean,
    default: false
  },

}, { timestamps: true });

module.exports = mongoose.model('UserOtpVerification', userOtpVerificationSchema);
