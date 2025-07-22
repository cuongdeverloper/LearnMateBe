const TutorApplication = require('../../modal/TutorApplication');
const User = require('../../modal/User');
const uploadCloud = require('../../config/cloudinaryConfig');
const { createTutorApplicationNotification } = require('../Notification/NotificationController');

const submitApplication = async (req, res) => {
  try {
    const {
      experience,
      education,
      subjects,
      bio,
      pricePerHour,
      location,
      languages,
      certificates,
      classes,
      availableTimes
    } = req.body;

    const tutorId = req.user?.id;
    const cvFile = req.file?.path;

    if (!tutorId) {
      return res.status(401).json({ errorCode: 5, message: 'Unauthorized: Missing user ID' });
    }

    const missingFields = [];
    if (!cvFile) missingFields.push('file CV');
    if (!experience?.trim()) missingFields.push('kinh nghiệm');
    if (!education?.trim()) missingFields.push('học vấn');
    if (!bio?.trim()) missingFields.push('giới thiệu');
    if (!location?.trim()) missingFields.push('địa điểm');
    if (!pricePerHour || isNaN(pricePerHour)) missingFields.push('giá mỗi giờ');

    const parsedSubjects = Array.isArray(subjects) ? subjects : [subjects];
    const parsedClasses = Array.isArray(classes) ? classes.map(Number) : [Number(classes)];
    const parsedAvailableTimes = JSON.parse(availableTimes || '[]');
    const parsedLanguages = Array.isArray(languages) ? languages : [languages];
    const parsedCertificates = Array.isArray(certificates) ? certificates : [certificates];

    if (parsedSubjects.length === 0) missingFields.push('môn học');
    if (parsedClasses.length === 0) missingFields.push('khối lớp');
    if (parsedAvailableTimes.length === 0) missingFields.push('thời gian rảnh');

    if (missingFields.length > 0) {
      return res.status(400).json({
        errorCode: 2,
        message: `Thiếu trường bắt buộc: ${missingFields.join(', ')}`
      });
    }

    const existing = await TutorApplication.findOne({ tutorId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ errorCode: 3, message: 'Đã có đơn đang chờ xử lý' });
    }

    const application = new TutorApplication({
      tutorId,
      cvFile,
      certificates: parsedCertificates,
      experience: experience.trim(),
      education: education.trim(),
      subjects: parsedSubjects,
      bio: bio.trim(),
      pricePerHour: Number(pricePerHour),
      location: location.trim(),
      languages: parsedLanguages,
      status: 'pending'
    });

    await application.save();
    await createTutorApplicationNotification(application);

    res.status(201).json({
      errorCode: 0,
      message: 'Đơn đăng ký đã gửi thành công',
      data: application
    });
  } catch (error) {
    console.error('Lỗi khi submit application:', error);
    res.status(500).json({ errorCode: 4, message: 'Lỗi máy chủ' });
  }
};

// Get all applications (for admin)
const getAllApplications = async (req, res) => {
  try {
    const applications = await TutorApplication.find({})
      .populate('tutorId', 'username email phoneNumber image')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      errorCode: 0,
      message: 'Applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      errorCode: 1,
      message: 'Error retrieving applications'
    });
  }
};

// Get applications by status
const getApplicationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        errorCode: 1,
        message: 'Invalid status'
      });
    }

    const applications = await TutorApplication.find({ status })
      .populate('tutorId', 'username email phoneNumber image')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      errorCode: 0,
      message: 'Applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    console.error('Get applications by status error:', error);
    res.status(500).json({
      errorCode: 2,
      message: 'Error retrieving applications'
    });
  }
};

// Approve application
const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const adminId = req.user.id;

    const application = await TutorApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        errorCode: 2,
        message: 'Application has already been processed'
      });
    }

    application.status = 'approved';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    await application.save();

    // Update user verified status - cho phép verify bất kỳ user nào
    await User.findByIdAndUpdate(application.tutorId, {
      verified: true,
      role: 'tutor'
    });

    res.status(200).json({
      errorCode: 0,
      message: 'Application approved successfully',
      data: application
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      errorCode: 3,
      message: 'Error approving application'
    });
  }
};

// Reject application
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        errorCode: 1,
        message: 'Rejection reason is required'
      });
    }

    const application = await TutorApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        errorCode: 2,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        errorCode: 3,
        message: 'Application has already been processed'
      });
    }

    application.status = 'rejected';
    application.rejectionReason = rejectionReason;
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    await application.save();

    res.status(200).json({
      errorCode: 0,
      message: 'Application rejected successfully',
      data: application
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      errorCode: 4,
      message: 'Error rejecting application'
    });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await TutorApplication.findById(applicationId)
      .populate('tutorId', 'username email phoneNumber image')
      .populate('reviewedBy', 'username');

    if (!application) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      errorCode: 0,
      message: 'Application retrieved successfully',
      data: application
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      errorCode: 2,
      message: 'Error retrieving application'
    });
  }
};

// Get tutor's own applications
const getTutorApplications = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const applications = await TutorApplication.find({ tutorId })
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      errorCode: 0,
      message: 'Applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    console.error('Get tutor applications error:', error);
    res.status(500).json({
      errorCode: 1,
      message: 'Error retrieving applications'
    });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationsByStatus,
  approveApplication,
  rejectApplication,
  getApplicationById,
  getTutorApplications
}; 