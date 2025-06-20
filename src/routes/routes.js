const express = require('express');
const routerApi = express.Router();
const { checkAccessToken, createRefreshToken, createJWT } = require('../middleware/JWTAction');
const { addUser, getUserByUserId, getAllUsers, blockUser, unblockUser, deleteUser } = require('../controller/User/UserController');
const { apiLogin, apiRegister, verifyOtp } = require('../controller/Auth/AuthController');
const { 
  submitApplication, 
  getAllApplications, 
  getApplicationsByStatus, 
  approveApplication, 
  rejectApplication, 
  getApplicationById, 
  getTutorApplications 
} = require('../controller/Tutor/TutorApplicationController');
const {
  getAllTutors,
  getTutorsByStatus,
  getTutorById,
  verifyTutor,
  unverifyTutor,
  toggleTutorStatus,
  deleteTutor,
  getTutorStats
} = require('../controller/Tutor/TutorController');
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
    async (req, res) => {
        // Kiểm tra block
        if (req.user.isBlocked) {
            return res.redirect('http://localhost:6161/signin?error=blocked');
        }
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

// Admin routes
routerApi.get('/admin/users', checkAccessToken, getAllUsers);
routerApi.put('/admin/users/:userId/block', checkAccessToken, blockUser);
routerApi.put('/admin/users/:userId/unblock', checkAccessToken, unblockUser);
routerApi.delete('/admin/users/:userId', checkAccessToken, deleteUser);

// Tutor Application routes
routerApi.post('/tutor/application', checkAccessToken, submitApplication);
routerApi.get('/tutor/applications', checkAccessToken, getTutorApplications);
routerApi.get('/admin/applications', checkAccessToken, getAllApplications);
routerApi.get('/admin/applications/:status', checkAccessToken, getApplicationsByStatus);
routerApi.get('/admin/applications/detail/:applicationId', checkAccessToken, getApplicationById);
routerApi.put('/admin/applications/:applicationId/approve', checkAccessToken, approveApplication);
routerApi.put('/admin/applications/:applicationId/reject', checkAccessToken, rejectApplication);

// Tutor Management routes
routerApi.get('/admin/tutors', checkAccessToken, getAllTutors);
routerApi.get('/admin/tutors/:status', checkAccessToken, getTutorsByStatus);
routerApi.get('/admin/tutors/detail/:tutorId', checkAccessToken, getTutorById);
routerApi.put('/admin/tutors/:tutorId/verify', checkAccessToken, verifyTutor);
routerApi.put('/admin/tutors/:tutorId/unverify', checkAccessToken, unverifyTutor);
routerApi.put('/admin/tutors/:tutorId/toggle-status', checkAccessToken, toggleTutorStatus);
routerApi.delete('/admin/tutors/:tutorId', checkAccessToken, deleteTutor);
routerApi.get('/admin/tutors-stats', checkAccessToken, getTutorStats);

module.exports = { routerApi };