// controller/Material/MaterialController.js

const Material = require('../../modal/Material');
const Booking = require('../../modal/Booking');
const User = require('../../modal/User');

// Helper function to check if a user is part of a booking (learner or tutor)
const isUserPartOfBooking = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId).select('learnerId tutorId');
  if (!booking) {
    return false;
  }

  const populatedBooking = await Booking.findById(bookingId)
    .populate({
      path: 'tutorId',
      select: 'user'
    })
    .exec();

  if (!populatedBooking || !populatedBooking.tutorId || !populatedBooking.tutorId.user) {
    return false;
  }

  const tutorUserId = populatedBooking.tutorId.user; // This should be an ObjectId

  const isLearner = booking.learnerId.toString() === userId.toString();
  const isTutor = tutorUserId.toString() === userId.toString();


  return isLearner || isTutor;
};


// 1. Get all materials for a specific booking
exports.getMaterialsByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId || !bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid bookingId format.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    const userId = req.user.id || req.user._id;


    // Authorization: Only the learner or tutor associated with the booking can view materials
    const authorized = await isUserPartOfBooking(userId, bookingId);

    if (!authorized) {
      return res.status(403).json({ message: 'Forbidden: Bạn không có quyền xem tài liệu của booking này.' });
    }

    // This is where we query for materials.
    // Mongoose usually handles casting string bookingId to ObjectId for direct queries.
    const materials = await Material.find({ bookingId: bookingId }).sort({ uploadDate: -1 });
    if (materials.length === 0) {
    }

    res.json(materials);
  } catch (error) {
    console.error("[getMaterialsByBookingId] Server error when fetching materials:", error);
    res.status(500).json({ message: 'Server error when fetching materials.' });
  }
};