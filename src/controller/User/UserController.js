const uploadCloud = require("../../config/cloudinaryConfig");
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

module.exports = { addUser, getUserByUserId };