// controller/Material/MaterialController.js

const Material = require('../../modal/Material');
const Booking = require('../../modal/Booking');
const User = require('../../modal/User');

// Helper function to check if a user is part of a booking (learner or tutor)
const isUserPartOfBooking = async (userId, bookingId) => {
  console.log(`[isUserPartOfBooking] Checking authorization for userId: ${userId} and bookingId: ${bookingId}`);
  const booking = await Booking.findById(bookingId).select('learnerId tutorId');
  if (!booking) {
    console.log(`[isUserPartOfBooking] Booking not found for ID: ${bookingId}`);
    return false;
  }

  const populatedBooking = await Booking.findById(bookingId)
    .populate({
      path: 'tutorId',
      select: 'user'
    })
    .exec();

  if (!populatedBooking || !populatedBooking.tutorId || !populatedBooking.tutorId.user) {
    console.log(`[isUserPartOfBooking] Populated booking or tutor user not found for booking ID: ${bookingId}`);
    return false;
  }

  const tutorUserId = populatedBooking.tutorId.user; // This should be an ObjectId

  const isLearner = booking.learnerId.toString() === userId.toString();
  const isTutor = tutorUserId.toString() === userId.toString();

  console.log(`[isUserPartOfBooking] Learner ID from booking: ${booking.learnerId.toString()}`);
  console.log(`[isUserPartOfBooking] Tutor User ID from populated booking: ${tutorUserId.toString()}`);
  console.log(`[isUserPartOfBooking] Current user (req.user) ID: ${userId.toString()}`);
  console.log(`[isUserPartOfBooking] Is Learner: ${isLearner}, Is Tutor: ${isTutor}`);

  return isLearner || isTutor;
};


// 1. Get all materials for a specific booking
exports.getMaterialsByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(`[getMaterialsByBookingId] Request received for bookingId: ${bookingId}`);

    if (!bookingId || !bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`[getMaterialsByBookingId] Invalid bookingId format: ${bookingId}`);
      return res.status(400).json({ message: 'Invalid bookingId format.' });
    }

    if (!req.user) {
      console.log("[getMaterialsByBookingId] Unauthorized: req.user is missing.");
      return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    const userId = req.user.id || req.user._id;
    console.log(`[getMaterialsByBookingId] Current user ID from JWT: ${userId}`);


    // Authorization: Only the learner or tutor associated with the booking can view materials
    const authorized = await isUserPartOfBooking(userId, bookingId);

    if (!authorized) {
      console.log(`[getMaterialsByBookingId] User ${userId} NOT AUTHORIZED for booking ${bookingId}`);
      return res.status(403).json({ message: 'Forbidden: Bạn không có quyền xem tài liệu của booking này.' });
    }

    // This is where we query for materials.
    // Mongoose usually handles casting string bookingId to ObjectId for direct queries.
    const materials = await Material.find({ bookingId: bookingId }).sort({ uploadDate: -1 });
    console.log(`[getMaterialsByBookingId] Found ${materials.length} materials for bookingId ${bookingId}:`, materials.map(m => m.title));
    if (materials.length === 0) {
        console.log(`[getMaterialsByBookingId] No materials found for bookingId ${bookingId}.`);
    }

    res.json(materials);
  } catch (error) {
    console.error("[getMaterialsByBookingId] Server error when fetching materials:", error);
    res.status(500).json({ message: 'Server error when fetching materials.' });
  }
};