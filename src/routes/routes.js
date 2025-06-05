const express = require('express');
const routerApi = express.Router();
const { checkAccessToken, createRefreshToken, createJWT } = require('../middleware/JWTAction');
const { addUser } = require('../controller/User/UserController');
const { apiLogin, apiRegister, verifyOtp } = require('../controller/Auth/AuthController');
const passport = require('passport');

routerApi.post('/login', apiLogin);
routerApi.post('/register', apiRegister);
routerApi.post('/verify-otp', verifyOtp);
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




const bookingController = require('../controller/Booking/bookingController');
const tutorController = require('../controller/User/TutorController');
const paymentController = require('../controller/Payment/PaymentController');
// POST /bookings
routerApi.post('/booking/:tutorId',  bookingController.createBooking);

// GET /pay/success/:bookingId
routerApi.get('/tutors', tutorController.getTutors);             // GET /api/tutors
routerApi.get('/tutors/:id', tutorController.getTutorById);       // GET /api/tutors/:id
routerApi.post('/bookings/:tutorId', checkAccessToken, bookingController.createBooking);



// Route callback từ VNPAY sau khi thanh toán
routerApi.get('/payment/vnpay_return', paymentController.vnpayReturn);

// Xác thực trước khi trả dữ liệu user
routerApi.get('/user/:userId', checkAccessToken, paymentController.getUserInfo);
routerApi.get('/user/:userId/payments', checkAccessToken, paymentController.getUserPayments);
routerApi.post('/payment/create-vnpay', checkAccessToken, paymentController.createVNPayPayment);



routerApi.post('/user', addUser);
module.exports = { routerApi };