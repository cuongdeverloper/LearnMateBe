const Booking = require('../../modal/Booking');
const Review = require('../../modal/Review');

// Tạo review mới
exports.createReview = async (req, res) => {
  try {
    const { tutor, course, rating, comment } = req.body;
    const user = req.user.id; // Lấy từ middleware xác thực

    // Kiểm tra booking
    const booking = await Booking.findById(course);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (!booking.learnerId || !user || booking.learnerId.toString() !== user.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền review booking này' });
    }
    if (!booking.completed) {
      return res.status(400).json({ message: 'Bạn chỉ có thể review sau khi hoàn thành khóa học' });
    }

    // Nếu đã review rồi thì không cho review lại (optional)
    const existed = await Review.findOne({ user, course });
    if (existed) {
      return res.status(400).json({ message: 'Bạn đã review khóa học này rồi' });
    }

    const review = new Review({ user, tutor, course, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Error in createReview:', err);
    res.status(500).json({ error: err.message });
  }
};

// Lấy review của 1 gia sư
exports.getReviewsByTutor = async (req, res) => {
  try {
    const reviews = await Review.find({ tutor: req.params.tutorId }).populate('user', 'username');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy review của 1 khóa học
exports.getReviewsByCourse = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId }).populate('user', 'username');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
