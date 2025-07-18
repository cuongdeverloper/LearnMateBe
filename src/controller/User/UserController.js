const uploadCloud = require("../../config/cloudinaryConfig");
const { sendMail } = require("../../config/mailSendConfig");
const User = require("../../modal/User");
// test branch moi ngay 29/5/2025
const addUser = async (req, res) => {
  uploadCloud.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: `Image upload error: ${err.message}` });
    }

    const { username, password, role, email, phoneNumber, gender } = req.body;
    const image = req.file ? req.file.path : null;

    if (!username || !password || !role || !email || !phoneNumber || !gender) {
      return res.status(400).json({ message: 'All fields are required.' });
    }


    try {
      const newUser = new User({
        username,
        password,
        role,
        email,
        phoneNumber,
        gender,
        image
      });

      await newUser.save();
      res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Username or email already exists.' });
      }
      res.status(500).json({ message: 'Error registering user', error });
    }
  });
};
const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id username email');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students', error });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        errorCode: 1,
        message: 'User not found'
      });
    }

    // Kiểm tra user có phải admin không
    if (existingUser.role === 'admin') {
      return res.status(403).json({
        errorCode: 2,
        message: 'Cannot block admin user'
      });
    }

    // Kiểm tra user đã bị block chưa
    if (existingUser.isBlocked) {
      return res.status(400).json({
        errorCode: 3,
        message: 'User is already blocked'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    ).select('-password');

    // Gửi email lý do block
    if (user.email && reason) {
      const subject = 'Tài khoản của bạn đã bị khóa';
      const msg = `<p>Xin chào <b>${user.username}</b>,</p>
        <p>Tài khoản của bạn đã bị khóa bởi quản trị viên.</p>
        <p><b>Lý do:</b> ${reason}</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ lại với chúng tôi.</p>`;
      sendMail(user.email, subject, msg);
    }

    res.status(200).json({
      errorCode: 0,
      message: 'User blocked successfully',
      user
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      errorCode: 4,
      message: 'Error blocking user'
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user', error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        errorCode: 1,
        message: 'User not found'
      });
    }

    // Kiểm tra user có phải admin không
    if (user.role === 'admin') {
      return res.status(403).json({
        errorCode: 2,
        message: 'Cannot delete admin user'
      });
    }

    // Kiểm tra user có booking hoặc application đang pending không
    const Booking = require('../../modal/Booking');
    const TutorApplication = require('../../modal/TutorApplication');

    const pendingBookings = await Booking.find({
      $or: [{ learnerId: userId }, { tutorId: userId }],
      status: 'pending'
    });

    const pendingApplications = await TutorApplication.find({
      tutorId: userId,
      status: 'pending'
    });

    if (pendingBookings.length > 0) {
      return res.status(400).json({
        errorCode: 3,
        message: 'Cannot delete user with pending bookings'
      });
    }

    if (pendingApplications.length > 0) {
      return res.status(400).json({
        errorCode: 4,
        message: 'Cannot delete user with pending applications'
      });
    }

    // Gửi email lý do delete trước khi xóa
    if (user.email && reason) {
      const subject = 'Tài khoản của bạn đã bị xóa';
      const msg = `<p>Xin chào <b>${user.username}</b>,</p>
        <p>Tài khoản của bạn đã bị xóa bởi quản trị viên.</p>
        <p><b>Lý do:</b> ${reason}</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ lại với chúng tôi.</p>`;
      sendMail(user.email, subject, msg);
    }

    // Xóa user sau khi gửi email
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      errorCode: 0,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      errorCode: 5,
      message: 'Error deleting user'
    });
  }
};

module.exports = {
  addUser, getUserByUserId, getAllStudents, getAllUsers,
  blockUser,
  unblockUser,
  deleteUser
};