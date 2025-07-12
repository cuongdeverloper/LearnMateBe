const Payment = require('../../modal/Payment');
const User = require('../../modal/User');
const vnpConfig = require('../../config/vnpay');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const Withdrawal = require('../../modal/Withdrawal');
const Booking = require('../../modal/Booking');
exports.createVNPayPayment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; // lấy từ token
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Thiếu hoặc sai định dạng amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Tạo paymentUrl như bạn đã có
    const vnpay = new VNPay({
      tmnCode: vnpConfig.vnp_TmnCode,
      secureSecret: vnpConfig.vnp_HashSecret,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnp_TxnRef = `deposit_${userId}_${dateFormat(new Date())}`;

    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: amount * 100,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_TxnRef,
      vnp_OrderInfo: `Nạp tiền vào ví cho user #${userId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: vnpConfig.vnp_ReturnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({ paymentUrl });
  } catch (error) {
    console.error('Lỗi tạo thanh toán VNPAY:', error);
    return res.status(500).json({ message: 'Lỗi tạo thanh toán VNPAY', error: error.message });
  }
};


exports.vnpayReturn = async (req, res) => {
  try {
    const query = req.query;
    const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount } = query;

    if (!vnp_TxnRef || !vnp_Amount) {
      return res.redirect('http://localhost:6161/payment/result?status=error');
    }

    const userId = vnp_TxnRef.split('_')[1];
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('http://localhost:6161/payment/result?status=user_not_found');
    }

    // Tìm payment đã tồn tại dựa vào vnp_TxnRef
    let payment = await Payment.findOne({ vnp_TxnRef });

    if (!payment) {
      payment = new Payment({
        userId,
        vnp_TxnRef,
        amount: parseInt(vnp_Amount) / 100,
        responseCode: vnp_ResponseCode,
        status: 'pending',
        paymentTime: new Date(),
        rawData: query,
      });
    }

    if (vnp_ResponseCode === '00' && payment.status !== 'success') {
      user.balance = (user.balance || 0) + payment.amount;
      await user.save();
      payment.status = 'success';
    } else if (vnp_ResponseCode !== '00') {
      payment.status = 'failed';
    }

    payment.paymentTime = new Date();
    payment.responseCode = vnp_ResponseCode;
    payment.rawData = query;

    await payment.save();

    return res.redirect(`http://localhost:6161/payment/result?vnp_ResponseCode=${vnp_ResponseCode}&vnp_Amount=${vnp_Amount}`);
  } catch (error) {
    console.error('Lỗi xử lý kết quả thanh toán VNPAY:', error);
    return res.redirect('http://localhost:6161/payment/result?status=error');
  }
};


// Lấy lịch sử nạp tiền (Payments)
exports.getUserPayments = async (req, res) => {
  try {
      // Lấy userId từ token thay vì req.params
      const userId = req.user.id || req.user._id;

      if (!userId) {
          return res.status(400).json({ message: 'Thiếu userId trong token.' });
      }

      const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
      res.status(200).json({ payments });
  } catch (error) {
      console.error('Lỗi lấy lịch sử nạp tiền:', error);
      res.status(500).json({ message: 'Lỗi lấy lịch sử nạp tiền.', error: error.message });
  }
};

// Lấy thông tin người dùng (có thể giữ nguyên hoặc dùng req.user nếu bạn chỉ muốn thông tin từ token)
// Nếu bạn cần thông tin đầy đủ từ DB (balance, etc.), vẫn dùng req.params.userId để query User model
exports.getUserInfo = async (req, res) => {
  try {
      // Lấy userId từ token thay vì req.params
      const userId = req.user.id || req.user._id; // Dùng ID từ token để tìm user
      
      if (!userId) {
          return res.status(400).json({ message: 'Thiếu userId trong token.' });
      }

      const user = await User.findById(userId).select('-password'); // Bỏ password
      if (!user) {
          return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
      }
      res.status(200).json({ user });
  } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      res.status(500).json({ message: 'Lỗi lấy thông tin người dùng.', error: error.message });
  }
};

// Tạo yêu cầu rút tiền (Withdrawal Request)
exports.createWithdrawalRequest = async (req, res) => {
  try {
      // Lấy userId từ token thay vì req.body
      const userId = req.user.id || req.user._id;
      const { amount, bankAccount } = req.body;

      if (!userId) {
          return res.status(400).json({ message: 'Thiếu userId trong token.' });
      }
      if (!amount || amount <= 0) {
          return res.status(400).json({ message: 'Số tiền rút không hợp lệ.' });
      }
      if (!bankAccount || !bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountHolderName) {
          return res.status(400).json({ message: 'Thông tin tài khoản ngân hàng không đầy đủ.' });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }

      if (user.balance < amount) {
          return res.status(400).json({ message: 'Số dư không đủ.' });
      }

      // Tạo yêu cầu rút tiền
      const newWithdrawal = new Withdrawal({
          userId,
          amount,
          bankAccount,
          status: 'pending' // Mặc định là đang chờ xử lý
      });
      await newWithdrawal.save();

      // Giảm số dư của người dùng ngay lập tức
      user.balance -= amount;
      await user.save();

      res.status(201).json({
          message: 'Yêu cầu rút tiền đã được gửi thành công.',
          withdrawal: newWithdrawal
      });

  } catch (error) {
      console.error('Lỗi khi tạo yêu cầu rút tiền:', error);
      res.status(500).json({ message: 'Lỗi khi tạo yêu cầu rút tiền.', error: error.message });
  }
};

// Lấy lịch sử rút tiền
exports.getUserWithdrawalHistory = async (req, res) => {
  try {
      // Lấy userId từ token thay vì req.params
      const userId = req.user.id || req.user._id;

      if (!userId) {
          return res.status(400).json({ message: 'Thiếu userId trong token.' });
      }

      const withdrawals = await Withdrawal.find({ userId })
          .sort({ createdAt: -1 });

      res.status(200).json({ withdrawals });
  } catch (error) {
      console.error('Lỗi lấy lịch sử rút tiền:', error);
      res.status(500).json({ message: 'Lỗi lấy lịch sử rút tiền.', error: error.message });
  }
};

// Lịch sử dòng tiền tổng thể (nạp, rút, thanh toán booking, hoàn tiền booking)
exports.getFinancialFlowHistory = async (req, res) => {
  try {
      // Lấy userId từ token thay vì req.params
      const userId = req.user.id || req.user._id;

      if (!userId) {
          return res.status(400).json({ message: 'Thiếu userId.' });
      }

      let combinedHistory = [];

      // 1. Lịch sử nạp tiền (Payments)
      const payments = await Payment.find({ userId }).select('amount createdAt status vnp_TxnRef').lean();
      const formattedPayments = payments.map(p => ({
          id: p._id.toString(),
          type: 'Nạp tiền',
          amount: p.amount,
          date: p.createdAt,
          status: p.status,
          transactionId: p.vnp_TxnRef,
          description: `Nạp tiền vào ví`,
          balanceChange: p.amount
      }));
      combinedHistory = combinedHistory.concat(formattedPayments);

      // 2. Lịch sử rút tiền (Withdrawals)
      const withdrawals = await Withdrawal.find({ userId }).select('amount createdAt status').lean();
      const formattedWithdrawals = withdrawals.map(w => ({
          id: w._id.toString(),
          type: 'Rút tiền',
          amount: w.amount,
          date: w.createdAt,
          status: w.status,
          transactionId: w._id.toString(),
          description: `Yêu cầu rút tiền`,
          balanceChange: -w.amount
      }));
      combinedHistory = combinedHistory.concat(formattedWithdrawals);

      // 3. Lịch sử thanh toán Booking (tiền chi ra)
      const bookedPayments = await Booking.find({ userId: userId, status: { $in: ['approve', 'completed'] } }) // Thêm 'completed' nếu booking sau khi 'approve' chuyển sang 'completed'
          .select('amount createdAt status _id tutorId')
          .populate('tutorId', 'user')
          .lean();

      const formattedBookedPayments = bookedPayments.map(b => ({
          id: b._id.toString(),
          type: 'Thanh toán Booking',
          amount: b.amount,
          date: b.createdAt,
          status: b.status === 'approve' ? 'Đã thanh toán' : b.status,
          transactionId: b._id.toString(),
          description: `Thanh toán cho gia sư ${b.tutorId?.user?.username || 'Không rõ'}`,
          balanceChange: -b.amount
      }));
      combinedHistory = combinedHistory.concat(formattedBookedPayments);

      // 4. Lịch sử hoàn tiền từ hủy Booking (tiền hoàn lại)
      const cancelledRefunds = await Booking.find({ userId: userId, status: 'cancelled' })
          .select('amount createdAt status _id tutorId')
          .populate('tutorId', 'user')
          .lean();

      const formattedCancelledRefunds = cancelledRefunds.map(b => ({
          id: b._id.toString(),
          type: 'Hoàn tiền Booking',
          amount: b.amount,
          date: b.createdAt,
          status: b.status === 'cancelled' ? 'Đã hoàn tiền' : b.status,
          transactionId: b._id.toString(),
          description: `Hoàn tiền từ hủy booking với gia sư ${b.tutorId?.user?.username || 'Không rõ'}`,
          balanceChange: b.amount
      }));
      combinedHistory = combinedHistory.concat(formattedCancelledRefunds);

      combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.status(200).json({ history: combinedHistory });

  } catch (error) {
      console.error('Lỗi lấy lịch sử dòng tiền:', error);
      res.status(500).json({ message: 'Lỗi lấy lịch sử dòng tiền.', error: error.message });
  }
};