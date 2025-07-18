// modal/FinancialHistory.js
const mongoose = require('mongoose');

const financialHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  balanceChange: { type: Number, required: true }, // dương hoặc âm
  type: { type: String, enum: ['topup', 'withdraw', 'earning', 'spend'], required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  description: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FinancialHistory', financialHistorySchema);
