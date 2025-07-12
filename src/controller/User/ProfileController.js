const uploadCloud = require("../../config/cloudinaryConfig");
const User = require("../../modal/User");

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

const updateProfile = async (req, res) => {
  uploadCloud.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: `Image upload error: ${err.message}` });
    }
    try {
      const userId = req.user.id || req.user._id;
      const updateData = { ...req.body };
      if (req.file) {
        updateData.image = req.file.path;
      }
      // Không cho phép cập nhật trường password ở đây
      delete updateData.password;
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error });
    }
  });
};

module.exports = { getProfile, updateProfile }; 