const Schedule = require('../../modal/Schedule');
const Booking = require('../../modal/Booking');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// 1. Lấy slot bận trong tuần của booking
// Lấy toàn bộ slot bận trong tuần (mọi booking)
exports.getBusySlotsForWeek = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { weekStart } = req.query;
  
      if (!bookingId || bookingId === 'undefined' || !weekStart) {
        return res.status(400).json({ message: 'Missing or invalid parameters' });
      }
  
      if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid bookingId format' });
      }
  
      const startDate = new Date(weekStart);
      const endDate = addDays(startDate, 7);
  
      const busySlots = await Schedule.find({
        date: { $gte: startDate, $lt: endDate }
      }).select('date startTime endTime bookingId');
  
      res.json(busySlots);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 2. Thêm nhiều slot lịch cho booking
exports.addMultipleSlots = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { slots } = req.body;

    if (!bookingId || bookingId === 'undefined' || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid bookingId format' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const newSchedules = slots.map(s => ({
      tutorId: booking.tutorId,
      learnerId : booking.learnerId,
      bookingId,
      date: new Date(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    await Schedule.insertMany(newSchedules);

    res.json({ message: 'Slots added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Xóa slot lịch
exports.deleteScheduleSlot = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId || scheduleId === 'undefined') {
      return res.status(400).json({ message: 'Missing scheduleId' });
    }

    if (!scheduleId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid scheduleId format' });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    await schedule.deleteOne();

    res.json({ message: 'Schedule slot deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getLearnerWeeklySchedules = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    const learnerId = req.user.id || req.user._id;
    const { weekStart } = req.query;

    if (!weekStart) {
      return res.status(400).json({ message: 'Missing weekStart parameter' });
    }

    const startDate = new Date(weekStart);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = addDays(startDate, 7);
    endDate.setUTCHours(0, 0, 0, 0);

    const schedules = await Schedule.find({
      learnerId: learnerId,
      date: { $gte: startDate, $lt: endDate }
    })
    .populate({
      path: 'bookingId',
      select: 'tutorId', 
      populate: {
        path: 'tutorId',
        select: 'user',
        populate: {
          path: 'user', 
          select: 'username' 
        }
      }
    })
    .select('date startTime endTime bookingId attended'); // ĐÃ THÊM 'attended' VÀO ĐÂY

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching learner's weekly schedules:", error);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
};
exports.markAttendance = async (req, res) => {
  try {
      const { scheduleId } = req.params;
      const { attended } = req.body;

      if (!scheduleId || !scheduleId.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ message: 'Invalid scheduleId' });
      }

      if (!req.user) {
          return res.status(401).json({ message: 'Unauthorized: User not logged in' });
      }

      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
          return res.status(404).json({ message: 'Schedule slot not found' });
      }

      if (schedule.learnerId.toString() !== (req.user.id || req.user._id).toString()) {
          return res.status(403).json({ message: 'Forbidden: Bạn không có quyền cập nhật lịch trình này.' });
      }

      const now = new Date(); // Thời gian hiện tại của server (UTC)

      const scheduleDatePart = schedule.date.toISOString().split('T')[0];
      const sessionStartTimeUTC = new Date(`${scheduleDatePart}T${schedule.startTime}:00.000Z`);

      // Logic: Chỉ cho phép điểm danh nếu buổi học đã bắt đầu (hoặc đã kết thúc).
      // Không cho phép điểm danh nếu buổi học chưa bắt đầu.
      if (now.getTime() < sessionStartTimeUTC.getTime()) {
          return res.status(400).json({ message: 'Không thể điểm danh cho buổi học chưa bắt đầu.' });
      }

      schedule.attended = attended;
      await schedule.save();

      // --- LOGIC CẬP NHẬT TRẠNG THÁI HOÀN THÀNH CỦA BOOKING ---
      if (schedule.bookingId) {
          const booking = await Booking.findById(schedule.bookingId);

          if (booking) {
              const totalSessions = booking.numberOfSessions;
              const attendedSessions = await Schedule.countDocuments({
                  bookingId: booking._id,
                  attended: true
              });

              // Nếu số buổi đã điểm danh >= tổng số buổi VÀ booking đang ở trạng thái 'approve'
              // thì set completed = true. Ngược lại, set completed = false.
              const newCompletedStatus = (attendedSessions >= totalSessions && booking.status === 'approve');

              if (booking.completed !== newCompletedStatus) {
                  booking.completed = newCompletedStatus;
                  await booking.save();
                  console.log(`Booking ${booking._id} completed status updated to: ${newCompletedStatus}`);
              }
          }
      }
      // --- KẾT THÚC LOGIC CẬP NHẬT TRẠNG THÁI HOÀN THÀNH ---

      res.json({ message: 'Điểm danh đã được cập nhật thành công', schedule });

  } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật điểm danh.' });
  }
};