const Tutor = require('../../modal/Tutor');
const User = require('../../modal/User');

// 🔍 Lấy danh sách tutor có filter
exports.getTutors = async (req, res) => {
  try {
    const { name, subject, minPrice, maxPrice, minRating, class: classGrade } = req.query;

    let filter = {};

    // Lọc theo tên tutor (từ User model)
    let userFilter = {};
    if (name) {
      userFilter.username = { $regex: name, $options: 'i' };
    }

    // Lọc theo subject
    if (subject) {
      filter.subjects = { $regex: subject, $options: 'i' };
    }

    // Lọc theo class (tutor dạy lớp nào)
    if (classGrade) {
      filter.classes = Number(classGrade);  // classes là array, nên MongoDB sẽ tìm các tutor có lớp này
    }

    // Lọc theo khoảng giá
    if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
    }

    // Lọc theo rating
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Tìm tutor và populate user
    let tutors = await Tutor.find(filter).populate({
      path: 'user',
      match: userFilter,
      select: 'username email image phoneNumber gender',
    });

    // Loại bỏ tutor không có user match khi dùng `match`
    tutors = tutors.filter(tutor => tutor.user !== null);

    res.json({ success: true, tutors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTutorById = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
      .populate('user', 'username email image phoneNumber gender')
      .select('subjects classes pricePerHour description rating'); // Lấy thêm các trường quan trọng

    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' });

    res.json({ success: true, tutor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
