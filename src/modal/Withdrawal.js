// modal/Withdrawal.js
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1000 // Ví dụ: số tiền rút tối thiểu 1.000 VND
    },
    bankAccount: { // Thông tin tài khoản ngân hàng để rút về
        bankName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        accountHolderName: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'], // Chờ duyệt, đã duyệt, bị từ chối, đã hủy (bởi user)
        default: 'pending'
    },
    processedBy: { // Admin xử lý yêu cầu rút
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    },
    note: { // Ghi chú từ người dùng hoặc admin
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);