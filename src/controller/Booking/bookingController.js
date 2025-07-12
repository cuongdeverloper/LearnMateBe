const Booking = require('../../modal/Booking');
const User = require('../../modal/User'); // giả sử đây là model user


exports.getBookingById = async (req, res) => {
  try {
      const { id } = req.params;

      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ message: 'Invalid booking ID format.' });
      }

      const booking = await Booking.findById(id);

      if (!booking) {
          return res.status(404).json({ message: 'Booking not found.' });
      }
      res.json(booking);
  } catch (error) {
      console.error("Error fetching booking by ID:", error);
      res.status(500).json({ message: 'Server error fetching booking details.' });
  }
};
exports.createBooking = async (req, res) => {
  try {
    const { tutorId } = req.params;
    // Destructure note from req.body
    const { amount, numberOfSessions, note } = req.body; 

    if (!tutorId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields: tutorId or amount' });
    }

    // Kiểm tra user login
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not logged in' });
    }

    // Lấy user từ DB
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Kiểm tra balance đủ không
    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Số dư tài khoản không đủ để đặt lịch' });
    }

    // Trừ tiền balance
    user.balance -= amount;
    await user.save();

    // Tạo booking với trạng thái pending và bao gồm note
    const booking = await Booking.create({
      learnerId: req.user.id || req.user._id,
      tutorId,
      amount,
      numberOfSessions: numberOfSessions || 0,
      status: 'pending',
      note, // Include the note here
    });

    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserBookingHistory = async (req, res) => {
  const userId = req.params.userId;
  try {
    const bookings = await Booking.find({ learnerId: userId })
      .populate({
        path: "tutorId",
        populate: {
          path: "user",
          select: "username email image"
        }
      })
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Lỗi getUserBookingHistory:", err);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử đặt lịch." });
  }
};

exports.getApprovedBookingsForLearner = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để xem các khóa học đã duyệt.' });
    }
    const learnerId = req.user.id || req.user._id;

    const bookings = await Booking.find({
      learnerId,
      status: 'approve'
    })
    .populate({
      path: 'tutorId', 
      select: 'user', 
      populate: {
        path: 'user', 
        select: 'username' 
      }
    })
    .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Lỗi khi lấy các khóa học đã duyệt:", err);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tải danh sách khóa học của bạn. Vui lòng thử lại sau.' });
  }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id || req.user._id; // Lấy ID người dùng từ token

    // Tìm booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Đảm bảo người dùng hiện tại là người tạo booking này
    if (booking.learnerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only cancel your own bookings.' });
    }

    // Chỉ cho phép hủy các booking có trạng thái 'pending'
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled.' });
    }

    // Cập nhật trạng thái booking thành 'cancelled'
    booking.status = 'cancelled';
    await booking.save();

    // Hoàn tiền cho người dùng
    const user = await User.findById(userId);
    if (!user) {
      // Đây là một trường hợp lỗi hiếm gặp nếu người dùng không tồn tại sau khi tìm thấy booking
      console.error(`User with ID ${userId} not found for refund.`);
      return res.status(500).json({ success: false, message: 'Error processing refund: User not found.' });
    }

    user.balance += booking.amount; // Hoàn lại số tiền booking
    await user.save();

    res.status(200).json({ success: true, message: 'Booking cancelled and refunded successfully.', bookingId: booking._id });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};