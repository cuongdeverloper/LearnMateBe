const express = require('express');
const routerApi = express.Router();
const { checkAccessToken, createRefreshToken, createJWT } = require('../middleware/JWTAction');
const { addUser, getUserByUserId } = require('../controller/User/UserController');
const { apiLogin, apiRegister, verifyOtp } = require('../controller/Auth/AuthController');
const passport = require('passport');
const { NewConversation, GetConversation } = require('../Socket controller/ConversationController');
const { SendMessage, GetMessages, MarkMessagesAsSeen } = require('../Socket controller/MessageController');

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
module.exports = { routerApi };