const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vnp_TxnRef: { type: String, required: true, unique: true }, // Mã giao dịch VNPAY
  amount: { type: Number, required: true },
  responseCode: { type: String },  // Mã trạng thái VNPAY
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentTime: { type: Date },      // Thời điểm nhận callback
  rawData: { type: Object },        // Lưu dữ liệu gốc từ VNPAY
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
