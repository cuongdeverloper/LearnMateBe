const Booking = require('../../modal/Booking');
const Schedule = require('../../modal/Schedule');
const Material = require('../../modal/Material');
const Progress = require('../../modal/Progress');
const Tutor = require('../../modal/Tutor');

// Accept or reject booking
const respondBooking = async (req, res) => {
  const { bookingId, action, learnerId } = req.body;
  if (!['approve', 'rejected', 'cancelled'].includes(action))
     return res.status(400).json({ message: 'Invalid action' });

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  // Only set learnerId if provided
  if (learnerId !== undefined) {
    booking.learnerId = learnerId;
  }
  booking.status = action;
  await booking.save();

  res.status(200).json({ message: `Booking ${action}` });
};

// Cancel booking
const cancelBooking = async (req, res) => {
  const { bookingId, reason } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  if (new Date(booking.startTime) < Date.now()) {
    return res.status(400).json({ message: 'Too late to cancel' });
  }

  // Ensure learnerId exists before saving
  if (!booking.learnerId) {
    return res.status(400).json({ message: 'learnerId is required to cancel booking' });
  }

  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  await booking.save();

  res.status(200).json({ message: 'Booking cancelled' });
};

const getPendingBookings = async (req, res) => {
  try {
    const tutorUserId = req.params.tutorId; 

    const tutor = await Tutor.findOne({ user: tutorUserId });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const bookings = await Booking.find({
      tutorId: tutor._id,
      status: 'pending'
    }).populate('learnerId', 'username email');

    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error fetching pending bookings:', err);
    res.status(500).json({ error: err.message });
  }
};



// Create schedule
const createSchedule = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // B1: Kiểm tra booking tồn tại
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // B2: Đếm số buổi đã tạo trong Schedule
    const existingSessions = await Schedule.countDocuments({ bookingId });

    // B3: So sánh với số buổi đã đặt
    if (existingSessions >= booking.numberOfSessions) {
      return res.status(400).json({ message: 'Number of scheduled sessions exceeds booking limit' });
    }

    // B4: Tạo buổi học mới
    const slot = new Schedule(req.body);
    await slot.save();

    // B5: Lưu lại ID buổi học vào booking.scheduleIds (optional, nếu dùng field này)
    booking.scheduleIds.push(slot._id);
    await booking.save();

    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSchedule = async (req, res) => {
  try {
    const tutorUserId = req.params.tutorId;
    const tutor = await Tutor.findOne({ user: tutorUserId });
    const schedule = await Schedule.find({ tutorId: tutor._id })
      .populate('learnerId', 'username email'); 
    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update progress
const updateProgress = async (req, res) => {
  try {
    const progress = new Progress(req.body);
    await progress.save();
    res.status(201).json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get progress by student
const getProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ studentId: req.params.studentId });
    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Upload material
const uploadMaterial = async (req, res) => {
  try {
    const { bookingId, title, description, fileUrl } = req.body;

    if (!fileUrl || !bookingId) {
      return res.status(400).json({ message: 'Missing fileUrl or bookingId' });
    }

    const material = new Material({
      bookingId,
      title: title || 'Untitled',
      description: description || '',
      fileUrl,
      fileType: 'link',
    });

    await material.save();
    res.status(201).json({ message: 'Upload thành công', data: material });
  } catch (err) {
    console.error('Upload material error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get materials by booking
const getMaterials = async (req, res) => {
  try {
    const list = await Material.find({ bookingId: req.params.bookingId });
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  respondBooking,
  cancelBooking,
  getPendingBookings,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  updateProgress,
  getProgress,
  uploadMaterial,
  getMaterials,
};
