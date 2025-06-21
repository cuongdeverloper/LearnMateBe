const Booking = require('../../modal/Tutor/Booking');
const Schedule = require('../../modal/Tutor/Schedule');
const Progress = require('../../modal/Tutor/Progress');
const Material = require('../../modal/Tutor/Material');

// Accept or reject booking
const respondBooking = async (req, res) => {
  const { bookingId, action, learnerId } = req.body;
  if (!['approve', 'rejected', 'cancelled'].includes(action))
     return res.status(400).json({ message: 'Invalid action' });


  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.learnerId = learnerId; 
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

  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  await booking.save();

  res.status(200).json({ message: 'Booking cancelled' });
};

// Get bookings with status 'pending'
const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      tutorId: req.params.tutorId,
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
    const slot = new Schedule(req.body);
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tutor's schedule
const getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({ tutorId: req.params.tutorId });
    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update schedule
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
    const fileUrl = req.file?.path;
    const material = new Material({
      studentId: req.body.studentId,
      description: req.body.description,
      fileUrl
    });

    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get materials by student
const getMaterials = async (req, res) => {
  try {
    const list = await Material.find({ studentId: req.params.studentId });
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
  getMaterials
};
