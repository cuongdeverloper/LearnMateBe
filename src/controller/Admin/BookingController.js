const Booking = require('../../modal/Booking');
const User = require('../../modal/User');
const Schedule = require('../../modal/Schedule');

// Lấy danh sách booking, filter, phân trang
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      learner,
      tutor,
      _id,
      fromDate,
      toDate
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (_id) query._id = { $regex: _id, $options: 'i' };
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    
    const bookings = await Booking.find(query)
      .populate('learnerId', 'username email')
      .populate('tutorId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    const total = await Booking.countDocuments(query);
    res.status(200).json({ errorCode: 0, data: bookings, total });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ errorCode: 1, message: 'Không thể tải dữ liệu. Vui lòng thử lại sau.' });
  }
};

// Lấy chi tiết booking
const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('learnerId', 'username email')
      .populate('tutorId', 'username email');
    if (!booking) {
      return res.status(404).json({ errorCode: 2, message: 'Booking not found' });
    }
    res.status(200).json({ errorCode: 0, data: booking });
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json({ errorCode: 1, message: 'Không thể tải dữ liệu. Vui lòng thử lại sau.' });
  }
};

// Lấy schedule data cho booking
const getBookingSchedules = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Lấy booking để kiểm tra
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ errorCode: 2, message: 'Booking not found' });
    }
    
    // Lấy schedules cho booking này
    const schedules = await Schedule.find({ bookingId: booking._id.toString() })
      .populate('learnerId', 'username email')
      .populate('tutorId', 'username email')
      .sort({ date: 1, startTime: 1 });
    
    // Format data cho frontend
    const formattedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      date: schedule.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject,
      location: schedule.location,
      attended: schedule.attended,
      notes: schedule.notes,
      learnerId: schedule.learnerId,
      tutorId: schedule.tutorId
    }));
    
    res.status(200).json({ errorCode: 0, data: formattedSchedules });
  } catch (error) {
    console.error('Get booking schedules error:', error);
    res.status(500).json({ errorCode: 1, message: 'Không thể tải dữ liệu schedule. Vui lòng thử lại sau.' });
  }
};

module.exports = { getAllBookings, getBookingDetail, getBookingSchedules }; 