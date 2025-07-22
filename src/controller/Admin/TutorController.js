const Tutor = require('../../modal/Tutor');
const User = require('../../modal/User');

// Get all tutors (for admin)
const getAllTutors = async (req, res) => {
  try {
    const tutors = await Tutor.find({})
      .populate('user', 'username email phoneNumber image role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      errorCode: 0,
      message: 'Tutors retrieved successfully',
      data: tutors
    });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({
      errorCode: 1,
      message: 'Error retrieving tutors'
    });
  }
};

// Get tutors by status
const getTutorsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    let query = {};
    if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    } else if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const tutors = await Tutor.find(query)
      .populate('user', 'username email phoneNumber image role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      errorCode: 0,
      message: 'Tutors retrieved successfully',
      data: tutors
    });
  } catch (error) {
    console.error('Get tutors by status error:', error);
    res.status(500).json({
      errorCode: 2,
      message: 'Error retrieving tutors'
    });
  }
};

// Get tutor by ID
const getTutorById = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const tutor = await Tutor.findById(tutorId)
      .populate('user', 'username email phoneNumber image role')
      .populate('reviews')
      .populate('classes');

    if (!tutor) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Tutor not found'
      });
    }

    res.status(200).json({
      errorCode: 0,
      message: 'Tutor retrieved successfully',
      data: tutor
    });
  } catch (error) {
    console.error('Get tutor by ID error:', error);
    res.status(500).json({
      errorCode: 3,
      message: 'Error retrieving tutor'
    });
  }
};

// Verify tutor
const verifyTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const adminId = req.user.id;

    const tutor = await Tutor.findById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Tutor not found'
      });
    }

    // Cho phép verify bất kỳ tutor nào, không cần kiểm tra điều kiện
    tutor.isVerified = true;
    await tutor.save();

    // Update user verified status
    await User.findByIdAndUpdate(tutor.user, {
      verified: true
    });

    res.status(200).json({
      errorCode: 0,
      message: 'Tutor verified successfully',
      data: tutor
    });
  } catch (error) {
    console.error('Verify tutor error:', error);
    res.status(500).json({
      errorCode: 4,
      message: 'Error verifying tutor'
    });
  }
};

// Unverify tutor
const unverifyTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const adminId = req.user.id;

    const tutor = await Tutor.findById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Tutor not found'
      });
    }

    // Cho phép unverify bất kỳ tutor nào, không cần kiểm tra điều kiện
    tutor.isVerified = false;
    await tutor.save();

    // Update user verified status
    await User.findByIdAndUpdate(tutor.user, {
      verified: false,
      role: 'student'
    });

    res.status(200).json({
      errorCode: 0,
      message: 'Tutor unverified successfully',
      data: tutor
    });
  } catch (error) {
    console.error('Unverify tutor error:', error);
    res.status(500).json({
      errorCode: 5,
      message: 'Error unverifying tutor'
    });
  }
};

// Activate/Deactivate tutor
const toggleTutorStatus = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { isActive } = req.body;

    const tutor = await Tutor.findById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Tutor not found'
      });
    }

    tutor.isActive = isActive;
    await tutor.save();

    res.status(200).json({
      errorCode: 0,
      message: `Tutor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: tutor
    });
  } catch (error) {
    console.error('Toggle tutor status error:', error);
    res.status(500).json({
      errorCode: 6,
      message: 'Error toggling tutor status'
    });
  }
};

// Delete tutor
const deleteTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const tutor = await Tutor.findById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Tutor not found'
      });
    }

    const userId = tutor.user;

    // Xóa bản ghi tutor
    await Tutor.findByIdAndDelete(tutorId);

    // Xóa luôn tài khoản user liên kết
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      errorCode: 0,
      message: 'Tutor and related user deleted successfully'
    });
  } catch (error) {
    console.error('Delete tutor error:', error);
    res.status(500).json({
      errorCode: 7,
      message: 'Error deleting tutor'
    });
  }
};


// Get tutor statistics
const getTutorStats = async (req, res) => {
  try {
    const totalTutors = await Tutor.countDocuments();
    const verifiedTutors = await Tutor.countDocuments({ isVerified: true });
    const unverifiedTutors = await Tutor.countDocuments({ isVerified: false });
    const activeTutors = await Tutor.countDocuments({ isActive: true });
    const inactiveTutors = await Tutor.countDocuments({ isActive: false });

    const stats = {
      total: totalTutors,
      verified: verifiedTutors,
      unverified: unverifiedTutors,
      active: activeTutors,
      inactive: inactiveTutors
    };

    res.status(200).json({
      errorCode: 0,
      message: 'Tutor statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get tutor stats error:', error);
    res.status(500).json({
      errorCode: 8,
      message: 'Error retrieving tutor statistics'
    });
  }
};

module.exports = {
  getAllTutors,
  getTutorsByStatus,
  getTutorById,
  verifyTutor,
  unverifyTutor,
  toggleTutorStatus,
  deleteTutor,
  getTutorStats
}; 