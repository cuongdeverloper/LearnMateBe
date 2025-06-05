const Payment = require('../../modal/Payment');
const User = require('../../modal/User');
const vnpConfig = require('../../config/vnpay');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

exports.createVNPayPayment = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Thiếu hoặc sai định dạng userId hoặc amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

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


// API lấy lịch sử thanh toán theo userId
exports.getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    // Lấy tất cả payment của user, sắp xếp mới nhất trước
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (error) {
    console.error('Lỗi lấy lịch sử thanh toán:', error);
    return res.status(500).json({ message: 'Lỗi lấy lịch sử thanh toán', error: error.message });
  }
};

// API lấy thông tin user (bao gồm balance)
exports.getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const user = await User.findById(userId).select('username email balance');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    return res.status(500).json({ message: 'Lỗi lấy thông tin user', error: error.message });
  }
};