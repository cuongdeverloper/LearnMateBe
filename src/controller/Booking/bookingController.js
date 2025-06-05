const Booking = require('../../modal/Booking');
const User = require('../../modal/User'); // giả sử đây là model user

exports.createBooking = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { amount, numberOfSessions } = req.body;

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

    // Tạo booking với trạng thái confirmed
    const booking = await Booking.create({
      learnerId: req.user.id || req.user._id,
      tutorId,
      amount,
      numberOfSessions: numberOfSessions || 0,
      status: 'paid', // đã thanh toán thành công
    });

    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
