const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: function() { return !this.socialLogin; }},
  password: { type: String, required: function() { return !this.socialLogin; } },
  role: { type: String, enum: ['student', 'tutor', 'admin'], required: true, default: 'student' },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String ,required: function() { return !this.socialLogin; }},
  gender: { type: String, enum: ['male', 'female', 'other'], required: function() { return !this.socialLogin; } },
  type: {
    type: String,
    default: 'Local'
  },
  socialLogin: {
    type: Boolean,
    default: false
  },
  image:{
    type:String
  },
  balance: { 
    type: Number,
    default: 0
  },
  verified:{
    type:Boolean,
    default:false
  }
}, { timestamps: true });




userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
