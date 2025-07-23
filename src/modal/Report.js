const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người báo cáo
  targetType: { type: String, enum: ['booking', 'comment', 'post'], required: true }, // Loại đối tượng bị báo cáo
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID đối tượng bị báo cáo (ví dụ: bookingId)
  reason: { type: String, required: true }, // Nội dung báo cáo
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' }, // Trạng thái xử lý
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
