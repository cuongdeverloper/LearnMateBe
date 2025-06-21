const express = require('express');
const routerApi = express.Router();
const passport = require('passport');

const {
  checkAccessToken,
  createRefreshToken,
  createJWT,
  decodeToken
} = require('../middleware/JWTAction');

const {
  apiLogin,
  apiRegister,
  verifyOtp
} = require('../controller/Auth/AuthController');

const {
  addUser,
  getAllStudents
} = require('../controller/User/UserController');

// ====== AUTH ROUTES ======
routerApi.post('/login', apiLogin);
routerApi.post('/register', apiRegister);
routerApi.post('/verify-otp', verifyOtp);

// ====== GOOGLE OAUTH ======
routerApi.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

routerApi.get('/google/redirect',
  passport.authenticate('google', { failureRedirect: 'http://localhost:6161/signin' }),
  (req, res) => {
    const payload = {
      email: req.user.email,
      name: req.user.username,
      role: req.user.role,
      id: req.user.id
    };
    const accessToken = createJWT(payload);
    const refreshToken = createRefreshToken(payload);

    const redirectUrl = `http://localhost:6161/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
    res.redirect(redirectUrl);
  }
);

// ====== TOKEN DECODE ======
routerApi.post('/decode-token', (req, res) => {
  const { token } = req.body;
  const data = decodeToken(token);
  if (data) {
    res.json({ data });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
});

// ====== USER ROUTES ======
routerApi.post('/user', addUser);
routerApi.get('/students', getAllStudents);  // Trả về danh sách sinh viên có role === 'student'

module.exports = { routerApi };