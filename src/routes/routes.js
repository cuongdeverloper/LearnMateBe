const express = require('express');
const routerApi = express.Router();
const { checkAccessToken, createRefreshToken, createJWT } = require('../middleware/JWTAction');
const { addUser, getUserByUserId } = require('../controller/User/UserController');
const { apiLogin, apiRegister, verifyOtp, requestPasswordReset, resetPassword } = require('../controller/Auth/AuthController');
const passport = require('passport');
const { NewConversation, GetConversation } = require('../Socket controller/ConversationController');
const { SendMessage, GetMessages, MarkMessagesAsSeen } = require('../Socket controller/MessageController');
const { getProfile, updateProfile } = require('../controller/User/ProfileController');

routerApi.post('/login', apiLogin);
routerApi.post('/register', apiRegister);
routerApi.post('/verify-otp', verifyOtp);
routerApi.get('/user/:userId',checkAccessToken,getUserByUserId)

routerApi.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

routerApi.get('/google/redirect',
    passport.authenticate('google', { failureRedirect: 'http://localhost:6161/signin' }),
    (req, res) => {
        // Create a payload for JWT
        const payload = {
            email: req.user.email,
            name: req.user.username,
            role: req.user.role,
            id: req.user.id
        };
        // Generate access and refresh tokens
        const accessToken = createJWT(payload);
        const refreshToken = createRefreshToken(payload);

        // Construct the redirect URL
        const redirectUrl = `http://localhost:6161/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&user=${encodeURIComponent(JSON.stringify(req.user))}`;

        // Redirect to the frontend with tokens
        res.redirect(redirectUrl);
    }
);
routerApi.post('/decode-token', (req, res) => {
    const { token } = req.body;
    const data = decodeToken(token);
    if (data) {
        res.json({ data });
    } else {
        res.status(400).json({ error: 'Invalid token' });
    }
});

//OTP
routerApi.post('/verify-otp', verifyOtp);

//socket 
routerApi.post('/conversation',checkAccessToken,NewConversation);
routerApi.get('/conversation',checkAccessToken,GetConversation);
routerApi.post('/message',checkAccessToken,SendMessage);
routerApi.get('/messages/:conversationId',checkAccessToken,GetMessages);
routerApi.put('/seenmessage/:conversationId',checkAccessToken,MarkMessagesAsSeen);

routerApi.post('/user', addUser);

//reset password
routerApi.post('/rqreset-password', requestPasswordReset);
routerApi.post('/reset-password', resetPassword);

routerApi.get('/profile', checkAccessToken, getProfile);
routerApi.put('/update-profile', checkAccessToken, updateProfile);




const  materialController = require('../controller/Booking/MaterialController');
const bookingController = require('../controller/Booking/bookingController');
const tutorController = require('../controller/User/TutorController');
const paymentController = require('../controller/Payment/PaymentController');
const scheduleController = require('../controller/Schedule/ScheduleController');
// POST /bookings
routerApi.post('/booking/:tutorId',  bookingController.createBooking);

// GET /pay/success/:bookingId
routerApi.get('/tutors', tutorController.getTutors);             // GET /api/tutors
routerApi.get('/tutors/:id', tutorController.getTutorById);       // GET /api/tutors/:id
routerApi.post('/bookings/:tutorId', checkAccessToken, bookingController.createBooking);

// --- NEW ROUTES FOR SAVED TUTORS (Thêm vào đây) ---
routerApi.get('/me/saved-tutors', checkAccessToken, tutorController.getSavedTutors);
routerApi.post('/me/saved-tutors/:tutorId', checkAccessToken, tutorController.addSavedTutor);
routerApi.delete('/me/saved-tutors/:tutorId', checkAccessToken, tutorController.removeSavedTutor);


// Route callback từ VNPAY sau khi thanh toán
routerApi.get('/payment/vnpay_return', paymentController.vnpayReturn);

// Xác thực trước khi trả dữ liệu user
routerApi.get('/user/:userId', checkAccessToken, paymentController.getUserInfo);
routerApi.get('/user/:userId/payments', checkAccessToken, paymentController.getUserPayments);
routerApi.post('/payment/create-vnpay', checkAccessToken, paymentController.createVNPayPayment);

routerApi.get('/schedule/booking/:bookingId/busy-slots', scheduleController.getBusySlotsForWeek);
routerApi.post('/schedule/booking/:bookingId/add-slots', scheduleController.addMultipleSlots);
routerApi.delete('/schedule/:scheduleId', scheduleController.deleteScheduleSlot);
routerApi.get('/schedule/my-weekly-schedules', checkAccessToken, scheduleController.getLearnerWeeklySchedules);
routerApi.patch('/schedule/:scheduleId/attendance', checkAccessToken, scheduleController.markAttendance); // New route


routerApi.get("/bookings/user/:userId", bookingController.getUserBookingHistory);
routerApi.get("/bookings/my-courses",checkAccessToken, bookingController.getApprovedBookingsForLearner);
routerApi.patch("/bookings/:bookingId/cancel", checkAccessToken, bookingController.cancelBooking);
routerApi.get('/materials/booking/:bookingId', checkAccessToken, materialController.getMaterialsByBookingId);
routerApi.get('/bookings/:id', bookingController.getBookingById);

// Thay đổi các route lấy thông tin và lịch sử
routerApi.get('/me/info', checkAccessToken,paymentController.getUserInfo); // Đổi từ /user/:userId
routerApi.get('/me/payments',checkAccessToken, paymentController.getUserPayments); // Đổi từ /user/:userId/payments
routerApi.post('/payment/withdraw', checkAccessToken,paymentController.createWithdrawalRequest); // Không cần userId trong body nữa
routerApi.get('/me/withdrawals',checkAccessToken, paymentController.getUserWithdrawalHistory); // Đổi từ /user/:userId/withdrawals
routerApi.get('/me/financial-flow',checkAccessToken, paymentController.getFinancialFlowHistory); // Đổi từ /user/:userId/financial-flow (nếu có trước đó)



routerApi.post('/user', addUser);

module.exports = { routerApi };