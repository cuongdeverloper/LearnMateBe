const { createJWT, createRefreshToken, verifyAccessToken, createJWTResetPassword } = require('../../middleware/JWTAction');
const bcrypt = require('bcryptjs');
const UserOTPVerification = require('./UserOTPVerification');
const uploadCloud = require('../../config/cloudinaryConfig');
const { sendMail } = require('../../config/mailSendConfig copy');
const user = require('../../modal/User');
require('dotenv').config();

const apiLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        errorCode: 1,
        message: 'Email and password are required'
      });
    }

    const userRecord = await user.findOne({ email });
    if (!userRecord) {
      return res.status(200).json({
        errorCode: 2,
        message: 'Email does not exist'
      });
    }


    const isPasswordValid = await bcrypt.compare(password, userRecord.password);

    
    if (!isPasswordValid) {
      return res.status(200).json({
        errorCode: 3,
        message: 'Invalid password'
      });
    }

    const payload = {
      id:userRecord._id,
      email: userRecord.email,
      role: userRecord.role,
    };

    const accessToken = createJWT(payload);
    const refreshToken = createRefreshToken(payload);

    if (!accessToken || !refreshToken) {
      return res.status(500).json({
        errorCode: 4,
        message: 'Failed to create tokens'
      });
    }  

    return res.status(200).json({
      errorCode: 0,
      message: 'Login successful',
      data: {
        id: userRecord._id,
        access_token: accessToken,
        refresh_token: refreshToken,
        username: userRecord.username,
        role: userRecord.role,
        email: userRecord.email,
        phoneNumber: userRecord.phoneNumber,
        gender: userRecord.gender,
        image:userRecord.image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      errorCode: 5,
      message: 'An error occurred during login'
    });
  }
};

const apiRegister = async (req, res) => {
  try {
    uploadCloud.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          errorCode: 4,
          message: `Upload Error: ${err.message}`,
        });
      }

      const { username, email, password, phoneNumber, gender, role } = req.body;
      const image = req.file ? req.file.path : null;

      if (!username || !email || !password || !phoneNumber || !gender) {
        return res.status(203).json({
          errorCode: 1,
          message: 'All fields are required',
        });
      }

      const existingUser = await user.findOne({ email });
      if (existingUser) {
        return res.status(200).json({
          errorCode: 2,
          message: 'Email already exists',
        });
      }


      const newUser = new user({
        username,
        email,
        password,
        phoneNumber,
        gender,
        role: role || 'student',
        image,
      });
      await newUser.save();

      // Generate OTP
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedOTP = await bcrypt.hash(otp, 10);

      // Create OTP verification entry
      const newOtpVerification = new UserOTPVerification({
        userId: newUser._id,
        otp: hashedOTP,
      });
      await newOtpVerification.save();

      // Send OTP to user's email
      const emailSubject = 'Your OTP Verification Code';
      const emailContent = `Your OTP code is: ${otp}. It will expire in 5 minutes.`;
      await sendMail(email, emailSubject, emailContent);

      // Schedule account deletion if not verified in 5 minutes
      setTimeout(async () => {
        const isVerified = await user.findById(newUser._id).select('verified');
        if (!isVerified || !isVerified.verified) {
          // Delete the user and OTP record
          await user.findByIdAndDelete(newUser._id);
          await UserOTPVerification.deleteMany({ userId: newUser._id });
          console.log(`Deleted unverified user with ID: ${newUser._id}`);
        }
      }, 5 * 60 * 1000); 

      return res.status(201).json({
        errorCode: 0,
        message: 'Registration successful. An OTP has been sent to your email for verification.',
        data: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          gender: newUser.gender,
          image,
        },
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      errorCode: 5,
      message: 'An error occurred during registration',
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, OTP } = req.body;
    // Check for empty OTP details
    if (!userId || !OTP) {
      return res.status(400).json({
        errorCode: 100,
        message: 'User ID and OTP are required',
      });
    }

    // Retrieve the OTP verification record for the user
    const otpRecord = await UserOTPVerification.findOne({ userId });
    if (!otpRecord) {
      return res.status(400).json({
        errorCode: 2,
        message: 'No OTP record found for this user',
      });
    }

    // Compare the hashed OTP stored in the database with the provided OTP
    const isOtpValid = await bcrypt.compare(OTP, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({
        errorCode: 3,
        message: 'Invalid OTP',
      });
    }


    await user.findByIdAndUpdate(userId, { verified: true });
    await UserOTPVerification.deleteMany({ userId });
    return res.status(200).json({
      errorCode: 0,
      message: 'OTP verification successful',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      errorCode: 4,
      message: 'An error occurred during OTP verification',
    });
  }
};
const resendOTPVerificationCode = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({
        errorCode: 1,
        message: 'User ID and email are required',
      });
    }

    // Delete previous OTP records for the user
    await UserOTPVerification.deleteMany({ userId });

    // Generate a new OTP
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    // Create a new OTP verification entry
    const newOtpVerification = new UserOTPVerification({
      userId,
      otp: hashedOTP,
    });
    await newOtpVerification.save();

    // Send the new OTP to the user's email
    const emailSubject = 'Your New OTP Verification Code';
    const emailContent = `Your new OTP code is: ${otp}. It will expire in 5 minutes.`;
    await sendMail(email, emailSubject, emailContent);

    return res.status(200).json({
      errorCode: 0,
      message: 'New OTP has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      errorCode: 2,
      message: 'An error occurred while resending the OTP',
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ errorCode: 1, message: 'Email is required' });
    }

    // Find user by email
    const userRecord = await user.findOne({ email });
    if (!userRecord) {
      return res.status(203).json({ errorCode: 2, message: 'Email does not exist' });
    }

    const payload = {
      id:userRecord._id,
      email: userRecord.email,
    };
    // Create a reset token with 1 minute expiration
    const resetToken = createJWTResetPassword(payload);

    // Create a reset link with the token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email with reset link
    const emailSubject = 'Password Reset Request';
    const emailContent = `Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 5 minute.`;
    await sendMail(email, emailSubject, emailContent);

    return res.status(200).json({
      errorCode: 0,
      message: 'Password reset email sent successfully. The link will expire in 1 minute.',
    });
  } catch (error) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({
      errorCode: 3,
      message: 'An error occurred during password reset request',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ errorCode: 1, message: 'Token and new password are required' });
    }

    const decodedToken = verifyAccessToken(token);
    console.log(decodedToken)
    if (!decodedToken) {
      return res.status(203).json({ errorCode: 2, message: 'Invalid or expired token' });
    }

    const userRecord = await user.findById(decodedToken.id);
    if (!userRecord) {
      return res.status(400).json({ errorCode: 3, message: 'User not found' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, userRecord.password);
    if (isSamePassword) {
      return res.status(400).json({
        errorCode: 4,
        message: 'New password cannot be the same as the old password',
      });
    }

    userRecord.password = newPassword;

    await userRecord.save();

    return res.status(200).json({
      errorCode: 0,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset Password error:', error);
    return res.status(500).json({
      errorCode: 5,
      message: 'An error occurred during password reset',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(200).json({
        errorCode: 1,
        message: 'Current password and new password are required',
      });
    }

    const userRecord = await user.findById(userId);
    if (!userRecord) {
      return res.status(200).json({
        errorCode: 2,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);
    if (!isPasswordValid) {
      return res.status(200).json({
        errorCode: 3,
        message: 'Current password is incorrect',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, userRecord.password);
    if (isSamePassword) {
      return res.status(200).json({
        errorCode: 4,
        message: 'New password cannot be the same as the old password',
      });
    }

    userRecord.password = newPassword
    await userRecord.save();

    return res.status(200).json({
      errorCode: 0,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      errorCode: 5,
      message: 'An error occurred during password change',
    });
  }
};


module.exports = {
  apiLogin,apiRegister,verifyOtp,resendOTPVerificationCode,
  requestPasswordReset,resetPassword,changePassword
};

