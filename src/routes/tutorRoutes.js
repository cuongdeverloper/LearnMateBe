const express = require('express');
const router = express.Router();
const uploadCloud = require('../config/cloudinaryConfig');
const tutorCtrl = require('../controller/Tutor/TutorController');

router.post('/bookings/respond', tutorCtrl.respondBooking);
router.post('/bookings/cancel', tutorCtrl.cancelBooking);
router.get('/bookings/pending/:tutorId', tutorCtrl.getPendingBookings);

router.post('/schedule', tutorCtrl.createSchedule);
router.get('/schedule/:tutorId', tutorCtrl.getSchedule);
router.put('/schedule/:id', tutorCtrl.updateSchedule);
router.delete('/schedule/:id', tutorCtrl.deleteSchedule);

router.post('/progress', tutorCtrl.updateProgress);
router.get('/progress/:studentId', tutorCtrl.getProgress);

router.post('/material/upload', uploadCloud.single('file'), tutorCtrl.uploadMaterial);
router.get('/material/:studentId', tutorCtrl.getMaterials);

module.exports = router;