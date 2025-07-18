const mongoose = require('mongoose');

// Validation cho block user
const validateBlockUser = (req, res, next) => {
  const { userId } = req.params;
  const { reason } = req.body;

  // Kiểm tra userId
  if (!userId) {
    return res.status(400).json({ 
      errorCode: 1, 
      message: 'User ID is required' 
    });
  }

  // Kiểm tra userId có phải ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ 
      errorCode: 2, 
      message: 'Invalid User ID format' 
    });
  }

  // Kiểm tra reason
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ 
      errorCode: 3, 
      message: 'Reason is required for blocking user' 
    });
  }

  if (reason.trim().length < 10) {
    return res.status(400).json({ 
      errorCode: 4, 
      message: 'Reason must be at least 10 characters long' 
    });
  }

  if (reason.trim().length > 500) {
    return res.status(400).json({ 
      errorCode: 5, 
      message: 'Reason must not exceed 500 characters' 
    });
  }

  next();
};

// Validation cho delete user
const validateDeleteUser = (req, res, next) => {
  const { userId } = req.params;
  const { reason } = req.body;

  // Kiểm tra userId
  if (!userId) {
    return res.status(400).json({ 
      errorCode: 1, 
      message: 'User ID is required' 
    });
  }

  // Kiểm tra userId có phải ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ 
      errorCode: 2, 
      message: 'Invalid User ID format' 
    });
  }

  // Kiểm tra reason
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ 
      errorCode: 3, 
      message: 'Reason is required for deleting user' 
    });
  }

  if (reason.trim().length < 10) {
    return res.status(400).json({ 
      errorCode: 4, 
      message: 'Reason must be at least 10 characters long' 
    });
  }

  if (reason.trim().length > 500) {
    return res.status(400).json({ 
      errorCode: 5, 
      message: 'Reason must not exceed 500 characters' 
    });
  }

  next();
};

// Validation cho tutor application
const validateTutorApplication = (req, res, next) => {
  const {
    experience,
    education,
    subjects,
    bio,
    pricePerHour,
    location,
    languages,
    certificates
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!experience || experience.trim().length === 0) {
    return res.status(400).json({
      errorCode: 1,
      message: 'Experience is required'
    });
  }

  if (!education || education.trim().length === 0) {
    return res.status(400).json({
      errorCode: 2,
      message: 'Education is required'
    });
  }

  if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {
    return res.status(400).json({
      errorCode: 3,
      message: 'At least one subject is required'
    });
  }

  if (!bio || bio.trim().length === 0) {
    return res.status(400).json({
      errorCode: 4,
      message: 'Bio is required'
    });
  }

  if (!pricePerHour || isNaN(pricePerHour) || pricePerHour <= 0) {
    return res.status(400).json({
      errorCode: 5,
      message: 'Valid price per hour is required'
    });
  }

  if (!location || location.trim().length === 0) {
    return res.status(400).json({
      errorCode: 6,
      message: 'Location is required'
    });
  }

  // Kiểm tra độ dài
  if (bio.trim().length < 50) {
    return res.status(400).json({
      errorCode: 7,
      message: 'Bio must be at least 50 characters long'
    });
  }

  if (bio.trim().length > 1000) {
    return res.status(400).json({
      errorCode: 8,
      message: 'Bio must not exceed 1000 characters'
    });
  }

  if (experience.trim().length < 20) {
    return res.status(400).json({
      errorCode: 9,
      message: 'Experience must be at least 20 characters long'
    });
  }

  if (education.trim().length < 10) {
    return res.status(400).json({
      errorCode: 10,
      message: 'Education must be at least 10 characters long'
    });
  }

  // Kiểm tra giá
  if (pricePerHour < 5 || pricePerHour > 1000) {
    return res.status(400).json({
      errorCode: 11,
      message: 'Price per hour must be between $5 and $1000'
    });
  }

  next();
};

// Validation cho approve/reject application
const validateApplicationAction = (req, res, next) => {
  const { applicationId } = req.params;
  const { reason } = req.body;

  // Kiểm tra applicationId
  if (!applicationId) {
    return res.status(400).json({
      errorCode: 1,
      message: 'Application ID is required'
    });
  }

  // Kiểm tra applicationId có phải ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(400).json({
      errorCode: 2,
      message: 'Invalid Application ID format'
    });
  }

  // Kiểm tra reason cho reject
  if (req.method === 'PUT' && req.path.includes('reject')) {
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        errorCode: 3,
        message: 'Reason is required for rejecting application'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        errorCode: 4,
        message: 'Reason must be at least 10 characters long'
      });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({
        errorCode: 5,
        message: 'Reason must not exceed 500 characters'
      });
    }
  }

  next();
};

// Validation cho tutor management
const validateTutorAction = (req, res, next) => {
  const { tutorId } = req.params;

  // Kiểm tra tutorId
  if (!tutorId) {
    return res.status(400).json({
      errorCode: 1,
      message: 'Tutor ID is required'
    });
  }

  // Kiểm tra tutorId có phải ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(tutorId)) {
    return res.status(400).json({
      errorCode: 2,
      message: 'Invalid Tutor ID format'
    });
  }

  // Kiểm tra isActive cho toggle status
  if (req.method === 'PUT' && req.path.includes('toggle-status')) {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        errorCode: 3,
        message: 'isActive must be a boolean value'
      });
    }
  }

  next();
};

// Validation cho booking queries
const validateBookingQuery = (req, res, next) => {
  const { page, limit, status, fromDate, toDate } = req.query;

  // Kiểm tra page
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      errorCode: 1,
      message: 'Page must be a positive number'
    });
  }

  // Kiểm tra limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      errorCode: 2,
      message: 'Limit must be between 1 and 100'
    });
  }

  // Kiểm tra status
  if (status && !['pending', 'approve', 'cancelled'].includes(status)) {
    return res.status(400).json({
      errorCode: 3,
      message: 'Invalid status value'
    });
  }

  // Kiểm tra date format
  if (fromDate && !isValidDate(fromDate)) {
    return res.status(400).json({
      errorCode: 4,
      message: 'Invalid fromDate format'
    });
  }

  if (toDate && !isValidDate(toDate)) {
    return res.status(400).json({
      errorCode: 5,
      message: 'Invalid toDate format'
    });
  }

  // Kiểm tra date range
  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    return res.status(400).json({
      errorCode: 6,
      message: 'fromDate cannot be later than toDate'
    });
  }

  next();
};

// Helper function để kiểm tra date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validation cho booking detail
const validateBookingId = (req, res, next) => {
  const { id, bookingId } = req.params;
  const targetId = id || bookingId;

  if (!targetId) {
    return res.status(400).json({
      errorCode: 1,
      message: 'Booking ID is required'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({
      errorCode: 2,
      message: 'Invalid Booking ID format'
    });
  }

  next();
};

module.exports = {
  validateBlockUser,
  validateDeleteUser,
  validateTutorApplication,
  validateApplicationAction,
  validateTutorAction,
  validateBookingQuery,
  validateBookingId
}; 