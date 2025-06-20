const TutorApplication = require('../../modal/TutorApplication');
const User = require('../../modal/User');
const uploadCloud = require('../../config/cloudinaryConfig');

// Submit tutor application
const submitApplication = async (req, res) => {
  try {
    uploadCloud.single('cvFile')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          errorCode: 1,
          message: `CV upload error: ${err.message}` 
        });
      }

      const {
        experience,
        education,
        subjects,
        bio,
        pricePerHour,
        location,
        languages,
        certificates
      } = req.body;

      const cvFile = req.file ? req.file.path : null;
      const tutorId = req.user.id;

      if (!cvFile || !experience || !education || !subjects || !bio || !pricePerHour || !location) {
        return res.status(400).json({
          errorCode: 2,
          message: 'All required fields must be provided'
        });
      }

      // Check if user already has a pending application
      const existingApplication = await TutorApplication.findOne({
        tutorId,
        status: 'pending'
      });

      if (existingApplication) {
        return res.status(400).json({
          errorCode: 3,
          message: 'You already have a pending application'
        });
      }

      // Create tutor profile first (this would be your existing tutor model)
      // For now, we'll create a basic tutor profile
      const tutorProfile = {
        user: tutorId,
        bio,
        subjects: Array.isArray(subjects) ? subjects : [subjects],
        pricePerHour: parseInt(pricePerHour),
        experience,
        education,
        location,
        rating: 0,
        languages: Array.isArray(languages) ? languages : [languages],
        certifications: Array.isArray(certificates) ? certificates : [certificates],
        availableTimes: [],
        reviews: []
      };

      // Create the application
      const newApplication = new TutorApplication({
        tutorId,
        tutorProfile: tutorProfile, // This would be the actual tutor document ID
        cvFile,
        certificates: Array.isArray(certificates) ? certificates : [certificates],
        experience,
        education,
        subjects: Array.isArray(subjects) ? subjects : [subjects],
        bio,
        pricePerHour: parseInt(pricePerHour),
        location,
        languages: Array.isArray(languages) ? languages : [languages],
        status: 'pending'
      });

      await newApplication.save();

      res.status(201).json({
        errorCode: 0,
        message: 'Application submitted successfully',
        data: newApplication
      });
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      errorCode: 4,
      message: 'Error submitting application'
    });
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
      verified: true
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